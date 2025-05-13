import mongoose from 'mongoose';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import { createDocumentModel, IDocument } from '../../../shared/src/models/document.model';
import { DocumentCategory, DocumentStatus, DocumentCreateSchema, DocumentUpdateSchema, DocumentFilterSchema } from '../../../shared/src/schemas/document.schema';
import { DocumentCreateDTO, DocumentUpdateDTO, DocumentFilterDTO, DocumentFilterResultDTO } from '../dto/document.dto';
import { ApiError } from '../../../shared/src/utils/apiError';
import { createLogger } from '../../../shared/src/utils/logger';

// Transformar fs.readFile em Promise
const readFile = promisify(fs.readFile);

// Inicializar o logger
const logger = createLogger({ 
  serviceName: 'document-service',
  customMetadata: { module: 'document-service' }
});

// Inicializar o modelo Document
const Document = createDocumentModel();

class DocumentService {
  // Criar novo documento
  async create(data: DocumentCreateDTO, file: Express.Multer.File, userId: string): Promise<IDocument> {
    try {
      // Validar dados usando schema compartilhado
      DocumentCreateSchema.parse(data);
      
      // Criar o documento com o conteúdo do arquivo
      // Com multer.memoryStorage(), file.buffer já contém os dados
      const document = new Document({
        ...data,
        uploadedBy: userId,
        fileName: file.originalname.replace(/\s+/g, '_'),
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileContent: file.buffer,
        status: DocumentStatus.PENDENTE
      });
      
      await document.save();
      
      return document;
    } catch (error) {
      logger.error('Erro no serviço ao criar documento:', error);
      throw error;
    }
  }
  
  // Buscar todos os documentos com filtros, paginação e ordenação
  async findAll(filters: DocumentFilterDTO): Promise<DocumentFilterResultDTO> {
    try {
      // Validar filtros usando schema compartilhado
      DocumentFilterSchema.parse(filters);
      
      const {
        search,
        category,
        status,
        workerId,
        departmentId,
        uploadedBy,
        startDate,
        endDate,
        tags,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;
      
      // Construir a query baseada nos filtros
      const query: Record<string, any> = {};
      
      // Filtro por texto (busca em título, descrição e tags)
      if (search) {
        query.$text = { $search: search };
      }
      
      // Filtros específicos
      if (category) query.category = category;
      if (status) query.status = status;
      if (workerId) query.workerId = workerId;
      if (departmentId) query.departmentId = departmentId;
      if (uploadedBy) query.uploadedBy = uploadedBy;
      if (tags && tags.length > 0) query.tags = { $in: tags };
      
      // Filtro por data de criação
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      // Calcular número de documentos a pular para a paginação
      const skip = (page - 1) * limit;
      
      // Opções de ordenação
      const sort: { [key: string]: 1 | -1 } = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      // Executar a consulta de contagem
      const totalDocuments = await Document.countDocuments(query);
      
      // Executar a consulta principal com paginação e ordenação
      const documents = await Document.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .populate([
          { path: 'uploadedBy', select: 'name email role' },
          { path: 'workerId', select: 'name cpf department' },
          { path: 'departmentId', select: 'name' }
        ]);
      
      // Calcular informações de paginação
      const totalPages = Math.ceil(totalDocuments / limit);
      const nextPage = page < totalPages ? page + 1 : null;
      const prevPage = page > 1 ? page - 1 : null;
      
      return {
        data: documents,
        total: totalDocuments,
        page,
        limit,
        totalPages,
        nextPage,
        prevPage
      };
    } catch (error) {
      logger.error('Erro no serviço ao buscar documentos:', error);
      throw error;
    }
  }
  
  // Buscar documento por ID
  async findById(id: string): Promise<IDocument | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ApiError.badRequest('ID inválido');
      }
      
      const document = await Document.findById(id).populate([
        { path: 'uploadedBy', select: 'name email role' },
        { path: 'workerId', select: 'name cpf department' },
        { path: 'departmentId', select: 'name' }
      ]);
      
