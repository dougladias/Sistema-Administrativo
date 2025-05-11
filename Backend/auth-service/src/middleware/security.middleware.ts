import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../../../shared/src/utils/logger';
import { ApiError } from '../../../shared/src/utils/apiError';
import { env } from '../config/env';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

// Inicializar logger
const logger = createLogger({ 
  serviceName: 'auth-service',
  customMetadata: { module: 'security-middleware' } 
});

/**
 * Middleware para proteção contra falsificação de requisições entre sites (CSRF)
 * Limita a origem das requisições
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Verificar o header Origin
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  // Rotas que não necessitam de verificação CSRF
  const exemptedRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh-token',
    '/api/auth/validate-token',
    '/health'
  ];
  
  // Verificar se a rota está isenta
  const isExempted = exemptedRoutes.some(route => 
    req.path === route || req.path.startsWith(`${route}/`)
  );
  
  if (isExempted) {
    return next();
  }
  
  // Se o ambiente for de produção e a requisição for POST, PUT, DELETE ou PATCH
  if (env.nodeEnv === 'production' && 
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    
    // Se não houver Origin e Referer, pode ser um ataque
    if (!origin && !referer) {
      logger.warn('Possível ataque CSRF detectado - Sem Origin e Referer', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      
      return next(new ApiError('Acesso negado', 403));
    }
    
    // Se houver Origin, verificar se está na lista permitida
    if (origin) {
      const allowedOrigins = env.corsOrigin === '*' 
        ? [] 
        : env.corsOrigin.split(',');
      
      if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
        logger.warn('Possível ataque CSRF detectado - Origin não permitida', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          origin
        });
        
        return next(new ApiError('Acesso negado', 403));
      }
    }
  }
  
  next();
};

/**
 * Middleware de limitação de taxa específico para tentativas de login
 * Previne ataques de força bruta
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limitar cada IP a 5 requisições por janela
  standardHeaders: true, // Incluir headers padrão de rate limit
  legacyHeaders: false, // Desabilitar headers antigos
  skipSuccessfulRequests: true, // Somente contar tentativas falhas
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Muitas tentativas de login. Por favor, tente novamente após 15 minutos.'
  },
  keyGenerator: (req) => {
    // Usar email + IP como chave para controle mais preciso
    return `${req.ip}-${req.body.email || 'anonymous'}`;
  },
  handler: (req: Request, res: Response) => {
    // Logar tentativa de excesso de login
    logger.warn('Excesso de tentativas de login detectado', {
      ip: req.ip,
      email: req.body.email || 'unknown',
      userAgent: req.headers['user-agent']
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Muitas tentativas de login. Por favor, tente novamente após 15 minutos.'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Middleware para limitação de taxa para registro de usuários
 * Previne criação em massa de contas
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Limitar cada IP a 3 registros por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Muitas tentativas de registro. Por favor, tente novamente mais tarde.'
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown-ip'; // Provide a default value if req.ip is undefined
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Excesso de tentativas de registro detectado', {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Muitas tentativas de registro. Por favor, tente novamente mais tarde.'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Middleware para limitação de taxa para reset de senha
 * Previne ataques de força bruta em fluxos de recuperação
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Limitar cada IP/email a 3 solicitações por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Muitas solicitações de recuperação de senha. Por favor, tente novamente mais tarde.'
  },
  keyGenerator: (req: Request) => {
    const email = req.body.email || 'anonymous_email';
    return `${req.ip}-${email}`;
  }
});

/**
 * Middleware para verificação de senha forte
 */
export const strongPasswordCheck = (req: Request, res: Response, next: NextFunction) => {
  // Verificar se é uma rota de registro ou alteração de senha
  const isPasswordRoute = req.path.includes('/register') || 
                         req.path.includes('/password');
  
  if (!isPasswordRoute) {
    return next();
  }
  
  const password = req.body.password || req.body.newPassword;
  
  if (!password) {
    return next();
  }
  
  // Regras para senha forte
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  // Verificar comprimento mínimo
  if (password.length < minLength) {
    return next(ApiError.validation(
      'Senha fraca', 
      { password: `A senha deve ter pelo menos ${minLength} caracteres` }
    ));
  }
  
  // Em produção, aplicar regras mais rigorosas
  if (env.nodeEnv === 'production') {
    const errors = [];
    
    if (!hasUpperCase) errors.push('pelo menos uma letra maiúscula');
    if (!hasLowerCase) errors.push('pelo menos uma letra minúscula');
    if (!hasNumbers) errors.push('pelo menos um número');
    if (!hasSpecialChars) errors.push('pelo menos um caractere especial');
    
    if (errors.length > 0) {
      return next(ApiError.validation(
        'Senha fraca', 
        { password: `A senha deve conter ${errors.join(', ')}` }
      ));
    }
  }
  
  // Verificar senhas comuns/fracas
  if (isCommonPassword(password)) {
    return next(ApiError.validation(
      'Senha fraca',
      { password: 'A senha é muito comum ou fácil de adivinhar' }
    ));
  }
  
  next();
};

