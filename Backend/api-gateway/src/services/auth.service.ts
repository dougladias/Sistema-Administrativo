import { env } from '../config/env';
import httpClient from '../utils/http-client';

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
  return httpClient.post(`${env.AUTH_SERVICE_URL}/auth/login`, data);
}

export async function register(data: RegisterRequest) {
  return httpClient.post(`${env.AUTH_SERVICE_URL}/auth/register`, data);
}

export async function validateToken(token: string) {
  return httpClient.post(`${env.AUTH_SERVICE_URL}/auth/validate`, { token });
}

export async function refreshToken(token: string) {
  return httpClient.post(`${env.AUTH_SERVICE_URL}/auth/refresh`, { token });
}

export async function getUserProfile(userId: string) {
  return httpClient.get(`${env.AUTH_SERVICE_URL}/users/${userId}`);
}