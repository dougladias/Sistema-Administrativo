import { Router } from 'express';
import * as workerController from '../controllers/worker.controller';

const router = Router();

// Rota para buscar todos os departamentos
router.get('/departments', workerController.getDepartments);

// Rotas CRUD para funcionários (sem middleware de autenticação)
router.get('/', (req, res, next) => {
  workerController.findAll(req, res, next).catch(next);
});
router.get('/:id', (req, res, next) => {
  workerController.findById(req, res, next).catch(next);
});
router.post('/', (req, res, next) => {
  workerController.create(req, res, next).catch(next);
});
router.put('/:id', (req, res, next) => {
  workerController.update(req, res, next).catch(next);
});
router.delete('/:id', (req, res, next) => {
  workerController.remove(req, res, next).catch(next);
});

// Rotas para controle de ponto
router.post('/:id/entry', (req, res, next) => {
  workerController.registerEntry(req, res, next).catch(next);
});
router.post('/:id/exit', (req, res, next) => {
  workerController.registerExit(req, res, next).catch(next);
});
router.post('/:id/absence', (req, res, next) => {
  workerController.registerAbsence(req, res, next).catch(next);
});

export default router;