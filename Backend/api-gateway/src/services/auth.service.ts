import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { createUserModel, IUser, UserRole, UserStatus } from '../../../shared/src/models/user.model';
import { 
  validateUserCreate, 
  validateLogin, 
  validateRefreshToken,
  validateUserUpdate,
  validatePasswordUpdate,
  UserCreate,
  LoginRequest,
  RefreshTokenRequest,
  UserUpdate,
  PasswordUpdate
} from '../../../shared/src/schemas/user.schema';
import { ApiError } from '../../../shared/src/utils/apiError';
import { createLogger } from '../../../shared/src/utils/logger';
import { Request } from 'express';
import { env } from '../config/env';

// Inicializar o logger
const logger = createLogger({ 
  serviceName: 'auth-service',
  customMetadata: { module: 'auth-service' }
});

// Inicializar o modelo User
const User = createUserModel();

// Interface para o payload do token
export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

// Interface para a resposta de autenticação
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

class AuthService {
  /**
   * Registra um novo usuário
   */
  async register(userData: UserCreate): Promise<AuthResponse> {
    try {
      // Validar dados usando schema compartilhado
      const validatedData = validateUserCreate(userData);
      
      // Verificar se o usuário já existe
      const existingUser = await User.findOne({ email: validatedData.email });
      if (existingUser) {
        throw ApiError.conflict('Um usuário com este email já existe');
      }
      
      // Criar o usuário
      const user = new User(validatedData);
      
      // Gerar tokens
      const { accessToken, refreshToken } = this.generateTokens(user);
      
      // Adicionar refresh token ao usuário no momento da criação
      user.refreshTokens = [{
        token: refreshToken,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        createdAt: new Date()
      }];
      
      // Salvar o usuário (uma única operação de save)
      await user.save();
      
      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      logger.error('Erro ao registrar usuário:', error);
      throw error;
    }
  }
  
  /**
   * Autentica um usuário
   */
  async login(loginData: LoginRequest, req?: Request): Promise<AuthResponse> {
    try {
      // Log detalhado para debug
      logger.debug('Iniciando processo de login com dados:', { 
        email: loginData.email,
        hasPassword: !!loginData.password 
      });
      
      // Validar dados
      const validatedData = validateLogin(loginData);
      
      // Buscar usuário
      const user = await User.findOne({ email: validatedData.email });
      if (!user) {
        // Registrar tentativa de login mal-sucedida
        logger.debug('Usuário não encontrado:', validatedData.email);
        this.recordLoginAttempt(null, req, false);
        throw ApiError.authentication('Credenciais inválidas');
      }
      
      // Verificar se a conta está ativa
      if (user.status !== UserStatus.ACTIVE) {
        logger.debug(`Tentativa de login com conta inativa: ${user._id}, status: ${user.status}`);
        this.recordLoginAttempt(user, req, false, false);
        throw ApiError.authentication('Conta inativa ou bloqueada');
      }
      
      // Verificar senha
      const isPasswordValid = await user.comparePassword(validatedData.password);
      if (!isPasswordValid) {
        // Registrar tentativa de login mal-sucedida
        logger.debug(`Senha inválida para usuário: ${user._id}`);
        this.recordLoginAttempt(user, req, false, false);
        throw ApiError.authentication('Credenciais inválidas');
      }
      
      logger.debug(`Login válido para usuário: ${user._id}`);
      
      // Gerar tokens
      const { accessToken, refreshToken } = this.generateTokens(user);
      
      // Criar objeto com o novo token de refresh
      const refreshTokenObj = {
        token: refreshToken,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        createdAt: new Date()
      };
      
      // Criar registro de login
      const loginRecord = {
        timestamp: new Date(),
        ip: req?.ip,
        userAgent: req?.headers['user-agent'],
        successful: true
      };
      
      // Limitar tamanho do histórico de login
      let loginHistory = [...user.loginHistory, loginRecord];
      if (loginHistory.length > 100) {
        loginHistory = loginHistory.slice(-100);
      }
      
      // Aplicar todas as atualizações em uma única operação atômica
      // para evitar múltiplos saves paralelos do mesmo documento
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $set: { 
            lastLogin: new Date(),
            loginHistory: loginHistory
          },
          $push: { 
            refreshTokens: refreshTokenObj 
          }
        },
        { new: true }
      );
      
      logger.debug(`Usuário ${user._id} atualizado com sucesso após login`);
      
