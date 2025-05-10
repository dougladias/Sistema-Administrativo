import { Router } from 'express';
import { env } from '../config/env';
import { authenticate, authorize } from '../middleware/auth.middleware';
import httpClient from '../utils/http-client';

const router = Router();

// Todas as rotas do worker requerem autenticação
router.use(authenticate);

// Buscar todos os workers (apenas admin pode acessar)
router.get('/', authorize(['admin']), async (req, res, next) => {
  try {
    const result = await httpClient.get(`${env.WORKER_SERVICE_URL}/workers`);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Buscar worker por ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await httpClient.get(`${env.WORKER_SERVICE_URL}/workers/${id}`);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Criar worker (apenas admin pode criar)
router.post('/', authorize(['admin']), async (req, res, next) => {
  try {
    const result = await httpClient.post(`${env.WORKER_SERVICE_URL}/workers`, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Atualizar worker
router.put('/:id', authorize(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await httpClient.put(`${env.WORKER_SERVICE_URL}/workers/${id}`, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Excluir worker
router.delete('/:id', authorize(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await httpClient.delete(`${env.WORKER_SERVICE_URL}/workers/${id}`);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;