import { Request, Response, NextFunction } from 'express';
import { DocumentCategory } from '../types/document.types';

export const validateDocumentCreate = (req: Request, res: Response, next: NextFunction) => {
  const { title, category } = req.body;

  // Validação básica
  if (!title) {
    return res.status(400).json({ error: 'O título do documento é obrigatório.' });
  }

  if (!category || !Object.values(DocumentCategory).includes(category)) {
    return res.status(400).json({ error: 'A categoria do documento é inválida.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'O arquivo é obrigatório.' });
  }

  next();
};