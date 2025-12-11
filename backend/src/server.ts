import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { ProbabilityEngine } from './services/ProbabilityEngine';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser'; 
import { authenticateToken, AuthRequest } from './middlewares/authMiddleware';

import crypto from 'crypto'; 
import PDFDocument from 'pdfkit'; 
import qrcode from 'qrcode';       

function generateUniqueToken(): string {
  return crypto.randomBytes(5).toString('hex').toUpperCase();
}

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as AuthRequest).user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accesso negato. Solo gli amministratori sono autorizzati.' });
  }
  next();
};

const requireStaff = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as AuthRequest).user;
  if (!user || (user.role !== 'STAFF' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Accesso negato. Area riservata allo staff.' });
  }
  next();
};

// --- NUOVA FUNZIONE GENERAZIONE PDF STILE CAMPARI ---
async function generatePDF(tokens: { token_code: string }[], res: express.Response) {
  const doc = new PDFDocument({ size: 'A4', margin: 0 }); // Margine 0 per gestire noi il layout
  const stream = doc.pipe(res);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="lotto_token.pdf"');

  // CONFIGURAZIONE GRIGLIA (A4: 595.28 x 841.89 pt)
  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 20;
  
  // Layout Biglietto (simile a Business Card Verticale)
  const cols = 3;
  const rows = 3; 
  const cardW = (pageW - (margin * 2)) / cols; // ~185pt
  const cardH = (pageH - (margin * 2)) / rows; // ~267pt (Abbastanza grandi)

  // COLORI
  const CAMPARI_RED = '#E3001B';
  const BLACK = '#000000';
  const WHITE = '#FFFFFF';

  // URL BASE FRONTEND
  // Nota: In produzione questo deve essere l'URL reale (es. https://tua-app.vercel.app)
  const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000'; 

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Gestione Nuova Pagina
    if (i > 0 && i % (cols * rows) === 0) doc.addPage();

    // Calcolo Coordinate
    const indexOnPage = i % (cols * rows);
    const col = indexOnPage % cols;
    const row = Math.floor(indexOnPage / cols);

    const x = margin + (col * cardW);
    const y = margin + (row * cardH);

    // 1. SFONDO CARD & BORDO DI TAGLIO (Dashed grigio chiaro per guidare il taglio)
    doc.save();
    doc.rect(x, y, cardW, cardH).strokeColor('#CCCCCC').dash(5, { space: 5 }).stroke();
    
    // Margine interno di sicurezza (padding)
    const innerX = x + 10;
    const innerY = y + 10;
    const innerW = cardW - 20;
    const innerH = cardH - 20;

    // 2. CORNICE NERA SPESSA (Stile Depero)
    doc.rect(innerX, innerY, innerW, innerH).lineWidth(3).strokeColor(BLACK).stroke().undash();

    // 3. HEADER ROSSO
    const headerH = 60;
    doc.rect(innerX, innerY, innerW, headerH).fill(CAMPARI_RED);

    // 4. SCRITTA HEADER
    doc.fillColor(WHITE)
       .font('Helvetica-Bold')
       .fontSize(14)
       .text('CAMPARI', innerX, innerY + 15, { width: innerW, align: 'center' })
       .fontSize(10)
       .text('SODA', innerX, innerY + 32, { width: innerW, align: 'center', characterSpacing: 2 });

    // 5. SCRITTA "INSTANT WIN" (Sotto header)
    doc.fillColor(BLACK)
       .fontSize(8)
       .text('INSTANT WIN', innerX, innerY + headerH + 10, { width: innerW, align: 'center', characterSpacing: 3 });

    // 6. QR CODE (Centrale)
    const qrSize = 100;
    const qrX = innerX + (innerW - qrSize) / 2;
    const qrY = innerY + headerH + 35;

    // Disegno una "ombra" sotto il QR per stacco
    doc.rect(qrX + 4, qrY + 4, qrSize, qrSize).fill('#EEEEEE');
    doc.rect(qrX, qrY, qrSize, qrSize).lineWidth(1).strokeColor(BLACK).stroke();

    try {
        // Genera QR puntando al link di gioco
        const playUrl = `${APP_URL}/play?token=${token.token_code}`;
        const qrDataUrl = await qrcode.toDataURL(playUrl, { width: 300, margin: 0 });
        doc.image(qrDataUrl, qrX, qrY, { width: qrSize });
    } catch (qrError) {
        doc.fillColor('red').text('QR ERR', qrX, qrY);
    }

    // 7. CODICE TESTUALE (Backup)
    doc.fillColor(BLACK)
       .font('Courier-Bold') // Font monospaziato per il codice
       .fontSize(10)
       .text(token.token_code, innerX, qrY + qrSize + 10, { width: innerW, align: 'center' });

    // 8. ISTRUZIONE FOOTER
    doc.font('Helvetica')
       .fontSize(7)
       .fillColor('#666666')
       .text('Inquadra per scoprire se hai vinto', innerX, innerY + innerH - 30, { width: innerW, align: 'center' });

    // 9. DECORAZIONE: Silhouette Bottiglia (Vettoriale Semplice)
    // Disegniamo un piccolo trapezio rosso in basso a destra come "firma"
    doc.save();
    const bottleW = 20;
    const bottleH = 40;
    const bX = innerX + innerW - 30;
    const bY = innerY + innerH - 50;
    
    doc.moveTo(bX + 5, bY) // Top
       .lineTo(bX + bottleW - 5, bY)
       .lineTo(bX + bottleW, bY + bottleH) // Bottom Right
       .lineTo(bX, bY + bottleH) // Bottom Left
       .lineTo(bX + 5, bY) // Close
       .fillOpacity(0.1) // Molto leggero
       .fill(CAMPARI_RED);
    doc.restore();

    doc.restore(); // Ripristina stato per il prossimo loop
  }

  doc.end();
  return new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
  });
}

