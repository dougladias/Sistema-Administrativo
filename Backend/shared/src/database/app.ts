import { env } from './env';
import { connectMongo, disconnectMongo } from './mongoose';

export async function initializeDatabase(): Promise<void> {
  try {
    await connectMongo(env.mongoUri);
    console.log("🎯 Conexão com banco de dados estabelecida com sucesso");
    
    // Configura os listeners para desconexão segura
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
    
  } catch (error) {
    console.error("❌ Falha ao conectar ao banco de dados:", error);
    process.exit(1);
  }
}

async function handleShutdown(): Promise<void> {
  console.log("🛑 Encerrando conexão com o banco de dados...");
  await disconnectMongo();
  console.log("👋 Conexão encerrada com sucesso");
  process.exit(0);
}
