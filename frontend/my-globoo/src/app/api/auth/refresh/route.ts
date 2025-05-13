
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// URL base para o serviço de autenticação
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002/api/auth';

export async function POST(req: NextRequest) {
  try {
    // Obter o cookie de refresh token
    const refreshToken = req.cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token não fornecido' },
        { status: 401 }
      );
    }
    
    // Enviar solicitação para o serviço de autenticação
    const response = await axios.post(`${AUTH_SERVICE_URL}/refresh-token`, {
      refreshToken
    });
    
    const { accessToken } = response.data.data;
    
    // Retornar o novo token de acesso
    return NextResponse.json({
      data: { accessToken }
    });
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar token' },
      { status: 401 }
    );
  }
}