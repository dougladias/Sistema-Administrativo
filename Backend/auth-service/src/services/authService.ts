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
      console.log('Dados recebidos para registro:', JSON.stringify(userData));
      
      // Validar dados usando schema compartilhado
      console.log('Validando dados...');
      const validatedData = validateUserCreate(userData);
      console.log('Dados validados com sucesso');
      
      // Verificar se o usuário já existe
      console.log('Verificando se usuário já existe...');
      const existingUser = await User.findOne({ email: validatedData.email });
      console.log('Verificação concluída, existingUser:', existingUser ? 'Encontrado' : 'Não encontrado');
      
      if (existingUser) {
        throw ApiError.conflict('Um usuário com este email já existe');
      }
      
      // Criar o usuário
      console.log('Criando novo usuário...');
      const user = new User(validatedData);
      
      // Gerar tokens
      console.log('Gerando tokens...');
      const { accessToken, refreshToken } = this.generateTokens(user);
      
      // Adicionar refresh token ao usuário
      console.log('Adicionando refresh token...');
      // Usar operação atômica para adicionar o token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias de expiração

      await User.findByIdAndUpdate(user._id, {
        $push: {
          refreshTokens: {
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            createdAt: new Date(),
            isRevoked: false
          }
        }
      });
      
      // Salvar o usuário
      console.log('Salvando usuário...');
      await user.save();
      console.log('Usuário salvo com sucesso');
      
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
      console.error('ERRO DETALHADO:', error);
      logger.error('Erro ao registrar usuário:', error);
      throw error;
    }
  }
  
  /**
   * Autentica um usuário
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Buscar usuário pelo email
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError('Credenciais inválidas', 401);
    }

    // Verificar senha
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError('Credenciais inválidas', 401);
    }

    // Gerar tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Usar findByIdAndUpdate em vez de save para operação atômica
    await User.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: {
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          createdAt: new Date(),
          isRevoked: false
        }
      }
    });

    return {
      user: {
        id: user.id,
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
  }
  
  /**
   * Registra logout (revoga refresh token)
   */
  async logout(userId: string, refreshToken: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }
      
      return await user.revokeRefreshToken(refreshToken);
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
      const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as TokenPayload;
      
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
      
      // Revogar o token antigo
      await user.revokeRefreshToken(refreshToken);
      
      // Gerar novos tokens
      const newTokens = this.generateTokens(user);
      
      // Adicionar novo refresh token
      await user.addRefreshToken(newTokens.refreshToken);
      
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
      
      // Atualizar senha
      user.password = validatedData.newPassword;
      
      // Revogar todos os refresh tokens existentes por segurança
      interface RefreshTokenEntry {
        token: string;
        isRevoked: boolean;
        expiresAt: Date;
        revokedAt?: Date; // Add revokedAt as optional since it's being assigned here
        // Add other properties if they exist on the refreshToken entry
      }

      user.refreshTokens.forEach((token: RefreshTokenEntry) => {
        token.isRevoked = true;
        token.revokedAt = new Date();
      });
      
      await user.save();
      
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
      const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;
      
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
    
    const accessToken = jwt.sign(payload, env.jwtSecret as Secret, {
      expiresIn: env.jwtExpiresIn
    } as SignOptions);
    
    const refreshToken = jwt.sign(payload, env.jwtRefreshSecret as Secret, {expiresIn: env.jwtRefreshExpiresIn
    } as SignOptions);
    
    return { accessToken, refreshToken };
  }
  
  /**
   * Registra tentativas de login
   */
  private async recordLoginAttempt(user: IUser | null, req?: Request, successful: boolean = false): Promise<void> {
    if (!user) return;
    
    const loginRecord = {
      timestamp: new Date(),
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
      successful
    };
    
    user.loginHistory.push(loginRecord);
    
    // Limitar o tamanho do histórico para evitar documentos muito grandes
    if (user.loginHistory.length > 100) {
      user.loginHistory = user.loginHistory.slice(-100);
    }
    
    // Se for uma tentativa bem-sucedida, atualizar o último login
    if (successful) {
      user.lastLogin = new Date();
    }
    
    await user.save();
  }
}

export default new AuthService();