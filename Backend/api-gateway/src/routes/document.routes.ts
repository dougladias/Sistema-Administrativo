import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { UserRole } from '../types/user';
import multer from 'multer';
import { validateDocumentCreate, validateDocumentUpdate } from '../middleware/document.middleware';
import axios from 'axios';
import { logger } from '../config/logger';
import { env } from '../config/env';
import FormData from 'form-data';
import { Request, Response, NextFunction } from 'express';
import { AxiosResponse } from 'axios';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // Upload temporário antes de enviar ao serviço

// URL base para o serviço de documentos (obtida das variáveis de ambiente)
const DOCUMENT_SERVICE_URL = env.DOCUMENT_SERVICE_URL || 'http://localhost:4011';

// Middleware para encaminhar requisições para o serviço de documentos
/**
 * Interface for document service request options
 */
interface DocumentServiceOptions {
  method: string;
  url: string;
  headers: Record<string, any>;
  data?: any;
  params?: any;
  validateStatus: () => boolean;
}

async function forwardToDocumentService(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    // Determinar o caminho a ser usado no serviço de documentos
    const path: string = req.originalUrl.replace('/api/documents', '');
    const url: string = `${DOCUMENT_SERVICE_URL}/api/documents${path || ''}`;
    
    logger.debug(`Encaminhando ${req.method} para ${url}`);
    
    // Configurar cabeçalhos
    const headers: Record<string, any> = { ...req.headers };
    if (headers.host) delete headers.host; // Remover host para evitar conflitos
    
    // Fazer a requisição para o serviço de documentos
    const response: AxiosResponse = await axios({
      method: req.method,
      url,
      headers,
      data: req.body,
      params: req.query,
      validateStatus: () => true // Aceitar qualquer status para manipulação adequada
    });
    
    // Retornar a resposta do serviço de documentos
    return res.status(response.status).json(response.data);
  } catch (error: unknown) {
    logger.error('Erro ao encaminhar para serviço de documentos:', error);
    next(error);
  }
}

// Temporariamente desabilitamos autenticação para testar
// Rotas para usuários autenticados
// Buscar documentos (com filtros)
router.get('/', forwardToDocumentService);

// Buscar documento específico
router.get('/:id', forwardToDocumentService);

// Download de documento
router.get('/:id/download', forwardToDocumentService);

// Visualizar documento
router.get('/:id/view', forwardToDocumentService);

// Buscar documentos por funcionário
router.get('/worker/:workerId', forwardToDocumentService);

// Buscar documentos por departamento
router.get('/department/:departmentId', forwardToDocumentService);

// Buscar documentos por categoria
router.get('/category/:category', forwardToDocumentService);

// Documentos a expirar
router.get('/expiring', forwardToDocumentService);

// Criar documento com upload - temporariamente sem autorização para teste
router.post('/', upload.single('file'), validateDocumentCreate, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Arquivo do documento é obrigatório'
        }
      });
    }

    // Criar FormData para enviar arquivo
    const formData = new FormData();
    
    // Adicionar os campos do formulário
    Object.keys(req.body).forEach(key => {
      formData.append(key, req.body[key]);
    });
    
    // Adicionar o arquivo
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Fazer a requisição para o serviço de documentos
    const response = await axios.post(
      `${DOCUMENT_SERVICE_URL}/api/documents`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': req.headers.authorization,
        },
        validateStatus: () => true
      }
    );
    
    return res.status(response.status).json(response.data);
  } catch (error) {
    logger.error('Erro ao criar documento:', error);
    next(error);
  }
});

// Atualizar documento
router.put('/:id', validateDocumentUpdate, forwardToDocumentService);

// Remover documento
router.delete('/:id', forwardToDocumentService);

// Atualizar status do documento
router.patch('/:id/status', forwardToDocumentService);

export default router;