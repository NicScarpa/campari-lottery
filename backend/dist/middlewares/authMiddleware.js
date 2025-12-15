"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.authenticateCustomer = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set!');
}
// ------------------------------------------------------------------
// Middleware per l'autenticazione
// ------------------------------------------------------------------
const authenticateToken = (req, // Usiamo AuthRequest qui per TypeScript
res, next) => {
    // 1. Cerca il token nei cookie O nell'header Authorization (Bearer token)
    // Questo è utile se decidi di testare le API con Postman o se il frontend cambia strategia
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied: Token not found' });
    }
    try {
        // 2. Verifica il token
        const verified = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // 3. Attacca l'utente alla richiesta
        req.user = verified;
        next();
    }
    catch (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
// ------------------------------------------------------------------
// Middleware per l'autenticazione dei customer
// ------------------------------------------------------------------
const authenticateCustomer = (req, res, next) => {
    // Cerca il token nei cookie o nell'header Authorization
    const token = req.cookies?.customerToken || req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied: Customer token not found' });
    }
    try {
        // Verifica il token
        const verified = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Attacca il customer alla richiesta
        req.customer = verified;
        next();
    }
    catch (err) {
        res.status(403).json({ error: 'Invalid or expired customer token' });
    }
};
exports.authenticateCustomer = authenticateCustomer;
// ------------------------------------------------------------------
// Middleware per l'autorizzazione basata sui ruoli (NUOVO)
// ------------------------------------------------------------------
const authorizeRole = (role) => {
    return (req, res, next) => {
        // Se l'utente è admin, passa sempre. Altrimenti controlla il ruolo specifico.
        if (!req.user || (req.user.role !== role && req.user.role !== 'admin')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
