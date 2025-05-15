import { NextRequest, NextResponse } from 'next/server';
import authService from '@/services/authService';

export async function POST(req: NextRequest) {
  try {
    // Obter o cookie de refresh token
    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      // Fazer logout usando o authService
      await authService.logout(refreshToken);
    }

    // Criar resposta com limpeza do cookie
    const response = NextResponse.json({
      message: 'Logout realizado com sucesso',
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