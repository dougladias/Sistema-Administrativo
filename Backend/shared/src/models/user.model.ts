import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

// Enum para papéis de usuário
export enum UserRole {
  CEO = 'CEO',
  ADMIN = 'ADMIN',
  ASSISTENTE = 'ASSISTENTE'
}

// Enum para status de usuário
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  BLOCKED = 'blocked'
}

// Interface para o histórico de login
export interface ILoginHistory {
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  successful: boolean;
}

// Interface para refresh tokens
export interface IRefreshToken {
  token: string;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
}

// Interface para as permissões
export interface IPermission {
  name: string;
  description?: string;
}

// Interface para o documento User
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  refreshTokens: IRefreshToken[];
  loginHistory: ILoginHistory[];
  permissions?: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  comparePassword(candidatePassword: string): Promise<boolean>;
  addRefreshToken(token: string, expiryDays: number): Promise<void>;
  revokeRefreshToken(token: string): Promise<boolean>;
  hasPermission(permissionName: string): boolean;
}

// Schema do User
const UserSchema = new Schema<IUser>(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      required: true, 
      enum: Object.values(UserRole),
      default: UserRole.ASSISTENTE
    },
    status: { 
      type: String, 
      required: true, 
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE
    },
    refreshTokens: [
      {
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        createdAt: { type: Date, default: Date.now },
        isRevoked: { type: Boolean, default: false },
        revokedAt: { type: Date }
      }
    ],
    loginHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        ip: { type: String },
        userAgent: { type: String },
        successful: { type: Boolean, required: true }
      }
    ],
    permissions: [{ type: String }],
    lastLogin: { type: Date }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Middleware para criptografar a senha antes de salvar
UserSchema.pre<IUser>('save', async function(next) {
  // Somente criptografa a senha se foi modificada ou é nova
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar senha
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para adicionar refresh token
UserSchema.methods.addRefreshToken = async function(token: string, expiryDays: number = 7): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);
  
  this.refreshTokens.push({
    token,
    expiresAt,
    createdAt: new Date(),
    isRevoked: false
  });
  
  await this.save();
};

// Método para revogar refresh token
UserSchema.methods.revokeRefreshToken = async function(token: string): Promise<boolean> {
  const tokenObj = this.refreshTokens.find(
    (t: IRefreshToken) => t.token === token && !t.isRevoked
  );
  
  if (!tokenObj) return false;
  
  tokenObj.isRevoked = true;
  tokenObj.revokedAt = new Date();
  
  await this.save();
  return true;
};

// Método para verificar permissão
UserSchema.methods.hasPermission = function(permissionName: string): boolean {
  if (!this.permissions) return false;
  return this.permissions.includes(permissionName);
};

// Criar índices
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ 'refreshTokens.token': 1 });

// Função para criar o modelo User
export const createUserModel = () => {
  return mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
};

// Exportar o modelo e o schema
export default createUserModel;
export { UserSchema };