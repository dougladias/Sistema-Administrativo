import api from './api'; // Importa o módulo centralizado de requisições
import { AxiosResponse } from 'axios';

// Define uma interface para o objeto Document
export interface Document {
  _id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  fileName?: string;
  originalName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  tags?: string[];
  metaData?: Record<string, unknown>;
  expirationDate?: Date;
  createdAt?: string;
  updatedAt?: string;
}

const documentService = {
  // Obter todos os documentos
  getAllDocuments: async (filters = {}): Promise<AxiosResponse<Document[]>> => {
    return api.get('/documents', { params: filters });
  },

  // Obter um documento por ID
  getDocumentById: async (id: string): Promise<AxiosResponse<Document>> => {
    return api.get(`/documents/${id}`);
  },

  // Criar um novo documento (upload)
  createDocument: async (formData: FormData): Promise<AxiosResponse<Document>> => {
    return api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Atualizar um documento
  updateDocument: async (id: string, documentData: Partial<Document>): Promise<AxiosResponse<Document>> => {
    return api.put(`/documents/${id}`, documentData);
  },

  // Excluir um documento
  deleteDocument: async (id: string): Promise<AxiosResponse> => {
    return api.delete(`/documents/${id}`);
  },

  // Visualizar um documento
  viewDocument: (id: string): void => {
    window.open(`${api.defaults.baseURL}/documents/${id}/view`, '_blank');
  },

  // Fazer download de um documento
  downloadDocument: (id: string): void => {
    window.open(`${api.defaults.baseURL}/documents/${id}/download`, '_blank');
  },

  // Obter todos os templates (documentos do tipo template)
  getAllTemplates: async (): Promise<AxiosResponse<Document[]>> => {
    return api.get('/documents', { params: { category: 'OUTROS', type: 'template' } });
  },

  // Visualizar um template
  viewTemplate: (id: string): void => {
    window.open(`${api.defaults.baseURL}/documents/${id}/view`, '_blank');
  },

  // Fazer download de um template
  downloadTemplate: (id: string): void => {
    window.open(`${api.defaults.baseURL}/documents/${id}/download`, '_blank');
  },
};

export default documentService;