const app = express();
const prisma = new PrismaClient();

// === MODIFICA QUI ===
// Ho aggiunto l'URL di Vercel alla lista delle origini permesse
app.use(cors({
  origin: [
    'http://localhost:3000',               // Per quando sviluppi sul tuo computer
    'https://campari-lottery.vercel.app'   // Per il sito online
  ],
  credentials: true
}));
// ====================

app.use(express.json());
app.use(cookieParser());

console.log('Routes caricate correttamente - v4.1 (Campari Style PDF)');

// VALIDAZIONE TOKEN (GAP FIX 1: Controllo Date Promozione)
app.get('/api/customer/token/validate', async (req, res) => {
  const { token } = req.query;
  const t = await prisma.token.findUnique({ 
    where: { token_code: String(token) },
    include: { promotion: true }
  });

  if (!t) return res.json({ valid: false, reason: "Codice inesistente" });
  if (t.status !== 'AVAILABLE') return res.json({ valid: false, reason: "Codice già usato" });
  
  // CHECK DATE PROMOZIONE
  const now = new Date();
  if (now < t.promotion.start_datetime) return res.json({ valid: false, reason: "La promozione non è ancora iniziata." });
  if (now > t.promotion.end_datetime) return res.json({ valid: false, reason: "La promozione è scaduta." });

  res.json({ valid: true, promotion: { id: t.promotion.id } });
}); 

// REGISTRAZIONE (AGGIORNATA per Privacy)
app.post('/api/customer/register', async (req, res) => {
  const { promotion_id, phone, first_name, last_name, marketing_consent } = req.body;
  const pid = String(promotion_id);
  
  try {
      const customer = await prisma.customer.upsert({
        where: { promotion_id_phone_number: { promotion_id: pid, phone_number: phone } },
        update: { 
            first_name, 
            last_name,
            marketing_consent_at: marketing_consent ? new Date() : null 
        },
        create: { 
            promotion_id: pid, 
            phone_number: phone, 
            first_name, 
            last_name, 
            accepted_terms_at: new Date(),
            marketing_consent_at: marketing_consent ? new Date() : null
        } 
      });
      res.json(customer);
  } catch (error) {
      console.error("Errore Register:", error);
      res.status(500).json({ error: "Errore interno durante la registrazione." });
  }
});

