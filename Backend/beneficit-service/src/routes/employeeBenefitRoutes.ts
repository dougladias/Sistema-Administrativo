import express from 'express';
import employeeBenefitController from '../controllers/employeeBenefitController';
import { validate } from '../middleware/validationMiddleware';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { createEmployeeBenefitSchema, updateEmployeeBenefitSchema } from '../validators/employeeBenefitValidator';

const router = express.Router();

// Rotas públicas (precisam de autenticação, mas não autorização)
router.get('/', authenticate, employeeBenefitController.getAllEmployeeBenefits);
router.get('/:id', authenticate, employeeBenefitController.getEmployeeBenefitById);
router.get('/employee/:employeeId', authenticate, employeeBenefitController.getEmployeeBenefitsByEmployeeId);

// Rotas que precisam de autenticação e autorização
router.post('/', 
  authenticate, 
  authorize(['ADMIN', 'CEO']), 
  validate(createEmployeeBenefitSchema),
  employeeBenefitController.createEmployeeBenefit
);

router.put('/:id', 
  authenticate, 
  authorize(['ADMIN', 'CEO']),
  validate(updateEmployeeBenefitSchema),
  employeeBenefitController.updateEmployeeBenefit
);

router.patch('/:id/deactivate', 
  authenticate, 
  authorize(['ADMIN', 'CEO']),
  employeeBenefitController.deactivateEmployeeBenefit
);

router.delete('/:id', 
  authenticate, 
  authorize(['CEO']), // Apenas CEO pode excluir permanentemente
  employeeBenefitController.deleteEmployeeBenefit
);

export { router as employeeBenefitRoutes };