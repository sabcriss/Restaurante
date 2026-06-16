import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

/* ==============================
   CONFIGURAÇÕES DO SCRIPT
   ============================== */

// Carrega as variáveis de ambiente de diferentes caminhos possíveis para garantir o funcionamento independente de onde o processo Node é iniciado.
dotenv.config();
dotenv.config({ path: '../.env' });

// Servidores DNS públicos para contornar falhas de resolução SRV do MongoDB Atlas no Node.js
const SERVIDORES_DNS = ['8.8.8.8', '1.1.1.1'];

// Recupera a URI de conexão a partir do ambiente externo, evitando dados sensíveis expostos no código.
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('>>> [MongoDB] Erro crítico: A variável de ambiente MONGODB_URI não foi configurada.');
  process.exit(1);
}

/**
 * @function conectarBanco
 * @description Conecta com o banco de dados (MongoDB) via mongoose.
 * Configura resolvedores DNS públicos para evitar falhas com a URI do Atlas e escuta os eventos da conexão.
 * @returns {Promise<void>}
 */
export async function conectarBanco() {
  try {
    // Força o resolvedor DNS do Node.js a utilizar servidores públicos e robustos.
    // Isso evita falhas de 'querySrv ECONNREFUSED' comuns ao resolver registros SRV em conexões Atlas.
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
