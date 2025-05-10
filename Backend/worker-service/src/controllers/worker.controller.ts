import { Request, Response, NextFunction } from 'express';
import workerService from '../services/worker.service';
import logger from '../utils/logger';
import ApiError from '../utils/apiError';
import { WorkerCreateDTO, WorkerUpdateDTO } from '../dto/worker.dto';

export default {
  // Buscar todos os funcionários
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query;
      const workers = await workerService.findAll(filters);
      
      return res.status(200).json(workers);
    } catch (error) {
      logger.error('Erro ao buscar funcionários:', error);
      next(error);
    }
  },
  
  // Buscar um funcionário por ID
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const worker = await workerService.findById(id);
      
      if (!worker) {
        throw new ApiError(404, 'Funcionário não encontrado');
      }
      
      return res.status(200).json(worker);
    } catch (error) {
      logger.error(`Erro ao buscar funcionário ID ${req.params.id}:`, error);
      next(error);
    }
  },
  
  // Criar um novo funcionário
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workerData: WorkerCreateDTO = req.body;
      
      const worker = await workerService.create(workerData);
      
      return res.status(201).json(worker);
    } catch (error) {
      logger.error('Erro ao criar funcionário:', error);
      next(error);
    }
  },
  
  // Atualizar um funcionário
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const workerData: WorkerUpdateDTO = req.body;
      
      const updatedWorker = await workerService.update(id, workerData);
      
      if (!updatedWorker) {
        throw new ApiError(404, 'Funcionário não encontrado');
      }
      
      return res.status(200).json(updatedWorker);
    } catch (error) {
      logger.error(`Erro ao atualizar funcionário ID ${req.params.id}:`, error);
      next(error);
    }
  },
  
  // Excluir um funcionário
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const deleted = await workerService.delete(id);
      
      if (!deleted) {
        throw new ApiError(404, 'Funcionário não encontrado');
      }
      
      return res.status(200).json({ message: 'Funcionário excluído com sucesso' });
    } catch (error) {
      logger.error(`Erro ao excluir funcionário ID ${req.params.id}:`, error);
      next(error);
    }
  },
  
  // Registrar entrada de um funcionário
  async registerEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const worker = await workerService.registerEntry(id);
      
      if (!worker) {
        throw new ApiError(404, 'Funcionário não encontrado');
      }
      
      return res.status(200).json(worker);
    } catch (error) {
      logger.error(`Erro ao registrar entrada do funcionário ID ${req.params.id}:`, error);
      next(error);
    }
  },
  
  // Registrar saída de um funcionário
  async registerExit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const worker = await workerService.registerExit(id);
      
      if (!worker) {
        throw new ApiError(404, 'Funcionário não encontrado');
      }
      
      return res.status(200).json(worker);
    } catch (error) {
      logger.error(`Erro ao registrar saída do funcionário ID ${req.params.id}:`, error);
      next(error);
    }
  },
  
  // Registrar ausência de um funcionário
  async registerAbsence(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const worker = await workerService.registerAbsence(id);
      
      if (!worker) {
        throw new ApiError(404, 'Funcionário não encontrado');
      }
      
      return res.status(200).json(worker);
    } catch (error) {
      logger.error(`Erro ao registrar ausência do funcionário ID ${req.params.id}:`, error);
      next(error);
    }
  },
  
  // Buscar departamentos (agrupamento)
  async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const departments = await workerService.getDepartments();
      
      return res.status(200).json(departments);
    } catch (error) {
      logger.error('Erro ao buscar departamentos:', error);
      next(error);
    }
  }
};