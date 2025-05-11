'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import { authService } from '@/services/authService'

// Importar Lottie dinamicamente para evitar problemas de SSR
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [animationData, setAnimationData] = useState(null)
  const [isClient, setIsClient] = useState(false)
  
  const router = useRouter()

  // Verificar se já está autenticado
  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  // Carregar a animação do logotipo quando componente montar
  useEffect(() => {
    // Marcar que estamos no cliente
    setIsClient(true)
    
    // Carregar a animação
    fetch('/logo-g.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Falha ao buscar dados de animação');
        }
        return response.json();
      })
      .then(data => {
        setAnimationData(data);
      })
      .catch(error => {
        console.error("Erro ao carregar animação:", error);
      });
  }, []);

  interface LoginError {
    response?: {
      status: number;
      data?: {
        error?: {
          message?: string;
        };
      };
    };
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Usar o serviço de autenticação direta
      await authService.login(email, password);
      
      // Redirecionar para o dashboard em caso de sucesso
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      
      // Tratar diferentes tipos de erro
      const typedError = error as LoginError;
      if (typedError.response) {
        // Erro da API
        const status = typedError.response.status;
        
        if (status === 401) {
          setError('Credenciais inválidas. Verifique seu email e senha.');
        } else if (status === 400) {
          setError('Dados de login inválidos. Verifique as informações digitadas.');
        } else if (status === 404) {
          setError('Usuário não encontrado com este email.');
        } else if (status === 500) {
          setError('Erro no servidor. Por favor, tente novamente mais tarde.');
        } else {
          setError(`Erro ao fazer login: ${typedError.response.data?.error?.message || 'Tente novamente'}`);
        }
      } else {
        // Erro de rede ou outro
        setError('Falha ao conectar com o servidor. Verifique sua conexão.');
      }
    } finally {
      setIsLoading(false);
    }
  }
  
  // Variantes de animação para framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  }

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        delay: 0.2
      }
    }
  }

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97 }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md"
      >
        <motion.div
          variants={logoVariants}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center justify-center">
            {isClient && animationData ? (
              <Lottie 
                animationData={animationData} 
                loop={true}
                style={{ width: '150px', height: '150px' }}
                className="shadow-lg rounded-full"
              />
            ) : (
              <motion.div 
                className="h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <span className="text-white text-2xl font-bold">G</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Bem-vindo ao Sistema Globoo</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Faça login para acessar o painel</p>
        </motion.div>

        <Card className="shadow-xl border-none bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
          <CardHeader>
            <CardTitle className="text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-2"
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

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
                    className="pl-10 bg-gray-50 dark:bg-gray-700"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
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
                    className="pl-10 pr-10 bg-gray-50 dark:bg-gray-700"
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
        </Card>

        <motion.p 
          variants={itemVariants}
          className="text-center mt-6 text-gray-600 dark:text-gray-400 text-sm"
        >
          © {new Date().getFullYear()} Globoo.io Todos os direitos reservados.
        </motion.p>
      </motion.div>
    </div>
  )
}