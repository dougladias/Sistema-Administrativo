/**
 * Interface para o modelo de Documento
 * Corresponde ao modelo do backend (document-service)
 */
export interface IDocument {
  _id?: string; // ID do MongoDB (opcional para criação)
  title: string; // Título do documento
  description?: string; // Descrição do documento (opcional)
  category: DocumentCategory; // Categoria do documento
  status: DocumentStatus; // Status do documento
  workerId?: string; // ID do funcionário associado (opcional)
  departmentId?: string; // ID do departamento associado (opcional)
  uploadedBy: string; // ID do usuário que fez o upload
  fileName: string; // Nome do arquivo salvo no sistema
  originalName: string; // Nome original do arquivo enviado
  filePath?: string; // Caminho do arquivo (opcional)
  fileSize: number; // Tamanho do arquivo em bytes
  mimeType: string; // Tipo MIME do arquivo
  fileContent?: ArrayBuffer; // Conteúdo do arquivo (opcional)
  tags?: string[]; // Tags associadas ao documento (opcional)
  metaData?: Record<string, string | number | boolean | null | string[] | Record<string, unknown>>; // Metadados adicionais (opcional)
  expirationDate?: Date; // Data de expiração do documento (opcional)
  createdAt?: Date; // Data de criação
  updatedAt?: Date; // Data de atualização
}

/**
 * Enum para categorias de documentos
 */
export enum DocumentCategory {
  FINANCEIRO = "Financeiro",
  RH = "RH",
  OUTROS = "Outros",
}

/**
 * Enum para status de documentos
 */
export enum DocumentStatus {
  PENDENTE = "Pendente",
  APROVADO = "Aprovado",
  REJEITADO = "Rejeitado",
}