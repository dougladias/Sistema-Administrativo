import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../config/logger';

// Configuração base
const httpClient = axios.create({
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request
httpClient.interceptors.request.use((config) => {
  logger.debug(`Requisição para ${config.url}`);
  return config;
});

// Interceptor de resposta
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      logger.error(`Erro na resposta: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      logger.error(`Sem resposta: ${error.message}`);
    } else {
      logger.error(`Erro na configuração: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

// Métodos de requisição
export async function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response: AxiosResponse<T> = await httpClient.get(url, config);
  return response.data;
}

export async function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response: AxiosResponse<T> = await httpClient.post(url, data, config);
  return response.data;
}

export async function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response: AxiosResponse<T> = await httpClient.put(url, data, config);
  return response.data;
}

export async function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response: AxiosResponse<T> = await httpClient.delete(url, config);
  return response.data;
}

export default {
  get,
  post,
  put,
  delete: del,
};