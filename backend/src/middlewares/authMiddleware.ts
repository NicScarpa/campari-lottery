import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

// Definiamo il tipo dell'utente che sarà attaccato alla Request
export interface UserPayload extends JwtPayload {
  id: number;
  username: string;
  role: string;
}

// Estendiamo l'interfaccia Request di Express per includere l'utente
export interface AuthRequest extends Request {
  user?: UserPayload;
}

// ------------------------------------------------------------------
// Middleware per l'autenticazione
// ------------------------------------------------------------------
export const authenticateToken = (
  req: AuthRequest, // Usiamo AuthRequest qui per TypeScript
  res: Response,
  next: NextFunction
) => {
  // 1. Cerca il token nei cookie O nell'header Authorization (Bearer token)
  // Questo è utile se decidi di testare le API con Postman o se il frontend cambia strategia
  const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied: Token not found' });
  }

  try {
    // 2. Verifica il token
    const verified = jwt.verify(token, JWT_SECRET) as UserPayload;
    
    // 3. Attacca l'utente alla richiesta
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ------------------------------------------------------------------
// Middleware per l'autorizzazione basata sui ruoli (NUOVO)
// ------------------------------------------------------------------
export const authorizeRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Se l'utente è admin, passa sempre. Altrimenti controlla il ruolo specifico.
    if (!req.user || (req.user.role !== role && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};