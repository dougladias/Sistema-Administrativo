import { BenefitType, IBenefitType } from '../models/BenefitType';
import ApiError from '../utils/apiError';
import logger from '../config/logger';
import mongoose from 'mongoose';

class BenefitTypeService {
  /**
   * Obter todos os tipos de benefícios
   */
  async getAllBenefitTypes(filter: { status?: 'active' | 'inactive' } = {}) {
    try {
      const benefitTypes = await BenefitType.find(filter).sort({ name: 1 });
      return benefitTypes;
    } catch (error) {
      logger.error('Error getting benefit types:', error);
      throw new ApiError('Failed to get benefit types', 500);
    }
  }

  /**
   * Obter um tipo de benefício por ID
   */
  async getBenefitTypeById(id: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError('Invalid benefit type ID', 400);
      }

      const benefitType = await BenefitType.findById(id);
      
      if (!benefitType) {
        throw new ApiError('Benefit type not found', 404);
      }
      
      return benefitType;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error getting benefit type by id:', error);
      throw new ApiError('Failed to get benefit type', 500);
    }
  }

  /**
   * Criar um novo tipo de benefício
   */
  async createBenefitType(data: Partial<IBenefitType>) {
    try {
      // Verificar se já existe um tipo com o mesmo nome
      const existingType = await BenefitType.findOne({ name: data.name });
      if (existingType) {
        throw new ApiError('A benefit type with this name already exists', 409);
      }

      // Criar o novo tipo de benefício
      const benefitType = new BenefitType(data);
      await benefitType.save();
      
      return benefitType;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof mongoose.Error.ValidationError) {
        const message = Object.values(error.errors)
          .map(err => err.message)
          .join(', ');
        throw new ApiError(message, 400);
      }
      logger.error('Error creating benefit type:', error);
      throw new ApiError('Failed to create benefit type', 500);
    }
  }

  /**
   * Atualizar um tipo de benefício existente
   */
  async updateBenefitType(id: string, data: Partial<IBenefitType>) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError('Invalid benefit type ID', 400);
      }

      // Verificar se o tipo de benefício existe
      const benefitType = await BenefitType.findById(id);
      if (!benefitType) {
        throw new ApiError('Benefit type not found', 404);
      }

      // Se o nome estiver sendo atualizado, verificar se já existe outro com este nome
      if (data.name && data.name !== benefitType.name) {
        const existingType = await BenefitType.findOne({ name: data.name });
        if (existingType) {
          throw new ApiError('A benefit type with this name already exists', 409);
        }
      }

      // Atualizar o tipo de benefício
      const updatedBenefitType = await BenefitType.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );
      
      return updatedBenefitType;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof mongoose.Error.ValidationError) {
        const message = Object.values(error.errors)
          .map(err => err.message)
          .join(', ');
        throw new ApiError(message, 400);
      }
      logger.error('Error updating benefit type:', error);
      throw new ApiError('Failed to update benefit type', 500);
    }
  }

  /**
   * Desativar um tipo de benefício (em vez de excluí-lo)
   */
  async deactivateBenefitType(id: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError('Invalid benefit type ID', 400);
      }

      // Verificar se o tipo de benefício existe
      const benefitType = await BenefitType.findById(id);
      if (!benefitType) {
        throw new ApiError('Benefit type not found', 404);
      }

      // Desativar o tipo de benefício
      benefitType.status = 'inactive';
      await benefitType.save();
      
      return benefitType;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error deactivating benefit type:', error);
      throw new ApiError('Failed to deactivate benefit type', 500);
    }
  }

  /**
   * Excluir um tipo de benefício permanentemente
   * Método para fins internos ou administrativos
   */
  async deleteBenefitType(id: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError('Invalid benefit type ID', 400);
      }

      // Verificar se o tipo de benefício existe
      const benefitType = await BenefitType.findById(id);
      if (!benefitType) {
        throw new ApiError('Benefit type not found', 404);
      }

      // Excluir o tipo de benefício
      await BenefitType.findByIdAndDelete(id);
      
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error deleting benefit type:', error);
      throw new ApiError('Failed to delete benefit type', 500);
    }
  }
}

export default new BenefitTypeService();