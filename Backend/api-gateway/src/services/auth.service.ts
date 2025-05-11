import { env } from '../config/env';
import httpClient from '../utils/http-client';
import { getServiceUrl } from './service-registry';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Função para obter o URL do serviço de autenticação
export async function login(data: LoginRequest) {
  const authServiceUrl = getServiceUrl('auth');
  return httpClient.post(`${authServiceUrl}/auth/login`, data);
}

// Função para registrar um novo usuário
export async function register(data: RegisterRequest) {
  const authServiceUrl = getServiceUrl('auth');
  return httpClient.post(`${authServiceUrl}/auth/register`, data);
}

// Função para validar o token JWT
export async function validateToken(token: string) {
  const authServiceUrl = getServiceUrl('auth');
  return httpClient.post(`${authServiceUrl}/auth/validate`, { token });
}

// Função para atualizar o token JWT
export async function refreshToken(token: string) {
  const authServiceUrl = getServiceUrl('auth');
  return httpClient.post(`${authServiceUrl}/auth/refresh`, { token });
}

// Função para obter o perfil do usuário
export async function getUserProfile(userId: string) {
  const authServiceUrl = getServiceUrl('auth');
  return httpClient.get(`${authServiceUrl}/users/${userId}`);
}