import { Request, Response, NextFunction } from 'express';
import authService, { TokenPayload } from '../services/authService';
import { UserRole } from '../utils/types';
import ApiError from '../utils/apiError';
import logger from '../config/logger';

// Registro de usuário
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validar os dados de entrada
    if (!name || !email || !password) {
      throw new ApiError('Nome, email e senha são obrigatórios', 400);
    }
    
    // Verificar role (se fornecido)
    if (role && !Object.values(UserRole).includes(role)) {
      throw new ApiError('Role inválido', 400);
    }
    
    // Registrar o usuário
    const result = await authService.register(name, email, password, role);
    
    res.status(201).json(result);
  } catch (error) {
    logger.error('Erro no registro de usuário:', error);
    next(error);
  }
};

// Login de usuário
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Validar os dados de entrada
    if (!email || !password) {
      throw new ApiError('Email e senha são obrigatórios', 400);
    }
    
    // Realizar login
    const result = await authService.login(email, password);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Erro no login de usuário:', error);
    next(error);
  }
};

// Logout de usuário
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError('Usuário não autenticado', 401);
    }
    
    await authService.logout(userId);
    
    res.status(200).json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    logger.error('Erro no logout de usuário:', error);
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new ApiError('Refresh token é obrigatório', 400);
    }
    
    const tokens = await authService.refreshToken(refreshToken);
    
    res.status(200).json(tokens);
  } catch (error) {
    logger.error('Erro ao atualizar token:', error);
    next(error);
  }
};

// Obter usuário autenticado
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError('Usuário não autenticado', 401);
    }
    
    const user = await authService.getUserById(userId);
    
    res.status(200).json(user);
  } catch (error) {
    logger.error('Erro ao obter usuário atual:', error);
    next(error);
  }
};

// Validar token
export const validateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      throw new ApiError('Token é obrigatório', 400);
    }
    
    const result = await authService.validateToken(token);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao validar token:', error);
    next(error);
  }
};