import { Request, Response, NextFunction } from 'express';
import workerService from '../services/worker.service';


// Este controlador lida com as requisições HTTP e interage com o serviço de funcionários.
export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.getDepartments();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Controladores para operações CRUD e controle de ponto
export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.findAll(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Controlador para buscar um funcionário específico pelo ID
export const findById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Controlador para criar um novo funcionário
export const create = async (req: Request, res: Response, next: NextFunction) => {
  console.log('Body recebido no worker-service:', req.body); // <--- Adicione esta linha
  try {
    const result = await workerService.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// Controlador para atualizar um funcionário existente
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.update(req.params.id, req.body);
    if (!result) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Controlador para remover um funcionário
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.delete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Controladores para registrar ponto de entrada, saída e ausência
export const registerEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.registerEntry(req.params.id);
    if (!result) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Controlador para registrar a saída de um funcionário
export const registerExit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.registerExit(req.params.id);
    if (!result) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Controlador para registrar a ausência de um funcionário
export const registerAbsence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.registerAbsence(req.params.id);
    if (!result) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json(result);
  } catch (error) {
    next(error);
  }
};