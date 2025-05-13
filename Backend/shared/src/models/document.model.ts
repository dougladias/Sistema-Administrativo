import mongoose, { Schema, Document } from 'mongoose';
import { DocumentCategory, DocumentStatus } from '../schemas/document.schema';

// Interface para o documento Document
export interface IDocument extends Document {
  title: string;
  description?: string;
  category: DocumentCategory;
  status: DocumentStatus;
  workerId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  fileName: string;
  originalName: string;
  filePath?: string; // Opcional agora
  fileSize: number;
  mimeType: string;
  fileContent: Buffer; // Novo campo para armazenar o conteúdo do arquivo
  tags?: string[];
  metaData?: Record<string, any>;
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema do Document
const DocumentSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    category: {
      type: String,
      enum: Object.values(DocumentCategory),
      default: DocumentCategory.OUTROS,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.PENDENTE,
      required: true
    },
    workerId: {
      type: Schema.Types.ObjectId,
      ref: 'Worker'
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department'
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    filePath: {
      type: String
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    fileContent: {
      type: Buffer,
      required: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    metaData: {
      type: Schema.Types.Mixed
    },
    expirationDate: {
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Índices para melhorar a performance de consultas
DocumentSchema.index({ title: 'text', description: 'text', tags: 'text' });
DocumentSchema.index({ category: 1 });
DocumentSchema.index({ status: 1 });
DocumentSchema.index({ workerId: 1 });
DocumentSchema.index({ departmentId: 1 });
DocumentSchema.index({ uploadedBy: 1 });
DocumentSchema.index({ createdAt: -1 });

// Função para criar o modelo Document
export const createDocumentModel = () => {
  return mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);
};

// Exportar o modelo e o schema
export default createDocumentModel;
export { DocumentSchema };