/**
 * Lista de senhas comuns (pequena amostra para exemplo)
 */
const commonPasswords = [
  'password', '123456', 'qwerty', 'admin', 'welcome',
  'senha', 'admin123', '123456789', '12345678', 'password123'
];

/**
 * Verifica se uma senha é comum ou facilmente adivinhável
 */
function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  
  // Verificar contra lista de senhas comuns
  if (commonPasswords.includes(lowerPassword)) {
    return true;
  }
  
  // Verificar padrões simples (123.., abc...)
  const sequences = ['123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  
  for (const seq of sequences) {
    for (let i = 0; i < seq.length - 3; i++) {
      const pattern = seq.slice(i, i + 4);
      if (lowerPassword.includes(pattern)) {
        return true;
      }
    }
  }
  
  // Verificar repetições (aaaa, 1111...)
  const repeats = /(.)\1{3,}/;
  if (repeats.test(lowerPassword)) {
    return true;
  }
  
  return false;
}

/**
 * Middleware para adicionar headers de segurança
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // No cache para rotas sensíveis
  if (req.path.includes('/auth/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Strict Transport Security
  if (env.nodeEnv === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content-Type protection
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (redundante com CSP, mas mantido para browsers antigos)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  
  next();
};

/**
 * Middleware para detecção e prevenção de ataques
 */
export const attackDetection = (req: Request, res: Response, next: NextFunction) => {
  // Verificação de injeção SQL
  const sqlInjectionCheck = () => {
    const sqlInjectionPattern = /('|"|;|--|\/\*|\*\/|xp_|sp_|exec|select|insert|update|delete|drop|alter|union\s+select)/i;
    
    const checkValue = (value: any): boolean => {
      if (typeof value !== 'string') return false;
      return sqlInjectionPattern.test(value);
    };
    
    const checkObject = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      
      for (const key in obj) {
        if (typeof obj[key] === 'string' && checkValue(obj[key])) {
          return true;
        } else if (typeof obj[key] === 'object' && checkObject(obj[key])) {
          return true;
        }
      }
      
      return false;
    };
    
    return checkObject(req.body) || checkObject(req.query) || checkObject(req.params);
  };
  
  // Verificação de injeção NoSQL
  const noSqlInjectionCheck = () => {
    // Padrões suspeitos em objetos
    const hasOperator = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      
      for (const key in obj) {
        // Verificar operadores MongoDB ($gt, $ne, etc)
        if (key.startsWith('$')) return true;
        
        // Verificar recursivamente
        if (typeof obj[key] === 'object' && hasOperator(obj[key])) {
          return true;
        }
      }
      
      return false;
    };
    
    return hasOperator(req.body) || hasOperator(req.query) || hasOperator(req.params);
  };
  
  // Verificação de XSS
  const xssCheck = () => {
    const xssPattern = /<script\b[^>]*>[\s\S]*?<\/script>|javascript:|onerror=|onload=|eval\(|setTimeout\(|setInterval\(|new\s+Function\(|document\.cookie|document\.write|window\.location/i;
    
    const checkValue = (value: any): boolean => {
      if (typeof value !== 'string') return false;
      return xssPattern.test(value);
    };
    
    const checkObject = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      
      for (const key in obj) {
        if (typeof obj[key] === 'string' && checkValue(obj[key])) {
          return true;
        } else if (typeof obj[key] === 'object' && checkObject(obj[key])) {
          return true;
        }
      }
      
      return false;
    };
    
    return checkObject(req.body) || checkObject(req.query) || checkObject(req.params);
  };
  
  // Verificação de path traversal
  const pathTraversalCheck = () => {
    const pathTraversalPattern = /\.\.\//;
    
    const checkValue = (value: any): boolean => {
      if (typeof value !== 'string') return false;
      return pathTraversalPattern.test(value);
    };
    
    const checkObject = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      
      for (const key in obj) {
        if (typeof obj[key] === 'string' && checkValue(obj[key])) {
          return true;
        } else if (typeof obj[key] === 'object' && checkObject(obj[key])) {
          return true;
        }
      }
      
      return false;
    };
    
    return checkObject(req.body) || checkObject(req.query) || checkObject(req.params);
  };
  
  // Realizar todas as verificações
  if (sqlInjectionCheck()) {
    logger.warn('Possível ataque de SQL Injection detectado', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      body: JSON.stringify(req.body).slice(0, 200), // Log limitado por segurança
      query: req.query,
      params: req.params
    });
    
    return next(new ApiError('Acesso negado - Solicitação inválida', 403));
  }
  
  if (noSqlInjectionCheck()) {
    logger.warn('Possível ataque de NoSQL Injection detectado', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    return next(new ApiError('Acesso negado - Solicitação inválida', 403));
  }
  
  if (xssCheck()) {
    logger.warn('Possível ataque XSS detectado', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    return next(new ApiError('Acesso negado - Solicitação inválida', 403));
  }
  
  if (pathTraversalCheck()) {
    logger.warn('Possível ataque de Path Traversal detectado', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    return next(new ApiError('Acesso negado - Solicitação inválida', 403));
  }
  
  next();
};

/**
 * Middleware para prevenção de enumeração de usuários
 * Torna o tempo de resposta constante para evitar ataques de timing
 */
export const preventUserEnumeration = (req: Request, res: Response, next: NextFunction) => {
  // Salvar o tempo de início
  const startTime = process.hrtime();
  
  // Interceptar o método res.send
  const originalSend = res.send;
  
  res.send = function(...args) {
    // Calcular o tempo decorrido
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const elapsedMs = seconds * 1000 + nanoseconds / 1000000;
    
    // Se for uma resposta de erro de autenticação ou usuário não encontrado
    // E a resposta foi muito rápida (menos de 1000ms)
    if (res.statusCode === 401 || res.statusCode === 404) {
      if (elapsedMs < 1000) {
        // Adicionar um atraso para tornar o tempo constante
        const delayMs = 1000 - elapsedMs;
        
        setTimeout(() => {
          originalSend.apply(res, args);
        }, delayMs);
        
        return res;
      }
    }
    
    // Para outros casos, continuar normalmente
    return originalSend.apply(res, args);
  };
  
  next();
};

/**
 * Middleware para limitar carga útil (payload) e prevenir DoS
 */
export const payloadSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  // Tamanho máximo de payload (1MB)
  const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
  
  // Verificar header Content-Length
  const contentLength = req.headers['content-length'] 
    ? parseInt(req.headers['content-length'], 10) 
    : 0;
  
  if (contentLength > MAX_PAYLOAD_SIZE) {
    logger.warn('Payload muito grande detectado', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      contentLength
    });
    
    return next(ApiError.badRequest(
      'Tamanho da carga útil excede o limite permitido'
    ));
  }
  
  next();
};

/**
 * Middleware para criar um nonce único para uso com CSP
 */
export const generateNonce = (req: Request, res: Response, next: NextFunction) => {
  // Gerar nonce aleatório para uso com CSP (Content Security Policy)
  const nonce = crypto.randomBytes(16).toString('base64');
  
  // Anexar à resposta para uso nas views
  res.locals.nonce = nonce;
  
  // Atualizar CSP para incluir o nonce
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}';`;
  res.setHeader('Content-Security-Policy', csp);
  
  next();
};

