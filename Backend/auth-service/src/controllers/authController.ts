import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { createLogger } from '../../../shared/src/utils/logger';
import { ApiError } from '../../../shared/src/utils/apiError';
import { UserStatus, UserRole } from '../../../shared/src/models/user.model'; 

const logger = createLogger({ 
  serviceName: 'auth-service',
  customMetadata: { module: 'auth-controller' } 
});

/**
 * Registra um novo usuário
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;
    console.log("Dados recebidos no controller register:", { name, email, role });
    
    const result = await authService.register({
      name,
      email,
      password,
      role: role || UserRole.ASSISTENTE,
      status: UserStatus.ACTIVE,
      permissions: [],
      refreshTokens: [],
      loginHistory: []
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error("Erro detalhado no controller register:", error);
    logger.error('Erro ao registrar usuário:', error);
    next(error);
  }
};

/**
 * Autentica um usuário
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    console.log("Dados recebidos no controller login:", { email });
    
    const result = await authService.login(email, password, req);
    res.status(200).json(result);
  } catch (error) {
    console.error("Erro detalhado no controller login:", error);
    logger.error('Erro ao autenticar usuário:', error);
    next(error);
  }
};

/**
 * Faz logout de um usuário (revogando o refresh token)
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.id) {
      throw ApiError.authentication('Usuário não autenticado');
    }
    
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw ApiError.badRequest('Refresh token é obrigatório');
    }
    
    await authService.logout(req.user.id, refreshToken);
    
    // If authService.logout completes without error, assume success
    res.status(200).json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (error) {
    logger.error('Erro ao fazer logout:', error);
    next(error);
  }
};

/**
 * Atualiza tokens usando refresh token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.refreshToken(req.body);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao atualizar token:', error);
    next(error);
  }
};

/**
 * Obtém perfil do usuário autenticado
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.id) {
      throw ApiError.authentication('Usuário não autenticado');
    }
    
    const user = await authService.getUserById(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    logger.error('Erro ao obter perfil do usuário:', error);
    next(error);
  }
};

/**
 * Atualiza perfil do usuário
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.id) {
      throw ApiError.authentication('Usuário não autenticado');
    }
    
    const user = await authService.updateUser(req.user.id, req.body);
    res.status(200).json(user);
  } catch (error) {
    logger.error('Erro ao atualizar usuário:', error);
    next(error);
  }
};

/**
 * Atualiza senha do usuário
 */
export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.id) {
      throw ApiError.authentication('Usuário não autenticado');
    }
    
    await authService.updatePassword(req.user.id, req.body);
    res.status(200).json({ success: true, message: 'Senha atualizada com sucesso' });
  } catch (error) {
    logger.error('Erro ao atualizar senha:', error);
    next(error);
  }
};

/**
 * Valida um token JWT
 */
export const validateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      throw ApiError.badRequest('Token é obrigatório');
    }
    
    const result = await authService.validateToken(token);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao validar token:', error);
    next(error);
  }
};

/**
 * Obter todos os usuários (apenas para administradores)
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await authService.findAllUsers(req.query);
    res.status(200).json(users);
  } catch (error) {
    logger.error('Erro ao obter usuários:', error);
    next(error);
  }
};

/**
 * Obter usuário por ID (apenas para administradores)
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Erro ao obter usuário ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Atualizar usuário por ID (apenas para administradores)
 */
export const updateUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.updateUser(req.params.id, req.body);
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Erro ao atualizar usuário ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Excluir usuário (apenas para administradores)
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.deleteUser(req.params.id);
    
    if (result) {
      res.status(200).json({ success: true, message: 'Usuário excluído com sucesso' });
    } else {
      throw ApiError.notFound('Usuário não encontrado');
    }
  } catch (error) {
    logger.error(`Erro ao excluir usuário ID ${req.params.id}:`, error);
    next(error);
  }
};