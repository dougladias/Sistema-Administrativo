import { z } from 'zod';

// Schema base para validação de entradas/saídas
export const EntrySchema = z.object({
  entryTime: z.date().optional(),
  leaveTime: z.date().optional(),
  absent: z.boolean().optional().default(false),
  date: z.date().optional().default(() => new Date()),
  createdAt: z.date().optional().default(() => new Date()),
});

// Schema base para validação de arquivos
export const FileSchema = z.object({
  filename: z.string(),
  originalName: z.string(),
  mimetype: z.string(),
  size: z.number(),
  path: z.string(),
  uploadDate: z.date().default(() => new Date()),
  description: z.string().optional(),
  category: z.string().optional(),
});

// Enums utilizados nos schemas
export const ContractTypeEnum = z.enum(['CLT', 'PJ']);
export const StatusEnum = z.enum(['active', 'inactive', 'other']);

// Schema base para criação de Worker
export const WorkerCreateSchema = z.object({
  name: z.string().min(3).max(100),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve conter 11 dígitos numéricos'),
  nascimento: z.preprocess((arg) => {
    if (typeof arg === 'string') {
      const date = new Date(arg);
      if (isNaN(date.getTime())) {
        throw new Error('Formato de data inválido para nascimento');
      }
      return date;
    }
    return arg;
  }, z.date()),
  admissao: z.preprocess((arg) => {
    if (typeof arg === 'string') {
      const date = new Date(arg);
      if (isNaN(date.getTime())) {
        throw new Error('Formato de data inválido para admissao');
      }
      return date;
    }
    return arg;
  }, z.date()),
  salario: z.string(),
  ajuda: z.string().optional(),
  numero: z.string(),
  email: z.string().email('Email inválido'),
  address: z.string(),
  contract: ContractTypeEnum,
  role: z.string(),
  department: z.string().default('Geral'),
  status: StatusEnum.optional().default('active'),
  logs: z.array(EntrySchema).optional().default([]),
  files: z.array(FileSchema).optional().default([]),
});

// Schema para atualização de Worker (todos os campos são opcionais)
export const WorkerUpdateSchema = WorkerCreateSchema.partial();

// Schema para filtros de busca de Worker
export const WorkerFilterSchema = z.object({
  name: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  status: StatusEnum.optional(),
  contract: ContractTypeEnum.optional(),
}).partial();

// Tipos inferidos dos schemas
export type WorkerCreate = z.infer<typeof WorkerCreateSchema>;
export type WorkerUpdate = z.infer<typeof WorkerUpdateSchema>;
export type WorkerFilter = z.infer<typeof WorkerFilterSchema>;
export type Entry = z.infer<typeof EntrySchema>;
export type File = z.infer<typeof FileSchema>;

// Função para validar dados de criação
export function validateWorkerCreate(data: unknown): WorkerCreate {
  return WorkerCreateSchema.parse(data);
}

// Função para validar dados de atualização
export function validateWorkerUpdate(data: unknown): WorkerUpdate {
  return WorkerUpdateSchema.parse(data);
}

// Função para validar filtros
export function validateWorkerFilter(data: unknown): WorkerFilter {
  return WorkerFilterSchema.parse(data);
}