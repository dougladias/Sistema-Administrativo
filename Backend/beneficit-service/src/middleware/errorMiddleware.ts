import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import ApiError from '../utils/apiError';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Determinar status code e mensagem
  let statusCode = 500;
  let message = 'Internal Server Error';
  
  // Se for um erro da API (operacional)
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } 
  // Se for um erro de validação do Mongoose
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }
  // Se for um erro de tipo do Mongoose
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid input data';
  }
  // Se for um erro de duplicação no MongoDB
  else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
  }
  // Se for um erro de JWT
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  // Se for um erro de expiração de JWT
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log do erro
  if (statusCode === 500) {
    logger.error(`[Error]: ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`[Error ${statusCode}]: ${message}`);
  }

  // Resposta ao cliente
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
};

// Middleware para rotas não encontradas
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(`Route not found - ${req.originalUrl}`, 404);
  next(error);
};