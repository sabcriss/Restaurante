import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
dotenv.config();
dotenv.config({ path: '../.env' });
const SERVIDORES_DNS = ['8.8.8.8', '1.1.1.1'];
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('>>> [MongoDB] Erro crítico: A variável de ambiente MONGODB_URI não foi configurada.');
  process.exit(1);
}
export async function conectarBanco() {
  try {
    dns.setServers(SERVIDORES_DNS);
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
    process.exit(1);
  }
}
