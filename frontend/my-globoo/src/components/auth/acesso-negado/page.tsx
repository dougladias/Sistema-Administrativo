'use client';

import { Button } from '@/components/ui/button';
import { Shield, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AccessDeniedPage() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center p-6 max-w-md">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto flex items-center justify-center mb-6">
          <Shield className="h-12 w-12 text-red-500 dark:text-red-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Acesso Negado
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Você não tem permissão para acessar esta página. Por favor, entre em contato com o administrador se acredita que isso é um erro.
        </p>
        
        {session?.user && (
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Conectado como <span className="font-semibold">{session.user.name}</span> ({session.user.role})
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <Link href="/dashboard">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              Ir para o Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}