      return document;
    } catch (error) {
      logger.error(`Erro no serviço ao buscar documento ID ${id}:`, error);
      throw error;
    }
  }
  
  // Atualizar documento
  async update(id: string, data: DocumentUpdateDTO): Promise<IDocument | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ApiError.badRequest('ID inválido');
      }
      
      // Validar dados usando schema compartilhado
      DocumentUpdateSchema.parse(data);
      
      const updatedDocument = await Document.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );
      
      return updatedDocument;
    } catch (error) {
      logger.error(`Erro no serviço ao atualizar documento ID ${id}:`, error);
      throw error;
    }
  }
  
  // Excluir documento
  async delete(id: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ApiError.badRequest('ID inválido');
      }
      
      const document = await Document.findById(id);
      
      if (!document) {
        return false;
      }
      
      // Excluir o documento do banco de dados
      await Document.findByIdAndDelete(id);
      
      logger.info(`Documento ID ${id} excluído com sucesso`);
      return true;
    } catch (error) {
      logger.error(`Erro no serviço ao excluir documento ID ${id}:`, error);
      throw error;
    }
  }
  
  // Obter arquivo físico do documento
  async getFile(id: string): Promise<{ fileContent: Buffer; fileName: string; mimeType: string } | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ApiError.badRequest('ID inválido');
      }
      
      const document = await Document.findById(id);
      
      if (!document) {
        return null;
      }
      
      return {
        fileContent: document.fileContent,
        fileName: document.originalName,
        mimeType: document.mimeType
      };
    } catch (error) {
      logger.error(`Erro no serviço ao obter arquivo do documento ID ${id}:`, error);
      throw error;
    }
  }
  
  // Atualizar status do documento
  async updateStatus(id: string, status: DocumentStatus): Promise<IDocument | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ApiError.badRequest('ID inválido');
      }
      
      const updatedDocument = await Document.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true }
      );
      
      return updatedDocument;
    } catch (error) {
      logger.error(`Erro no serviço ao atualizar status do documento ID ${id}:`, error);
      throw error;
    }
  }
  
  // Buscar documentos por funcionário
  async findByWorker(workerId: string, filters: DocumentFilterDTO): Promise<DocumentFilterResultDTO> {
    try {
      if (!mongoose.Types.ObjectId.isValid(workerId)) {
        throw ApiError.badRequest('ID do funcionário inválido');
      }
      
      // Adicionar o workerId aos filtros e chamar o método findAll
      return await this.findAll({
        ...filters,
        workerId
      });
    } catch (error) {
      logger.error(`Erro no serviço ao buscar documentos do funcionário ID ${workerId}:`, error);
      throw error;
    }
  }
  
  // Buscar documentos por departamento
  async findByDepartment(departmentId: string, filters: DocumentFilterDTO): Promise<DocumentFilterResultDTO> {
    try {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        throw ApiError.badRequest('ID do departamento inválido');
      }
      
      // Adicionar o departmentId aos filtros e chamar o método findAll
      return await this.findAll({
        ...filters,
        departmentId
      });
    } catch (error) {
      logger.error(`Erro no serviço ao buscar documentos do departamento ID ${departmentId}:`, error);
      throw error;
    }
  }
  
  // Buscar documentos por categoria
  async findByCategory(category: string, filters: DocumentFilterDTO): Promise<DocumentFilterResultDTO> {
    try {
      // Validar categoria
      if (!Object.values(DocumentCategory).includes(category as DocumentCategory)) {
        throw ApiError.badRequest('Categoria inválida');
      }
      
      // Adicionar a categoria aos filtros e chamar o método findAll
      return await this.findAll({
        ...filters,
        category: category as DocumentCategory
      });
    } catch (error) {
      logger.error(`Erro no serviço ao buscar documentos da categoria ${category}:`, error);
      throw error;
    }
  }
  
  // Buscar documentos expirados ou prestes a expirar
  async findExpiring(daysToExpire: number): Promise<IDocument[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysToExpire);
      
      const documents = await Document.find({
        expirationDate: { $ne: null, $lte: futureDate, $gte: today }
      })
      .populate([
        { path: 'uploadedBy', select: 'name email role' },
        { path: 'workerId', select: 'name cpf department' },
        { path: 'departmentId', select: 'name' }
      ])
      .sort({ expirationDate: 1 });
      
      return documents;
    } catch (error) {
      logger.error(`Erro no serviço ao buscar documentos expirando em ${daysToExpire} dias:`, error);
      throw error;
    }
  }
  
  // Buscar estatísticas por categoria
  async getDocumentStats() {
    try {
      const stats = await Document.aggregate([
        { 
          $group: { 
            _id: "$category", 
            count: { $sum: 1 }
          } 
        },
        { $sort: { _id: 1 } },
        { 
          $project: { 
            category: "$_id", 
            count: 1, 
            _id: 0 
          } 
        }
      ]);
      
      return stats;
    } catch (error) {
      logger.error('Erro no serviço ao buscar estatísticas de documentos:', error);
      throw error;
    }
  }
}

export default new DocumentService();