import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { User, UserRole } from "next-auth";
import axios, { AxiosError } from 'axios';


// URL direta do serviço de autenticação para debug
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3005/api/auth';

// Interface para o usuário autenticado
interface CustomUser extends User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
}

// Estender o tipo JWT para incluir role e token
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
    accessToken?: string;
    refreshToken?: string;
  }
}

// Estender o tipo Session para incluir role e token
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      email: string;
      name: string;
      role: UserRole;
    }
    accessToken?: string;
  }
  
  type UserRole = 'CEO' | 'ADMIN' | 'ASSISTENTE';
  
  interface User {
    role: UserRole;
    accessToken?: string;
    refreshToken?: string;
  }
}

// Configuração do NextAuth
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.email || !credentials?.password) {
          console.log("Credenciais incompletas");
          return null;
        }

        try {
          console.log(`Tentando autenticar com ${AUTH_SERVICE_URL}/api/auth/login`);
          
          // Para debug, tente primeiramente o serviço direto
          const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
            email: credentials.email,
            password: credentials.password
          });
          
          console.log('Resposta da autenticação:', response.data);
          
          const data = response.data;
          
          if (data.tokens && data.user) {
            // Para debug
            console.log('Tokens recebidos:', data.tokens);
            console.log('Dados do usuário:', data.user);
            
            // Salvar o refreshToken em um cookie
            if (typeof window !== 'undefined') {
              document.cookie = `refreshToken=${data.tokens.refreshToken}; path=/; secure; samesite=strict; max-age=604800`; // 7 dias
            }
            
            // Mapear o papel do usuário para o formato NextAuth
            const userRole = mapRoleFromBackend(data.user.role);
            
            return {
              id: data.user.id || data.user._id,
              email: data.user.email,
              name: data.user.name || data.user.email,
              role: userRole,
              accessToken: data.tokens.accessToken,
              refreshToken: data.tokens.refreshToken
            } as CustomUser;
          } else {
            console.log('Resposta não contém tokens ou dados de usuário:', data);
            return null;
          }
        } catch (error: unknown) {
          const axiosError = error as AxiosError;
          console.error('Erro na autenticação:', axiosError.message);
          
          // Log detalhado de erros para debug
          if (axiosError.response) {
            console.error('Status do erro:', axiosError.response.status);
            console.error('Dados do erro:', axiosError.response.data);
            console.error('Headers do erro:', axiosError.response.headers);
          } else if (axiosError.request) {
            console.error('Requisição sem resposta:', axiosError.request);
          } else {
            console.error('Erro durante a configuração da requisição:', axiosError.message);
          }
          
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role as UserRole;
        session.accessToken = token.accessToken;
        // Não expor o refreshToken na sessão
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || "sua_chave_secreta_muito_longa_e_complexa_aqui",
});

// Função auxiliar para mapear as roles do backend para o frontend
function mapRoleFromBackend(role: string | string[]): UserRole {
  if (Array.isArray(role)) {
    if (role.includes('CEO')) return 'CEO';
    if (role.includes('ADMIN')) return 'ADMIN';
    return 'ASSISTENTE';
  }
  
  switch(role) {
    case 'CEO':
      return 'CEO';
    case 'ADMIN':
      return 'ADMIN';
    default:
      return 'ASSISTENTE';
  }
}

export { handler as GET, handler as POST }