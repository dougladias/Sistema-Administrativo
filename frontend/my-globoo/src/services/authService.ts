import api from '../lib/api';

// Tipagem para requisições
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Tipagem para respostas
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authService = {
  // Login de usuário
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    // Salvar tokens e dados do usuário
    if (response.tokens) {
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },
  
  // Registro de novo usuário
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    
    // Salvar tokens e dados do usuário
    if (response.tokens) {
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },
  
  // Logout do usuário
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    }
    
    // Remover dados de autenticação
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
  
  // Verificar se o usuário está autenticado
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('accessToken');
  },
  
  // Obter usuário atual
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as User;
    } catch (e) {
      return null;
    }
  },
  
  // Verificar se o usuário tem determinado papel/função
  hasRole: (role: string): boolean => {
    const user = authService.getCurrentUser();
    return !!user && user.role === role;
  },
  
  // Atualizar dados do usuário
  updateUser: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put<User>('/auth/me', userData);
    
    // Atualizar dados no localStorage
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...response };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return response;
  },
  
  // Atualizar senha do usuário
  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/auth/me/password', {
      currentPassword,
      newPassword,
      confirmPassword: newPassword
    });
  }
};

export default authService;