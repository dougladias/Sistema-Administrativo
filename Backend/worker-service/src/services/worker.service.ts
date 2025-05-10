import mongoose from 'mongoose';
import Worker, { IWorker } from '../models/worker.model';
import { WorkerCreateDTO, WorkerUpdateDTO, WorkerFilterDTO } from '../dto/worker.dto';
import ApiError from '../utils/apiError';
import logger from '../utils/logger';

class WorkerService {
  // Buscar todos os funcionários com filtros opcionais
  async findAll(filters: Partial<WorkerFilterDTO> = {}): Promise<IWorker[]> {
    try {
      const query: Record<string, any> = {};
      
      // Aplicar filtros
      if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' }; // Case-insensitive
      }
      
      if (filters.department) {
        query.department = filters.department;
      }
      
      if (filters.role) {
        query.role = { $regex: filters.role, $options: 'i' };
      }
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.contract) {
        query.contract = filters.contract;
      }
      
      // Executar a consulta
      const workers = await Worker.find(query).sort({ name: 1 });
      
      return workers;
    } catch (error) {
      logger.error('Erro no serviço ao buscar funcionários:', error);
      throw error;
    }
  }
  
  // Buscar um funcionário por ID
  async findById(id: string): Promise<IWorker | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'ID inválido');
      }
      
      const worker = await Worker.findById(id);
      
      return worker;
    } catch (error) {
      logger.error(`Erro no serviço ao buscar funcionário ID ${id}:`, error);
      throw error;
    }
  }
  
  // Criar um novo funcionário
  async create(workerData: WorkerCreateDTO): Promise<IWorker> {
    try {
      // Verificar se já existe funcionário com o mesmo CPF
      const existingWorker = await Worker.findOne({ cpf: workerData.cpf });
      
      if (existingWorker) {
        throw new ApiError(409, 'Já existe um funcionário com este CPF');
      }
      
      // Verificar se já existe funcionário com o mesmo email
      const existingEmail = await Worker.findOne({ email: workerData.email });
      
      if (existingEmail) {
        throw new ApiError(409, 'Já existe um funcionário com este email');
      }
      
      // Criar o funcionário
      const worker = new Worker({
        ...workerData,
        logs: [] // Iniciar com array de logs vazio
      });
      
      await worker.save();
      
      return worker;
    } catch (error) {
      logger.error('Erro no serviço ao criar funcionário:', error);
      throw error;
    }
  }
  
  // Atualizar um funcionário
  async update(id: string, workerData: WorkerUpdateDTO): Promise<IWorker | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'ID inválido');
      }
      
      // Verificar se o funcionário existe
      const worker = await Worker.findById(id);
      
      if (!worker) {
        return null;
      }
      
      // Se estiver atualizando CPF, verificar se já existe outro funcionário com esse CPF
      if (workerData.cpf && workerData.cpf !== worker.cpf) {
        const existingWorker = await Worker.findOne({ cpf: workerData.cpf });
        
        if (existingWorker && existingWorker._id.toString() !== id) {
          throw new ApiError(409, 'Já existe um funcionário com este CPF');
        }
      }
      
      // Se estiver atualizando email, verificar se já existe outro funcionário com esse email
      if (workerData.email && workerData.email !== worker.email) {
        const existingEmail = await Worker.findOne({ email: workerData.email });
        
        if (existingEmail && existingEmail._id.toString() !== id) {
          throw new ApiError(409, 'Já existe um funcionário com este email');
        }
      }
      
      // Garantir que o contrato seja válido
      if (workerData.contract && !['CLT', 'PJ'].includes(workerData.contract)) {
        throw new ApiError(400, 'Tipo de contrato inválido. Use CLT ou PJ.');
      }
      
      // Atualizar o funcionário
      const updatedWorker = await Worker.findByIdAndUpdate(
        id,
        { $set: workerData },
        { new: true, runValidators: true }
      );
      
      return updatedWorker;
    } catch (error) {
      logger.error(`Erro no serviço ao atualizar funcionário ID ${id}:`, error);
      throw error;
    }
  }
  
  // Excluir um funcionário
  async delete(id: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'ID inválido');
      }
      
      const result = await Worker.findByIdAndDelete(id);
      
      return !!result;
    } catch (error) {
      logger.error(`Erro no serviço ao excluir funcionário ID ${id}:`, error);
      throw error;
    }
  }
  
  // Registrar entrada de um funcionário
  async registerEntry(id: string): Promise<IWorker | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'ID inválido');
      }
      
      const worker = await Worker.findById(id);
      
      if (!worker) {
        return null;
      }
      
      // Adicionar registro de entrada
      worker.logs.push({
        entryTime: new Date(),
        date: new Date()
      });
      
      await worker.save();
      
      return worker;
    } catch (error) {
      logger.error(`Erro no serviço ao registrar entrada do funcionário ID ${id}:`, error);
      throw error;
    }
  }
  
  // Registrar saída de um funcionário
  async registerExit(id: string): Promise<IWorker | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'ID inválido');
      }
      
      const worker = await Worker.findById(id);
      
      if (!worker) {
        return null;
      }
      
      // Verificar se existe um registro de entrada sem saída
      if (worker.logs.length > 0) {
        const lastLog = worker.logs[worker.logs.length - 1];
        
        if (lastLog.entryTime && !lastLog.leaveTime) {
          lastLog.leaveTime = new Date();
          await worker.save();
        } else {
          // Se não houver registro de entrada aberto, criar um novo log com apenas a saída
          worker.logs.push({
            leaveTime: new Date(),
            date: new Date()
          });
          await worker.save();
        }
      } else {
        // Se não houver logs, criar um novo com apenas a saída
        worker.logs.push({
          leaveTime: new Date(),
          date: new Date()
        });
        await worker.save();
      }
      
      return worker;
    } catch (error) {
      logger.error(`Erro no serviço ao registrar saída do funcionário ID ${id}:`, error);
      throw error;
    }
  }
  
  // Registrar ausência de um funcionário
  async registerAbsence(id: string): Promise<IWorker | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'ID inválido');
      }
      
      const worker = await Worker.findById(id);
      
      if (!worker) {
        return null;
      }
      
      // Adicionar registro de ausência
      worker.logs.push({
        faltou: true,
        date: new Date(),
        absent: true
      });
      
      await worker.save();
      
      return worker;
    } catch (error) {
      logger.error(`Erro no serviço ao registrar ausência do funcionário ID ${id}:`, error);
      throw error;
    }
  }
  
  // Buscar departamentos (agrupamento)
  async getDepartments() {
    try {
      const departments = await Worker.aggregate([
        { $match: { status: "active" } },
        { 
          $group: { 
            _id: { 
              $cond: { 
                if: { $eq: ["$department", null] }, 
                then: "Sem Departamento", 
                else: "$department" 
              } 
            }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { _id: 1 } },
        { 
          $project: { 
            department: "$_id", 
            count: 1, 
            _id: 0 
          } 
        }
      ]);
      
      // Formatar para o formato esperado pelo frontend
      const formattedDepartments = departments.map(dept => ({
        value: dept.department === "Sem Departamento" ? "noDepartment" : dept.department,
        label: `${dept.department} (${dept.count})`
      }));
      
      // Adicionar opção para todos os departamentos
      formattedDepartments.unshift({ value: 'all', label: 'Todos os departamentos' });
      
      return formattedDepartments;
    } catch (error) {
      logger.error('Erro no serviço ao buscar departamentos:', error);
      throw error;
    }
  }
}

export default new WorkerService();