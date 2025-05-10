import { Router } from 'express';
import workerController from '../controllers/worker.controller';
import { validateWorkerCreate, validateWorkerUpdate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Rota para buscar todos os departamentos
router.get('/departments', authenticate, async (req, res, next) => {
  try {
    await workerController.getDepartments(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Rotas CRUD para funcionários
router.get('/', authenticate, async (req, res, next) => {
  try {
    await workerController.findAll(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    await workerController.findById(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, validateWorkerCreate, async (req, res, next) => {
  try {
    await workerController.create(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, validateWorkerUpdate, async (req, res, next) => {
  try {
    await workerController.update(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await workerController.delete(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Rotas para controle de ponto
router.post('/:id/entry', authenticate, async (req, res, next) => {
  try {
    await workerController.registerEntry(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/exit', authenticate, async (req, res, next) => {
  try {
    await workerController.registerExit(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/absence', authenticate, async (req, res, next) => {
  try {
    await workerController.registerAbsence(req, res, next);
  } catch (error) {
    next(error);
  }
});

export default router;