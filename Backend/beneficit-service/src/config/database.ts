import mongoose from 'mongoose';
import logger from './logger';
import { env } from './env';

// Configurações do mongoose
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,  // Tempo de seleção do servidor
  socketTimeoutMS: 45000,  // Timeout para operações de socket
  connectTimeoutMS: 10000,  // Tempo máximo para conectar
  maxPoolSize: 10,  // Número máximo de conexões simultâneas
  minPoolSize: 2,   // Número mínimo de conexões mantidas
};

// Função para conectar ao banco de dados
export async function connectToDatabase() {
  try {
    // Configuração global do Mongoose
    mongoose.set('strictQuery', true);
    
    // Conectar ao MongoDB
    await mongoose.connect(env.mongoUri, mongooseOptions);
    
    // Registrar eventos de conexão
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.info('MongoDB connection disconnected');
    });
    
    // Tratamento para encerramento gracioso
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to application termination');
      process.exit(0);
    });
    
    logger.info('Successfully connected to MongoDB');
    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export { mongoose };