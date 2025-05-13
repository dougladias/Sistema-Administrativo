import express from 'express';
import benefitTypeController from '../controllers/benefitTypeController';
import { validate } from '../middleware/validationMiddleware';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { createBenefitTypeSchema, updateBenefitTypeSchema } from '../validators/benefitTypeValidator';

const router = express.Router();

// Rotas públicas (precisam de autenticação, mas não autorização)
router.get('/', authenticate, benefitTypeController.getAllBenefitTypes);
router.get('/:id', authenticate, benefitTypeController.getBenefitTypeById);

// Rotas que precisam de autenticação e autorização
router.post('/', 
  authenticate, 
  authorize(['ADMIN', 'CEO']), 
  validate(createBenefitTypeSchema),
  benefitTypeController.createBenefitType
);

router.put('/:id', 
  authenticate, 
  authorize(['ADMIN', 'CEO']),
  validate(updateBenefitTypeSchema),
  benefitTypeController.updateBenefitType
);

router.patch('/:id/deactivate', 
  authenticate, 
  authorize(['ADMIN', 'CEO']),
  benefitTypeController.deactivateBenefitType
);

router.delete('/:id', 
  authenticate, 
  authorize(['CEO']), // Apenas CEO pode excluir permanentemente
  benefitTypeController.deleteBenefitType
);

// Rota especial para inicialização (protegida para admin)
router.post('/initialize', 
  authenticate, 
  authorize(['ADMIN', 'CEO']),
  (req, res, next) => {
    benefitTypeController.initializeBenefitTypes(req, res, next)
      .catch(next);
  }
);

export { router as benefitTypeRoutes };