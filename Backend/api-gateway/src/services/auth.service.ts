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

export async function login(data: LoginRequest) {
  const authServiceUrl = getServiceUrl('auth');
  return httpClient.post(`${authServiceUrl}/auth/login`, data);
}

export async function register(data: RegisterRequest) {
  const authServiceUrl = getServiceUrl('auth');
  return httpClient.post(`${authServiceUrl}/auth/register`, data);
}

export async function validateToken(token: string) {
  const authServiceUrl = getServiceUrl('auth');
  return httpClient.post(`${authServiceUrl}/auth/validate`, { token });
}

export async function refreshToken(token: string) {
  const authServiceUrl = getServiceUrl('auth');
  return httpClient.post(`${authServiceUrl}/auth/refresh`, { token });
}

export async function getUserProfile(userId: string) {
  const authServiceUrl = getServiceUrl('auth');
  return httpClient.get(`${authServiceUrl}/users/${userId}`);
}