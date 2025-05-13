import { z } from 'zod';

// Enums para documentos
export enum DocumentCategory {
  CONTRATO = 'CONTRATO',
  FOLHA_PAGAMENTO = 'FOLHA_PAGAMENTO',
  ADMISSIONAL = 'ADMISSIONAL',
  DEMISSIONAL = 'DEMISSIONAL',
  REGISTRO_PONTO = 'REGISTRO_PONTO',
  OUTROS = 'OUTROS'
}

export enum DocumentStatus {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
  ARQUIVADO = 'ARQUIVADO'
}

// Schema base para documentos
export const DocumentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  category: z.nativeEnum(DocumentCategory),
  status: z.nativeEnum(DocumentStatus),
  workerId: z.string().optional(),
  departmentId: z.string().optional(),
  uploadedBy: z.string(),
  fileName: z.string(),
  originalName: z.string(),
  filePath: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  tags: z.array(z.string()).optional().default([]),
  metaData: z.record(z.any()).optional(),
  expirationDate: z.date().optional()
});

// Schema para criação de documentos
export const DocumentCreateSchema = DocumentSchema.omit({
  status: true,
  fileName: true,
  originalName: true,
  filePath: true,
  fileSize: true,
  mimeType: true,
  uploadedBy: true
});

// Schema para atualização de documentos (todos os campos são opcionais)
export const DocumentUpdateSchema = DocumentCreateSchema.partial();

// Schema para filtros de busca de documentos
export const DocumentFilterSchema = z.object({
  search: z.string().optional(),
  category: z.nativeEnum(DocumentCategory).optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  workerId: z.string().optional(),
  departmentId: z.string().optional(),
  uploadedBy: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});