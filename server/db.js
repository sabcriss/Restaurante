
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env na raiz do projeto
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurante';

/**
 * @function conectarBanco
 * @description Conecta com o bd (MongoDB) via mongoose.
 * Centraliza as configurações do cliente de banco e escuta eventos de conexão.
 * @returns {Promise<void>}
 */
export async function conectarBanco() {
  try {
    mongoose.connection.on('connected', () => {
      console.log('>>> [MongoDB] Conectado ao banco com sucesso.');
    });

    mongoose.connection.on('error', (erro) => {
      console.error('>>> [MongoDB] Erro na conexão:', erro.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('>>> [MongoDB] Conexão perdida com o servidor.');
    });

    await mongoose.connect(MONGODB_URI);
  } catch (erro) {
    console.error('>>> [MongoDB] Falha crítica ao conectar ao MongoDB:', erro.message);
    process.exit(1); // Finaliza o processo se não conseguir conectar ao bd no start
  }
}
