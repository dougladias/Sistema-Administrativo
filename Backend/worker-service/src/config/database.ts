import mongoose from 'mongoose';
import logger from '../utils/logger';
import { env } from './env';

// Configurações para a conexão com MongoDB
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 2,
};

mongoose.set('strictQuery', true);

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongoUri, mongooseOptions);

    mongoose.connection.on('connected', () => {
      logger.info('Conexão Mongoose estabelecida');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Erro na conexão Mongoose:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.info('Conexão Mongoose encerrada');
    });

    logger.info('Banco de dados conectado com sucesso');
  } catch (error) {
    logger.error('Falha na conexão com MongoDB:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Banco de dados desconectado com sucesso');
  } catch (error) {
    logger.error('Erro ao desconectar do banco de dados:', error);
    throw error;
  }
};