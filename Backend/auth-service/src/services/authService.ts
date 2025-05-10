import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { UserRole } from '../utils/types';
import ApiError from '../utils/apiError';
import { env } from '../config/env';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

class AuthService {
  // Registro de novo usuário
  async register(name: string, email: string, password: string, role: UserRole = UserRole.ASSISTENTE): Promise<AuthResponse> {
    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError('Usuário já existe com este email', 409);
    }

    // Criar novo usuário
    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    // Gerar tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Salvar refresh token no usuário
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  // Login de usuário
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

    // Salvar refresh token no usuário
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  // Logout de usuário
  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  // Refresh Token
  async refreshToken(token: string): Promise<{ accessToken: string, refreshToken: string }> {
    try {
      // Verificar refresh token
      const decoded = jwt.verify(token, env.jwtRefreshSecret as Secret) as TokenPayload;
      
      // Buscar usuário e verificar se refresh token está salvo
      const user = await User.findById(decoded.id);
      
      if (!user || user.refreshToken !== token) {
        throw new ApiError('Token inválido', 401);
      }

      // Gerar novos tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      // Atualizar refresh token no banco
      user.refreshToken = refreshToken;
      await user.save();

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError('Token inválido ou expirado', 401);
    }
  }

  // Buscar usuário por ID
  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId).select('-password -refreshToken');
    
    if (!user) {
      throw new ApiError('Usuário não encontrado', 404);
    }
    
    return user;
  }

  // Método privado para gerar tokens
  private generateTokens(user: IUser): { accessToken: string, refreshToken: string } {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, String(env.jwtSecret), {
      expiresIn: env.jwtExpiresIn
    } as SignOptions);
    
    const refreshToken = jwt.sign(payload, String(env.jwtRefreshSecret), {
      expiresIn: env.jwtRefreshExpiresIn
    } as SignOptions);

    return { accessToken, refreshToken };
  }

  // Validar um token de acesso
  async validateToken(token: string): Promise<{ isValid: boolean, payload?: TokenPayload }> {
    try {
      const decoded = jwt.verify(token, env.jwtSecret as Secret) as TokenPayload;
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return { isValid: false };
      }
      
      return { isValid: true, payload: decoded };
    } catch (error) {
      return { isValid: false };
    }
  }
}

export default new AuthService();