import api from './api';
import { IWorker } from '../../../../Backend/shared/src/models/worker.model';

// Exportar o tipo para uso no frontend
export type { IWorker };

// Centraliza todas as chamadas de API relacionadas a workers
export const workerService = {
  // Obter todos os funcionários
  getAll: async (filters = {}): Promise<IWorker[]> => {
    const response = await api.get('/workers', { params: filters });
    return response.data;
  },

  // Obter um funcionário por ID
  getById: async (id: string): Promise<IWorker> => {
    const response = await api.get(`/workers/${id}`);
    return response.data;
  },

  // Criar um novo funcionário
  create: async (workerData: Omit<IWorker, '_id'>): Promise<IWorker> => {
    const response = await api.post('/workers', workerData);
    return response.data;
  },

  // Atualizar um funcionário
  update: async (id: string, workerData: Partial<IWorker>): Promise<IWorker> => {
    const response = await api.put(`/workers/${id}`, workerData);
    return response.data;
  },

  // Excluir um funcionário
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workers/${id}`);
  },

  // Registrar entrada de um funcionário
  registerEntry: async (id: string, observation?: string): Promise<void> => {
    const response = await api.post(`/workers/${id}/entry`, { observation });
    return response.data;
  },

  // Registrar saída de um funcionário
  registerExit: async (id: string, observation?: string): Promise<void> => {
    const response = await api.post(`/workers/${id}/exit`, { observation });
    return response.data;
  },

  // Registrar ausência de um funcionário
  registerAbsence: async (id: string, reason?: string): Promise<void> => {
    const response = await api.post(`/workers/${id}/absence`, { reason });
    return response.data;
  },

  // Obter departamentos
  getDepartments: async (): Promise<string[]> => {
    const response = await api.get('/workers/departments');
    return response.data.departments || [];
  }
};