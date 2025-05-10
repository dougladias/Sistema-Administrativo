import mongoose, { ConnectOptions } from 'mongoose';

// Evita múltiplos listeners
let listenersAdded = false;

export const connectMongo = async (
  uri: string,
  options: ConnectOptions = {}
): Promise<typeof mongoose> => {
  if (!uri) {
    throw new Error("❌ URI de conexão com MongoDB não fornecida!");
  }

  // Opções padrão modernas (ajuste conforme necessidade)
  const defaultOptions: ConnectOptions = {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    socketTimeoutMS: 45000,
    family: 4,
    ...options,
  };

  try {
    if (mongoose.connection.readyState === 0) {
      // Adiciona listeners apenas uma vez
      if (!listenersAdded) {
        mongoose.connection.on('connected', () =>
          console.log('✅ Mongoose: Conexão estabelecida com sucesso')
        );
        mongoose.connection.on('error', (err) =>
          console.error('❌ Mongoose: Erro de conexão:', err)
        );
        mongoose.connection.on('disconnected', () =>
          console.warn('⚠️ Mongoose: Conexão encerrada')
        );
        listenersAdded = true;
      }

      // Conecta ao MongoDB
      await mongoose.connect(uri, defaultOptions);
    } else if (mongoose.connection.readyState === 2) {
      
    } else if (mongoose.connection.readyState === 1) {
      
    }

    // Fecha a conexão automaticamente ao encerrar o processo
    process.once('SIGINT', async () => {
      await mongoose.disconnect();      
      process.exit(0);
    });
    process.once('SIGTERM', async () => {
      await mongoose.disconnect();      
      process.exit(0);
    });

    return mongoose;
  } catch (error: any) {
    console.error(`❌ Mongoose: Falha ao conectar ao MongoDB: ${error.message}`);
    throw error;
  }
};

// Desconecta do MongoDB de forma segura
export const disconnectMongo = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      console.log('👋 Mongoose: Desconectado com sucesso do MongoDB');
    } catch (error: any) {
      console.error(`❌ Mongoose: Erro ao desconectar: ${error.message}`);
      throw error;
    }
  } else {
    console.log('ℹ️ Mongoose: Não há conexão ativa para encerrar');
  }
};

// Obtém a instância atual do mongoose
export const getMongoose = (): typeof mongoose => {
  return mongoose;
};

// Verifica se o Mongoose está conectado
export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};