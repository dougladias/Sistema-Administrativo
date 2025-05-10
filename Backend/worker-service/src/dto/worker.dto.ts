
export interface WorkerCreateDTO {
    name: string;
    cpf: string;
    nascimento: Date | string;
    admissao: Date | string;
    salario: string;
    ajuda?: string;
    numero: string;
    email: string;
    address: string;
    contract: "CLT" | "PJ";
    role: string;
    department?: string;
  }
  
  export interface WorkerUpdateDTO {
    name?: string;
    cpf?: string;
    nascimento?: Date | string;
    admissao?: Date | string;
    salario?: string;
    ajuda?: string;
    numero?: string;
    email?: string;
    address?: string;
    contract?: "CLT" | "PJ";
    role?: string;
    department?: string;
    status?: "active" | "inactive" | "other";
  }
  
  export interface WorkerFilterDTO {
    name?: string;
    department?: string;
    role?: string;
    status?: "active" | "inactive" | "other";
    contract?: "CLT" | "PJ";
  }