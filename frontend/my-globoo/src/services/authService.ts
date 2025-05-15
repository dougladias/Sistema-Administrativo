import api from './api';

const authService = {
  // Login de usuário
  login: async (email: string, password: string) => {
    return api.post('/auth/login', { email, password });
  },

  // Registro de usuário
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    return api.post('/auth/register', userData);
  },

  // Logout de usuário
  logout: async (refreshToken: string) => {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (err) {
      console.error('Erro ao fazer logout na API:', err);
      throw err;
    }
  },

  // Atualizar token
  refreshToken: async (refreshToken: string) => {
    return api.post('/auth/refresh-token', { refreshToken });
  },
};

export default authService;