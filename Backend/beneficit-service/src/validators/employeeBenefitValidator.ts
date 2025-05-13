import Joi from 'joi';
import mongoose from 'mongoose';

// Função auxiliar para validar ObjectId
const validateObjectId = (value: string, helpers: Joi.CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

export const createEmployeeBenefitSchema = Joi.object({
  employeeId: Joi.string().required().custom(validateObjectId)
    .messages({
      'string.empty': 'ID do funcionário é obrigatório',
      'any.invalid': 'ID do funcionário inválido'
    }),
  benefitTypeId: Joi.string().required().custom(validateObjectId)
    .messages({
      'string.empty': 'ID do tipo de benefício é obrigatório',
      'any.invalid': 'ID do tipo de benefício inválido'
    }),
  value: Joi.number().min(0)
    .messages({
      'number.base': 'Valor deve ser um número',
      'number.min': 'Valor deve ser maior ou igual a zero'
    }),
  status: Joi.string().valid('active', 'inactive').default('active'),
  startDate: Joi.date().default(new Date()),
  endDate: Joi.date().greater(Joi.ref('startDate'))
    .messages({
      'date.greater': 'Data de término deve ser posterior à data de início'
    })
});

export const updateEmployeeBenefitSchema = Joi.object({
  value: Joi.number().min(0)
    .messages({
      'number.base': 'Valor deve ser um número',
      'number.min': 'Valor deve ser maior ou igual a zero'
    }),
  status: Joi.string().valid('active', 'inactive'),
  endDate: Joi.date()
    .messages({
      'date.base': 'Data de término deve ser uma data válida'
    })
}).min(1).messages({
  'object.min': 'É necessário fornecer pelo menos um campo para atualização'
});