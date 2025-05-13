import mongoose, { Schema, Document } from "mongoose";

// Interface para o tipo de benefício
export interface IBenefitType extends Document {
  name: string;
  description: string;
  hasDiscount: boolean;
  discountPercentage?: number;
  defaultValue: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Schema para Tipos de Benefícios
const BenefitTypeSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  hasDiscount: { 
    type: Boolean, 
    default: false 
  },
  discountPercentage: { 
    type: Number,
    min: [0, 'Discount percentage must be at least 0'],
    max: [100, 'Discount percentage cannot exceed 100'],
    validate: {
      validator: function(this: IBenefitType, v: number | undefined) {
        return !this.hasDiscount || (v !== undefined && v >= 0 && v <= 100);
      },
      message: 'Discount percentage is required when hasDiscount is true and must be between 0 and 100'
    }
  },
  defaultValue: { 
    type: Number, 
    required: [true, 'Default value is required'],
    min: [0, 'Default value must be a positive number']
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: 'Status must be either active or inactive'
    },
    default: 'active'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para melhorar a performance das consultas
BenefitTypeSchema.index({ name: 1 }, { unique: true });
BenefitTypeSchema.index({ status: 1 });

// Verificar se o modelo já existe para evitar redefinição
export const BenefitType = mongoose.models.BenefitType as mongoose.Model<IBenefitType> || 
  mongoose.model<IBenefitType>('BenefitType', BenefitTypeSchema);