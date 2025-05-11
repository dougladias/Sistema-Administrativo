import { useState} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import documentService from '@/services/documentService';


export function useTemplates() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  
  // Query to fetch templates
  const { 
    data: templates = [], 
    isLoading: loading, 
    isError,
    refetch: fetchTemplates 
  } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      try {
        const response = await documentService.getAllTemplates();
        
        // Map the response to match the expected DocumentTemplate interface
        const mappedTemplates = response.data.map((doc: any) => ({
          _id: doc._id,
          name: doc.title || 'Untitled Template',
          type: doc.category || 'Outros',
          description: doc.description || '',
          fileName: doc.originalName || '',
          fileSize: doc.fileSize,
          fileType: doc.mimeType,
          uploadedBy: doc.uploadedBy,
          createdAt: doc.createdAt,
        }));
        
        return mappedTemplates;
      } catch (error: unknown) {
        console.error('Error fetching templates:', error);
        setError('Failed to load templates. Please check if the service is available.');
        return [];
      }
    }
  });
  
  // Upload template
  const uploadTemplateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Add a category field to identify this as a template
      formData.append('category', 'OUTROS');
      formData.append('type', 'template');
      
      // Use the title field for the name
      const name = formData.get('name');
      if (name) {
        formData.set('title', name.toString());
      }
      
      // Add type to description for filtering
      const description = formData.get('description');
      const type = formData.get('type');
      if (description && type) {
        formData.set('description', `${description.toString()} [TYPE:${type.toString()}]`);
      }
      
      return documentService.uploadDocument(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setError(null);
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 401) {
        setError('Authentication error. Please log in again.');
      } else if (axiosError.response?.status === 413) {
        setError('File is too large. Maximum file size is 10MB.');
      } else if (axiosError.response?.status === 400) {
        setError('Invalid input. Please check all fields.');
      } else {
        setError('Failed to upload template. Please try again later.');
      }
    }
  });
  
  // Delete template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return documentService.deleteDocument(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setError(null);
    },
    onError: (error: unknown) => {
      console.error('Error deleting template:', error);
      setError('Failed to delete template');
    }
  });  
  
  return {
    templates,
    loading,
    isError,
    error,
    setError,
    uploadTemplate: uploadTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    fetchTemplates
  };
}