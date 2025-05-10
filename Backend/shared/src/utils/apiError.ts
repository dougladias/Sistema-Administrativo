
// Códigos de erro padronizados
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATA_ACCESS_ERROR = 'DATA_ACCESS_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

// Mapeamento de códigos de erro para status HTTP
export const ErrorStatusMap: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.AUTHENTICATION_ERROR]: 401,
  [ErrorCode.AUTHORIZATION_ERROR]: 403,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCode.INVALID_REQUEST]: 400,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.DATA_ACCESS_ERROR]: 500,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
};

// Classe de erro base para a API
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: any;
  readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Cria uma resposta padronizada de erro
   */
  toResponse() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Factory para criar erros específicos
   */
  static validation(message: string = 'Erro de validação', details?: any): ApiError {
    return new ApiError(
      message, 
      ErrorStatusMap[ErrorCode.VALIDATION_ERROR], 
      ErrorCode.VALIDATION_ERROR, 
      details
    );
  }

  static authentication(message: string = 'Não autenticado'): ApiError {
    return new ApiError(
      message,
      ErrorStatusMap[ErrorCode.AUTHENTICATION_ERROR],
      ErrorCode.AUTHENTICATION_ERROR
    );
  }

  static authorization(message: string = 'Não autorizado'): ApiError {
    return new ApiError(
      message,
      ErrorStatusMap[ErrorCode.AUTHORIZATION_ERROR],
      ErrorCode.AUTHORIZATION_ERROR
    );
  }

  static notFound(message: string = 'Recurso não encontrado'): ApiError {
    return new ApiError(
      message,
      ErrorStatusMap[ErrorCode.RESOURCE_NOT_FOUND],
      ErrorCode.RESOURCE_NOT_FOUND
    );
  }

  static conflict(message: string = 'Recurso já existe', details?: any): ApiError {
    return new ApiError(
      message,
      ErrorStatusMap[ErrorCode.RESOURCE_ALREADY_EXISTS],
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      details
    );
  }

  static badRequest(message: string = 'Requisição inválida', details?: any): ApiError {
    return new ApiError(
      message,
      ErrorStatusMap[ErrorCode.INVALID_REQUEST],
      ErrorCode.INVALID_REQUEST,
      details
    );
  }

  static internal(message: string = 'Erro interno do servidor', details?: any): ApiError {
    return new ApiError(
      message,
      ErrorStatusMap[ErrorCode.INTERNAL_ERROR],
      ErrorCode.INTERNAL_ERROR,
      details,
      false
    );
  }

  static serviceUnavailable(message: string = 'Serviço temporariamente indisponível'): ApiError {
    return new ApiError(
      message,
      ErrorStatusMap[ErrorCode.SERVICE_UNAVAILABLE],
      ErrorCode.SERVICE_UNAVAILABLE
    );
  }

  static dataAccess(message: string = 'Erro ao acessar dados', details?: any): ApiError {
    return new ApiError(
      message,
      ErrorStatusMap[ErrorCode.DATA_ACCESS_ERROR],
      ErrorCode.DATA_ACCESS_ERROR,
      details
    );
  }

  static rateLimit(message: string = 'Limite de requisições excedido'): ApiError {
    return new ApiError(
      message,
      ErrorStatusMap[ErrorCode.RATE_LIMIT_EXCEEDED],
      ErrorCode.RATE_LIMIT_EXCEEDED
    );
  }
}

/**
 * Extrai mensagens de erro de diferentes formatos de erro
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Erro desconhecido';
}

/**
 * Converte erros específicos do Mongoose para ApiError
 */
export function handleMongooseError(error: any): ApiError {
  // Erro de validação do Mongoose
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
    
    return ApiError.validation('Erro de validação do banco de dados', details);
  }
  
  // Erro de chave duplicada (unique constraint)
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const value = error.keyValue[field];
    
    return ApiError.conflict(
      `Já existe um registro com ${field} = ${value}`,
      { field, value }
    );
  }
  
  // Erro de ID inválido
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return ApiError.badRequest('ID inválido ou mal formatado');
  }
  
  // Outros erros do Mongoose
  return ApiError.dataAccess(error.message);
}

/**
 * Função para tratamento unificado de erros
 */
export function handleError(error: unknown): ApiError {
  // Se já for um ApiError, retorna diretamente
  if (error instanceof ApiError) {
    return error;
  }
  
  // Trata erros específicos do Mongoose
  if (error instanceof Error && 
      ['ValidationError', 'MongoServerError', 'CastError'].includes(error.name)) {
    return handleMongooseError(error);
  }
  
  // Erros de JWT
  if (error instanceof Error && error.name === 'JsonWebTokenError') {
    return ApiError.authentication('Token inválido');
  }
  
  if (error instanceof Error && error.name === 'TokenExpiredError') {
    return ApiError.authentication('Token expirado');
  }
  
  // Outros erros conhecidos
  if (error instanceof Error) {
    return new ApiError(error.message, 500, ErrorCode.INTERNAL_ERROR, 
      process.env.NODE_ENV !== 'production' ? { stack: error.stack } : undefined,
      false
    );
  }
  
  // Fallback para erros desconhecidos
  return ApiError.internal(
    typeof error === 'string' ? error : 'Erro interno do servidor'
  );
}

/**
 * Formata detalhes de erro de validação do Zod
 */
export function formatZodError(error: any): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  if (error && error.errors) {
    error.errors.forEach((err: any) => {
      const path = err.path.join('.');
      formattedErrors[path] = err.message;
    });
  }
  
  return formattedErrors;
}

/**
 * Verifica se um erro é seguro para enviar ao cliente
 */
export function isSafeError(error: ApiError): boolean {
  return error.isOperational;
}