// frontend/my-globoo/src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from 'axios';

// URL do API Gateway (sem o /api)
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3005';

// Tipos para o NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name: string;
      email: string;
      role: string;
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    accessToken: string;
    refreshToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

// Criar o handler NextAuth
const handler = NextAuth({
  // Configurar os provedores (apenas credentials neste caso)
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Verificar se as credenciais estão presentes
          if (!credentials?.email || !credentials?.password) {
            console.log("Credenciais incompletas");
            return null;
          }

          // URL para o endpoint de login
          const loginUrl = `${API_GATEWAY_URL}/api/auth/login`;
          console.log(`Fazendo login em: ${loginUrl}`);
          
          // Chamar a API de login
          const response = await axios.post(loginUrl, {
            email: credentials.email,
            password: credentials.password
          });
          
          // Verificar se a resposta contém os dados necessários
          const data = response.data;
          console.log("Resposta do login:", JSON.stringify(data).substring(0, 200) + "...");
          
          if (!data || !data.tokens || !data.user) {
            console.log("Resposta não contém tokens ou dados do usuário");
            return null;
          }
          
          // Retornar o usuário autenticado
          return {
            id: data.user.id || data.user._id,
            name: data.user.name || "Usuário",
            email: data.user.email,
            role: data.user.role || "ASSISTENTE",
            accessToken: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken
          };
        } catch (error) {
          console.error("Erro na autenticação:", error);
          return null;
        }
      }
    })
  ],
  
  // Configurar callbacks para gerenciar JWT e sessão
  callbacks: {
    // Callback para JWT - chamado quando um token JWT é criado/atualizado
    async jwt({ token, user }) {
      // Adicionar dados do usuário ao token após autenticação bem-sucedida
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    
    // Callback para Session - chamado toda vez que uma sessão é checada
    async session({ session, token }) {
      // Transferir dados relevantes do token para a sessão
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name || "Usuário";
        session.user.email = token.email || "exemplo@email.com";
        session.user.role = token.role || "ASSISTENTE";
        session.accessToken = token.accessToken;
      }
      return session;
    }
  },
  
  // Configurar páginas personalizadas
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    signOut: '/auth/logout'
  },
  
  // Configurar sessão
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // 12 horas
  },
  
  // Segredo para criptografar os tokens
  secret: process.env.NEXTAUTH_SECRET,
  
  // Debug em desenvolvimento
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };