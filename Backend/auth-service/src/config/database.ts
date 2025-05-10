import mongoose from 'mongoose';
import logger from './logger';
import { env } from './env';

const connectDB = async (): Promise<void> => {
  try {
    // Configurações do mongoose
    mongoose.set('debug', env.nodeEnv === 'development');
    mongoose.set('strictQuery', true);
    
    // Conectar ao MongoDB
    await mongoose.connect(env.mongoUri);
    
    logger.info('MongoDB connected successfully');
  } catch (error) {
    const err = error as Error;
    logger.error(`MongoDB connection error: ${err.message}`);
    // Encerra o processo com falha
    process.exit(1);
  }
};

export default connectDB;