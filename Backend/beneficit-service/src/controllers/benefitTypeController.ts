import { Request, Response, NextFunction } from 'express';
import benefitTypeService from '../services/benefitTypeService';
import logger from '../config/logger';
import ApiError from '../utils/apiError';

class BenefitTypeController {
  /**
   * Obter todos os tipos de benefícios
   * GET /benefit-types
   */
  async getAllBenefitTypes(req: Request, res: Response, next: NextFunction) {
    try {
      // Obter parâmetros de filtro da query
      const { status } = req.query;
      
      // Validar status se fornecido
      const filter: { status?: 'active' | 'inactive' } = {};
      if (status === 'active' || status === 'inactive') {
        filter.status = status;
      }
      
      const benefitTypes = await benefitTypeService.getAllBenefitTypes(filter);
      
      res.status(200).json({
        success: true,
        count: benefitTypes.length,
        data: benefitTypes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter um tipo de benefício por ID
   * GET /benefit-types/:id
   */
  async getBenefitTypeById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const benefitType = await benefitTypeService.getBenefitTypeById(id);
      
      res.status(200).json({
        success: true,
        data: benefitType
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar um novo tipo de benefício
   * POST /benefit-types
   */
  async createBenefitType(req: Request, res: Response, next: NextFunction) {
    try {
      const benefitType = await benefitTypeService.createBenefitType(req.body);
      
      res.status(201).json({
        success: true,
        data: benefitType
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar um tipo de benefício
   * PUT /benefit-types/:id
   */
  async updateBenefitType(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const benefitType = await benefitTypeService.updateBenefitType(id, req.body);
      
      res.status(200).json({
        success: true,
        data: benefitType
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Desativar um tipo de benefício
   * PATCH /benefit-types/:id/deactivate
   */
  async deactivateBenefitType(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const benefitType = await benefitTypeService.deactivateBenefitType(id);
      
      res.status(200).json({
        success: true,
        data: benefitType
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Excluir um tipo de benefício
   * DELETE /benefit-types/:id
   */
  async deleteBenefitType(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await benefitTypeService.deleteBenefitType(id);
      
      res.status(200).json({
        success: true,
        message: 'Benefit type deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Inicializar tipos de benefícios padrão (para setup inicial)
   * POST /benefit-types/initialize
   */
  async initializeBenefitTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const defaultTypes = [
        {
          name: 'Vale Transporte',
          description: 'Auxílio para deslocamento do funcionário',
          hasDiscount: true,
          discountPercentage: 6,
          defaultValue: 220.00
        },
        {
          name: 'Vale Refeição',
          description: 'Auxílio para alimentação',
          hasDiscount: false,
          defaultValue: 880.00
        },
        {
          name: 'Vale Alimentação',
          description: 'Auxílio para compras em supermercados',
          hasDiscount: false,
          defaultValue: 600.00
        },
        {
          name: 'Plano de Saúde',
          description: 'Assistência médica empresarial',
          hasDiscount: true,
          discountPercentage: 20,
          defaultValue: 350.00
        },
        {
          name: 'Auxílio Educação',
          description: 'Auxílio para cursos e qualificações',
          hasDiscount: false,
          defaultValue: 300.00
        }
      ];

      // Verificar se já existem tipos de benefícios
      const existingTypes = await benefitTypeService.getAllBenefitTypes();
      
      if (existingTypes.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Benefit types have already been initialized',
          count: existingTypes.length
        });
      }

      // Criar os tipos padrão
      const createdTypes = [];
      for (const typeData of defaultTypes) {
        try {
          const benefitType = await benefitTypeService.createBenefitType(typeData);
          createdTypes.push(benefitType);
        } catch (error) {
          logger.error(`Error creating default benefit type ${typeData.name}:`, error);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Default benefit types initialized successfully',
        count: createdTypes.length,
        data: createdTypes
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BenefitTypeController();