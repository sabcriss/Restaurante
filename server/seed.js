import { conectarBanco } from './db.js';
import { MesaModel } from './modelos/Mesa.js';
import { ReservaModel } from './modelos/Reserva.js';
import mongoose from 'mongoose';

const RESERVAS_INICIAIS = [
  { id: 'RES-001', clienteNome: 'João Silva', dataHora: '2026-06-15T19:00', quantidadePessoas: 4, mesaNumero: 'Mesa 5', status: 'Confirmada' },
  { id: 'RES-002', clienteNome: 'Maria Santos', dataHora: '2026-06-15T20:00', quantidadePessoas: 2, mesaNumero: 'Mesa 3', status: 'Confirmada' },
  { id: 'RES-003', clienteNome: 'Ana Paula', dataHora: '2026-06-16T19:30', quantidadePessoas: 6, mesaNumero: 'Mesa 8', status: 'Pendente' },
  { id: 'RES-004', clienteNome: 'Pedro Costa', dataHora: '2026-06-14T18:00', quantidadePessoas: 3, mesaNumero: 'Mesa 2', status: 'Cancelada' },
];

const MESAS_INICIAIS = [
  { numero: 'Mesa 1', capacidade: 4, status: 'Disponível' },
  { numero: 'Mesa 2', capacidade: 4, status: 'Disponível' },
  { numero: 'Mesa 3', capacidade: 2, status: 'Disponível' },
  { numero: 'Mesa 4', capacidade: 2, status: 'Disponível' },
  { numero: 'Mesa 5', capacidade: 6, status: 'Disponível' },
  { numero: 'Mesa 6', capacidade: 6, status: 'Disponível' },
  { numero: 'Mesa 7', capacidade: 8, status: 'Disponível' },
  { numero: 'Mesa 8', capacidade: 8, status: 'Disponível' },
];

/**
 * @function semearBanco
 * @description Apaga os registros anteriores das mesas e reservas e insere os dados de teste.
 * @returns {Promise<void>}
 */
async function semearBanco() {
  try {
    await conectarBanco();

    console.log('>>> [Seed] Limpando coleções antigas...');
    await MesaModel.deleteMany({});
    await ReservaModel.deleteMany({});

    console.log('>>> [Seed] Semeando mesas padrão...');
    await MesaModel.insertMany(MESAS_INICIAIS);

    console.log('>>> [Seed] Semeando reservas de teste...');
    await ReservaModel.insertMany(RESERVAS_INICIAIS);

    console.log('>>> [Seed] Carga de dados concluída com sucesso!');
  } catch (erro) {
    console.error('>>> [Seed] Erro catastrófico ao semear o banco:', erro.message);
  } finally {
    // Desconecta do bd pra finalizar o script
    await mongoose.disconnect();
    console.log('>>> [Seed] Desconectado do MongoDB.');
    process.exit(0);
  }
}

semearBanco();
