
export interface IDocument {
    _id: string;
    name: string;
    employee?: string;
    employeeId?: string;
    department?: string;
    type: string;
    fileType?: string;
    size?: number;
    tags?: string[];
    uploadDate?: Date;
    expiryDate?: Date;
    createdAt?: string;
    filePath?: string;
    updatedAt?: string;
  }
  
  export interface IDocumentTemplate {
    _id: string;
    name: string;
    description: string;
    type: string;
    filePath: string;
    fileType: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }