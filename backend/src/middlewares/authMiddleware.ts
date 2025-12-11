// src/middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken'; // AGGIUNTO VerifyErrors

// Definiamo il tipo dell'utente che sarà attaccato alla Request
// Assumiamo che il payload del token contenga queste proprietà
export interface UserPayload extends JwtPayload {
  id: number;
  username: string;
  role: 'ADMIN' | 'STAFF';
}

// Estendiamo l'interfaccia Request di Express per includere l'utente
export interface AuthRequest extends Request {
  user?: UserPayload; 
}

// ------------------------------------------------------------------
// Middleware per l'autenticazione tramite cookie JWT
// ------------------------------------------------------------------
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Leggi il token dal cookie (impostato dal frontend con credentials: 'include')
  const token = req.cookies.token;

  if (!token) {
    // Se il cookie non è presente, l'utente non è loggato
    return res.status(401).json({ error: 'Token non trovato o sessione scaduta.' });
  }

  // 2. Verifica il token
  // Legge JWT_SECRET dal .env, se non presente userà il fallback
  const secret = process.env.JWT_SECRET || 'chiave_segreta_super_sicura';

  // *** CORREZIONE TS7006: Tipizzazione di err e user ***
  jwt.verify(token, secret, (err: VerifyErrors | null, user: any) => {
    if (err) {
      // Se il token è scaduto o non è valido (firma errata)
      return res.status(403).json({ error: 'Token non valido o scaduto.' });
    }

    // 3. Se il token è valido, attacca i dati dell'utente alla richiesta
    // Assumiamo che il payload sia corretto (UserPayload)
    (req as AuthRequest).user = user as UserPayload;
    next();
  });
};