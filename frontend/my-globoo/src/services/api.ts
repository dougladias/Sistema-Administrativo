import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

// Criação da instância do Axios
const api = axios.create({
  // Use a URL do seu API Gateway
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    // Obter a sessão atual
    const session = await getSession();
    
    // Adicionar token ao cabeçalho se disponível
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
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

export default api;