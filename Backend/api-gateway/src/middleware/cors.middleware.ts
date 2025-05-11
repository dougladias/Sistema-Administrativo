import cors from 'cors';
import { env } from '../config/env';
import { Request, Response, NextFunction } from 'express';

// Lista de origens permitidas
const allowedOrigins = [
  // Origens de desenvolvimento
  'http://localhost:3000',
  'http://localhost:8080',
  
  
  
  // Permite subdomínios em produção
  ...(env.NODE_ENV === 'production' ? [/\.globoo\.com\.br$/] : []),
];

// Configurações do CORS
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem origin (como apps mobile ou curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verifica se a origem está na lista de permitidas
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      }
      // Se for RegExp, testa o padrão
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origem não permitida: ${origin}`));
    }
  },
  // Permite credenciais (cookies, auth headers)
  credentials: true,
  // Métodos HTTP permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  // Headers permitidos
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  // Headers expostos ao cliente
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  // Tempo de cache da preflight
  maxAge: 86400, // 24 horas
};

// Middleware CORS configurado
export const corsMiddleware = cors(corsOptions);

// Handler de erro específico para CORS
interface CorsError extends Error {
    message: string;
}

export const corsErrorHandler = (err: CorsError, req: Request, res: Response, next: NextFunction): void => {
    if (err.message.includes('Origem não permitida')) {
        res.status(403).json({
            success: false,
            error: {
                code: 'CORS_ERROR',
                message: 'Acesso bloqueado: origem não permitida',
            },
            timestamp: new Date().toISOString(),
        });
    }
    next(err);
};