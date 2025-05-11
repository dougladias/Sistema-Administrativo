import { Router } from 'express';
import { env } from '../config/env';
import { authenticate, authorize } from '../middleware/auth.middleware';
import httpClient from '../utils/http-client';
import { logger } from '../config/logger';

const router = Router();

// Desativado temporariamente para testes
// router.use(authenticate);

// Função de logging para facilitar depuração
function logRequest(method: string, url: string, body?: any) {
  logger.debug(`Fazendo requisição ${method} para ${url}`, { 
    body: body ? JSON.stringify(body).slice(0, 200) : undefined 
  });
}

// Buscar todos os workers
router.get('/', async (req, res, next) => {
  try {
    // Remover o prefixo /api/
    const result = await httpClient.get(`${env.WORKER_SERVICE_URL}/workers`);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Buscar departamentos
router.get('/departments', async (req, res, next) => {
  try {
    const result = await httpClient.get(`${env.WORKER_SERVICE_URL}/workers/departments`);
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

// Criar worker
router.post('/', async (req, res, next) => {
  try {
    const result = await httpClient.post(`${env.WORKER_SERVICE_URL}/workers`, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Atualizar worker
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await httpClient.put(`${env.WORKER_SERVICE_URL}/workers/${id}`, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Excluir worker
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await httpClient.delete(`${env.WORKER_SERVICE_URL}/workers/${id}`);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Registrar entrada de ponto
router.post('/:id/entry', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await httpClient.post(`${env.WORKER_SERVICE_URL}/workers/${id}/entry`);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Registrar saída de ponto
router.post('/:id/exit', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await httpClient.post(`${env.WORKER_SERVICE_URL}/workers/${id}/exit`);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Registrar ausência
router.post('/:id/absence', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await httpClient.post(`${env.WORKER_SERVICE_URL}/workers/${id}/absence`);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Rota de teste/debug
router.get('/debug/connection', async (req, res) => {
  try {
    const axios = require('axios');
    
    // Testar health
    let healthCheck;
    try {
      const url = `${env.WORKER_SERVICE_URL}/health`;
      const healthResponse = await axios.get(url, { timeout: 3000 });
      healthCheck = {
        url,
        status: healthResponse.status,
        data: healthResponse.data
      };
    } catch (err: any) {
      healthCheck = {
        error: err.message,
        code: err.code,
        stack: err.stack
      };
    }
    
    // Testar rota de API
    let apiCheck;
    try {
      const url = `${env.WORKER_SERVICE_URL}/workers`;
      const apiResponse = await axios.get(url, { timeout: 3000 });
      apiCheck = {
        url,
        status: apiResponse.status,
        dataType: typeof apiResponse.data,
        isArray: Array.isArray(apiResponse.data),
        length: Array.isArray(apiResponse.data) ? apiResponse.data.length : null
      };
    } catch (err: any) {
      apiCheck = {
        error: err.message,
        code: err.code,
        stack: err.stack
      };
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: env.NODE_ENV,
        WORKER_SERVICE_URL: env.WORKER_SERVICE_URL
      },
      tests: {
        health: healthCheck,
        api: apiCheck
      }
    });
  } catch (error: any) {
    logger.error('Erro na rota de diagnóstico:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

export default router;