// GIOCATA (GAP FIX 2: Calcolo Rank Utente)
app.post('/api/customer/play', async (req, res) => {
  const { promotion_id, token_code, customer_id } = req.body;
  const pid = String(promotion_id);

  try {
    let currentPlays = 0;
    
    const result = await prisma.$transaction(async (tx) => {
      const token = await tx.token.findUnique({ where: { token_code } });
      if (!token || token.status !== 'AVAILABLE') throw new Error("Token non valido");

      // CHECK DATE PROMOZIONE (Sicurezza lato backend)
      const promo = await tx.promotion.findUnique({ where: { id: pid } });
      const now = new Date();
      if (!promo) throw new Error("Promozione non trovata");
      if (now < promo.start_datetime) throw new Error("Promozione non iniziata");
      if (now > promo.end_datetime) throw new Error("Promozione scaduta");

      await tx.token.update({ 
          where: { id: token.id }, 
          data: { status: 'USED', usedAt: new Date() } 
      });

      const usedTokens = await tx.token.count({ where: { promotion_id: pid, status: 'USED' } });
      const prizes = await tx.prizeType.findMany({ where: { promotion_id: pid } });

      let wonPrize = null;
      for (const prize of prizes) {
        const p = ProbabilityEngine.compute(promo.planned_token_count, usedTokens, prize.remaining_stock);
        if (Math.random() < p) {
          await tx.prizeType.update({ where: { id: prize.id }, data: { remaining_stock: { decrement: 1 } } });
          wonPrize = prize;
          break; 
        }
      }

      await tx.play.create({
        data: {
          promotion_id: pid, 
          customer_id, token_id: token.id,
          is_winner: !!wonPrize
        }
      });

      const updatedCustomer = await tx.customer.update({
        where: { id: customer_id },
        data: { total_plays: { increment: 1 }, last_play_at: new Date() }
      });
      
      currentPlays = updatedCustomer.total_plays; // Salva per il calcolo rank

      let assignment = null;
      if (wonPrize) {
        assignment = await tx.prizeAssignment.create({
          data: {
            prize_type_id: wonPrize.id,
            prize_code: `WIN-${Math.floor(Math.random()*10000)}`
          }
        });
      }

      return { win: !!wonPrize, prize: wonPrize, assignment, currentPlays };
    });

    // 1. Ottieni Top 5
    const leaderboard = await prisma.customer.findMany({
      where: { promotion_id: pid },
      orderBy: [{ total_plays: 'desc' }, { last_play_at: 'asc' }],
      take: 5
    });

    // 2. Calcola Posizione Utente
    const userRankCount = await prisma.customer.count({
        where: {
            promotion_id: pid,
            total_plays: { gt: result.currentPlays }
        }
    });
    const userRank = userRankCount + 1;

    res.json({ 
        ...result, 
        leaderboard,
        userRank, 
        userTotalPlays: result.currentPlays 
    });

  } catch (e: any) {
    console.error("Errore Play:", e);
    res.status(400).json({ error: e.message });
  }
});

// AUTH
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.staffUser.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: "Credenziali errate" });
  const validPass = await bcrypt.compare(password, user.password_hash);
  if (!validPass) return res.status(401).json({ error: "Credenziali errate" });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
  res.cookie('token', token, { httpOnly: true, secure: false, path: '/', sameSite: 'lax', maxAge: 8 * 3600000 });
  res.json({ success: true, user: { username: user.username, role: user.role } });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = (req as AuthRequest).user;
  res.json({ user });
});

// --- STAFF ROUTES ---

