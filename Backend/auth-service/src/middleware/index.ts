import { authenticate, authorize, authorizeOwnerOrRole, checkPermissions, validateActivationToken } from './auth.middleware';
import { errorHandler, notFoundHandler } from './error.middleware';
import { requestLogger, errorLogger, auditLogger } from './logging.middleware';
import { validateBody, validateQuery, validateParams, validateMongoId, sanitizeInput, validatePagination, requireFields } from './validation.middleware';
import { csrfProtection, loginRateLimiter, strongPasswordCheck, securityHeaders, attackDetection } from './security.middleware';

// Exportar todos os middlewares
export {
  // Middlewares de Autenticação
  authenticate,
  authorize,
  authorizeOwnerOrRole,
  checkPermissions,
  validateActivationToken,
  
  // Middlewares de Erro
  errorHandler,
  notFoundHandler,
  
  // Middlewares de Logging
  requestLogger,
  errorLogger,
  auditLogger,
  
  // Middlewares de Validação
  validateBody,
  validateQuery,
  validateParams,
  validateMongoId,
  sanitizeInput,
  validatePagination,
  requireFields,
  
  // Middlewares de Segurança
  csrfProtection,
  loginRateLimiter,
  strongPasswordCheck,
  securityHeaders,
  attackDetection
};

/**
 * Middlewares comuns para todas as rotas
 */
export const commonMiddlewares = [
  requestLogger,        // Logging de requisições
  securityHeaders,      // Headers de segurança
  sanitizeInput,        // Sanitização de entrada
  csrfProtection        // Proteção CSRF
];

/**
 * Middlewares para rotas de autenticação sensíveis (login, registro, etc.)
 */
export const authenticationMiddlewares = [
  requestLogger,        // Logging de requisições
  securityHeaders,      // Headers de segurança
  sanitizeInput,        // Sanitização de entrada
  attackDetection,      // Detecção de ataques
  strongPasswordCheck   // Verificação de senha forte
];

/**
 * Middlewares para rotas protegidas (requerem autenticação)
 */
export const protectedRouteMiddlewares = [
  requestLogger,        // Logging de requisições 
  securityHeaders,      // Headers de segurança
  sanitizeInput,        // Sanitização de entrada
  csrfProtection,       // Proteção CSRF
  authenticate(),       // Autenticação JWT
  attackDetection       // Detecção de ataques
];

/**
 * Aplicar middlewares em uma rota
 * @param middlewares Array de middlewares para aplicar
 */
export const applyMiddlewares = (middlewares: any[]) => middlewares;

// Exportar por padrão
export default {
  auth: {
    authenticate,
    authorize,
    authorizeOwnerOrRole,
    checkPermissions,
    validateActivationToken
  },
  error: {
    errorHandler,
    notFoundHandler
  },
  logging: {
    requestLogger,
    errorLogger,
    auditLogger
  },
  validation: {
    validateBody,
    validateQuery,
    validateParams,
    validateMongoId,
    sanitizeInput,
    validatePagination,
    requireFields
  },
  security: {
    csrfProtection,
    loginRateLimiter,
    strongPasswordCheck,
    securityHeaders,
    attackDetection
  },
  common: commonMiddlewares,
  authentication: authenticationMiddlewares,
  protected: protectedRouteMiddlewares
};