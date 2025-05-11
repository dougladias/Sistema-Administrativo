export interface DocumentTemplate {
  _id: string;
  name: string;
  type: string;
  description: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  uploadedBy?: string;
  createdAt?: string;
  createdFormatted?: string;
}