// RISCATTO PREMIO
app.post('/api/staff/redeem', authenticateToken, requireStaff, async (req, res) => {
    const { prize_code } = req.body;
    const staffUser = (req as AuthRequest).user;

    if (!prize_code) return res.status(400).json({ error: 'Codice premio mancante.' });

    try {
        const assignment = await prisma.prizeAssignment.findUnique({
            where: { prize_code },
            include: { 
                prize_type: true,
                redeemed_by_staff: true 
            }
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Codice premio non trovato.' });
        }

        if (assignment.redeemed_at) {
            return res.status(400).json({ 
                error: 'Premio già ritirato!',
                redeemedAt: assignment.redeemed_at,
                redeemedBy: assignment.redeemed_by_staff?.username
            });
        }

        const updatedAssignment = await prisma.prizeAssignment.update({
            where: { id: assignment.id },
            data: {
                redeemed_at: new Date(),
                redeemed_by_staff_id: staffUser?.id ? String(staffUser.id) : null
            }
        });

        res.json({ 
            success: true, 
            prize: assignment.prize_type.name, 
            redeemedAt: updatedAssignment.redeemed_at
        });

    } catch (error) {
        console.error("Errore Redeem:", error);
        res.status(500).json({ error: 'Errore interno durante il riscatto.' });
    }
});

// ADMIN ROUTES
app.post('/api/admin/tokens/generate', authenticateToken, requireAdmin, async (req, res) => {
  const { promotionId, count } = req.body;
  if (!promotionId || count <= 0) return res.status(400).json({ error: 'Dati mancanti.' });
  const pid = String(promotionId);

  try {
    const tokensToCreate = [];
    const createdTokens = []; 
    for (let i = 0; i < count; i++) {
      const tokenCode = generateUniqueToken();
      tokensToCreate.push({ token_code: tokenCode, promotion_id: pid, status: 'AVAILABLE' });
      createdTokens.push({ token_code: tokenCode }); 
    }
    await prisma.token.createMany({ data: tokensToCreate, skipDuplicates: true });
    await generatePDF(createdTokens, res); 
  } catch (error) {
    console.error("Errore Gen Token:", error);
    if (!res.headersSent) res.status(500).json({ error: 'Errore server.' });
  }
});

app.get('/api/admin/tokens/list/:promotionId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const tokens = await prisma.token.findMany({
            where: { promotion_id: String(req.params.promotionId) },
            select: { id: true, token_code: true, status: true, promotion_id: true, usedAt: true },
            orderBy: { id: 'asc' },
        });
        res.json(tokens);
    } catch (error) {
        console.error("Errore Token List:", error);
        res.status(500).json({ error: 'Errore DB.' });
    }
});

app.get('/api/admin/stats/:promotionId', authenticateToken, requireAdmin, async (req, res) => {
    const pid = String(req.params.promotionId);
    try {
        const totalTokens = await prisma.token.count({ where: { promotion_id: pid } });
        const usedTokens = await prisma.token.count({ where: { promotion_id: pid, status: 'USED' } });
        const prizes = await prisma.prizeType.findMany({ where: { promotion_id: pid }, select: { name: true, initial_stock: true, remaining_stock: true } });
        const totalPrizes = prizes.reduce((sum, p) => sum + p.initial_stock, 0);
        const remainingPrizes = prizes.reduce((sum, p) => sum + p.remaining_stock, 0);

        res.json({
            tokenStats: { total: totalTokens, used: usedTokens, available: totalTokens - usedTokens },
            prizeStats: { total: totalPrizes, remaining: remainingPrizes, details: prizes }
        });
    } catch (error) {
        console.error("Errore Stats:", error);
        res.status(500).json({ error: 'Errore statistiche.' });
    }
});

app.delete('/api/admin/tokens/reset/:promotionId', authenticateToken, requireAdmin, async (req, res) => {
    const pid = String(req.params.promotionId);
    try {
        await prisma.play.deleteMany({ where: { promotion_id: pid } });
        const tokenDeletionResult = await prisma.token.deleteMany({ where: { promotion_id: pid } });
        res.json({ success: true, deletedTokens: tokenDeletionResult.count });
    } catch (error) {
        console.error("Errore Reset:", error);
        res.status(500).json({ error: 'Errore reset.' });
    }
});

app.post('/api/admin/prizes/add', authenticateToken, requireAdmin, async (req, res) => {
    const { promotionId, name, initialStock } = req.body;
    try {
        const newPrize = await prisma.prizeType.create({
            data: { promotion_id: String(promotionId), name, initial_stock: initialStock, remaining_stock: initialStock }
        });
        res.json({ success: true, prize: newPrize });
    } catch (error) {
        console.error("Errore Prize Add:", error);
        res.status(500).json({ error: 'Errore creazione premio.' });
    }
});

