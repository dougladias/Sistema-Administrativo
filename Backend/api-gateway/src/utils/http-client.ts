import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import logger from './logger';

// Interface para erros de aplicação personalizados
interface AppErrorOptions {
  statusCode?: number;
  code?: string;
  details?: any;
}

// Classe de erro personalizada para a aplicação
class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;
  shouldLogout: boolean; // Nova propriedade para controlar logout

  // Construtor da classe ApiError
  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    // Apenas desloga em erros de autenticação (401) ou autorização (403)
    this.shouldLogout = statusCode === 401 || statusCode === 403;
  }
}


// Cliente HTTP personalizado para comunicação com microserviços
const httpClient = axios.create({
  timeout: 30000, // 30 segundos padrão
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Request-From': 'api-gateway'
  }
});


// Interceptor para requisições 
httpClient.interceptors.request.use(
  (config) => {
    // Log de requisição em nível de debug
    logger.debug(`Requisição HTTP: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data ? JSON.stringify(config.data).substring(0, 1000) : undefined
    });
    
    // Adicionar cabeçalhos extras se necessário
    config.headers = config.headers || {};
    config.headers['Request-Id'] = `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    return config;
  },
  (error: AxiosError) => {
    logger.error('Erro na requisição HTTP:', error);
    return Promise.reject(error);
  }
);


// Interceptor para respostas
httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log de resposta em nível de debug
    logger.debug(`Resposta HTTP: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      headers: response.headers,
      data: response.data ? JSON.stringify(response.data).substring(0, 1000) : undefined
    });
    
    // Retornar apenas os dados da resposta para simplificar o uso
    return response.data;
  },
  (error: AxiosError) => {
    // Formatação e centralização de erros
    const { response, request, config } = error;
    
    // Detectar timeout
    if (error.code === 'ECONNABORTED') {
      logger.error(`Timeout na requisição: ${config?.method?.toUpperCase()} ${config?.url}`, {
        timeout: config?.timeout
      });
      
      // Criar erro de timeout
      const timeoutError = new ApiError(
        'Tempo limite excedido ao conectar ao serviço', 
        504, 
        'SERVICE_TIMEOUT'
      );
      return Promise.reject(timeoutError);
    }
    
    // Erro com resposta do servidor
    if (response) {
      logger.error(`Erro HTTP ${response.status}: ${config?.method?.toUpperCase()} ${config?.url}`, {
        data: response.data,
        status: response.status
      });
      
      // Determinar tipo de erro
      let statusCode = response.status;
      // Força o tipo de response.data para any para evitar erro de propriedade inexistente
      const responseData: any = response.data;
      let errorCode = responseData?.error?.code || 'SERVICE_ERROR';
      let shouldLogout = false;
      
      // Verificar se é um erro de autenticação/autorização
      if (statusCode === 401) {
        errorCode = 'UNAUTHORIZED';
        shouldLogout = true;
      } else if (statusCode === 403) {
        errorCode = 'FORBIDDEN';
        shouldLogout = true;
      } else if (statusCode >= 500) {
        errorCode = 'SERVER_ERROR';
        shouldLogout = false; 
      }
      
      // Criar erro personalizado
      const serverError = new ApiError(
        (typeof response.data === 'object' && response.data !== null && 'message' in response.data ? (response.data as any).message : undefined) ||
        (typeof response.data === 'object' && response.data !== null && 'error' in response.data && typeof (response.data as any).error === 'object' && (response.data as any).error !== null && 'message' in (response.data as any).error ? (response.data as any).error.message : undefined) ||
        'Erro no serviço',
        statusCode,
        errorCode,
        response.data
      );
      
      // Define explicitamente se deve deslogar
      serverError.shouldLogout = shouldLogout;
      
      return Promise.reject(serverError);
    }
    
    // Erro na requisição (sem resposta do servidor)
    if (request) {
      logger.error(`Erro de conexão: ${config?.method?.toUpperCase()} ${config?.url}`, {
        error: error.message
      });
      
      const connectionError = new ApiError(
        'Não foi possível conectar ao serviço',
        502,
        'SERVICE_UNAVAILABLE'
      );
      
      // Erros de conexão não devem causar logout
      connectionError.shouldLogout = false;
      
      return Promise.reject(connectionError);
    }
    
    // Erro na configuração da requisição
    logger.error(`Erro de configuração da requisição: ${error.message}`);
    const configError = new ApiError(
      'Erro de configuração da requisição',
      500,
      'REQUEST_CONFIG_ERROR'
    );
    
    // Erros de configuração não devem causar logout
    configError.shouldLogout = false;
    
    return Promise.reject(configError);
  }
);


 // Métodos auxiliares para fazer requisições HTTP, 
export default {
  
  // Realiza uma requisição GET 
  async get(url: string, config?: AxiosRequestConfig) {
    return httpClient.get(url, config);
  },
  
  
  // Realiza uma requisição POST 
  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    return httpClient.post(url, data, config);
  },
  
 
  // Realiza uma requisição PUT  
  async put(url: string, data?: any, config?: AxiosRequestConfig) {
    return httpClient.put(url, data, config);
  },
  
  
 // Realiza uma requisição PATCH  
  async patch(url: string, data?: any, config?: AxiosRequestConfig) {
    return httpClient.patch(url, data, config);
  },
  
 
  // Realiza uma requisição DELETE  
  async delete(url: string, config?: AxiosRequestConfig) {
    return httpClient.delete(url, config);
  },
  
  
  // Permite configurar instâncias personalizadas do cliente HTTP
  createInstance(options: AxiosRequestConfig) {
    return axios.create(options);
  },
  
  
  // Verifica se um erro deve causar logout   
  shouldLogoutOnError(error: any): boolean {
    return error instanceof ApiError ? error.shouldLogout : false;
  }
};

// Exportação da classe de erro para uso em outros módulos
export { ApiError };