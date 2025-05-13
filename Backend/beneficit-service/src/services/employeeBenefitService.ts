import { EmployeeBenefit, IEmployeeBenefit } from '../models/EmployeeBenefit';
import { BenefitType } from '../models/BenefitType';
import ApiError from '../utils/apiError';
import logger from '../config/logger';
import mongoose from 'mongoose';

class EmployeeBenefitService {
  /**
   * Obter todos os benefícios de funcionários
   */
  async getAllEmployeeBenefits(filter: { 
    employeeId?: string; 
    status?: 'active' | 'inactive';
  } = {}) {
    try {
      const query: Record<string, any> = {};
      
      if (filter.employeeId) {
        if (!mongoose.Types.ObjectId.isValid(filter.employeeId)) {
          throw new ApiError('Invalid employee ID', 400);
        }
        query.employeeId = new mongoose.Types.ObjectId(filter.employeeId);
      }
      
      if (filter.status) {
        query.status = filter.status;
      }
      
      const employeeBenefits = await EmployeeBenefit.find(query)
        .populate('benefitTypeId')
        .sort({ createdAt: -1 });
      
      return employeeBenefits;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error getting employee benefits:', error);
      throw new ApiError('Failed to get employee benefits', 500);
    }
  }

  /**
   * Obter um benefício de funcionário por ID
   */
  async getEmployeeBenefitById(id: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError('Invalid employee benefit ID', 400);
      }

      const employeeBenefit = await EmployeeBenefit.findById(id)
        .populate('benefitTypeId');
      
      if (!employeeBenefit) {
        throw new ApiError('Employee benefit not found', 404);
      }
      
      return employeeBenefit;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error getting employee benefit by id:', error);
      throw new ApiError('Failed to get employee benefit', 500);
    }
  }

  /**
   * Obter benefícios de um funcionário específico
   */
  async getEmployeeBenefitsByEmployeeId(employeeId: string) {
    try {
      // Simplificar a consulta para depurar
      let query = {};
      
      // Tentar diferentes abordagens para busca
      if (mongoose.Types.ObjectId.isValid(employeeId)) {
        query = { employeeId: new mongoose.Types.ObjectId(employeeId) };
      } else {
        query = { employeeId: employeeId };
      }
      
      logger.info(`Query: ${JSON.stringify(query)}`);
      
      const employeeBenefits = await EmployeeBenefit.find(query)
        .populate('benefitTypeId')
        .sort({ createdAt: -1 })
        .lean();
      
      return employeeBenefits;
    } catch (error) {
      logger.error('Detailed error:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Verificar se há algum problema com o mongoose
      if (mongoose.connection.readyState !== 1) {
        throw new ApiError('Database connection issue', 500);
      }
      
      throw new ApiError('Failed to get employee benefits', 500);
    }
  }

  /**
   * Criar um novo benefício para um funcionário
   */
  async createEmployeeBenefit(data: {
    employeeId: string;
    benefitTypeId: string;
    value?: number;
    status?: 'active' | 'inactive';
    startDate?: Date;
  }) {
    try {
      // Validar IDs
      if (!mongoose.Types.ObjectId.isValid(data.employeeId)) {
        throw new ApiError('Invalid employee ID', 400);
      }
      
      if (!mongoose.Types.ObjectId.isValid(data.benefitTypeId)) {
        throw new ApiError('Invalid benefit type ID', 400);
      }

      // Verificar se o tipo de benefício existe
      const benefitType = await BenefitType.findById(data.benefitTypeId);
      if (!benefitType) {
        throw new ApiError('Benefit type not found', 404);
      }

      // Verificar se o funcionário já possui este benefício ativo
      const existingBenefit = await EmployeeBenefit.findOne({
        employeeId: data.employeeId,
        benefitTypeId: data.benefitTypeId,
        status: 'active'
      });

      if (existingBenefit) {
        throw new ApiError('Employee already has this benefit active', 409);
      }

      // Usar valor padrão do tipo de benefício, se não for fornecido
      const value = data.value !== undefined ? data.value : benefitType.defaultValue;

      // Criar o novo benefício
      const employeeBenefit = new EmployeeBenefit({
        employeeId: data.employeeId,
        benefitTypeId: data.benefitTypeId,
        value,
        status: data.status || 'active',
        startDate: data.startDate || new Date()
      });

      await employeeBenefit.save();
      
      // Retornar com o tipo de benefício populado
      return await EmployeeBenefit.findById(employeeBenefit._id).populate('benefitTypeId');
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
      logger.error('Error creating employee benefit:', error);
      throw new ApiError('Failed to create employee benefit', 500);
    }
  }

  /**
   * Atualizar um benefício de funcionário
   */
  async updateEmployeeBenefit(id: string, data: Partial<IEmployeeBenefit>) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError('Invalid employee benefit ID', 400);
      }

      // Verificar se o benefício existe
      const employeeBenefit = await EmployeeBenefit.findById(id);
      if (!employeeBenefit) {
        throw new ApiError('Employee benefit not found', 404);
      }

      // Aplicar as atualizações
      if (data.value !== undefined) {
        employeeBenefit.value = data.value;
      }
      
      if (data.status !== undefined) {
        employeeBenefit.status = data.status;
        
        // Se estiver desativando, definir data de término
        if (data.status === 'inactive' && !employeeBenefit.endDate) {
          employeeBenefit.endDate = new Date();
        }
      }
      
      if (data.endDate) {
        employeeBenefit.endDate = data.endDate;
      }

      await employeeBenefit.save();
      
      // Retornar com o tipo de benefício populado
      return await EmployeeBenefit.findById(id).populate('benefitTypeId');
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
      logger.error('Error updating employee benefit:', error);
      throw new ApiError('Failed to update employee benefit', 500);
    }
  }

  /**
   * Desativar um benefício de funcionário
   */
  async deactivateEmployeeBenefit(id: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError('Invalid employee benefit ID', 400);
      }

      // Verificar se o benefício existe
      const employeeBenefit = await EmployeeBenefit.findById(id);
      if (!employeeBenefit) {
        throw new ApiError('Employee benefit not found', 404);
      }

      // Desativar o benefício
      employeeBenefit.status = 'inactive';
      employeeBenefit.endDate = employeeBenefit.endDate || new Date();
      await employeeBenefit.save();
      
      // Retornar com o tipo de benefício populado
      return await EmployeeBenefit.findById(id).populate('benefitTypeId');
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error deactivating employee benefit:', error);
      throw new ApiError('Failed to deactivate employee benefit', 500);
    }
  }

  /**
   * Excluir um benefício de funcionário
   */
  async deleteEmployeeBenefit(id: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError('Invalid employee benefit ID', 400);
      }

      // Verificar se o benefício existe
      const employeeBenefit = await EmployeeBenefit.findById(id);
      if (!employeeBenefit) {
        throw new ApiError('Employee benefit not found', 404);
      }

      // Excluir o benefício
      await EmployeeBenefit.findByIdAndDelete(id);
      
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error deleting employee benefit:', error);
      throw new ApiError('Failed to delete employee benefit', 500);
    }
  }
}

export default new EmployeeBenefitService();