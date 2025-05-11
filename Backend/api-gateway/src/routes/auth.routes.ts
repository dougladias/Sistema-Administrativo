import { Router } from 'express';
import * as AuthService from '../services/auth.service';

const router = Router();

// Middleware para verificar se o usuário está autenticado
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login({ email, password });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Middleware para verificar se o token JWT é válido
router.post('/register', async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Middleware para validar o token JWT
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;