import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      // Não há token, redirecionar para login
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Verificando autenticação...</div>;
  }

  return isAuthenticated ? <>{children}</> : null;
}