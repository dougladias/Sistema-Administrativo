import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

// Criação da instância do Axios
const api = axios.create({
  // Use a URL do seu API Gateway
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000,
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    try {
      // Obter a sessão atual
      const session = await getSession();

      // Log para debug
      console.log("Session obtida:", session ? "Sim" : "Não");

      // Verificar diferentes localizações possíveis do token
      type SessionWithAccessToken = {
        accessToken?: string;
        user?: {
          accessToken?: string;
        };
      };

      // Verificar se o token está disponível na sessão ou no localStorage
      const sessionTyped = session as SessionWithAccessToken | null;
      const token = sessionTyped?.accessToken ||
        sessionTyped?.user?.accessToken ||
        localStorage.getItem('token');

      // Adicionar o token ao cabeçalho Authorization
      if (token) {
        console.log("Token encontrado, adicionando ao cabeçalho");
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn("Nenhum token disponível para autenticação");
      }
      // Retornar a configuração da requisição
    } catch (error) {
      console.error("Erro ao obter sessão:", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para lidar com respostas
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Evitar loop infinito se o refresh token já falhou
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Verificar se o erro é de autenticação (401) 
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Tentar fazer o refresh token
        const response = await axios.post('/api/auth/refresh');

        if (response.data?.accessToken) {
          // Atualizar o token na requisição original
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          // Repetir a requisição
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Se falhar o refresh, fazer logout
        if (typeof window !== 'undefined') {
          // Limpe também o cookie
          document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          await signOut({ redirect: false });
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Melhor tratamento para erros de rede
    if (!error.response) {
      // Erro de rede ou sem resposta do servidor
      console.error('Erro de conectividade com o servidor:', error.message);
      // Adicionar aqui lógica para mostrar mensagem de erro amigável ao usuário
    }

    return Promise.reject(error);
  }
);
// Definição de tipos para as credenciais de login e resposta
interface LoginCredentials {
  email: string;
  password: string;
}

// Definição de tipos para a resposta de login
interface LoginResponse {
  accessToken: string;
  [key: string]: unknown;
}

// Função para fazer login
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>('http://localhost:3005/api/auth/login', credentials);
    const { accessToken } = response.data;

    // Salvar o token no localStorage
    localStorage.setItem('token', accessToken);

    return response.data;
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    throw error;
  }
};

export default api;