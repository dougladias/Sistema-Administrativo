'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';

interface LoginCredentials {
  email: string;
  password: string;
}

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se o usuário está autenticado
  const isAuthenticated = status === 'authenticated';

  // Verificar se o usuário está autenticando
  const isLoading = status === 'loading' || loading;

  // Login com credenciais
  const login = async (credentials: LoginCredentials, callbackUrl?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: credentials.email,
        password: credentials.password,
      });

      if (result?.error) {
        setError('Credenciais inválidas');
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
      setError('Ocorreu um erro ao tentar fazer login');
      setLoading(false);
      return false;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut({ redirect: false });

      // Chamar API de logout
      try {
        await axios.post('/api/auth/logout');
      } catch (err) {
        console.error('Erro ao fazer logout na API:', err);
      }

      router.push('/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  // Refresh Token
  const refreshToken = async () => {
    try {
      const response = await axios.post('/api/auth/refresh-token');
      const { accessToken } = response.data;

      // Armazenar o novo token no localStorage
      localStorage.setItem('accessToken', accessToken);

      return accessToken;
    } catch (err) {
      console.error('Erro ao atualizar token:', err);
      throw err;
    }
  };

  return {
    user: session?.user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
    error,
  };
}