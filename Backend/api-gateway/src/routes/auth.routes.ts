import { Router } from 'express';
import { env } from '../config/env';
import { authenticate, authorize } from '../middleware/auth.middleware';
import httpClient from '../utils/http-client';
import { logger } from '../config/logger';

const router = Router();

// Função de logging para facilitar depuração
function logRequest(method: string, url: string, body?: any) {
  logger.debug(`Fazendo requisição ${method} para ${url}`, { 
    body: body ? JSON.stringify(body).slice(0, 200) : undefined 
  });
}

// Rota de login
router.post('/login', async (req, res, next) => {
  try {
    logRequest('POST', `${env.AUTH_SERVICE_URL}/api/auth/login`, req.body);
    const result = await httpClient.post(`${env.AUTH_SERVICE_URL}/api/auth/login`, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Rota de registro
router.post('/register', async (req, res, next) => {
  try {
    logRequest('POST', `${env.AUTH_SERVICE_URL}/api/auth/register`, req.body);
    const result = await httpClient.post(`${env.AUTH_SERVICE_URL}/api/auth/register`, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Rota para refresh token
router.post('/refresh-token', async (req, res, next) => {
  try {
    logRequest('POST', `${env.AUTH_SERVICE_URL}/api/auth/refresh-token`, req.body);
    const result = await httpClient.post(`${env.AUTH_SERVICE_URL}/api/auth/refresh-token`, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Rota para validar token
router.post('/validate-token', async (req, res, next) => {
  try {
    logRequest('POST', `${env.AUTH_SERVICE_URL}/api/auth/validate-token`, req.body);
    const result = await httpClient.post(`${env.AUTH_SERVICE_URL}/api/auth/validate-token`, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Rota para logout (middleware de autenticação desativado temporariamente para testes)
router.post('/logout', /* authenticate(), */ async (req, res, next) => {
  try {
    logRequest('POST', `${env.AUTH_SERVICE_URL}/api/auth/logout`, req.body);
    const result = await httpClient.post(`${env.AUTH_SERVICE_URL}/api/auth/logout`, req.body, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Rota para obter perfil do usuário autenticado (middleware de autenticação desativado temporariamente para testes)
router.get('/me', /* authenticate(), */ async (req, res, next) => {
  try {
    logRequest('GET', `${env.AUTH_SERVICE_URL}/api/auth/me`);
    const result = await httpClient.get(`${env.AUTH_SERVICE_URL}/api/auth/me`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Rota para atualizar perfil do usuário (middleware de autenticação desativado temporariamente para testes)
router.put('/me', /* authenticate(), */ async (req, res, next) => {
  try {
    logRequest('PUT', `${env.AUTH_SERVICE_URL}/api/auth/me`, req.body);
    const result = await httpClient.put(`${env.AUTH_SERVICE_URL}/api/auth/me`, req.body, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Rota para atualizar senha (middleware de autenticação desativado temporariamente para testes)
router.put('/me/password', /* authenticate(), */ async (req, res, next) => {
  try {
    logRequest('PUT', `${env.AUTH_SERVICE_URL}/api/auth/me/password`, req.body);
    const result = await httpClient.put(`${env.AUTH_SERVICE_URL}/api/auth/me/password`, req.body, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// === Rotas Administrativas ===

// Listar todos os usuários (middlewares de autenticação e autorização desativados temporariamente para testes)
router.get('/users', /* authenticate(), authorize(['ADMIN', 'CEO']), */ async (req, res, next) => {
  try {
    logRequest('GET', `${env.AUTH_SERVICE_URL}/api/auth/users`);
    const result = await httpClient.get(`${env.AUTH_SERVICE_URL}/api/auth/users`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Obter usuário por ID (middlewares de autenticação e autorização desativados temporariamente para testes)
router.get('/users/:id', /* authenticate(), authorize(['ADMIN', 'CEO']), */ async (req, res, next) => {
  try {
    const { id } = req.params;
    logRequest('GET', `${env.AUTH_SERVICE_URL}/api/auth/users/${id}`);
    const result = await httpClient.get(`${env.AUTH_SERVICE_URL}/api/auth/users/${id}`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Atualizar usuário por ID (middlewares de autenticação e autorização desativados temporariamente para testes)
router.put('/users/:id', /* authenticate(), authorize(['ADMIN', 'CEO']), */ async (req, res, next) => {
  try {
    const { id } = req.params;
    logRequest('PUT', `${env.AUTH_SERVICE_URL}/api/auth/users/${id}`, req.body);
    const result = await httpClient.put(`${env.AUTH_SERVICE_URL}/api/auth/users/${id}`, req.body, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Excluir usuário (middlewares de autenticação e autorização desativados temporariamente para testes)
router.delete('/users/:id', /* authenticate(), authorize(['ADMIN', 'CEO']), */ async (req, res, next) => {
  try {
    const { id } = req.params;
    logRequest('DELETE', `${env.AUTH_SERVICE_URL}/api/auth/users/${id}`);
    const result = await httpClient.delete(`${env.AUTH_SERVICE_URL}/api/auth/users/${id}`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;