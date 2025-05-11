import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { authService } from './authService';

// URL do API Gateway
const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3005';

// Criar instância do Axios com configurações padrão
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variável para controlar requisições em andamento de refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
  config: any;
}> = [];

// Função para processar a fila de requisições após o refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(request => {
    if (error) {
      request.reject(error);
    } else {
      request.config.headers.Authorization = token ? `Bearer ${token}` : '';
      request.resolve(axios(request.config));
    }
  });
  
  failedQueue = [];
};

// Interceptor para adicionar token em cada requisição
apiClient.interceptors.request.use(
  (config) => {
    // Obter token de acesso
    const token = authService.getAccessToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Se não temos config ou já tentamos refresh, rejeitar
    if (!originalRequest || (originalRequest as any)._retry) {
      return Promise.reject(error);
    }

    // Se for erro 401 (não autorizado) e não for uma tentativa de refresh
    if (error.response?.status === 401 && 
        !originalRequest.url?.includes('/auth/refresh-token')) {
      // Marcar que esta requisição já passou por retry
      (originalRequest as any)._retry = true;
      
      // Se já estamos refreshing, adicione a requisição à fila
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }
      
      isRefreshing = true;
      
      try {
        // Tentar atualizar o token
        const newToken = await authService.refreshToken();
        
        if (newToken) {
          // Atualizar o header da requisição original
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Processar a fila de requisições pendentes
          processQueue(null, newToken);
          
          // Refazer a requisição original com o novo token
          return axios(originalRequest);
        } else {
          // Se o refresh falhou, processar a fila com erro
          processQueue(new Error('Falha ao renovar token'));
          
          // Fazer logout e redirecionar para página de login
          authService.logout();
          
          return Promise.reject(new Error('Sessão expirada'));
        }
      } catch (refreshError) {
        // Se falhar na renovação do token, fazer logout
        processQueue(refreshError);
        authService.logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Métodos para simplificar as chamadas HTTP
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    apiClient.get(url, config).then((response: AxiosResponse<T>) => response.data),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    apiClient.post(url, data, config).then((response: AxiosResponse<T>) => response.data),
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    apiClient.put(url, data, config).then((response: AxiosResponse<T>) => response.data),
  
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    apiClient.delete(url, config).then((response: AxiosResponse<T>) => response.data),
};

export default api;