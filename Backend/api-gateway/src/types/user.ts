// Papéis de usuário no sistema
export enum UserRole {
  ADMIN = 'admin',
  HR = 'hr',
  WORKER = 'worker',
  CEO = 'CEO', // Adicionado com base no uso em document.routes.ts
}

// Status do usuário
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  BLOCKED = 'blocked',
}

// Interface de usuário
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Payload JWT armazenado no token
export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}