app.put('/api/admin/prizes/update/:prizeTypeId', authenticateToken, requireAdmin, async (req, res) => {
    const { prizeTypeId } = req.params;
    const { newStock } = req.body;
    try {
        const updatedPrize = await prisma.prizeType.update({
            where: { id: prizeTypeId },
            data: { remaining_stock: newStock }
        });
        res.json({ success: true, prize: updatedPrize });
    } catch (error) {
        console.error("Errore Prize Update:", error);
        res.status(500).json({ error: 'Errore aggiornamento premio.' });
    }
});

app.get('/api/promotions/list', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const promotions = await prisma.promotion.findMany({ orderBy: { name: 'asc' } });
        res.json(promotions);
    } catch (error) {
        console.error("Errore Promo List:", error);
        res.status(500).json({ error: 'Errore lista.' });
    }
});

app.post('/api/promotions/create', authenticateToken, requireAdmin, async (req, res) => {
    const { name, plannedTokenCount, startDatetime, endDatetime } = req.body;
    try {
        const newPromotion = await prisma.promotion.create({
            data: {
                name,
                planned_token_count: Number(plannedTokenCount),
                start_datetime: new Date(startDatetime),
                end_datetime: new Date(endDatetime),
                status: 'DRAFT', 
            }
        });
        res.json({ success: true, promotion: newPromotion });
    } catch (error) {
        console.error("Errore Promo Create:", error);
        res.status(500).json({ error: 'Errore creazione.' });
    }
});

app.delete('/api/promotions/delete/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.play.deleteMany({ where: { promotion_id: id } });
        await prisma.token.deleteMany({ where: { promotion_id: id } });
        
        const prizeTypes = await prisma.prizeType.findMany({ where: { promotion_id: id } });
        const ptIds = prizeTypes.map(p => p.id);
        if (ptIds.length > 0) {
            await prisma.prizeAssignment.deleteMany({ where: { prize_type_id: { in: ptIds } } });
            await prisma.prizeType.deleteMany({ where: { promotion_id: id } });
        }
        
        await prisma.promotion.delete({ where: { id: id } });
        res.json({ success: true });
    } catch (error) {
        console.error("Errore Promo Delete:", error);
        res.status(500).json({ error: 'Errore eliminazione.' });
    }
});

app.put('/api/promotions/update/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, status, start_datetime, end_datetime, plannedTokenCount } = req.body;
    try {
        const data: any = {};
        if (name) data.name = name;
        if (status) data.status = status;
        if (plannedTokenCount) data.planned_token_count = Number(plannedTokenCount);
        if (start_datetime) data.start_datetime = new Date(start_datetime);
        if (end_datetime) data.end_datetime = new Date(end_datetime);

        const promo = await prisma.promotion.update({ where: { id }, data });
        res.json({ success: true, promotion: promo });
    } catch (error) {
        console.error("Errore Promo Update:", error);
        res.status(500).json({ error: 'Errore aggiornamento.' });
    }
});

app.get('/api/admin/plays/list/:promotionId', authenticateToken, requireAdmin, async (req, res) => {
    const pid = String(req.params.promotionId);
    try {
        const plays = await prisma.play.findMany({
            where: { promotion_id: pid },
            include: { token: true, customer: true },
            orderBy: { created_at: 'desc' },
        });

        const formatted = plays.map(play => ({
            playId: play.id,
            isWinner: play.is_winner,
            date: play.created_at,
            tokenCode: play.token?.token_code || 'N/A', 
            firstName: play.customer?.first_name || 'N/A',
            lastName: play.customer?.last_name || 'N/A',
            phoneNumber: play.customer?.phone_number || 'N/A',
        }));
        res.json(formatted);
    } catch (error) {
        console.error("Errore Plays List:", error);
        res.status(500).json({ error: 'Errore log.' });
    }
});

app.listen(3001, () => console.log('Backend running on 3001'));