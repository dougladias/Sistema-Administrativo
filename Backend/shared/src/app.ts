import { initializeDatabase } from './database/app';

async function bootstrap() {
  try {
    // Inicializa a conexão com o banco de dados
    await initializeDatabase();    
    
  } catch (error) {
    console.error("Falha ao inicializar o Banco de Dados:", error);
    process.exit(1);
  }
}

bootstrap();