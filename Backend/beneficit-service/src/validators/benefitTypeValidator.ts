import Joi from 'joi';

export const createBenefitTypeSchema = Joi.object({
  name: Joi.string().required().trim().max(100)
    .messages({
      'string.empty': 'Nome é obrigatório',
      'string.max': 'Nome não pode ter mais de 100 caracteres'
    }),
  description: Joi.string().required().trim().max(500)
    .messages({
      'string.empty': 'Descrição é obrigatória',
      'string.max': 'Descrição não pode ter mais de 500 caracteres'
    }),
  hasDiscount: Joi.boolean().default(false),
  discountPercentage: Joi.number().min(0).max(100).when('hasDiscount', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'number.min': 'Percentual de desconto deve ser no mínimo 0',
    'number.max': 'Percentual de desconto deve ser no máximo 100',
    'any.required': 'Percentual de desconto é obrigatório quando hasDiscount é true'
  }),
  defaultValue: Joi.number().required().min(0)
    .messages({
      'number.base': 'Valor padrão deve ser um número',
      'number.min': 'Valor padrão deve ser maior ou igual a zero',
      'any.required': 'Valor padrão é obrigatório'
    }),
  status: Joi.string().valid('active', 'inactive').default('active')
});

export const updateBenefitTypeSchema = Joi.object({
  name: Joi.string().trim().max(100)
    .messages({
      'string.max': 'Nome não pode ter mais de 100 caracteres'
    }),
  description: Joi.string().trim().max(500)
    .messages({
      'string.max': 'Descrição não pode ter mais de 500 caracteres'
    }),
  hasDiscount: Joi.boolean(),
  discountPercentage: Joi.number().min(0).max(100)
    .messages({
      'number.min': 'Percentual de desconto deve ser no mínimo 0',
      'number.max': 'Percentual de desconto deve ser no máximo 100'
    }),
  defaultValue: Joi.number().min(0)
    .messages({
      'number.base': 'Valor padrão deve ser um número',
      'number.min': 'Valor padrão deve ser maior ou igual a zero'
    }),
  status: Joi.string().valid('active', 'inactive')
}).min(1).messages({
  'object.min': 'É necessário fornecer pelo menos um campo para atualização'
});