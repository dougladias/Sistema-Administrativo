import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../../shared/src/utils/apiError';
import { createLogger } from '../../../shared/src/utils/logger';

const logger = createLogger({ serviceName: 'api-gateway' });

/**
 * Middleware para validar a criação de documentos
 */
export const validateDocumentCreate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Valida se o arquivo foi enviado
    if (!req.file) {
      logger.warn('Tentativa de criar documento sem arquivo');
      return res.status(400).json({ 
        status: 'error', 
        message: 'O arquivo do documento é obrigatório' 
      });
    }
    
    // Verifica campos obrigatórios
    const { title, workerId, type, category } = req.body;
    
    if (!title) {
      return res.status(400).json({ status: 'error', message: 'O título do documento é obrigatório' });
    }
    
    if (!workerId) {
      return res.status(400).json({ status: 'error', message: 'O funcionário associado é obrigatório' });
    }
    
    if (!type) {
      return res.status(400).json({ status: 'error', message: 'O tipo do documento é obrigatório' });
    }
    
    if (!category) {
      return res.status(400).json({ status: 'error', message: 'A categoria do documento é obrigatória' });
    }
    
    logger.debug('Documento validado com sucesso');
    next();
  } catch (error) {
    logger.error('Erro ao validar documento', { error });
    next(error);
  }
};

/**
 * Middleware para validar a atualização de documentos
 */
export const validateDocumentUpdate = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Nenhum campo fornecido para atualização' 
      });
    }
    
    // Validações específicas para cada campo (se necessário)
    // ...
    
    next();
  } catch (error) {
    logger.error('Erro ao validar atualização de documento', { error });
    next(error);
  }
};

/**
 * Valida os dados para atualização de status do documento
 */
export const validateStatusUpdate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;

    // Validar se status foi fornecido
    if (!status) {
      throw new ApiError('Status é obrigatório', 400);
    }
    next();
  } catch (error) {
    next(error);
  }
};