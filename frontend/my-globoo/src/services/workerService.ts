import api from './api';
import { IWorker } from '@/models/Worker';

const workerService = {
  // Obter todos os funcionários
  getAllWorkers: async (filters = {}) => {
    return api.get('/workers', { params: filters });
  },

  // Obter um funcionário por ID
  getWorkerById: async (id: string) => {
    return api.get(`/workers/${id}`);
  },

  // Criar um novo funcionário
  createWorker: async (workerData: Omit<IWorker, '_id'>) => {
    return api.post('/workers', workerData);
  },

  // Atualizar um funcionário
  updateWorker: async (id: string, workerData: Partial<IWorker>) => {
    return api.put(`/workers/${id}`, workerData);
  },

  // Excluir um funcionário
  deleteWorker: async (id: string) => {
    return api.delete(`/workers/${id}`);
  },

  // Registrar entrada de um funcionário
  registerEntry: async (id: string) => {
    return api.post(`/workers/${id}/entry`);
  },

  // Registrar saída de um funcionário
  registerExit: async (id: string) => {
    return api.post(`/workers/${id}/exit`);
  },

  // Registrar ausência de um funcionário
  registerAbsence: async (id: string) => {
    return api.post(`/workers/${id}/absence`);
  },

  // Obter departamentos
  getDepartments: async () => {
    return api.get('/workers/departments');
  }
};

export default workerService;