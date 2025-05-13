import { DocumentCategory, DocumentStatus } from '../../../shared/src/schemas/document.schema';

/**
 * DTO para criação de documentos
 */
export interface DocumentCreateDTO {
  title: string;
  description?: string;
  category: DocumentCategory;
  workerId?: string;
  departmentId?: string;
  tags?: string[];
  metaData?: Record<string, any>;
  expirationDate?: Date;
}

/**
 * DTO para atualização de documentos
 */
export interface DocumentUpdateDTO {
  title?: string;
  description?: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
  workerId?: string;
  departmentId?: string;
  tags?: string[];
  metaData?: Record<string, any>;
  expirationDate?: Date;
}

/**
 * DTO para filtros de busca de documentos
 */
export interface DocumentFilterDTO {
  search?: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
  workerId?: string;
  departmentId?: string;
  uploadedBy?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * DTO para resultado paginado de documentos
 */
export interface DocumentFilterResultDTO {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
}

/**
 * DTO para estatísticas de documentos
 */
export interface DocumentStatsDTO {
  category: string;
  count: number;
}

/**
 * DTO para informações de arquivo
 */
export interface DocumentFileDTO {
  filePath: string;
  fileName: string;
  mimeType: string;
}

/**
 * Re-exportação de enums do schema para conveniência
 */
export { DocumentCategory, DocumentStatus };