
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import documentService from '@/services/documentService';

export interface IDocument {
  _id: string;
  name: string;
  employee?: string;
  employeeId?: string;
  department?: string;
  type: string;
  fileType?: string;
  size?: number;
  tags?: string[];
  uploadDate?: Date;
  expiryDate?: Date;
  createdAt?: string;
  [key: string]: string | number | string[] | Date | undefined;
}

export function useDocuments() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Buscar todos os documentos
  const {
    data: documents = [],
    isLoading: loading,
    refetch: fetchDocuments
  } = useQuery<IDocument[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      try {
        const response = await documentService.getAllDocuments();
        // Assert first to unknown, then to the desired type
        return response.data as unknown as IDocument[];
      } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        setError('Falha ao carregar documentos');
        return [];
      }
    }
  });

  // Upload de documento
  const uploadDocument = async (formData: FormData) => {
    try {
      const response = await documentService.uploadDocument(formData);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer upload de documento:', error);
      setError('Falha ao enviar documento');
      throw error;
    }
  };

  // Deletar documento
  const deleteDocument = async (id: string) => {
    try {
      await documentService.deleteDocument(id);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      setError('Falha ao excluir documento');
      throw error;
    }
  };

  return {
    documents,
    loading,
    error,
    setError,
    fetchDocuments,
    uploadDocument,
    deleteDocument
  };
}