import api from './api';

export interface IWorker {
  _id: string;
  name: string;
  email: string;
  role: string;
  cpf: string;
  numero: string;
  address: string;
  department: string;
  salario: number | string;
  ajuda?: number | string;
  status: 'active' | 'inactive';
  contract: 'CLT' | 'PJ';
  nascimento: Date | string | null;
  admissao: Date | string | null;
}

// Tipo para criação de novo funcionário (sem _id que será gerado pelo backend)
export type IWorkerCreate = Omit<IWorker, '_id'>;

// Tipo para atualização (todos os campos opcionais)
export type IWorkerUpdate = Partial<IWorker>;

export const workerService = {
  /**
   * Busca todos os funcionários
   */
  getAll: async (): Promise<IWorker[]> => {
    const response = await api.get<IWorker[]>('/workers');
    
    // Normaliza os dados vindos da API
    return response.data.map(worker => ({
      ...worker,
      // Converter datas com segurança
      nascimento: worker.nascimento ? new Date(worker.nascimento) : null,
      admissao: worker.admissao ? new Date(worker.admissao) : null,
      // Valores padrão para campos opcionais
      status: worker.status || 'active',
      department: worker.department || 'Geral'
    }));
  },

  /**
   * Busca um funcionário pelo ID
   */
  getById: async (id: string): Promise<IWorker> => {
    const response = await api.get<IWorker>(`/workers/${id}`);
    const worker = response.data;
    
    return {
      ...worker,
      nascimento: worker.nascimento ? new Date(worker.nascimento) : null,
      admissao: worker.admissao ? new Date(worker.admissao) : null,
    };
  },

  /**
   * Cria um novo funcionário
   */
  create: async (worker: Partial<IWorkerCreate>): Promise<IWorker> => {
    // Prepara datas para envio ao backend
    const workerToCreate = {
      ...worker,
      // Formata as datas para ISO String se existirem
      nascimento: worker.nascimento ? new Date(worker.nascimento).toISOString() : null,
      admissao: worker.admissao ? new Date(worker.admissao).toISOString() : null,
    };
    
    const response = await api.post<IWorker>('/workers', workerToCreate);
    return response.data;
  },

  /**
   * Atualiza um funcionário existente
   */
  update: async (id: string, updates: Partial<IWorker>): Promise<IWorker> => {
    // Prepara datas para envio ao backend
    const workerToUpdate = {
      ...updates,
      // Formata as datas para ISO String se existirem
      nascimento: updates.nascimento ? new Date(updates.nascimento).toISOString() : null,
      admissao: updates.admissao ? new Date(updates.admissao).toISOString() : null,
    };
    
    const response = await api.put<IWorker>(`/workers/${id}`, workerToUpdate);
    return response.data;
  },

  /**
   * Remove um funcionário
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workers/${id}`);
  },

  /**
   * Registra entrada de ponto
   */
  registerEntry: async (id: string, observation?: string): Promise<void> => {
    await api.post(`/workers/${id}/entry`, { observation });
  },

  /**
   * Registra saída de ponto
   */
  registerExit: async (id: string, observation?: string): Promise<void> => {
    await api.post(`/workers/${id}/exit`, { observation });
  },

  /**
   * Registra ausência
   */
  registerAbsence: async (id: string, reason: string): Promise<void> => {
    await api.post(`/workers/${id}/absence`, { reason });
  },
  
  /**
   * Busca departamentos disponíveis
   */
  getDepartments: async (): Promise<string[]> => {
    const response = await api.get<{departments: string[]}>('/workers/departments');
    return response.data.departments;
  }
};