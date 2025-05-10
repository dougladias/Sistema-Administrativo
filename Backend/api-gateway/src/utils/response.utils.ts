
import { Response } from 'express';

/**
 * Interface para resposta de sucesso padrão
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

/**
 * Interface para resposta de erro padrão
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Tipos de status HTTP comuns
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Códigos de erro padronizados da API
 */
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
}

/**
 * Classe de utilitários para respostas da API
 */
export class ApiResponse {
  /**
   * Envia uma resposta de sucesso
   * @param res Objeto de resposta do Express
   * @param data Dados a serem incluídos na resposta
   * @param status Código de status HTTP (padrão 200)
   * @param requestId ID opcional da requisição para rastreamento
   */
  static success<T>(
    res: Response,
    data: T,
    status: number = HttpStatus.OK,
    requestId?: string
  ): Response {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId,
    };

    return res.status(status).json(response);
  }

  /**
   * Envia uma resposta de erro
   * @param res Objeto de resposta do Express
   * @param code Código de erro padronizado
   * @param message Mensagem de erro
   * @param status Código de status HTTP (padrão 400)
   * @param details Detalhes adicionais sobre o erro
   * @param requestId ID opcional da requisição para rastreamento
   */
  static error(
    res: Response,
    code: string,
    message: string,
    status: number = HttpStatus.BAD_REQUEST,
    details?: any,
    requestId?: string
  ): Response {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };

    return res.status(status).json(response);
  }

  /**
   * Resposta para recursos criados com sucesso
   */
  static created<T>(res: Response, data: T, requestId?: string): Response {
    return ApiResponse.success(res, data, HttpStatus.CREATED, requestId);
  }

  /**
   * Resposta para operações bem-sucedidas sem conteúdo de retorno
   */
  static noContent(res: Response): Response {
    return res.status(HttpStatus.NO_CONTENT).end();
  }

  /**
   * Resposta para erros de validação
   */
  static validationError(
    res: Response,
    message: string = 'Erro de validação',
    details?: any,
    requestId?: string
  ): Response {
    return ApiResponse.error(
      res,
      ErrorCode.VALIDATION_ERROR,
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      details,
      requestId
    );
  }

  /**
   * Resposta para erros de autenticação
   */
  static unauthorized(
    res: Response,
    message: string = 'Não autorizado',
    requestId?: string
  ): Response {
    return ApiResponse.error(
      res,
      ErrorCode.AUTHENTICATION_ERROR,
      message,
      HttpStatus.UNAUTHORIZED,
      undefined,
      requestId
    );
  }

  /**
   * Resposta para erros de autorização
   */
  static forbidden(
    res: Response,
    message: string = 'Acesso negado',
    requestId?: string
  ): Response {
    return ApiResponse.error(
      res,
      ErrorCode.AUTHORIZATION_ERROR,
      message,
      HttpStatus.FORBIDDEN,
      undefined,
      requestId
    );
  }

  /**
   * Resposta para recursos não encontrados
   */
  static notFound(
    res: Response,
    message: string = 'Recurso não encontrado',
    requestId?: string
  ): Response {
    return ApiResponse.error(
      res,
      ErrorCode.RESOURCE_NOT_FOUND,
      message,
      HttpStatus.NOT_FOUND,
      undefined,
      requestId
    );
  }

  /**
   * Resposta para conflitos (ex: tentativa de criar recurso que já existe)
   */
  static conflict(
    res: Response,
    message: string = 'Recurso já existe',
    details?: any,
    requestId?: string
  ): Response {
    return ApiResponse.error(
      res,
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      message,
      HttpStatus.CONFLICT,
      details,
      requestId
    );
  }

  /**
   * Resposta para erros internos do servidor
   */
  static serverError(
    res: Response,
    message: string = 'Erro interno do servidor',
    details?: any,
    requestId?: string
  ): Response {
    return ApiResponse.error(
      res,
      ErrorCode.INTERNAL_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
      requestId
    );
  }

  /**
   * Resposta para serviços indisponíveis
   */
  static serviceUnavailable(
    res: Response,
    message: string = 'Serviço temporariamente indisponível',
    requestId?: string
  ): Response {
    return ApiResponse.error(
      res,
      ErrorCode.SERVICE_UNAVAILABLE,
      message,
      HttpStatus.SERVICE_UNAVAILABLE,
      undefined,
      requestId
    );
  }
}