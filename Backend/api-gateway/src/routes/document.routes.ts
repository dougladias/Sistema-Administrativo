import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { UserRole } from '../types/user';
import { proxyRequest } from '../utils/serviceProxy';
import multer from 'multer';
import { validateDocumentCreate, validateDocumentUpdate } from '../middleware/document.middleware';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import FormData from 'form-data';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // Upload temporário antes de enviar ao serviço

// URL base para o serviço de documentos (obtida das variáveis de ambiente)
const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:4011';

// Middleware para adicionar cabeçalhos de autenticação e encaminhar para o serviço de documentos
interface ForwardToDocumentServiceRequest extends Request {}
interface ForwardToDocumentServiceResponse extends Response {}
type ForwardToDocumentServiceNext = NextFunction;

const forwardToDocumentService = async (
  req: ForwardToDocumentServiceRequest,
  res: ForwardToDocumentServiceResponse,
  next: ForwardToDocumentServiceNext
): Promise<void> => {
  try {
    const path = req.originalUrl.replace('/api/documents', ''); 
    await proxyRequest({
      req,
      res,
      serviceUrl: DOCUMENT_SERVICE_URL,
      path,
      method: req.method,
      serviceName: 'document-service',
    });
  } catch (error) {
    next(error);
  }
};

// Rotas públicas (apenas para visualização, se aplicável)
router.get('/public/:id/view', async (req, res, next) => {
  try {
    // Verificar se o documento é público antes de encaminhar
    await proxyRequest({
      req,
      res,
      serviceUrl: DOCUMENT_SERVICE_URL,
      path: `/api/documents/${req.params.id}/public/view`,
      method: 'GET',
      serviceName: 'document-service'
    });
  } catch (error) {
    next(error);
  }
});

// Todas as outras rotas exigem autenticação
router.use(authenticate);

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

// Rotas que exigem permissões elevadas (ADMIN, CEO ou RH)
router.use(authorize([UserRole.ADMIN, UserRole.CEO, UserRole.HR]));

// Criar documento com upload
router.post('/', upload.single('file'), validateDocumentCreate, async (req, res, next) => {
  try {
    const formData = new FormData();

    // Adicionar os campos JSON
    Object.keys(req.body).forEach((key) => {
      formData.append(key, req.body[key]);
    });
    // Adicionar o arquivo
    if (req.file) {
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype || 'application/octet-stream'
      });
    }

    // Enviar para o serviço de documentos
    await proxyRequest({
      req,
      res,
      serviceUrl: DOCUMENT_SERVICE_URL,
      path: `/api/documents`,
      method: 'POST',
      body: formData,
      serviceName: 'document-service',
      headers: {
        ...formData.getHeaders(),
      },
    });
  } catch (error) {
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