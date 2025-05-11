import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Configurações do API Gateway
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api';
const TIMEOUT = 15000; // 15 segundos

// Criar instância do Axios com configurações padrão
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em cada requisição
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
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

    // Se for erro 401 (não autorizado) e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh-token') {
      originalRequest._retry = true;
      
      try {
        // Tentar renovar o token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Se não tiver refresh token, direcionar para login
          handleLogout();
          return Promise.reject(error);
        }

        const response = await apiClient.post('/auth/refresh-token', { 
          refreshToken 
        });

        if (response.data.tokens) {
          // Atualizar tokens no storage
          localStorage.setItem('accessToken', response.data.tokens.accessToken);
          localStorage.setItem('refreshToken', response.data.tokens.refreshToken);

          // Refazer a requisição original com o novo token
          originalRequest.headers.Authorization = `Bearer ${response.data.tokens.accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Se falhar na renovação do token, fazer logout
        handleLogout();
      }
    }

    return Promise.reject(error);
  }
);

// Função para lidar com logout
function handleLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Redirecionar para página de login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

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