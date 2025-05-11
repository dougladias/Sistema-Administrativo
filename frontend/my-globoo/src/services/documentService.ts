import axios, { AxiosResponse } from 'axios';

// Define an interface for the Document object
interface Document {
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

// Access document service with the correct URL
const DOCUMENT_SERVICE_URL = 'http://localhost:4005';

const api = axios.create({
  baseURL: DOCUMENT_SERVICE_URL,
  withCredentials: true // Important for CORS with credentials
});

const documentService = {
  // Get all documents
  getAllDocuments: async (): Promise<AxiosResponse<Document[]>> => {
    try {
      return await api.get('/documents');
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // Get all templates (documents of template type)
  getAllTemplates: async (): Promise<AxiosResponse<Document[]>> => {
    try {
      // Query for documents with category OUTROS and template=true
      return await api.get('/documents?category=OUTROS&type=template');
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  // Upload document
  uploadDocument: async (formData: FormData): Promise<AxiosResponse<Document>> => {
    try {
      return await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // View document
  viewDocument: (id: string): void => {
    window.open(`${DOCUMENT_SERVICE_URL}/documents/${id}/view`, '_blank');
  },

  // Download document
  downloadDocument: (id: string): void => {
    window.open(`${DOCUMENT_SERVICE_URL}/documents/${id}/download`, '_blank');
  },

  // Delete document
  deleteDocument: async (id: string): Promise<AxiosResponse> => {
    return await api.delete(`/documents/${id}`);
  },

  // View template (same as view document)
  viewTemplate: (id: string): void => {
    window.open(`${DOCUMENT_SERVICE_URL}/documents/${id}/view`, '_blank');
  },

  // Download template (same as download document)
  downloadTemplate: (id: string): void => {
    window.open(`${DOCUMENT_SERVICE_URL}/documents/${id}/download`, '_blank');
  }
};

const fetchWorkers = async () => {
  try {
    const response = await axios.get('http://localhost:4000/api/workers', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`, // Certifique-se de que o token está correto
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar trabalhadores:', error);
    throw error;
  }
};

export default documentService;