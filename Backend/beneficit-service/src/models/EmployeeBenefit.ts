import mongoose, { Schema, Document, model, models } from "mongoose";
import { IBenefitType } from "./BenefitType";

// Interface para benefícios do funcionário
export interface IEmployeeBenefit extends Document {
  employeeId: mongoose.Types.ObjectId;
  benefitTypeId: mongoose.Types.ObjectId | IBenefitType;
  value: number;
  status: 'active' | 'inactive';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para Benefícios dos Funcionários
const EmployeeBenefitSchema: Schema = new Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    index: true // Adicionar índice para melhorar performance de consultas
  },
  benefitTypeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BenefitType', 
    required: true 
  },
  value: { 
    type: Number, 
    required: true,
    min: 0 
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true // Adicionar índice para melhorar performance de consultas
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: { 
    type: Date 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice composto para garantir restrição de unicidade (um funcionário não pode ter o mesmo benefício ativo duas vezes)
EmployeeBenefitSchema.index({ employeeId: 1, benefitTypeId: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: 'active' } 
});

// Método para converter documento para objeto de resposta
EmployeeBenefitSchema.methods.toResponse = function() {
  return {
    id: this._id,
    employeeId: this.employeeId,
    benefitTypeId: this.benefitTypeId,
    value: this.value,
    status: this.status,
    startDate: this.startDate,
    endDate: this.endDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Verificar se o modelo já existe para evitar redefinição
export const EmployeeBenefit = mongoose.models.EmployeeBenefit as mongoose.Model<IEmployeeBenefit> || 
  mongoose.model<IEmployeeBenefit>('EmployeeBenefit', EmployeeBenefitSchema);