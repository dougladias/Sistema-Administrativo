import { Request, Response, NextFunction } from 'express';
import workerService from '../services/worker.service';

export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.getDepartments();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.findAll(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const findById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.update(req.params.id, req.body);
    if (!result) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.delete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const registerEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.registerEntry(req.params.id);
    if (!result) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const registerExit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.registerExit(req.params.id);
    if (!result) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const registerAbsence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workerService.registerAbsence(req.params.id);
    if (!result) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json(result);
  } catch (error) {
    next(error);
  }
};