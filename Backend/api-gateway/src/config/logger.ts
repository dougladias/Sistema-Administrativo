import winston from 'winston';
import { env } from './env';
import { Request, Response, NextFunction } from 'express';


// Extend Express Request interface to include custom properties
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
            logger?: winston.Logger;
        }
    }
}

// Definir níveis de log personalizados
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Definir cores para cada nível de log (para console)
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Adicionar cores ao Winston
winston.addColors(colors);

// Determinar o nível de log com base no ambiente
const level = () => {
    const environment = env.NODE_ENV || 'development';
    const isDevelopment = environment === 'development';
    return isDevelopment ? 'debug' : (env as any).LOG_LEVEL || 'info';
};

// Formato para logs do console (coloridos e formatados)
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Formato para logs de arquivo (JSON estruturado)
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.json()
);

// Criação dos transportes (destinos dos logs)
const transports: winston.transport[] = [
    // Sempre log para console
    new winston.transports.Console({
        format: consoleFormat,
    }),
];

// Em produção, adicionar log para arquivo
if (env.NODE_ENV === 'production') {
    transports.push(
        // Arquivo para todos os logs
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: fileFormat,
        }),
        // Arquivo separado apenas para erros
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: fileFormat,
        })
    );
}

// Criação do logger
export const logger = winston.createLogger({
    level: level(),
    levels,
    transports,
    // Não encerrar em caso de erro não tratado
    exitOnError: false,
});

// Criar um middleware de log para Express
interface LoggedRequestDetails {
    method: string;
    url: string;
    params?: any;
    query?: any;
    body?: any;
    headers?: Record<string, string | string[] | undefined>;
}

interface LoggedResponseDetails {
    statusCode: number;
    responseTime: number;
    body?: any;
}


export const httpLogger = (req: Request, res: Response, next: NextFunction): void => {
    // Registra o início da requisição
    const startTime: number = new Date().getTime();

    // Gerar ID único para a requisição (para correlação)
    const requestId: string = (req.headers['x-request-id'] as string) || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Registrar informações básicas
    logger.http(`[${requestId}] ${req.method} ${req.originalUrl} - Início`);

    // Registrar dados da requisição em ambiente de desenvolvimento
    if (env.NODE_ENV === 'development') {
        const requestDetails: LoggedRequestDetails = {
            method: req.method,
            url: req.originalUrl,
            params: req.params,
            query: req.query,
            // Evitar logging de dados sensíveis
            body: req.method === 'POST' || req.method === 'PUT'
                ? (req.body && req.body.password ? { ...req.body, password: '[REDACTED]' } : req.body)
                : undefined,
            headers: {
                ...req.headers,
                // Redação de cabeçalhos sensíveis
                authorization: req.headers.authorization ? '[REDACTED]' : undefined,
                cookie: req.headers.cookie ? '[REDACTED]' : undefined,
            },
        };
        logger.debug(`[${requestId}] Requisição: ${JSON.stringify(requestDetails)}`);
    }

    // Capturar a resposta
    const originalSend = res.send;
    res.send = function (body?: any): Response {
        const responseTime: number = new Date().getTime() - startTime;

        // Logging da resposta
        logger.http(`[${requestId}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`);

        // Logging detalhado em ambiente de desenvolvimento
        if (env.NODE_ENV === 'development' && res.statusCode >= 400) {
            try {
                // Tentar fazer parse do body para logging (se for JSON)
                const parsedBody: any = typeof body === 'string' ? JSON.parse(body) : body;
                const responseDetails: LoggedResponseDetails = {
                    statusCode: res.statusCode,
                    responseTime,
                    body: parsedBody
                };
                logger.debug(`[${requestId}] Resposta: ${JSON.stringify(responseDetails)}`);
            } catch (e) {
                // Se não conseguir fazer parse, logar apenas status e tempo
                logger.debug(`[${requestId}] Resposta não-JSON: ${res.statusCode} - ${responseTime}ms`);
            }
        }

        // Adicionar request ID ao cabeçalho de resposta para correlação
        res.setHeader('X-Request-ID', requestId);

        // Continuar com o comportamento original
        return originalSend.call(this, body);
    };

    // Anexar o requestId e o logger à requisição para uso nos controladores
    req.requestId = requestId;
    req.logger = logger.child({ requestId });

    next();
};

// Middleware para logging de erros
interface LoggedError {
    name: string;
    message: string;
    stack?: string;
    status: number;
}

interface LoggedRequestInfo {
    method: string;
    url: string;
}

interface CustomError extends Error {
    status?: number;
}

export const errorLogger = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
    const requestId: string = req.requestId || 'unknown';

    const errorDetails: LoggedError = {
        name: err.name,
        message: err.message,
        stack: env.NODE_ENV === 'development' ? err.stack : undefined,
        status: err.status || 500,
    };

    const requestInfo: LoggedRequestInfo = {
        method: req.method,
        url: req.originalUrl,
    };

    logger.error(`[${requestId}] Erro: ${err.message}`, {
        error: errorDetails,
        request: requestInfo,
    });

    next(err);
};

// Para usar em testes ou ambientes onde o logger não deve fazer output
export const silentLogger = {
    error: () => { },
    warn: () => { },
    info: () => { },
    http: () => { },
    debug: () => { },
};

// Helper para inicializar os diretórios de log em produção
export function initializeLoggers() {
    if (env.NODE_ENV === 'production') {
        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(process.cwd(), 'logs');

        // Criar diretório de logs se não existir
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
    }

    logger.info(`Logger inicializado em modo ${env.NODE_ENV} com nível ${level()}`);
}

// Inicializar logs
initializeLoggers();