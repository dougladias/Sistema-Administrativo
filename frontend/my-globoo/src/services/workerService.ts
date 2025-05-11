import api from './api';
import { IWorker } from '@/models/Worker';

const workerService = {
  // Obter todos os funcionários
  getAllWorkers: async (filters = {}) => {
    return api.get('/api/workers', { params: filters });
  },

  // Obter um funcionário por ID
  getWorkerById: async (id: string) => {
    return api.get(`/api/workers/${id}`);
  },

  // Criar um novo funcionário
  createWorker: async (workerData: Omit<IWorker, '_id'>) => {
    return api.post('/api/workers', workerData);
  },

  // Atualizar um funcionário
  updateWorker: async (id: string, workerData: Partial<IWorker>) => {
    return api.put(`/api/workers/${id}`, workerData);
  },

  // Excluir um funcionário
  deleteWorker: async (id: string) => {
    return api.delete(`/api/workers/${id}`);
  },

  // Registrar entrada de um funcionário
  registerEntry: async (id: string) => {
    return api.post(`/api/workers/${id}/entry`);
  },

  // Registrar saída de um funcionário
  registerExit: async (id: string) => {
    return api.post(`/api/workers/${id}/exit`);
  },

  // Registrar ausência de um funcionário
  registerAbsence: async (id: string) => {
    return api.post(`/api/workers/${id}/absence`);
  },

  // Obter departamentos
  getDepartments: async () => {
    return api.get('/api/workers/departments');
  }
};

export default workerService;