/**
 * Middleware para prevenção de ataques de força bruta adicionais
 * Progressivamente aumenta o atraso após falhas repetidas
 */
export const bruteForceProtection = (req: Request, res: Response, next: NextFunction) => {
  // Este middleware seria mais eficaz com um store como Redis para persistir os dados
  // Para este exemplo, usamos uma variável em memória
  const ipFailures: Record<string, { count: number, lastFailure: number }> = {};
  
  // Verificar se é uma rota sensível (login, registro, reset de senha)
  const isSensitiveRoute = req.path.includes('/login') || 
                          req.path.includes('/register') || 
                          req.path.includes('/password');
  
  if (!isSensitiveRoute) {
    return next();
  }
  
  const ip = req.ip || 'unknown';
  
  // Verificar tentativas anteriores
  if (ipFailures[ip]) {
    const { count, lastFailure } = ipFailures[ip];
    const now = Date.now();
    const timeSinceLastFailure = now - lastFailure;
    
    // Se houver muitas falhas, implementar backoff exponencial
    if (count > 3) {
      // Calcular atraso: 2^(count-3) segundos (4, 8, 16...)
      const delaySeconds = Math.pow(2, count - 3);
      const delayMs = delaySeconds * 1000;
      
      // Se ainda estiver dentro do período de atraso
      if (timeSinceLastFailure < delayMs) {
        return next(new ApiError(
          `Muitas tentativas. Tente novamente em ${delaySeconds} segundos.`,
          429
        ));
      }
    }
  }
  
  // Interceptar a resposta para detectar falhas
  const originalSend = res.send;
  res.send = function(...args) {
    // Se for uma resposta de erro (401, 403)
    if (res.statusCode === 401 || res.statusCode === 403) {
      if (!ipFailures[ip]) {
        ipFailures[ip] = { count: 1, lastFailure: Date.now() };
      } else {
        ipFailures[ip].count++;
        ipFailures[ip].lastFailure = Date.now();
      }
      
      // Log da falha
      logger.warn('Falha de autenticação detectada', {
        ip,
        path: req.path,
        method: req.method,
        failureCount: ipFailures[ip].count
      });
    }
    
    // Em caso de sucesso, resetar as falhas
    if (res.statusCode >= 200 && res.statusCode < 300 && ipFailures[ip]) {
      delete ipFailures[ip];
    }
    
    return originalSend.apply(res, args);
  };
  
  next();
};