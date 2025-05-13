import { Request, Response, NextFunction } from 'express';
import documentService from '../services/document.service';
import { ApiError } from '../../../shared/src/utils/apiError';
import logger from '../../../shared/src/utils/logger';
import { DocumentCategory, DocumentStatus } from '../utils/types';

// Adiciona a propriedade 'user' ao tipo Request do Express
declare global {
  namespace Express {
    interface User {
      id: string;
      // adicione outros campos conforme necessário
    }
    interface Request {
      user?: User;
    }
  }
}

// Controlador para criar novo documento com upload de arquivo
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ApiError('Arquivo não enviado', 400);
    }
    
    const userId = req.user?.id || '123456'; // Usar ID padrão se autenticação estiver desativada
    
    const document = await documentService.create(req.body, req.file, userId);
    
    res.status(201).json(document);
  } catch (error) {
    logger.error('Erro ao criar documento:', error);
    next(error);
  }
};

// Controlador para listar todos os documentos com filtros
export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = { ...req.query };
    
    // Converter parâmetros de paginação para números
    const page = filters.page ? parseInt(filters.page as string) : undefined;
    const limit = filters.limit ? parseInt(filters.limit as string) : undefined;
    
    const result = await documentService.findAll({ ...filters, page, limit });
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao listar documentos:', error);
    next(error);
  }
};

// Controlador para buscar documento por ID
export const findById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const document = await documentService.findById(id);
    
    if (!document) return res.status(404).json({ message: 'Documento não encontrado' });
    
    res.status(200).json(document);
  } catch (error) {
    logger.error(`Erro ao buscar documento ID ${req.params.id}:`, error);
    next(error);
  }
};

// Controlador para atualizar documento
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const document = await documentService.update(id, req.body);
    
    if (!document) return res.status(404).json({ message: 'Documento não encontrado' });
    
    res.status(200).json(document);
  } catch (error) {
    logger.error(`Erro ao atualizar documento ID ${req.params.id}:`, error);
    next(error);
  }
};

// Controlador para excluir documento
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await documentService.delete(id);
    
    if (result === null || result === undefined) return res.status(404).json({ message: 'Documento não encontrado' });
    
    res.status(204).send();
  } catch (error) {
    logger.error(`Erro ao excluir documento ID ${req.params.id}:`, error);
    next(error);
  }
};

// Controlador para download de arquivo
export const download = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const fileInfo = await documentService.getFile(id);
    
    if (!fileInfo) return res.status(404).json({ message: 'Arquivo não encontrado' });
    
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.fileName}"`);
    
    // Enviar o conteúdo do arquivo diretamente do banco de dados
    res.end(fileInfo.fileContent);
  } catch (error) {
    logger.error(`Erro ao fazer download do documento ID ${req.params.id}:`, error);
    next(error);
  }
};

// Controlador para visualizar arquivo (sem download)
export const view = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const fileInfo = await documentService.getFile(id);
    
    if (!fileInfo) return res.status(404).json({ message: 'Arquivo não encontrado' });
    
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', 'inline');
    
    // Enviar o conteúdo do arquivo diretamente do banco de dados
    res.end(fileInfo.fileContent);
  } catch (error) {
    logger.error(`Erro ao visualizar documento ID ${req.params.id}:`, error);
    next(error);
  }
};

// Controlador para atualizar status do documento
export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !Object.values(DocumentStatus).includes(status as DocumentStatus)) {
      throw new ApiError('Status inválido', 400);
    }
    
    const document = await documentService.updateStatus(id, status);
    
    if (!document) return res.status(404).json({ message: 'Documento não encontrado' });
    
    res.status(200).json(document);
  } catch (error) {
    logger.error(`Erro ao atualizar status do documento ID ${req.params.id}:`, error);
    next(error);
  }
};

// Controlador para buscar documentos por funcionário
export const findByWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workerId } = req.params;
    const filters = { ...req.query };
    
    // Converter parâmetros de paginação para números
    const page = filters.page ? parseInt(filters.page as string) : undefined;
    const limit = filters.limit ? parseInt(filters.limit as string) : undefined;
    
    const result = await documentService.findByWorker(workerId, { ...filters, page, limit });
    
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Erro ao buscar documentos do funcionário ID ${req.params.workerId}:`, error);
    next(error);
  }
};

// Controlador para buscar documentos por departamento
export const findByDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId } = req.params;
    const filters = { ...req.query };
    
    // Converter parâmetros de paginação para números
    const page = filters.page ? parseInt(filters.page as string) : undefined;
    const limit = filters.limit ? parseInt(filters.limit as string) : undefined;
    
    const result = await documentService.findByDepartment(departmentId, { ...filters, page, limit });
    
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Erro ao buscar documentos do departamento ID ${req.params.departmentId}:`, error);
    next(error);
  }
};

// Controlador para buscar documentos por categoria
export const findByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const filters = { ...req.query };
    
    // Validar categoria
    if (!Object.values(DocumentCategory).includes(category as DocumentCategory)) {
      throw new ApiError('Categoria inválida', 400);
    }
    
    // Converter parâmetros de paginação para números
    const page = filters.page ? parseInt(filters.page as string) : undefined;
    const limit = filters.limit ? parseInt(filters.limit as string) : undefined;
    
    const result = await documentService.findByCategory(category, { ...filters, page, limit });
    
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Erro ao buscar documentos da categoria ${req.params.category}:`, error);
    next(error);
  }
};

// Controlador para buscar documentos prestes a expirar
export const findExpiring = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days } = req.query;
    const daysToExpire = parseInt(days as string) || 30; // Padrão: 30 dias
    
    const documents = await documentService.findExpiring(daysToExpire);
    
    res.status(200).json(documents);
  } catch (error) {
    logger.error('Erro ao buscar documentos expirando:', error);
    next(error);
  }
};