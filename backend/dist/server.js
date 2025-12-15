"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const ProbabilityEngine_1 = require("./services/ProbabilityEngine");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authMiddleware_1 = require("./middlewares/authMiddleware");
const qrcode_1 = __importDefault(require("qrcode"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use((0, cors_1.default)({
    origin: [APP_URL, 'http://localhost:3000'],
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// --- HEALTH CHECK (Required for Railway) ---
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
// --- STAFF / ADMIN AUTH ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.staffUser.findUnique({ where: { username } });
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });
        const valid = await bcrypt_1.default.compare(password, user.password_hash);
        if (!valid)
            return res.status(401).json({ error: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 3600 * 1000 // 8 hours
        });
        res.json({ success: true, role: user.role });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});
app.get('/api/auth/me', authMiddleware_1.authenticateToken, (req, res) => {
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
        if (!token)
            return res.status(404).json({ valid: false, message: 'Codice non trovato.' });
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
    }
    catch (err) {
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
                consent_marketing: consentMarketing,
                marketing_consent_at: consentMarketing ? new Date() : undefined,
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// 3. Play (The Core Logic)
app.post('/api/customer/play', async (req, res) => {
    const { promotion_id, token_code, customer_id } = req.body;
    try {
        const result = await prisma.$transaction(async (tx) => {
            // A. Re-validate token
            const token = await tx.token.findUnique({
                where: { token_code },
                include: { promotion: true }
            });
            if (!token)
                throw new Error('TOKEN_NOT_FOUND');
            if (token.status !== 'available')
                throw new Error('TOKEN_USED');
            if (token.promotion_id !== Number(promotion_id))
                throw new Error('TOKEN_MISMATCH');
            const promotionId = token.promotion_id;
            // B. Load Prizes & Stats for Engine
            const totalTokens = await tx.token.count({ where: { promotion_id: promotionId } });
            const usedTokens = await tx.token.count({ where: { promotion_id: promotionId, status: 'used' } });
            const prizeTypes = await tx.prizeType.findMany({
                where: { promotion_id: promotionId }
            });
            // C. Determine Outcome
            const engine = new ProbabilityEngine_1.ProbabilityEngine();
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
            // D. Logic for Winner / Loser
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
                    // Success: stock reserved -> WINNER
                    isWinner = true;
                    const uniqueCode = `WIN-${token_code}-${Date.now().toString().slice(-4)}`;
                    // FIX: Creiamo PRIMA la Play e POI il PrizeAssignment collegato
                    // Questo risolve l'errore di tipi Annidati (Nested Writes)
                    const playRecord = await tx.play.create({
                        data: {
                            promotion_id: promotionId,
                            token_id: token.id,
                            customer_id: customer_id,
                            is_winner: true
                        }
                    });
                    prizeAssignment = await tx.prizeAssignment.create({
                        data: {
                            promotion_id: promotionId,
                            prize_type_id: wonPrizeType.id,
                            customer_id: customer_id,
                            token_id: token.id,
                            prize_code: uniqueCode,
                            play_id: playRecord.id // Colleghiamo usando l'ID appena creato
                        },
                        include: {
                            prize_type: true
                            // play: true // Non necessario includerlo qui per il return
                        }
                    });
                }
                else {
                    // Failed to reserve stock -> LOSER (Fallback)
                    isWinner = false;
                    await tx.play.create({
                        data: {
                            promotion_id: promotionId,
                            token_id: token.id,
                            customer_id: customer_id,
                            is_winner: false
                        }
                    });
                }
            }
            else {
                // Lost by probability -> LOSER
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
    }
    catch (err) {
        console.error("Play Error:", err);
        if (err.message === 'TOKEN_NOT_FOUND')
            return res.status(404).json({ error: 'Token not found' });
        if (err.message === 'TOKEN_USED')
            return res.status(400).json({ error: 'Token already used' });
        if (err.message === 'TOKEN_MISMATCH')
            return res.status(400).json({ error: 'Token does not belong to this promotion' });
        res.status(500).json({ error: 'Transaction failed' });
    }
});
// 4. Leaderboard (Live)
app.get('/api/leaderboard/:promotionId', async (req, res) => {
    const { promotionId } = req.params;
    const { customerId } = req.query;
    try {
        const topN = 10;
        const leaderboard = await prisma.customer.findMany({
            where: { promotion_id: Number(promotionId) },
            orderBy: [
                { total_plays: 'desc' },
                { updated_at: 'asc' }
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
    }
    catch (err) {
        res.status(500).json({ error: 'Error fetching leaderboard' });
    }
});
// --- ADMIN API (Protected) ---
// Generate Tokens PDF
app.post('/api/admin/generate-tokens', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorizeRole)('admin'), async (req, res) => {
    const { promotionId, count, prefix } = req.body;
    try {
        const codesToCreate = [];
        for (let i = 0; i < count; i++) {
            const code = (prefix || '') + Math.random().toString(36).substring(2, 8).toUpperCase();
            codesToCreate.push({
                promotion_id: Number(promotionId),
                token_code: code,
                status: 'available'
            });
        }
        await prisma.token.createMany({
            data: codesToCreate,
            skipDuplicates: true
        });
        const tokens = await prisma.token.findMany({
            where: { promotion_id: Number(promotionId) },
            orderBy: { created_at: 'desc' },
            take: Number(count)
        });
        const doc = new pdfkit_1.default();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=tokens.pdf');
        doc.pipe(res);
        let x = 50, y = 50;
        for (const t of tokens) {
            const playUrl = `${APP_URL}/play?token=${t.token_code}`;
            const qrData = await qrcode_1.default.toDataURL(playUrl);
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Generation failed' });
    }
});
// --- STAFF API ---
app.post('/api/staff/redeem', authMiddleware_1.authenticateToken, async (req, res) => {
    const { prizeCode } = req.body;
    if (!prizeCode)
        return res.status(400).json({ error: 'Codice mancante' });
    try {
        const assignment = await prisma.prizeAssignment.findUnique({
            where: { prize_code: prizeCode },
            include: { prize_type: true, customer: true }
        });
        if (!assignment) {
            return res.status(404).json({ error: 'Codice premio non trovato o non valido' });
        }
        if (assignment.redeemed_at) {
            return res.status(400).json({
                error: 'Premio già ritirato',
                redeemedAt: assignment.redeemed_at,
                redeemedBy: assignment.redeemed_by_staff_id
            });
        }
        const updated = await prisma.prizeAssignment.update({
            where: { id: assignment.id },
            data: {
                redeemed_at: new Date(),
            }
        });
        res.json({
            success: true,
            prize: assignment.prize_type.name,
            customer: `${assignment.customer.first_name} ${assignment.customer.last_name}`,
            redeemedAt: updated.redeemed_at
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore durante il riscatto' });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
