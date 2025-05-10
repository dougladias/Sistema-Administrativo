class ApiError extends Error {
    statusCode: number;
    errors?: any[];
  
    constructor(statusCode: number, message: string, errors?: any[]) {
      super(message);
      this.statusCode = statusCode;
      this.errors = errors;
      
      // Para que o instanceof funcione corretamente
      Object.setPrototypeOf(this, ApiError.prototype);
    }
  }
  
  export default ApiError;