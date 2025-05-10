import { Router } from 'express';
import workerController from '../controllers/worker.controller';

const router = Router();

// Rota para buscar todos os departamentos
router.get('/departments', workerController.getDepartments);

// Rotas CRUD para funcionários (sem middleware de autenticação)
router.get('/', workerController.findAll);
router.get('/:id', workerController.findById);
router.post('/', workerController.create);
router.put('/:id', workerController.update);
router.delete('/:id', workerController.delete);

// Rotas para controle de ponto
router.post('/:id/entry', workerController.registerEntry);
router.post('/:id/exit', workerController.registerExit);
router.post('/:id/absence', workerController.registerAbsence);

export default router;