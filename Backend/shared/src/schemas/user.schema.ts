import { z } from 'zod';
import { UserRole, UserStatus } from '../models/user.model';

// Enum para validação de papéis
export const UserRoleEnum = z.enum([
  UserRole.CEO,
  UserRole.ADMIN,
  UserRole.ASSISTENTE
]);

// Enum para validação de status
export const UserStatusEnum = z.enum([
  UserStatus.ACTIVE,
  UserStatus.INACTIVE,
  UserStatus.PENDING,
  UserStatus.BLOCKED
]);

// Schema para refresh token
export const RefreshTokenSchema = z.object({
  token: z.string(),
  expiresAt: z.date(),
  createdAt: z.date().default(() => new Date()),
  isRevoked: z.boolean().default(false),
  revokedAt: z.date().optional()
});

// Schema para histórico de login
export const LoginHistorySchema = z.object({
  timestamp: z.date().default(() => new Date()),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  successful: z.boolean()
});

// Schema base para criação de User
export const UserCreateSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role: UserRoleEnum.default(UserRole.ASSISTENTE),
  status: UserStatusEnum.default(UserStatus.ACTIVE),
  permissions: z.array(z.string()).optional().default([]),
  refreshTokens: z.array(RefreshTokenSchema).optional().default([]),
  loginHistory: z.array(LoginHistorySchema).optional().default([]),
  lastLogin: z.date().optional()
});

// Schema para atualização de User (todos os campos são opcionais)
export const UserUpdateSchema = UserCreateSchema.partial().omit({ password: true });

// Schema para atualização de senha
export const PasswordUpdateSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
});

// Schema para login
export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
});

// Schema para refresh token
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string()
});

// Schema para filtros de busca de User
export const UserFilterSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  role: UserRoleEnum.optional(),
  status: UserStatusEnum.optional()
}).partial();

// Tipos inferidos dos schemas
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type PasswordUpdate = z.infer<typeof PasswordUpdateSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type UserFilter = z.infer<typeof UserFilterSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;
export type LoginHistory = z.infer<typeof LoginHistorySchema>;

// Função para validar dados de criação
export function validateUserCreate(data: unknown): UserCreate {
  return UserCreateSchema.parse(data);
}

// Função para validar dados de atualização
export function validateUserUpdate(data: unknown): UserUpdate {
  return UserUpdateSchema.parse(data);
}

// Função para validar atualização de senha
export function validatePasswordUpdate(data: unknown): PasswordUpdate {
  return PasswordUpdateSchema.parse(data);
}

// Função para validar request de login
export function validateLogin(data: unknown): LoginRequest {
  return LoginSchema.parse(data);
}

// Função para validar refresh token request
export function validateRefreshToken(data: unknown): RefreshTokenRequest {
  return RefreshTokenRequestSchema.parse(data);
}

// Função para validar filtros
export function validateUserFilter(data: unknown): UserFilter {
  return UserFilterSchema.parse(data);
}