      if (!updatedUser) {
        logger.error(`Erro ao atualizar usuário após login: ID ${user._id} não encontrado`);
        throw ApiError.internal('Erro ao processar login');
      }
      
      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      logger.error('Erro ao fazer login:', error);
      throw error;
    }
  }
  
  /**
   * Registra logout (revoga refresh token)
   */
  async logout(userId: string, refreshToken: string): Promise<boolean> {
    try {
      logger.debug(`Tentativa de logout para usuário ${userId} com token ${refreshToken.substring(0, 10)}...`);
      
      // Encontrar e atualizar o token em uma única operação atômica
      const result = await User.findOneAndUpdate(
        { 
          _id: userId,
          'refreshTokens.token': refreshToken,
          'refreshTokens.isRevoked': false
        },
        {
          $set: {
            'refreshTokens.$.isRevoked': true,
            'refreshTokens.$.revokedAt': new Date()
          }
        }
      );
      
      if (!result) {
        logger.debug(`Token não encontrado ou já revogado: ${refreshToken.substring(0, 10)}...`);
        return false;
      }
      
      logger.debug(`Logout bem-sucedido para usuário ${userId}`);
      return true;
    } catch (error) {
      logger.error('Erro ao fazer logout:', error);
      throw error;
    }
  }
  
  /**
   * Valida e renova tokens usando refresh token
   */
  async refreshToken(refreshTokenData: RefreshTokenRequest): Promise<{ accessToken: string, refreshToken: string }> {
    try {
      // Validar dados
      const { refreshToken } = validateRefreshToken(refreshTokenData);
      
      // Validar o token
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as TokenPayload;
      
      // Buscar usuário
      const user = await User.findById(decoded.id);
      if (!user) {
        throw ApiError.authentication('Usuário não encontrado');
      }
      
      // Verificar se o refresh token existe e é válido
      interface RefreshTokenEntry {
        token: string;
        isRevoked: boolean;
        expiresAt: Date;
        // Add other properties if they exist on the refreshToken entry
      }

      const tokenExists: RefreshTokenEntry | undefined = user.refreshTokens.find(
        (t: RefreshTokenEntry) => t.token === refreshToken && !t.isRevoked && t.expiresAt > new Date()
      );
      
      if (!tokenExists) {
        throw ApiError.authentication('Refresh token inválido ou expirado');
      }
      
      // Gerar novos tokens
      const newTokens = this.generateTokens(user);
      
      // Adicionar novo refresh token e revogar o antigo em uma única operação
      await User.findByIdAndUpdate(
        user._id,
        {
          $push: {
            refreshTokens: {
              token: newTokens.refreshToken,
              isRevoked: false,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
              createdAt: new Date()
            }
          },
          $set: {
            'refreshTokens.$[elem].isRevoked': true,
            'refreshTokens.$[elem].revokedAt': new Date()
          }
        },
        {
          arrayFilters: [{ 'elem.token': refreshToken }]
        }
      );
      
      return newTokens;
    } catch (error) {
      logger.error('Erro ao renovar token:', error);
      throw error;
    }
  }
  
  /**
   * Busca usuário por ID
   */
  async getUserById(userId: string): Promise<Partial<IUser>> {
    try {
      const user = await User.findById(userId).select('-password -refreshTokens');
      
      if (!user) {
        throw ApiError.notFound('Usuário não encontrado');
      }
      
      return user;
    } catch (error) {
      logger.error(`Erro ao buscar usuário ID ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Atualiza dados do usuário
   */
  async updateUser(userId: string, userData: UserUpdate): Promise<Partial<IUser>> {
    try {
      // Validar dados
      const validatedData = validateUserUpdate(userData);
      
      // Verificar se o email já está em uso (se estiver sendo atualizado)
      if (validatedData.email) {
        const existingUser = await User.findOne({ 
          email: validatedData.email,
          _id: { $ne: userId }
        });
        
        if (existingUser) {
          throw ApiError.conflict('Email já está em uso');
        }
      }
      
      // Atualizar usuário
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: validatedData },
        { new: true, runValidators: true }
      ).select('-password -refreshTokens');
      
      if (!updatedUser) {
        throw ApiError.notFound('Usuário não encontrado');
      }
      
      return updatedUser;
    } catch (error) {
      logger.error(`Erro ao atualizar usuário ID ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Atualiza senha do usuário
   */
  async updatePassword(userId: string, passwordData: PasswordUpdate): Promise<boolean> {
    try {
      // Validar dados
      const validatedData = validatePasswordUpdate(passwordData);
      
      // Buscar usuário
      const user = await User.findById(userId);
      if (!user) {
        throw ApiError.notFound('Usuário não encontrado');
      }
      
      // Verificar senha atual
      const isCurrentPasswordValid = await user.comparePassword(validatedData.currentPassword);
      if (!isCurrentPasswordValid) {
        throw ApiError.badRequest('Senha atual incorreta');
      }
      
      // Criar hash da nova senha usando o método do usuário
      const hashedPassword = await user.constructor.hashPassword(validatedData.newPassword);
      
      // Atualizar senha e revogar todos os refresh tokens existentes por segurança
      await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            password: hashedPassword,
            'refreshTokens.$[].isRevoked': true,
            'refreshTokens.$[].revokedAt': new Date()
          }
        }
      );
      
      return true;
    } catch (error) {
      logger.error(`Erro ao atualizar senha do usuário ID ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Valida um token JWT
   */
  async validateToken(token: string): Promise<{ isValid: boolean; payload?: TokenPayload }> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      
      // Verificar se o usuário existe
      const user = await User.findById(decoded.id);
      if (!user) {
        return { isValid: false };
      }
      
      // Verificar se o usuário está ativo
      if (user.status !== UserStatus.ACTIVE) {
        return { isValid: false };
      }
      
      return { 
        isValid: true,
        payload: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        }
      };
    } catch (error) {
      logger.error('Erro ao validar token:', error);
      return { isValid: false };
    }
  }
  
  /**
   * Busca todos os usuários com filtros opcionais
   */
  async findAllUsers(filters: Record<string, any> = {}): Promise<Partial<IUser>[]> {
    try {
      const query: Record<string, any> = {};
      
      // Aplicar filtros
      if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
      }
      
      if (filters.email) {
        query.email = { $regex: filters.email, $options: 'i' };
      }
      
      if (filters.role) {
        query.role = filters.role;
      }
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      const users = await User.find(query)
        .select('-password -refreshTokens')
        .sort({ name: 1 });
      
      return users;
    } catch (error) {
      logger.error('Erro ao buscar usuários:', error);
      throw error;
    }
  }
  
  /**
   * Exclui um usuário
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(userId);
      return !!result;
    } catch (error) {
      logger.error(`Erro ao excluir usuário ID ${userId}:`, error);
      throw error;
    }
  }
  
  // ------- Métodos privados -------
  
  /**
   * Gera tokens de acesso e refresh
   */
  private generateTokens(user: IUser): { accessToken: string; refreshToken: string } {
    const payload: TokenPayload = {
      id: (user._id as any).toString(),
      email: user.email,
      role: user.role
    };
    
    const accessToken = jwt.sign(payload, env.JWT_SECRET as Secret, {
      expiresIn: env.JWT_EXPIRATION
    } as SignOptions);
    
    const refreshToken = jwt.sign(payload, env.JWT_SECRET as Secret, {
      expiresIn: env.JWT_EXPIRATION
    } as SignOptions);
    
    return { accessToken, refreshToken };
  }
  
  /**
   * Registra tentativas de login
   * @param saveChanges Se verdadeiro, salva as alterações no documento
   */
  private async recordLoginAttempt(
    user: IUser | null, 
    req?: Request, 
    successful: boolean = false,
    saveChanges: boolean = true
  ): Promise<void> {
    if (!user) return;
    
    try {
      const loginRecord = {
        timestamp: new Date(),
        ip: req?.ip,
        userAgent: req?.headers['user-agent'],
        successful
      };
      
      // Se não formos salvar as mudanças, apenas modificamos o objeto em memória
      if (!saveChanges) {
        user.loginHistory.push(loginRecord);
        
        // Limitar o tamanho do histórico para evitar documentos muito grandes
        if (user.loginHistory.length > 100) {
          user.loginHistory = user.loginHistory.slice(-100);
        }
        
        // Se for uma tentativa bem-sucedida, atualizar o último login
        if (successful) {
          user.lastLogin = new Date();
        }
        
        return;
      }
      
      // Se formos salvar, usamos findByIdAndUpdate para evitar conflitos
      const updates: any = {
        $push: { loginHistory: loginRecord }
      };
      
      // Se for uma tentativa bem-sucedida, atualizar o último login
      if (successful) {
        updates.$set = { lastLogin: new Date() };
      }
      
      // Limitar tamanho do histórico
      if (user.loginHistory.length >= 99) {
        // Usar $slice para manter apenas os últimos 100 registros
        updates.$push = { 
          loginHistory: { 
            $each: [loginRecord], 
            $slice: -100 
          } 
        };
      }
      
      await User.findByIdAndUpdate(user._id, updates);
    } catch (error) {
      logger.error('Erro ao registrar tentativa de login:', error);
      // Não propagamos o erro para não afetar o fluxo principal
    }
  }
}

export default new AuthService();