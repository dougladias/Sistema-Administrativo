import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { WorkerCreateDTO, WorkerUpdateDTO } from '../dto/worker.dto';
import ApiError from '../utils/apiError';

// Schema de validação para criação de funcionário
const workerCreateSchema = Joi.object<WorkerCreateDTO>({
  name: Joi.string().required().min(3).max(100).messages({
    'string.empty': 'Nome é obrigatório',
    'string.min': 'Nome deve ter pelo menos 3 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres'
  }),
  cpf: Joi.string().required().pattern(/^\d{11}$/).messages({
    'string.empty': 'CPF é obrigatório',
    'string.pattern.base': 'CPF deve conter 11 dígitos numéricos'
  }),
  nascimento: Joi.date().required().messages({
    'date.base': 'Data de nascimento é obrigatória e deve ser uma data válida'
  }),
  admissao: Joi.date().required().messages({
    'date.base': 'Data de admissão é obrigatória e deve ser uma data válida'
  }),
  salario: Joi.string().required().messages({
    'string.empty': 'Salário é obrigatório'
  }),
  ajuda: Joi.string().allow('').optional(),
  numero: Joi.string().required().messages({
    'string.empty': 'Número de telefone é obrigatório'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email é obrigatório',
    'string.email': 'Email inválido'
  }),
  address: Joi.string().required().messages({
    'string.empty': 'Endereço é obrigatório'
  }),
  contract: Joi.string().valid('CLT', 'PJ').required().messages({
    'string.empty': 'Tipo de contrato é obrigatório',
    'any.only': 'Tipo de contrato deve ser CLT ou PJ'
  }),
  role: Joi.string().required().messages({
    'string.empty': 'Cargo é obrigatório'
  }),
  department: Joi.string().default('Geral')
});

// Schema de validação para atualização de funcionário
const workerUpdateSchema = Joi.object<WorkerUpdateDTO>({
  name: Joi.string().min(3).max(100).messages({
    'string.min': 'Nome deve ter pelo menos 3 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres'
  }),
  cpf: Joi.string().pattern(/^\d{11}$/).messages({
    'string.pattern.base': 'CPF deve conter 11 dígitos numéricos'
  }),
  nascimento: Joi.date().messages({
    'date.base': 'Data de nascimento deve ser uma data válida'
  }),
  admissao: Joi.date().messages({
    'date.base': 'Data de admissão deve ser uma data válida'
  }),
  salario: Joi.string(),
  ajuda: Joi.string().allow('').optional(),
  numero: Joi.string(),
  email: Joi.string().email().messages({
    'string.email': 'Email inválido'
  }),
  address: Joi.string(),
  contract: Joi.string().valid('CLT', 'PJ').messages({
    'any.only': 'Tipo de contrato deve ser CLT ou PJ'
  }),
  role: Joi.string(),
  department: Joi.string(),
  status: Joi.string().valid('active', 'inactive', 'other').messages({
    'any.only': 'Status deve ser active, inactive ou other'
  })
});

// Middleware para validar criação de funcionário
export const validateWorkerCreate = (req: Request, res: Response, next: NextFunction) => {
  const { error } = workerCreateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join('; ');
    return next(new ApiError(400, errorMessages));
  }
  
  next();
};

// Middleware para validar atualização de funcionário
export const validateWorkerUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { error } = workerUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join('; ');
    return next(new ApiError(400, errorMessages));
  }
  
  next();
};