import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IWorker, workerService } from '../services/workerService';
import { safeFormatDate } from '@/utils/date-helpers';
import { toast } from 'react-hot-toast'; 

// Interface para retorno do hook
export interface UseWorkersReturn {
  // Dados
  workers: IWorker[];
  isLoading: boolean;
  error: Error | null;
  filteredWorkers: IWorker[];
  
  // Operações básicas
  createWorker: (worker: Partial<Omit<IWorker, '_id'>>) => Promise<void>;
  updateWorker: (id: string, updates: Partial<IWorker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  
  // Operações de ponto
  registerEntry: (id: string, observation?: string) => Promise<void>;
  registerExit: (id: string, observation?: string) => Promise<void>;
  registerAbsence: (id: string, reason: string) => Promise<void>;
  
  // Operações adicionais
  getWorkerById: (id: string) => Promise<IWorker | undefined>;
  getDepartments: () => Promise<string[]>;
  refetchWorkers: () => Promise<void>;
  
  // Estados de operações
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Utilidades
  formatSalary: (value: number | string) => string;
  formatDate: (date: Date | string | null | undefined) => string;
  
  // UI State
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  visibleSalaries: Record<string, boolean>;
  toggleSalaryVisibility: (workerId: string) => void;
}

// Hook para gerenciar operações relacionadas a funcionários
export function useWorkers(): UseWorkersReturn {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleSalaries, setVisibleSalaries] = useState<Record<string, boolean>>({});
  
  // Query para buscar todos os funcionários
  const { 
    data: workers = [], 
    isLoading,
    error,
    refetch
  } = useQuery<IWorker[], Error>({
    queryKey: ['workers'],
    queryFn: workerService.getAll,
  });
  
  // Query para buscar departamentos (lazy)
  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: workerService.getDepartments,
    enabled: false, // Não executa automaticamente
  });

  // Buscar worker por ID
  const getWorkerById = useCallback(async (id: string): Promise<IWorker | undefined> => {
    try {
      const worker = await workerService.getById(id);
      return worker;
    } catch (error) {
      console.error(`Erro ao buscar funcionário ${id}:`, error);
      return undefined;
    }
  }, []);
  
  // Mutation para criar funcionário
  const createMutation = useMutation({
    mutationFn: (workerData: Partial<Omit<IWorker, '_id'>>) => {
      // Ensure type compatibility by casting to the required type
      return workerService.create(workerData as Omit<IWorker, '_id'>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast?.success('Funcionário criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar funcionário:', error);
      toast?.error('Erro ao criar funcionário');
    }
  });
  
  // Mutation para atualizar funcionário
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<IWorker> }) => 
      workerService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast?.success('Funcionário atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar funcionário:', error);
      toast?.error('Erro ao atualizar funcionário');
    }
  });
  
  // Mutation para deletar funcionário
  const deleteMutation = useMutation({
    mutationFn: workerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast?.success('Funcionário removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover funcionário:', error);
      toast?.error('Erro ao remover funcionário');
    }
  });
  
  // Mutation para registrar entrada
  const entryMutation = useMutation({
    mutationFn: ({ id, observation }: { id: string; observation?: string }) => 
      workerService.registerEntry(id, observation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast?.success('Entrada registrada com sucesso!');
    }
  });
  
  // Mutation para registrar saída
  const exitMutation = useMutation({
    mutationFn: ({ id, observation }: { id: string; observation?: string }) => 
      workerService.registerExit(id, observation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast?.success('Saída registrada com sucesso!');
    }
  });
  
  // Mutation para registrar ausência
  const absenceMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      workerService.registerAbsence(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast?.success('Ausência registrada com sucesso!');
    }
  });
  
  // Filtragem de funcionários
  const filteredWorkers = useMemo(() => {
    const filtered = workers.filter(worker => {
      if (!searchTerm.trim()) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        worker.name?.toLowerCase().includes(searchLower) ||
        worker.email?.toLowerCase().includes(searchLower) ||
        worker.role?.toLowerCase().includes(searchLower) ||
        worker.department?.toLowerCase().includes(searchLower)
      );
    });
    
    // Ordenação por nome
    return filtered.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [workers, searchTerm]);
  
  // Função para formatar salário
  const formatSalary = useCallback((value: number | string): string => {
    if (!value) return '-';
    
    try {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) return '-';
      
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue);
    } catch (error) {
      console.error('Erro ao formatar salário:', error);
      return '-';
    }
  }, []);
  
  // Função para formatar data
  const formatDate = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return 'Data não informada';
    return safeFormatDate(date);
  }, []);
  
  // Toggle para visibilidade de salário
  const toggleSalaryVisibility = useCallback((workerId: string): void => {
    setVisibleSalaries(prev => ({
      ...prev,
      [workerId]: !prev[workerId],
    }));
  }, []);
  
  // Busca departamentos
  const getDepartments = useCallback(async (): Promise<string[]> => {
    try {
      const { data } = await departmentsQuery.refetch();
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      return [];
    }
  }, [departmentsQuery]);

  // Recarregar lista de funcionários
  const refetchWorkers = useCallback(async (): Promise<void> => {
    try {
      await refetch();
    } catch (error) {
      console.error('Erro ao recarregar funcionários:', error);
    }
  }, [refetch]);
  
  return {
    // Dados
    workers,
    isLoading,
    error: error || null,
    filteredWorkers,
    
    // Operações básicas
    createWorker: async (worker) => {
      await createMutation.mutateAsync(worker);
    },
    updateWorker: async (id, updates) => {
      await updateMutation.mutateAsync({ id, updates });
    },
    deleteWorker: async (id) => {
      await deleteMutation.mutateAsync(id);
    },
    
    // Operações de ponto
    registerEntry: async (id, observation) => {
      await entryMutation.mutateAsync({ id, observation });
    },
    registerExit: async (id, observation) => {
      await exitMutation.mutateAsync({ id, observation });
    },
    registerAbsence: async (id, reason) => {
      await absenceMutation.mutateAsync({ id, reason: reason || "Não informado" });
    },
    
    // Operações adicionais
    getWorkerById,
    getDepartments,
    refetchWorkers,
    
    // Estados
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Utilidades
    formatSalary,
    formatDate,
    
    // UI State
    searchTerm,
    setSearchTerm,
    visibleSalaries,
    toggleSalaryVisibility,
  };
}