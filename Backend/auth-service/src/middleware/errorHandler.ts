import { Request, Response, NextFunction } from 'express';
import logger from '../../../shared/src/utils/logger';
import ApiError from '../utils/apiError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log do erro
  logger.error(`${err.name}: ${err.message}`);
  
  // Se é um erro operacional conhecido
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }
  
  // Se é um erro de MongoDB (duplicação)
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    return res.status(409).json({
      status: 'error',
      message: 'Recurso já existe com os dados fornecidos'
    });
  }
  
  // Se é um erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Erro de validação dos dados',
      details: err.message
    });
  }
  
  // Se é um erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token inválido'
    });
  }
  
  // Se é um erro de expiração de JWT
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expirado'
    });
  }
  
  // Para erros de produção
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
  
  // Para erros de desenvolvimento
  return res.status(500).json({
    status: 'error',
    message: err.message,
    stack: err.stack
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(`Rota não encontrada: ${req.originalUrl}`, 404);
  next(error);
};