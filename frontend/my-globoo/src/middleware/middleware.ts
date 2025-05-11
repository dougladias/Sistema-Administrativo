// frontend/my-globoo/src/middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Definir permissões por role
const rolePermissions: Record<string, string[]> = {
  'CEO': ['dashboard', 'funcionarios', 'documentos', 'folha-pagamento', 'relatorios', 'configuracoes', 'admin'],
  'ADMIN': ['dashboard', 'funcionarios', 'documentos', 'folha-pagamento', 'relatorios'],
  'ASSISTENTE': ['dashboard', 'funcionarios', 'documentos']
};

export async function middleware(request: NextRequest) {
  // Ignorar rotas de API para evitar redirecionamentos incorretos
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Obter o token JWT da sessão
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  const isAuthenticated = !!token;
  const path = request.nextUrl.pathname;
  
  // Verificar se é uma rota de autenticação
  const isAuthRoute = path.startsWith('/auth/');
  
  // Verificar se é uma página protegida
  const isProtectedRoute = [
    '/dashboard',
    '/funcionarios',
    '/documentos',    
    '/folha-pagamento',
    '/relatorios',
    '/configuracoes',
    '/admin'
  ].some(route => path.startsWith(route));
  
  // Verificar se é uma página de backoffice
  const isBackofficeRoute = path.startsWith('/admin');
  
  // Redirecionar usuários não autenticados para login
  if (!isAuthenticated && isProtectedRoute) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(path));
    return NextResponse.redirect(url);
  }
  
  // Redirecionar usuários autenticados para o dashboard se tentarem acessar login
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Verificar permissões baseadas em role
  if (isAuthenticated && isProtectedRoute && token.role) {
    const userRole = token.role as string;
    const allowedRoutes = rolePermissions[userRole] || [];
    
    // Verificar se o usuário tem permissão para acessar a rota
    const hasPermission = allowedRoutes.some(route => path.startsWith(`/${route}`));
    
    if (!hasPermission) {
      return NextResponse.redirect(new URL('/acesso-negado', request.url));
    }
    
    // Verificar permissões específicas para backoffice - apenas CEO pode acessar
    if (isBackofficeRoute && userRole !== 'CEO') {
      return NextResponse.redirect(new URL('/acesso-negado', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Ignora requisições para:
     * - Arquivos estáticos (_next/)
     * - API routes (/api/ - mas permitimos executar o middleware primeiro)
     * - Arquivos dentro da pasta public
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}