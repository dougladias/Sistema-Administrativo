import { Request, Response, NextFunction } from 'express';
import employeeBenefitService from '../services/employeeBenefitService';
import logger from '../config/logger';
import ApiError from '../utils/apiError';

class EmployeeBenefitController {
  /**
   * Obter todos os benefícios de funcionários
   * GET /employee-benefits
   */
  async getAllEmployeeBenefits(req: Request, res: Response, next: NextFunction) {
    try {
      // Obter parâmetros de filtro da query
      const { employeeId, status } = req.query;
      
      // Construir filtro
      const filter: { employeeId?: string; status?: 'active' | 'inactive' } = {};
      
      if (employeeId && typeof employeeId === 'string') {
        filter.employeeId = employeeId;
      }
      
      if (status === 'active' || status === 'inactive') {
        filter.status = status;
      }
      
      const employeeBenefits = await employeeBenefitService.getAllEmployeeBenefits(filter);
      
      res.status(200).json({
        success: true,
        count: employeeBenefits.length,
        data: employeeBenefits
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter um benefício de funcionário por ID
   * GET /employee-benefits/:id
   */
  async getEmployeeBenefitById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const employeeBenefit = await employeeBenefitService.getEmployeeBenefitById(id);
      
      res.status(200).json({
        success: true,
        data: employeeBenefit
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter benefícios de um funcionário específico
   * GET /employee-benefits/employee/:employeeId
   */
  async getEmployeeBenefitsByEmployeeId(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const employeeBenefits = await employeeBenefitService.getEmployeeBenefitsByEmployeeId(employeeId);
      
      res.status(200).json({
        success: true,
        count: employeeBenefits.length,
        data: employeeBenefits
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar um novo benefício para um funcionário
   * POST /employee-benefits
   */
  async createEmployeeBenefit(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeBenefit = await employeeBenefitService.createEmployeeBenefit(req.body);
      
      res.status(201).json({
        success: true,
        data: employeeBenefit
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar um benefício de funcionário
   * PUT /employee-benefits/:id
   */
  async updateEmployeeBenefit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const employeeBenefit = await employeeBenefitService.updateEmployeeBenefit(id, req.body);
      
      res.status(200).json({
        success: true,
        data: employeeBenefit
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Desativar um benefício de funcionário
   * PATCH /employee-benefits/:id/deactivate
   */
  async deactivateEmployeeBenefit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const employeeBenefit = await employeeBenefitService.deactivateEmployeeBenefit(id);
      
      res.status(200).json({
        success: true,
        data: employeeBenefit
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Excluir um benefício de funcionário
   * DELETE /employee-benefits/:id
   */
  async deleteEmployeeBenefit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await employeeBenefitService.deleteEmployeeBenefit(id);
      
      res.status(200).json({
        success: true,
        message: 'Employee benefit deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new EmployeeBenefitController();