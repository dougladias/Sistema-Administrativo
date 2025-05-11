
// Papéis de usuário no sistema
export enum UserRole {
  ADMIN = 'admin',
  HR = 'hr',
  WORKER = 'worker',
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

// Requisição de login
export interface LoginRequest {
  email: string;
  password: string;
}

// Resposta de login
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number; // Segundos
}

// Requisição de refresh token
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Alteração de senha
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}


// Tipos relacionados a workers
// Status do worker
export enum WorkerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
  PENDING = 'pending',
}

// Departamento
export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
}

// Cargo
export interface Position {
  id: string;
  name: string;
  description?: string;
  department?: string;
  level?: number;
}

// Endereço
export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Contato
export interface Contact {
  phone: string;
  email: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

// Dados bancários
export interface BankInfo {
  bankName: string;
  accountType: 'checking' | 'savings';
  accountNumber: string;
  branchNumber: string;
  accountHolderName: string;
}

// Worker completo
export interface Worker {
  id: string;
  userId: string;
  name: string;
  cpf: string;
  rg?: string;
  birthDate: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'other';
  nationality?: string;
  address: Address;
  contact: Contact;
  bankInfo?: BankInfo;
  departmentId: string;
  department?: Department;
  positionId: string;
  position?: Position;
  startDate: Date;
  endDate?: Date;
  salary: number;
  workload?: number; // Horas por semana
  contractType?: 'clt' | 'pj' | 'internship' | 'temporary';
  status: WorkerStatus;
  benefits?: string[] | Benefit[];
  documents?: string[] | Document[];
  managerId?: string;
  manager?: Worker;
  directReports?: Worker[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Worker simplificado (para listagens)
export interface WorkerSummary {
  id: string;
  name: string;
  department: string;
  position: string;
  status: WorkerStatus;
}

// Requisição de criação de worker
export interface CreateWorkerRequest {
  name: string;
  email: string;
  cpf: string;
  birthDate: string; // YYYY-MM-DD
  address: Address;
  contact: Contact;
  departmentId: string;
  positionId: string;
  startDate: string; // YYYY-MM-DD
  salary: number;
  contractType?: 'clt' | 'pj' | 'internship' | 'temporary';
  [key: string]: any; // Campos adicionais
}

//Tipos relacionados a benefícios
// Tipo de benefício
export enum BenefitType {
  HEALTH = 'health',
  DENTAL = 'dental',
  TRANSPORTATION = 'transportation',
  MEAL = 'meal',
  FOOD = 'food',
  GYM = 'gym',
  EDUCATION = 'education',
  CHILDCARE = 'childcare',
  RETIREMENT = 'retirement',
  OTHER = 'other',
}

// Status do benefício
export enum BenefitStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  EXPIRED = 'expired',
}

// Benefício
export interface Benefit {
  id: string;
  name: string;
  description: string;
  type: BenefitType;
  value: number;
  provider: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Benefício atribuído a um worker
export interface WorkerBenefit {
  id: string;
  workerId: string;
  benefitId: string;
  benefit?: Benefit;
  startDate: Date;
  endDate?: Date;
  status: BenefitStatus;
  notes?: string;
  registeredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Requisição para criar benefício
export interface CreateBenefitRequest {
  name: string;
  description: string;
  type: BenefitType;
  value: number;
  provider: string;
  active?: boolean;
}

// Requisição para atribuir benefício
export interface AssignBenefitRequest {
  workerId: string;
  benefitId: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  notes?: string;
}


// Tipos relacionados a documentos
// Tipo de documento
export enum DocumentType {
  CONTRACT = 'contract',
  ID = 'id',
  CPF = 'cpf',
  ADDRESS_PROOF = 'address_proof',
  DIPLOMA = 'diploma',
  CERTIFICATE = 'certificate',
  PAYSLIP = 'payslip',
  PERFORMANCE_REVIEW = 'performance_review',
  MEDICAL_CERTIFICATE = 'medical_certificate',
  OTHER = 'other',
}

// Status de validação do documento
export enum DocumentValidationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

// Documento
export interface Document {
  id: string;
  workerId?: string;
  type: DocumentType;
  name: string;
  description?: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  isValidated: boolean;
  validationStatus?: DocumentValidationStatus;
  validatedBy?: string;
  validatedAt?: Date;
  expiresAt?: Date;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Requisição de criação de documento
export interface CreateDocumentRequest {
  workerId?: string;
  type: DocumentType;
  name: string;
  description?: string;
  expiresAt?: string; // YYYY-MM-DD
  tags?: string[];
}

// Requisição de validação de documento
export interface ValidateDocumentRequest {
  status: DocumentValidationStatus;
  notes?: string;
}


// Tipos de serviços e registros
// Informação de serviço para service registry
export interface ServiceInfo {
  id: string;
  name: string;
  url: string;
  healthCheck: string;
  isActive: boolean;
  lastCheck: Date;
  version?: string;
  metadata?: Record<string, any>;
}

// Estatísticas de serviço
export interface ServiceStats {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastRequestTime?: Date;
  uptime: number; // em segundos
}

// Tipos relacionados a APIs e requisições
// Paginação
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Parâmetros de filtro
export interface FilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
  position?: string;
  [key: string]: any; // Outros filtros
}

// Resposta paginada
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Resposta de sucesso genérica
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

// Resposta de erro
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId?: string;
}

// Códigos de erro
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATA_ACCESS_ERROR = 'DATA_ACCESS_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

// Níveis de log
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

// Entrada de log
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  requestId?: string;
  metadata?: Record<string, any>;
}

// Tipos relacionados à segurança
// Tipos de eventos de segurança
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  ACCESS_DENIED = 'access_denied',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

// Evento de segurança
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip: string;
  userAgent?: string;
  timestamp: Date;
  details?: Record<string, any>;
}

// API Key
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdBy: string;
  expiresAt?: Date;
  lastUsed?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para testes e monitoramento
// Saúde do sistema
export interface SystemHealth {
  status: 'ok' | 'degraded' | 'down';
  uptime: number; // em segundos
  services: {
    [key: string]: {
      status: 'ok' | 'degraded' | 'down';
      message?: string;
    };
  };
  timestamp: Date;
}

// Métricas do sistema
export interface SystemMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  cpu: number; // porcentagem
  memory: number; // porcentagem
  activeConnections: number;
  services: {
    [key: string]: {
      requestsPerMinute: number;
      averageResponseTime: number;
      errorRate: number;
    };
  };
  timestamp: Date;
}

// Alerta
export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  source: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}


// Tipos de namespace e extensões
import * as winston from 'winston';

// Estender a interface Request do Express para incluir atributos personalizados
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      logger?: winston.Logger;
      startTime?: number;
      user?: {
        id: string;
        email: string;
        role: string;
      };
      isAdmin?: boolean;
    }
  }
}

// Tipos de configuração
// Configuração do ambiente
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  AUTH_SERVICE_URL: string;
  WORKER_SERVICE_URL: string;
  BENEFIT_SERVICE_URL: string;
  DOCUMENT_SERVICE_URL: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
  APP_NAME: string;
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;
  API_KEY?: string;
  [key: string]: any;
}