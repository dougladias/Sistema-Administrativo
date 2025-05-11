'use client'

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { z } from 'zod';

// Schema para validação
const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(50, 'Senha muito longa')
});

// Tipos de erro
type FormErrors = {
  email?: string;
  password?: string;
};

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  // Validar formulário
  const validateForm = () => {
    try {
      loginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as 'email' | 'password'] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Lidar com o login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    // Validar formulário
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      });

      if (result?.error) {
        setGeneralError('Credenciais inválidas. Verifique seu email e senha.');
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setGeneralError('Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.');
      setIsLoading(false);
    }
  };

  // Variantes para animações
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  // Variante para botão
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97 }
  };

  return (
    <CardContent className="pt-6">
      <form onSubmit={handleLogin} className="space-y-5">
        <AnimatePresence>
          {generalError && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{generalError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemVariants}>
          <label htmlFor="email" className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
            E-mail
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-10 bg-gray-50 dark:bg-gray-700 ${errors.email ? 'border-red-500 dark:border-red-500' : ''}`}
              placeholder="seu@email.com"
              required
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor="password" className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
            Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pl-10 pr-10 bg-gray-50 dark:bg-gray-700 ${errors.password ? 'border-red-500 dark:border-red-500' : ''}`}
              placeholder="••••••••"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
              >
                {showPassword ? 
                  <EyeOff className="w-5 h-5" /> : 
                  <Eye className="w-5 h-5" />
                }
              </button>
            </div>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-end">
          <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Esqueceu a senha?
          </a>
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.div
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            <Button 
              type="submit" 
              className="w-full bg-cyan-400 hover:bg-cyan-500 text-white py-3 rounded-lg transition-all duration-200 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Autenticando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </motion.div>
        </motion.div>
      </form>
    </CardContent>
  );
}