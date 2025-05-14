import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import documentService from '@/services/documentService';
import { IDocument } from '@/models/Document';
import api from '@/services/api'; // Certifique-se de que o serviço API está importado

export const createDocument = async (formData: FormData) => {
  try {
    // Obter o token de autenticação do armazenamento local
    const token = localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await api.post('/api/documents', formData, config);
    return response.data;
  } catch (error) {
    console.error("Erro no createDocument:", error);
    throw error;
  }
};

export function useDocuments() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Obter todos os documentos
  const {
    data: documents = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<IDocument[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      try {
        const response = await documentService.getAllDocuments();
        
        // Processar a resposta, considerando as diferentes estruturas possíveis
        let processedData: IDocument[];
        
        if (response.data && Array.isArray(response.data)) {
          // Se a resposta é um array diretamente
          processedData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // Se a resposta é um objeto com uma propriedade data que é um array
          processedData = response.data.data;
        } else {
          // Caso a resposta não seja do formato esperado, log e retorna array vazio
          console.error('Formato de resposta inesperado:', response);
          return [];
        }
          
        // Garante que cada documento tenha a propriedade uploadedBy
        return processedData.map(doc => ({
          ...doc,
          uploadedBy: doc.uploadedBy || 'unknown' // Valor padrão para uploadedBy se não existir
        }));
      } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        setError('Falha ao buscar documentos');
        throw error;
      }
    },
  });

  // Criar documento
  const createDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return createDocument(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setError(null);
    },
    onError: (error) => {
      console.error('Erro ao criar documento:', error);
      setError('Falha ao criar documento');
    },
  });

  // Atualizar documento
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IDocument> }) => {
      // Converter campos Date para string
      const convertedData = { ...data };
      
      if (data.createdAt instanceof Date) {
        convertedData.createdAt = data.createdAt.toISOString();
      }
      
      if (data.updatedAt instanceof Date) {
        convertedData.updatedAt = data.updatedAt.toISOString();
      }
      
      if (data.expirationDate instanceof Date) {
        convertedData.expirationDate = data.expirationDate.toISOString();
      }
      
      return documentService.updateDocument(id, convertedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setError(null);
    },
    onError: (error) => {
      console.error('Erro ao atualizar documento:', error);
      setError('Falha ao atualizar documento');
    },
  });

  // Excluir documento
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return documentService.deleteDocument(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setError(null);
    },
    onError: (error) => {
      console.error('Erro ao excluir documento:', error);
      setError('Falha ao excluir documento');
    },
  });

  return {
    documents,
    isLoading,
    isError,
    error,
    setError,
    refetch,
    createDocument: createDocumentMutation.mutate,
    updateDocument: updateDocumentMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,
  };
}