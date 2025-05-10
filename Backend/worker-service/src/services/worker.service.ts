import mongoose from 'mongoose';
import { createWorkerModel, IWorker } from '../../../shared/src/models/worker.model';
import { WorkerCreate, WorkerUpdate, WorkerFilter, validateWorkerCreate, validateWorkerUpdate } from '../../../shared/src/schemas/worker.schema';
import { ApiError } from '../../../shared/src/utils/apiError';
import { createLogger } from '../../../shared/src/utils/logger';
const logger = createLogger({ 
  serviceName: 'worker-service',
  customMetadata: { module: 'worker-service' }
});

// Inicializar o modelo Worker
const Worker = createWorkerModel();

class WorkerService {
  // Buscar todos os funcionários com filtros opcionais
  async findAll(filters: Partial<WorkerFilter> = {}): Promise<IWorker[]> {
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
        throw ApiError.badRequest('ID inválido');
      }
      
      const worker = await Worker.findById(id);
      
      return worker;
    } catch (error) {
      logger.error(`Erro no serviço ao buscar funcionário ID ${id}:`, error);
      throw error;
    }
  }
  
  // Criar um novo funcionário
  async create(workerData: WorkerCreate): Promise<IWorker> {
    try {
      // Validar dados usando schema compartilhado
      const validatedData = validateWorkerCreate(workerData);
      
      // Verificar se já existe funcionário com o mesmo CPF
      const existingWorker = await Worker.findOne({ cpf: validatedData.cpf });
      
      if (existingWorker) {
        throw ApiError.conflict('Já existe um funcionário com este CPF');
      }
      
      // Verificar se já existe funcionário com o mesmo email
      const existingEmail = await Worker.findOne({ email: validatedData.email });
      
      if (existingEmail) {
        throw ApiError.conflict('Já existe um funcionário com este email');
      }
      
      // Criar o funcionário
      const worker = new Worker({
        ...validatedData,
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
  async update(id: string, workerData: WorkerUpdate): Promise<IWorker | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ApiError.badRequest('ID inválido');
      }
      
      // Validar dados usando schema compartilhado
      const validatedData = validateWorkerUpdate(workerData);
      
      // Verificar se o funcionário existe
      const worker = await Worker.findById(id);
      
      if (!worker) {
        return null;
      }
      
      // Se estiver atualizando CPF, verificar se já existe outro funcionário com esse CPF
      if (validatedData.cpf && validatedData.cpf !== worker.cpf) {
        const existingWorker = await Worker.findOne({ cpf: validatedData.cpf });
        
        if (existingWorker && existingWorker._id.toString() !== id) {
          throw ApiError.conflict('Já existe um funcionário com este CPF');
        }
      }
      
      // Se estiver atualizando email, verificar se já existe outro funcionário com esse email
      if (validatedData.email && validatedData.email !== worker.email) {
        const existingEmail = await Worker.findOne({ email: validatedData.email });
        
        if (existingEmail && existingEmail._id.toString() !== id) {
          throw ApiError.conflict('Já existe um funcionário com este email');
        }
      }
      
      // Atualizar o funcionário
      const updatedWorker = await Worker.findByIdAndUpdate(
        id,
        { $set: validatedData },
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
        throw ApiError.badRequest('ID inválido');
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
        throw ApiError.badRequest('ID inválido');
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
        throw ApiError.badRequest('ID inválido');
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
        throw ApiError.badRequest('ID inválido');
      }
      
      const worker = await Worker.findById(id);
      
      if (!worker) {
        return null;
      }
      
      // Adicionar registro de ausência
      worker.logs.push({
        absent: true,
        date: new Date()
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