import { Request, Response } from 'express';
import workerService from '../services/worker.service';
import { ApiError } from 'shared/src/utils/error.utils';
import { createLogger } from 'shared/src/utils/logger.utils';
import { WorkerCreate, WorkerUpdate } from 'shared/src/schemas/worker.schema';

const logger = createLogger({ serviceName: 'worker-service' });

export default {
  // Buscar todos os funcionários
  async findAll(req: Request, res: Response) {
    try {
      const filters = req.query;
      const workers = await workerService.findAll(filters);
      
      return res.status(200).json(workers);
    } catch (error) {
      logger.error('Erro ao buscar funcionários:', error);
      return res.status(error instanceof ApiError ? error.statusCode : 500)
                .json({ message: error instanceof Error ? error.message : 'Erro interno' });
    }
  },
  
  // Buscar um funcionário por ID
  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const worker = await workerService.findById(id);
      
      if (!worker) {
        return res.status(404).json({ message: 'Funcionário não encontrado' });
      }
      
      return res.status(200).json(worker);
    } catch (error) {
      logger.error(`Erro ao buscar funcionário ID ${req.params.id}:`, error);
      return res.status(error instanceof ApiError ? error.statusCode : 500)
                .json({ message: error instanceof Error ? error.message : 'Erro interno' });
    }
  },
  
  // Criar um novo funcionário
  async create(req: Request, res: Response) {
    try {
      const workerData = req.body as WorkerCreate;
      const worker = await workerService.create(workerData);
      
      return res.status(201).json(worker);
    } catch (error) {
      logger.error('Erro ao criar funcionário:', error);
      return res.status(error instanceof ApiError ? error.statusCode : 500)
                .json({ message: error instanceof Error ? error.message : 'Erro interno' });
    }
  },
  
  // Atualizar um funcionário
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const workerData = req.body as WorkerUpdate;
      
      const updatedWorker = await workerService.update(id, workerData);
      
      if (!updatedWorker) {
        return res.status(404).json({ message: 'Funcionário não encontrado' });
      }
      
      return res.status(200).json(updatedWorker);
    } catch (error) {
      logger.error(`Erro ao atualizar funcionário ID ${req.params.id}:`, error);
      return res.status(error instanceof ApiError ? error.statusCode : 500)
                .json({ message: error instanceof Error ? error.message : 'Erro interno' });
    }
  },
  
  // Excluir um funcionário
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const deleted = await workerService.delete(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Funcionário não encontrado' });
      }
      
      return res.status(200).json({ message: 'Funcionário excluído com sucesso' });
    } catch (error) {
      logger.error(`Erro ao excluir funcionário ID ${req.params.id}:`, error);
      return res.status(error instanceof ApiError ? error.statusCode : 500)
                .json({ message: error instanceof Error ? error.message : 'Erro interno' });
    }
  },
  
  // Registrar entrada de um funcionário
  async registerEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const worker = await workerService.registerEntry(id);
      
      if (!worker) {
        return res.status(404).json({ message: 'Funcionário não encontrado' });
      }
      
      return res.status(200).json(worker);
    } catch (error) {
      logger.error(`Erro ao registrar entrada do funcionário ID ${req.params.id}:`, error);
      return res.status(error instanceof ApiError ? error.statusCode : 500)
                .json({ message: error instanceof Error ? error.message : 'Erro interno' });
    }
  },
  
  // Registrar saída de um funcionário
  async registerExit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const worker = await workerService.registerExit(id);
      
      if (!worker) {
        return res.status(404).json({ message: 'Funcionário não encontrado' });
      }
      
      return res.status(200).json(worker);
    } catch (error) {
      logger.error(`Erro ao registrar saída do funcionário ID ${req.params.id}:`, error);
      return res.status(error instanceof ApiError ? error.statusCode : 500)
                .json({ message: error instanceof Error ? error.message : 'Erro interno' });
    }
  },
  
  // Registrar ausência de um funcionário
  async registerAbsence(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const worker = await workerService.registerAbsence(id);
      
      if (!worker) {
        return res.status(404).json({ message: 'Funcionário não encontrado' });
      }
      
      return res.status(200).json(worker);
    } catch (error) {
      logger.error(`Erro ao registrar ausência do funcionário ID ${req.params.id}:`, error);
      return res.status(error instanceof ApiError ? error.statusCode : 500)
                .json({ message: error instanceof Error ? error.message : 'Erro interno' });
    }
  },
  
  // Buscar departamentos (agrupamento)
  async getDepartments(req: Request, res: Response) {
    try {
      const departments = await workerService.getDepartments();
      
      return res.status(200).json(departments);
    } catch (error) {
      logger.error('Erro ao buscar departamentos:', error);
      return res.status(error instanceof ApiError ? error.statusCode : 500)
                .json({ message: error instanceof Error ? error.message : 'Erro interno' });
    }
  }
};