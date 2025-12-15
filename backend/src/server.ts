import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { ProbabilityEngine } from './services/ProbabilityEngine';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { authenticateToken, authorizeRole, AuthRequest } from './middlewares/authMiddleware';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';
// IMPORTANT: Set this env var in Railway to your deployed frontend URL (e.g. https://campari-lottery.vercel.app)
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: [APP_URL, 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// --- HEALTH CHECK (Required for Railway) ---
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// --- STAFF / ADMIN AUTH ---

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.staffUser.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 3600 * 1000 // 8 hours
    });

    res.json({ success: true, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticateToken, (req: any, res: any) => {
  res.json({ user: req.user });
});

// --- CUSTOMER FLOW ---

// 1. Validate Token (Scan)
app.get('/api/customer/validate-token/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const token = await prisma.token.findUnique({
      where: { token_code: code },
      include: { promotion: true }
    });

    if (!token) return res.status(404).json({ valid: false, message: 'Codice non trovato.' });

    if (token.status !== 'available') {
      return res.status(400).json({ valid: false, message: 'Codice già utilizzato o non valido.' });
    }

    const now = new Date();
    if (now < token.promotion.start_datetime || now > token.promotion.end_datetime) {
       return res.status(400).json({ valid: false, message: 'Promozione non attiva in questo momento.' });
    }

    res.json({ 
      valid: true, 
      promotionId: token.promotion_id,
      promotionName: token.promotion.name,
      termsUrl: token.promotion.terms_url,
      privacyUrl: token.promotion.privacy_url
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Register / Identify
app.post('/api/customer/register', async (req, res) => {
  const { promotionId, firstName, lastName, phoneNumber, consentMarketing, consentTerms } = req.body;
  
  if (!promotionId || !firstName || !lastName || !phoneNumber) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // FIX: Update timestamps for consents if provided
    const customer = await prisma.customer.upsert({
      where: {
        promotion_id_phone_number: {
          promotion_id: Number(promotionId),
          phone_number: phoneNumber
        }
      },
      update: {
        first_name: firstName,
        last_name: lastName,
        // Update consents only if they are true (re-consent) or keep existing
        consent_marketing: consentMarketing,
        marketing_consent_at: consentMarketing ? new Date() : undefined,
        // Terms are mandatory for play usually
        consent_terms: consentTerms,
        terms_consent_at: consentTerms ? new Date() : undefined
      },
      create: {
        promotion_id: Number(promotionId),
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        consent_marketing: consentMarketing || false,
        consent_terms: consentTerms || false,
        marketing_consent_at: consentMarketing ? new Date() : null,
        terms_consent_at: consentTerms ? new Date() : null
      }
    });

    res.json({ customerId: customer.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 3. Play (The Core Logic)
app.post('/api/customer/play', async (req: any, res: any) => {
  const { promotion_id, token_code, customer_id } = req.body;

  try {
    // FIX: Use a transaction to ensure atomic operations (prevent overselling)
    const result = await prisma.$transaction(async (tx) => {
      // A. Re-validate token locked for update if possible (Prisma doesn't support SELECT FOR UPDATE easily yet without raw query, 
      // but inside transaction with strict isolation levels it handles concurrency well enough for this scale. 
      // For higher robustness on Postgres, we rely on atomic updates below).
      
      const token = await tx.token.findUnique({
        where: { token_code },
        include: { promotion: true } // Need promotion data?
      });

      if (!token) throw new Error('TOKEN_NOT_FOUND');
      if (token.status !== 'available') throw new Error('TOKEN_USED');
      // FIX: Integrity check
      if (token.promotion_id !== Number(promotion_id)) throw new Error('TOKEN_MISMATCH');

      const promotionId = token.promotion_id;

      // B. Load Prizes & Stats for Engine
      const totalTokens = await tx.token.count({ where: { promotion_id: promotionId } });
      const usedTokens = await tx.token.count({ where: { promotion_id: promotionId, status: 'used' } });
      
      const prizeTypes = await tx.prizeType.findMany({
        where: { promotion_id: promotionId }
      });

      // C. Determine Outcome
      const engine = new ProbabilityEngine();
      const wonPrizeType = engine.determineOutcome({
        totalTokens,
        usedTokens,
        prizeTypes: prizeTypes.map(p => ({
          id: p.id,
          initialStock: p.initial_stock,
          remainingStock: p.remaining_stock,
          targetProbability: p.target_overall_probability || 0
        }))
      });

      let prizeAssignment = null;
      let isWinner = false;

      // D. If winner, try to decrement stock ATOMICALLY
      if (wonPrizeType) {
        // Atomic update: only update if remaining_stock > 0
        const updateResult = await tx.prizeType.updateMany({
          where: { 
            id: wonPrizeType.id, 
            remaining_stock: { gt: 0 } 
          },
          data: { 
            remaining_stock: { decrement: 1 } 
          }
        });

        if (updateResult.count > 0) {
          // Success: stock reserved
          isWinner = true;
          const uniqueCode = `WIN-${token_code}-${Date.now().toString().slice(-4)}`; // Simple unique code
          
          prizeAssignment = await tx.prizeAssignment.create({
            data: {
              promotion_id: promotionId,
              prize_type_id: wonPrizeType.id,
              customer_id: customer_id,
              token_id: token.id,
              prize_code: uniqueCode,
              // We need to create the Play first or connect it? 
              // Prisma cycle dependency: PrizeAssignment needs play_id, Play needs prize_assignment_id (optional).
              // Let's create Play first.
              play: {
                create: {
                  promotion_id: promotionId,
                  token_id: token.id,
                  customer_id: customer_id,
                  is_winner: true,
                }
              }
            },
            include: {
              prize_type: true,
              play: true
            }
          });
        } else {
          // Failed to reserve stock (race condition hit 0), user loses effectively
          isWinner = false;
          // Just create a losing play
          await tx.play.create({
            data: {
              promotion_id: promotionId,
              token_id: token.id,
              customer_id: customer_id,
              is_winner: false
            }
          });
        }
      } else {
        // Lost by probability
        await tx.play.create({
          data: {
            promotion_id: promotionId,
            token_id: token.id,
            customer_id: customer_id,
            is_winner: false
          }
        });
      }

      // E. Mark Token as Used
      await tx.token.update({
        where: { id: token.id },
        data: { 
          status: 'used',
          used_at: new Date()
        }
      });

      // F. Increment Customer Plays
      await tx.customer.update({
        where: { id: customer_id },
        data: { total_plays: { increment: 1 } }
      });

      return { isWinner, prizeAssignment };
    }); // End Transaction

    res.json(result);

  } catch (err: any) {
    console.error("Play Error:", err);
    if (err.message === 'TOKEN_NOT_FOUND') return res.status(404).json({ error: 'Token not found' });
    if (err.message === 'TOKEN_USED') return res.status(400).json({ error: 'Token already used' });
    if (err.message === 'TOKEN_MISMATCH') return res.status(400).json({ error: 'Token does not belong to this promotion' });
    res.status(500).json({ error: 'Transaction failed' });
  }
});

// 4. Leaderboard (Live)
app.get('/api/leaderboard/:promotionId', async (req, res) => {
  const { promotionId } = req.params;
  const { customerId } = req.query; // Optional: to show "you are here"

  try {
    const topN = 10; // Make configurable if needed

    const leaderboard = await prisma.customer.findMany({
      where: { promotion_id: Number(promotionId) },
      orderBy: [
        { total_plays: 'desc' },
        { updated_at: 'asc' } // Tie-breaker: who reached score first
      ],
      take: topN,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        total_plays: true
      }
    });

    const formatted = leaderboard.map((c, index) => ({
      rank: index + 1,
      name: `${c.first_name} ${c.last_name.charAt(0)}.`,
      phone: `*** *** ${c.phone_number.slice(-4)}`,
      plays: c.total_plays,
      isMe: customerId ? c.id === Number(customerId) : false
    }));

    let myStats = null;
    if (customerId) {
        // If user is not in top N, fetch their rank
        // Calculating rank in SQL is expensive, for small lottery just fetch count > myPlays
        const me = await prisma.customer.findUnique({ where: { id: Number(customerId) } });
        if (me) {
            const betterPlayers = await prisma.customer.count({
                where: {
                    promotion_id: Number(promotionId),
                    OR: [
                        { total_plays: { gt: me.total_plays } },
                        { total_plays: me.total_plays, updated_at: { lt: me.updated_at } }
                    ]
                }
            });
            myStats = {
                rank: betterPlayers + 1,
                plays: me.total_plays
            };
        }
    }

    res.json({ leaderboard: formatted, myStats });

  } catch (err) {
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
});

// --- ADMIN API (Protected) ---

// Generate Tokens PDF
app.post('/api/admin/generate-tokens', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { promotionId, count, prefix } = req.body;

  try {
    // 1. Generate unique codes (Collision check loop simplified for demo)
    const codesToCreate = [];
    for (let i = 0; i < count; i++) {
        const code = (prefix || '') + Math.random().toString(36).substring(2, 8).toUpperCase();
        codesToCreate.push({
            promotion_id: Number(promotionId),
            token_code: code,
            status: 'available'
        });
    }

    // 2. Insert DB (skip duplicates if any collision)
    // Prisma createMany skipDuplicates is handy
    await prisma.token.createMany({
        data: codesToCreate,
        skipDuplicates: true
    });

    // 3. Fetch ACTUAL created tokens to ensure we print valid ones
    // We fetch the latest N tokens for this promotion.
    // NOTE: This assumes no one else is generating tokens at the exact same millisecond.
    const tokens = await prisma.token.findMany({
        where: { promotion_id: Number(promotionId) },
        orderBy: { created_at: 'desc' },
        take: Number(count)
    });

    // 4. Generate PDF
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=tokens.pdf');
    doc.pipe(res);

    // Simple grid layout
    let x = 50, y = 50;
    for (const t of tokens) {
        // FIX: QR URL must be full URL
        const playUrl = `${APP_URL}/play?token=${t.token_code}`;
        const qrData = await QRCode.toDataURL(playUrl);
        
        doc.image(qrData, x, y, { width: 100 });
        doc.text(t.token_code, x, y + 105, { width: 100, align: 'center' });
        
        x += 150;
        if (x > 500) {
            x = 50;
            y += 150;
        }
        if (y > 700) {
            doc.addPage();
            y = 50;
        }
    }

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Generation failed' });
  }
});

// Basic CRUD for promotions/prizes omitted for brevity but follows standard patterns

// --- STAFF API ---
app.post('/api/staff/redeem', authenticateToken, async (req, res) => {
    const { prizeCode } = req.body;
    // Implementation of redemption logic...
    // (Ensure you check unique constraints and update redeemed_at)
    res.json({ success: true, message: "Premio riscattato" }); // Placeholder
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});