import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import workerService from '@/services/workerService';
import { IWorker } from '@/models/Worker';

export function useWorkers() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Obter todos os funcionários
  const {
    data: workers = [],
    isLoading,
    isError,
    refetch
  } = useQuery<IWorker[]>({
    queryKey: ['workers'],
    queryFn: async () => {
      try {
        const response = await workerService.getAllWorkers();
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
        setError('Falha ao carregar funcionários');
        throw error;
      }
    }
  });

  // Criar funcionário
  const createWorkerMutation = useMutation({
    mutationFn: async (workerData: Omit<IWorker, '_id'>) => {
      return workerService.createWorker(workerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setError(null);
    },
    onError: (error) => {
      console.error('Erro ao criar funcionário:', error);
      setError('Falha ao criar funcionário');
    }
  });

  // Atualizar funcionário
  const updateWorkerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IWorker> }) => {
      return workerService.updateWorker(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setError(null);
    },
    onError: (error) => {
      console.error('Erro ao atualizar funcionário:', error);
      setError('Falha ao atualizar funcionário');
    }
  });

  // Excluir funcionário
  const deleteWorkerMutation = useMutation({
    mutationFn: async (id: string) => {
      return workerService.deleteWorker(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setError(null);
    },
    onError: (error) => {
      console.error('Erro ao excluir funcionário:', error);
      setError('Falha ao excluir funcionário');
    }
  });

  return {
    workers,
    isLoading,
    isError,
    error,
    setError,
    refetch,
    createWorker: createWorkerMutation.mutate,
    updateWorker: updateWorkerMutation.mutate,
    deleteWorker: deleteWorkerMutation.mutate
  };
}