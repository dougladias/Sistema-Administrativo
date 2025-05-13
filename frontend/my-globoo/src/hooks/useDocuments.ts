import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import documentService from '@/services/documentService';
import { IDocument } from '@/models/Document';

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
        // Define o tipo da resposta para evitar o erro de tipo 'never'
        type ResponseType = { data: IDocument[] | { data: IDocument[] } };
        const typedResponse = response as unknown as ResponseType;
        
        // Processar e garantir que todos os documentos tenham os campos necessários
        const processedData = Array.isArray(typedResponse.data) 
          ? typedResponse.data 
          : typedResponse.data.data;
          
        // Garante que cada documento tenha a propriedade uploadedBy
        return processedData.map(doc => ({
          ...doc,
          uploadedBy: doc.uploadedBy || 'unknown' // Valor padrão para uploadedBy se não existir
        }));
      } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        throw error;
      }
    },
  });

  // Criar documento
  const createDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return documentService.createDocument(formData);
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
      // Converter campos Date para string para corresponder ao tipo Partial<Document>
      const convertedData = {
        ...data,
        createdAt: data.createdAt instanceof Date ? data.createdAt.toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Date ? data.updatedAt.toISOString() : data.updatedAt,
      };
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