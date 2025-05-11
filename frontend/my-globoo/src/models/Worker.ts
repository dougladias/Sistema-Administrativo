
/**
 * Interface para o modelo de Funcionário
 * Corresponde ao modelo do backend (worker-service)
 */
export interface IWorker {
    _id?: string;  // ID do MongoDB (opcional para criação)
    name: string;  // Nome do funcionário
    cpf: string;   // CPF do funcionário
    nascimento: Date | string | null;  // Data de nascimento
    admissao: Date | string | null;    // Data de admissão
    salario: string;  // Salário (como string para preservar formatação)
    ajuda?: string;   // Ajuda de custo (opcional)
    numero: string;   // Número de contato
    email: string;    // Email
    address: string;  // Endereço
    contract: "CLT" | "PJ";  // Tipo de contrato (CLT ou PJ)
    role: string;     // Cargo
    department?: string;  // Departamento (opcional)
    status?: "active" | "inactive" | "other";  // Status do funcionário
    
    // Informações para controle de ponto
    logs?: Array<{
      entryTime?: Date;    // Horário de entrada
      leaveTime?: Date;    // Horário de saída
      faltou?: boolean;    // Indicador de falta
      date?: Date;         // Data do registro
      absent?: boolean;    // Indicador de ausência
    }>;
    
    // Arquivos associados ao funcionário
    files?: Array<{
      filename: string;      // Nome do arquivo
      originalName: string;  // Nome original do arquivo
      mimetype: string;      // Tipo MIME
      size: number;          // Tamanho em bytes
      path: string;          // Caminho do arquivo
      uploadDate: Date;      // Data de upload
      description?: string;  // Descrição (opcional)
      category?: string;     // Categoria (opcional)
    }>;
    
    // Campos de auditoria
    createdAt?: Date;  // Data de criação
    updatedAt?: Date;  // Data de atualização
  }
  
  /**
   * Interface simplificada para componentes de listagem
   */
  export interface IWorkerListItem {
    _id: string;
    name: string;
    role: string;
    email: string;
    department?: string;
    status: "active" | "inactive" | "other";
    contract: "CLT" | "PJ";
    salario: string;
    admissao: Date | string | null;
  }
  
  /**
   * Interface para resposta das operações de funcionários
   */
  export interface IWorkerResponse {
    success: boolean;
    message?: string;
    data?: IWorker;
  }
  
  /**
   * Interface para resposta de listagem de funcionários
   */
  export interface IWorkersListResponse {
    success: boolean;
    count: number;
    data: IWorker[];
  }
  
  /**
   * Enum para status de funcionário
   */
  export enum WorkerStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    OTHER = "other"
  }
  
  /**
   * Enum para tipo de contrato
   */
  export enum ContractType {
    CLT = "CLT",
    PJ = "PJ"
  }