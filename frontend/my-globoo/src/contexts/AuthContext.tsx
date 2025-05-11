'use client';

import { createContext, useContext, ReactNode, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: {
    id?: string;
    name: string;
    email: string;
    role: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  canAccessBackoffice: boolean;
  login: (credentials: { email: string; password: string }, callbackUrl?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (route: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Verificar se o usuário está autenticado
  const isAuthenticated = status === 'authenticated';
  
  // Verificar se o usuário está sendo autenticado
  const isLoading = status === 'loading' || loading;
  
  // Definir se o usuário pode acessar o backoffice (apenas CEO)
  const canAccessBackoffice = session?.user?.role === 'CEO';
  
  // Mapeamento de permissões por função
  const rolePermissions: Record<string, string[]> = {
    'CEO': ['dashboard', 'funcionarios', 'documentos', 'folha-pagamento', 'relatorios', 'configuracoes', 'admin'],
    'administrador': ['dashboard', 'funcionarios', 'documentos', 'folha-pagamento', 'relatorios'],
    'assistente': ['dashboard', 'funcionarios', 'documentos']
  };
  
  // Login com credenciais
  const login = async (credentials: { email: string; password: string }, callbackUrl?: string) => {
    setLoading(true);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: credentials.email,
        password: credentials.password
      });
      
      if (result?.error) {
        setLoading(false);
        return false;
      }
      
      // Redirecionar após login bem-sucedido
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push('/dashboard');
      }
      
      return true;
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setLoading(false);
      return false;
    }
  };
  
  // Logout
  const logout = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/auth/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };
  
  // Verificar se o usuário tem permissão para acessar uma rota
  const hasPermission = (route: string) => {
    if (!session?.user?.role) return false;
    
    const userRole = session.user.role;
    const allowedRoutes = rolePermissions[userRole] || [];
    
    return allowedRoutes.some(r => route.startsWith(r));
  };
  
  const value = {
    user: session?.user ?? null,
    isAuthenticated,
    isLoading,
    canAccessBackoffice,
    login,
    logout,
    hasPermission
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}