import { Router } from 'express';
import * as authController from '../controllers/authController';
import { 
  authenticate, 
  authorize, 
  validateBody, 
  validateMongoId, 
  loginRateLimiter, 
  strongPasswordCheck,
  auditLogger 
} from '../middleware';
import { UserRole } from '../../../shared/src/models/user.model';
import { 
  LoginSchema, 
  UserCreateSchema, 
  UserUpdateSchema, 
  PasswordUpdateSchema,
  RefreshTokenRequestSchema 
} from '../../../shared/src/schemas/user.schema';
import { z } from 'zod';

const router = Router();

// Schema para validação do token JWT
const TokenSchema = z.object({
  token: z.string()
});

// Schema para validação do ID MongoDB
const MongoIdSchema = z.object({
  id: z.string().refine(id => /^[0-9a-fA-F]{24}$/.test(id), {
    message: "ID inválido"
  })
});

// =================================================
// Rotas públicas (não requerem autenticação)
// =================================================

// Rota de registro
router.post(
  '/register', 
  validateBody(UserCreateSchema),
  strongPasswordCheck,
  auditLogger('user_registration'),
  authController.register
);

// Rota de login
router.post(
  '/login', 
  loginRateLimiter,
  validateBody(LoginSchema), 
  auditLogger('user_login'),
  authController.login
);

// Rota para refresh token
router.post(
  '/refresh-token', 
  validateBody(RefreshTokenRequestSchema),
  auditLogger('token_refresh'),
  authController.refreshToken
);

// Rota para validar token
router.post(
  '/validate-token', 
  validateBody(TokenSchema),
  authController.validateToken
);

// =================================================
// Rotas protegidas (requerem autenticação)
// =================================================

// Middleware de autenticação para todas as rotas abaixo
router.use(authenticate());

// Rota para obter perfil do usuário atual
router.get(
  '/me', 
  authController.getCurrentUser
);

// Rota para atualizar perfil do usuário
router.put(
  '/me', 
  validateBody(UserUpdateSchema),
  auditLogger('profile_update'),
  authController.updateUser
);

// Rota para atualizar senha
router.put(
  '/me/password', 
  validateBody(PasswordUpdateSchema),
  strongPasswordCheck,
  auditLogger('password_change'),
  authController.updatePassword
);

// Rota para logout
router.post(
  '/logout', 
  validateBody(RefreshTokenRequestSchema),
  auditLogger('user_logout'),
  authController.logout
);

// =================================================
// Rotas administrativas (requerem papel de ADMIN ou CEO)
// =================================================

// Rota para listar todos os usuários
router.get(
  '/users', 
  authorize([UserRole.ADMIN, UserRole.CEO]), 
  authController.getUsers
);

// Rota para obter usuário por ID
router.get(
  '/users/:id', 
  authorize([UserRole.ADMIN, UserRole.CEO]),
  validateMongoId('id'),
  authController.getUserById
);

// Rota para atualizar usuário por ID
router.put(
  '/users/:id', 
  authorize([UserRole.ADMIN, UserRole.CEO]),
  validateMongoId('id'),
  validateBody(UserUpdateSchema),
  auditLogger('admin_user_update'),
  authController.updateUserById
);

// Rota para excluir usuário
router.delete(
  '/users/:id', 
  authorize([UserRole.ADMIN, UserRole.CEO]),
  validateMongoId('id'),
  auditLogger('user_deletion'),
  authController.deleteUser
);

export default router;