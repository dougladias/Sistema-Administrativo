// frontend/my-globoo/src/services/auth-service.ts
import axios from 'axios';

// URL do API Gateway
const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3005';

// Tipagem para resposta da autenticação
interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Serviço de autenticação
export const authService = {
  // Login com email e senha
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log(`Tentando login direto para ${email} em ${API_URL}/api/auth/login`);
      
      // Fazer requisição para o endpoint de login
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      console.log('Resposta do login:', response.data);
      
      // Verificar se a resposta contém os dados necessários
      if (!response.data || !response.data.tokens || !response.data.user) {
        throw new Error('Resposta de autenticação inválida');
      }
      
      // Salvar dados de autenticação no localStorage
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      
      // Logar detalhes do erro se disponíveis
      if (axios.isAxiosError(error) && error.response) {
        console.error('Status do erro:', error.response.status);
        console.error('Dados do erro:', error.response.data);
      }
      
      throw error;
    }
  },
  
  // Verificar se o usuário está autenticado
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('accessToken');
  },
  
  // Obter usuário atual
  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch (error) {
      console.error('Erro ao parsear dados do usuário:', error);
      return null;
    }
  },
  
  // Obter token de acesso
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  },
  
  // Logout
  logout(): void {
    if (typeof window === 'undefined') return;
    
    // Limpar dados de autenticação
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Redirecionar para a página de login
    window.location.href = '/auth/login';
  },
  
  // Refresh token
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;
      
      const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
        refreshToken
      });
      
      if (!response.data || !response.data.tokens) {
        throw new Error('Resposta de refresh inválida');
      }
      
      // Atualizar tokens
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      
      return response.data.tokens.accessToken;
    } catch (error) {
      console.error('Erro ao atualizar token:', error);
      return null;
    }
  }
};

export default authService;