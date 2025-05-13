import { Router } from 'express';
import { routeBasedProxy } from '../services/proxy.service';
// Update the import path to match the actual file name and location
import { apiLimiter, authLimiter } from '../middleware/rate-limit.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Rota para o caminho raiz
router.get('/', (req, res) => {
  res.status(200).json({ message: 'API Gateway is running', status: 'UP' });
});

// Rota de health check (não autenticada)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

// Definir explicitamente quais rotas de autenticação são públicas
const publicAuthRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh-token'];

// Middleware para verificar se é uma rota pública de autenticação
router.use('/api/auth', (req, res, next) => {
  const isPublicRoute = publicAuthRoutes.some(route => req.path.endsWith(route));
  
  if (isPublicRoute) {
    // Rota pública - aplicar apenas rate limiting mais restritivo
    return authLimiter(req, res, next);
  } else {
    // Rota protegida de autenticação - requer autenticação
    return authenticate()(req, res, next);
  }
});

// Proxy para as rotas de autenticação
router.use('/api/auth', routeBasedProxy);

// Todas as outras rotas da API requerem autenticação
router.use('/api', apiLimiter, authenticate, routeBasedProxy);

// Adicionar uma rota para forçar a reinicialização do serviço worker (apenas para administradores)
import type { Request, Response } from 'express';

type RestartWorkerRequest = Request;
type RestartWorkerResponse = Response;

router.post(
  '/admin/services/worker/restart',
  authenticate,
  hasRole(['admin']),
  async (req: RestartWorkerRequest, res: RestartWorkerResponse): Promise<void> => {
    // Esta rota seria implementada para reiniciar o serviço worker
    // A implementação real envolveria importar a função startWorkerService e chamá-la
    res.status(200).json({ message: 'Worker service restart initiated' });
  }
);

// Rotas do serviço de documentos
router.use('/api/documents', apiLimiter, authenticate, routeBasedProxy);
router.use('/api/templates', apiLimiter, authenticate, routeBasedProxy);

// É possível criar rotas específicas para operações mais sensíveis
router.delete('/api/documents/:id', authenticate, hasRole(['admin', 'manager']), routeBasedProxy);

function hasRole(roles: string[]): import("express-serve-static-core").RequestHandler {
  return (req, res, next) => {
    // Supondo que o middleware de autenticação adiciona o usuário ao req.user
    const user = req.user as { role?: string } | undefined;
    if (!user || !user.role || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

export default router;
