import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// URL do API Gateway
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3005/api';

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
    
    // Enviar solicitação para o API Gateway
    const response = await axios.post(`${API_GATEWAY_URL}/auth/refresh-token`, {
      refreshToken
    });
    
    const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
    
    // Criar resposta com os novos tokens
    const jsonResponse = NextResponse.json({
      success: true,
      tokens: {
        accessToken
      }
    });
    
    // Atualizar o cookie de refresh token
    jsonResponse.cookies.set({
      name: 'refreshToken',
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    });
    
    return jsonResponse;
  } catch (error: any) {
    console.error('Erro ao atualizar token:', error);
    
    // Se o erro for de autenticação, limpar o cookie
    if (error.response?.status === 401) {
      const jsonResponse = NextResponse.json(
        { message: 'Sessão expirada' },
        { status: 401 }
      );
      
      jsonResponse.cookies.set({
        name: 'refreshToken',
        value: '',
        httpOnly: true,
        expires: new Date(0),
        path: '/'
      });
      
      return jsonResponse;
    }
    
    return NextResponse.json(
      { message: 'Erro ao atualizar token' },
      { status: 500 }
    );
  }
}