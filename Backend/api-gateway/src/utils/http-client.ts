// Sugestão para Backend/api-gateway/src/utils/http-client.ts

import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { logger } from '../config/logger';

// Função auxiliar para manipular erros
const handleError = (error: AxiosError, url: string) => {
  if ((error as AxiosError).response) {
    // O servidor respondeu com um código de status fora do intervalo 2xx
    logger.error(`Erro na resposta: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
  } else if (error.request) {
    // A requisição foi feita mas não houve resposta
    logger.error(`Sem resposta: ${error.message}`);
  } else {
    // Algo aconteceu ao configurar a requisição
    logger.error(`Erro na configuração: ${error.message}`);
  }
};

// Configuração padrão para todas as requisições
axios.defaults.timeout = 10000; // 10 segundos
axios.defaults.headers.common['Content-Type'] = 'application/json';

const httpClient = {
  async get(url: string, config?: AxiosRequestConfig): Promise<any> {
    try {
      logger.debug(`Requisição GET para ${url}`);
      const response = await axios.get(url, {
        ...config,
        validateStatus: (status) => status < 500, // Aceitar status 2xx, 3xx e 4xx
      });
      
      // Verificar se a resposta é bem-sucedida (2xx)
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw { 
          response: response,
          message: `Erro HTTP ${response.status}`
        };
      }
    } catch (error) {
      handleError(error as AxiosError, url);
      
      // Capturar e recriar o erro com informações mais detalhadas
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw { 
          code: (axiosError.response.data && (axiosError.response.data as any).error?.code) || 'API_ERROR',
          message: (axiosError.response.data && (axiosError.response.data as any).error?.message) || `Erro HTTP ${axiosError.response.status}`,
          details: axiosError.response.data,
          status: axiosError.response.status
        };
      } else {
        throw { 
          code: 'CONNECTION_ERROR',
          message: axiosError.message || 'Erro de conexão com o serviço',
          status: 503
        };
      }
    }
  },

  async post(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    try {
      logger.debug(`Requisição POST para ${url}`);
      
      // Log do corpo da requisição (sem informações sensíveis)
      if (data) {
        const logData = { ...data };
        if (logData.password) logData.password = '[PROTEGIDO]';
        logger.debug(`Corpo da requisição: ${JSON.stringify(logData)}`);
      }
      
      const response = await axios.post(url, data, {
        ...config,
        validateStatus: (status) => status < 500, // Aceitar status 2xx, 3xx e 4xx
      });
      
      // Verificar se a resposta é bem-sucedida (2xx)
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw { 
          response: response,
          message: `Erro HTTP ${response.status}`
        };
      }
    } catch (error) {
      handleError(error as AxiosError, url);
      
      // Capturar e recriar o erro com informações mais detalhadas
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw { 
          code: (axiosError.response.data && (axiosError.response.data as any).error?.code) || 'API_ERROR',
          message: (axiosError.response.data && (axiosError.response.data as any).error?.message) || `Erro HTTP ${axiosError.response.status}`,
          details: axiosError.response.data,
          status: axiosError.response.status
        };
      } else {
        throw { 
          code: 'CONNECTION_ERROR',
          message: axiosError.message || 'Erro de conexão com o serviço',
          status: 503
        };
      }
    }
  },

  async put(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    try {
      logger.debug(`Requisição PUT para ${url}`);
      const response = await axios.put(url, data, {
        ...config,
        validateStatus: (status) => status < 500,
      });
      
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw { 
          response: response,
          message: `Erro HTTP ${response.status}`
        };
      }
    } catch (error) {
      handleError(error as AxiosError, url);
      
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw { 
          code: (axiosError.response.data && typeof axiosError.response.data === 'object' && (axiosError.response.data as any).error?.code) || 'API_ERROR',
          message: (axiosError.response.data && typeof axiosError.response.data === 'object' && (axiosError.response.data as any).error?.message) || `Erro HTTP ${axiosError.response.status}`,
          details: axiosError.response.data,
          status: axiosError.response.status
        };
      } else {
        throw { 
          code: 'CONNECTION_ERROR',
          message: axiosError.message || 'Erro de conexão com o serviço',
          status: 503
        };
      }
    }
  },

  async delete(url: string, config?: AxiosRequestConfig): Promise<any> {
    try {
      logger.debug(`Requisição DELETE para ${url}`);
      const response = await axios.delete(url, {
        ...config,
        validateStatus: (status) => status < 500,
      });
      
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw { 
          response: response,
          message: `Erro HTTP ${response.status}`
        };
      }
    } catch (error) {
      handleError(error as AxiosError, url);
      
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const errorData = axiosError.response.data;
        const errorCode = (errorData && typeof errorData === 'object' && 'error' in errorData && (errorData as any).error?.code) || 'API_ERROR';
        const errorMessage = (errorData && typeof errorData === 'object' && 'error' in errorData && (errorData as any).error?.message) || `Erro HTTP ${axiosError.response.status}`;
        throw { 
          code: errorCode,
          message: errorMessage,
          details: errorData,
          status: axiosError.response.status
        };
      } else {
        throw { 
          code: 'CONNECTION_ERROR',
          message: (error as AxiosError).message || 'Erro de conexão com o serviço',
          status: 503
        };
      }
    }
  }
};

export default httpClient;