import api from './api';

const authService = {
  // Login de usuário
  login: async (email: string, password: string) => {
    return api.post('/api/auth/login', { email, password });
  },

  // Registro de usuário
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    return api.post('/api/auth/register', userData);
  },

  // Logout de usuário
  logout: async () => {
    return api.post('/api/auth/logout');
  },

  // Obter usuário atual
  getCurrentUser: async () => {
    return api.get('/api/auth/me');
  },

  // Atualizar token
  refreshToken: async (refreshToken: string) => {
    return api.post('/api/auth/refresh-token', { refreshToken });
  },

  // Validar token
  validateToken: async (token: string) => {
    return api.post('/api/auth/validate-token', { token });
  }
};

export default authService;