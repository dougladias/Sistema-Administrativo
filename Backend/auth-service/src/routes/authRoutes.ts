import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../utils/types';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

const router = Router();

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/validate-token', authController.validateToken);

// Rota de teste para gerar um token JWT
router.post('/generate-token', (async (req: Request, res: Response, next: NextFunction) => {
  const { id, email, role } = req.body;

  if (!id || !email || !role) {
    return res.status(400).json({ message: 'ID, email e role são obrigatórios' });
  }

  const jwtSecret = env.jwtSecret as Secret;
  const options: SignOptions = { expiresIn: parseInt(env.jwtExpiresIn, 10) };
  const token = jwt.sign(
    { id, email, role },
    jwtSecret,
    options // Tempo de expiração definido no `.env`
  );

  res.json({ token });
}) as RequestHandler);

// Rotas protegidas
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authenticateToken, authController.logout);

// Rotas de administração (apenas para admin e CEO)
router.get('/users', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.CEO]), 
  (req, res) => {
    res.json({ message: 'Rota de administração - Lista de usuários' });
  }
);

export default router;