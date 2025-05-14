
// Função para formatar respostas de sucesso 
export const formatResponse = <T = any>(data: T, meta: any = null) => {
  const response: any = {
    success: true,
    data
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  return response;
};


// Função para formatar respostas de erro
export const formatErrorResponse = (
  message: string,
  code: string = 'INTERNAL_SERVER_ERROR',
  details: any = null
) => {
  const response: any = {
    success: false,
    error: {
      message,
      code
    }
  };
  
  // Adiciona detalhes adicionais, se fornecidos
  if (details) {
    response.error.details = details;
  }
  
  return response;
};

// Formatação para paginação
export const formatPaginatedResponse = <T = any>(
  data: T[],
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  
  // Verifica se a página atual é maior que o total de páginas
  return formatResponse(data, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
};