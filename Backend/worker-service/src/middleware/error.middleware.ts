import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/apiError';
import logger from '../utils/logger';

export default function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`[Error Handler] ${err.message}`);
  
  // Verificar se é um erro da API
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message
    });
  }
  
  // Para erros de MongoDB/Mongoose
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: err.message
    });
  }
  
  // Para erros de duplicidade no MongoDB
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    return res.status(409).json({
      status: 'error',
      statusCode: 409,
      message: 'Já existe um registro com os mesmos dados únicos'
    });
  }
  
  // Erro padrão (500 - Internal Server Error)
  return res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno no servidor'
  });
}