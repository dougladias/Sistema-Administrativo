import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// URL base para o serviço de autenticação
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4010/api/auth';

export async function POST(req: NextRequest) {
  try {
    // Obter o cookie de refresh token
    const refreshToken = req.cookies.get('refreshToken')?.value;
    
    // Obter o token de acesso do cabeçalho
    const authHeader = req.headers.get('Authorization');
    const accessToken = authHeader ? authHeader.split(' ')[1] : undefined;
    
    if (refreshToken) {
      // Fazer logout no serviço de autenticação
      try {
        await axios.post(`${AUTH_SERVICE_URL}/logout`, {
          refreshToken,
          accessToken
        });
      } catch (error) {
        console.error('Erro ao fazer logout no serviço de autenticação:', error);
      }
    }
    
    // Criar resposta com limpeza do cookie
    const response = NextResponse.json({
      message: 'Logout realizado com sucesso'
    });
    
    // Limpar o cookie de refresh token
    response.cookies.delete('refreshToken');
    
    return response;
  } catch (error) {
    console.error('Erro ao processar logout:', error);
    return NextResponse.json(
      { message: 'Erro ao processar logout' },
      { status: 500 }
    );
  }
}