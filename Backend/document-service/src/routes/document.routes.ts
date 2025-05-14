import { Router } from 'express';
import * as documentController from '../controllers/document.controller';
import { UserRole } from '../utils/types';
import multer from 'multer';

// Usar memoryStorage para manter o arquivo em memória (não salvar em disco)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();

// Rota para listar todos os documentos com filtros
router.get('/', (req, res, next) => {
  documentController.findAll(req, res, next).catch(next);
});

// Rota para buscar documento por ID
router.get('/:id', (req, res, next) => {
  documentController.findById(req, res, next).catch(next);
});

// Rota para download de arquivo
router.get('/:id/download', (req, res, next) => {
  documentController.download(req, res, next).catch(next);
});

// Rota para visualizar arquivo (sem download)
router.get('/:id/view', (req, res, next) => {
  documentController.view(req, res, next).catch(next);
});

// Rota para buscar documentos por funcionário
router.get('/worker/:workerId', (req, res, next) => {
  documentController.findByWorker(req, res, next).catch(next);
});

// Rota para buscar documentos por departamento
router.get('/department/:departmentId', (req, res, next) => {
  documentController.findByDepartment(req, res, next).catch(next);
});

// Rota para buscar documentos por categoria
router.get('/category/:category', (req, res, next) => {
  documentController.findByCategory(req, res, next).catch(next);
});

// Rota para buscar documentos prestes a expirar
router.get('/expiring', (req, res, next) => {
  documentController.findExpiring(req, res, next).catch(next);
});


// Rota para criar novo documento com upload de arquivo
router.post('/', upload.single('file'), (req, res, next) => {
  documentController.create(req, res, next).catch(next);
});

// Rota para atualizar documento
router.put('/:id', (req, res, next) => {
  documentController.update(req, res, next).catch(next);
});

// Rota para excluir documento
router.delete('/:id', (req, res, next) => {
  documentController.remove(req, res, next).catch(next);
});

// Rota para atualizar status do documento
router.patch('/:id/status', (req, res, next) => {
  documentController.updateStatus(req, res, next).catch(next);
});

export default router;

function authorize(arg0: UserRole[]): any {
  throw new Error('Function not implemented.');
}
