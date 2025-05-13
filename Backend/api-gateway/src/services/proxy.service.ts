import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { logger } from '../config/logger';
import { getAllServices, getServiceUrl, isServiceActive } from './service-registry';
import { ApiResponse, ErrorCode } from '../utils/response.utils';
import { env } from '../config/env';

/**
 * Configurações padrão para todos os proxies
 */
const defaultProxyOptions: Options = {
  changeOrigin: true,
  logLevel: 'silent', // Não logar pelo proxy, usar nosso próprio logger
  pathRewrite: {
    '^/api/': '/' // Remove o prefixo /api para encaminhar ao serviço
  },
  // Intercepta erros do proxy
  onError: (err: Error, req: Request, res: Response) => {
    const requestId = (req as any).requestId || 'unknown';
    logger.error(`Erro no proxy: ${err.message}`, { 
      error: err, 
      requestId, 
      path: req.path,
      method: req.method 
    });
    
    return ApiResponse.error(
      res,
      ErrorCode.SERVICE_UNAVAILABLE,
      'Erro no serviço',
      503,
      undefined,
      requestId
    );
  },
  // Intercepta a resposta
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['x-proxied-by'] = 'Globoo API Gateway';
    
    // Logar o resultado da requisição ao serviço
    logger.debug(`Proxy ${req.method} ${req.path} -> ${proxyRes.statusCode}`);
  }
};

/**
 * Cria um proxy para um serviço específico
 * @param serviceId ID do serviço registrado
 * @param options Opções adicionais do proxy
 */
export function createServiceProxy(serviceId: string, options: Options = {}) {
  // Normalizar o ID do serviço, removendo possíveis caminhos duplicados
  if (serviceId.includes('/')) {
    const parts = serviceId.split('/');
    serviceId = parts[parts.length - 1];
  }
  
  // Limpar o serviceId de quaisquer caracteres especiais
  serviceId = serviceId.replace(/[^a-zA-Z0-9-_]/g, '');
  
  // Verificar se o serviço existe e está registrado
  const services = getAllServices();
  const serviceExists = services.some(s => s.id === serviceId);
  
  if (!serviceExists) {
    logger.error(`Serviço '${serviceId}' não configurado. Serviços disponíveis:`, 
                services.map(s => s.id));
    throw new Error(`Service '${serviceId}' not configured`);
  }
  
  try {
    // Obter a URL base do serviço
    const serviceUrl = getServiceUrl(serviceId);
    const isActive = isServiceActive(serviceId);
    
    if (!isActive) {
      logger.warn(`Serviço '${serviceId}' está inativo, mas tentando fazer proxy mesmo assim`);
    }
    
    logger.info(`Criando proxy para serviço '${serviceId}' em ${serviceUrl}`);
    
    // Combinar as opções padrão com as específicas
    const proxyOptions = {
      ...defaultProxyOptions,
      ...options,
      target: serviceUrl
    };
    
    // Criar e retornar o middleware de proxy
    return createProxyMiddleware(proxyOptions);
  } catch (error) {
    logger.error(`Erro ao criar proxy para serviço '${serviceId}':`, error);
    throw error;
  }
}

/**
 * Middleware que redireciona as requisições para os serviços apropriados
 * baseado no primeiro segmento do caminho (/api/{service}/...)
 */
export function routeBasedProxy(req: Request, res: Response, next: NextFunction) {
  try {
    const path = req.path;

    // Identificar o serviço com base no caminho
    const serviceId = path.split('/')[2]; // Exemplo: /api/documents -> "documents"

    let targetUrl = '';
    if (serviceId === 'documents') {
      targetUrl = env.DOCUMENT_SERVICE_URL;
    } else if (serviceId === 'workers') {
      targetUrl = env.WORKER_SERVICE_URL;
    } else if (serviceId === 'auth') {
      targetUrl = env.AUTH_SERVICE_URL;
    } else {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    logger.info(`Redirecionando requisição para ${targetUrl}${req.originalUrl}`);

    // Criar o proxy para o serviço
    const proxy = createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api/documents': '/api/documents', // Mantém o caminho original
        '^/api/workers': '/api/workers',
        '^/api/auth': '/api/auth',
      },
    });

    return proxy(req, res, next);
  } catch (error) {
    logger.error('Erro no proxy:', error);
    next(error);
  }
}

/**
 * Middleware que redireciona as requisições para um serviço específico
 * @param serviceId ID do serviço registrado
 * @param options Opções adicionais do proxy
 */
export function serviceProxy(serviceId: string, options: Options = {}) {
  const proxy = createServiceProxy(serviceId, options);
  
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      return proxy(req, res, next);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Erro no proxy para serviço '${serviceId}': ${err.message}`, { error });
      return next(error);
    }
  };
}

export default {
  createServiceProxy,
  routeBasedProxy,
  serviceProxy
};