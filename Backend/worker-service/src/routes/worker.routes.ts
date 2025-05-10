import { Router } from 'express';
import * as workerController from '../controllers/worker.controller';

const router = Router();

// Rota para buscar todos os departamentos
router.get('/departments', workerController.getDepartments);

// Rotas CRUD para funcionários 
router.get('/', (req, res, next) => {
  workerController.findAll(req, res, next).catch(next);
});
// Rota para buscar um funcionário específico pelo ID
router.get('/:id', (req, res, next) => {
  workerController.findById(req, res, next).catch(next);
});
// Rota para criar um novo funcionário
router.post('/', (req, res, next) => {
  workerController.create(req, res, next).catch(next);
});
// Rota para atualizar um funcionário existente
router.put('/:id', (req, res, next) => {
  workerController.update(req, res, next).catch(next);
});
// Rota para remover um funcionário
router.delete('/:id', (req, res, next) => {
  workerController.remove(req, res, next).catch(next);
});

// Rotas para controle de ponto
router.post('/:id/entry', (req, res, next) => {
  workerController.registerEntry(req, res, next).catch(next);
});
// Rota para registrar a saída de um funcionário
router.post('/:id/exit', (req, res, next) => {
  workerController.registerExit(req, res, next).catch(next);
});
// Rota para registrar a ausência de um funcionário
router.post('/:id/absence', (req, res, next) => {
  workerController.registerAbsence(req, res, next).catch(next);
});

export default router;