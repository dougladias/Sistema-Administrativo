import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

// Interface para o payload do token JWT
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET as Secret, { 
    expiresIn: env.JWT_EXPIRATION 
  } as SignOptions);
}

// Função para verificar e decodificar o token JWT
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET as Secret) as TokenPayload;
}