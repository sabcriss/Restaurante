import { conectarBanco } from './db.js';
import { MesaModel } from './modelos/Mesa.js';
import { ReservaModel } from './modelos/Reserva.js';
import { PedidoModel } from './modelos/Pedido.js';
import ProdutoCardapioModel from './modelos/ProdutoCardapio.js';
import UsuarioModel from './modelos/Usuario.js';
import mongoose from 'mongoose';

/* ==============================
   CONFIGURAÇÕES DO SCRIPT
   ============================== */

// Carga inicial de mesas para teste e simulação de capacidade do salão.
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

// Reservas de simulação para verificar conflitos de horário e fluxo de reservas pendentes.
const RESERVAS_INICIAIS = [
  { id: 'RES-001', clienteNome: 'João Silva', dataHora: '2026-06-15T19:00', quantidadePessoas: 4, mesaNumero: 'Mesa 5', status: 'Confirmada' },
  { id: 'RES-002', clienteNome: 'Maria Santos', dataHora: '2026-06-15T20:00', quantidadePessoas: 2, mesaNumero: 'Mesa 3', status: 'Confirmada' },
  { id: 'RES-003', clienteNome: 'Ana Paula', dataHora: '2026-06-16T19:30', quantidadePessoas: 6, mesaNumero: 'Mesa 8', status: 'Pendente' },
  { id: 'RES-004', clienteNome: 'Pedro Costa', dataHora: '2026-06-14T18:00', quantidadePessoas: 3, mesaNumero: 'Mesa 2', status: 'Cancelada' },
];

// Produtos iniciais para povoar o cardápio do restaurante em diferentes categorias.
const PRODUTOS_INICIAIS = [
  {
    nome: 'Bruschetta di Pomodoro',
    precoBase: 28.90,
    categoria: 'Entradas',
    informacoesExtras: { ingredientes: ['Pão italiano', 'Tomate', 'Manjericão', 'Azeite de oliva'] }
  },
  {
    nome: 'Carpaccio de Mignon',
    precoBase: 42.00,
    categoria: 'Entradas',
    informacoesExtras: { ingredientes: ['Fatias finas de mignon', 'Alcaparras', 'Mostarda', 'Parmesão'] }
  },
  {
    nome: 'Filé Mignon ao Molho Madeira',
    precoBase: 78.00,
    categoria: 'Pratos Principais',
    informacoesExtras: { tempoPreparo: '25 min', serve: '1 pessoa' }
  },
  {
    nome: 'Risoto de Camarão com Limão Siciliano',
    precoBase: 85.00,
    categoria: 'Pratos Principais',
    informacoesExtras: { tempoPreparo: '20 min', serve: '1 pessoa' }
  },
  {
    nome: 'Fettuccine Alfredo com Frango',
    precoBase: 65.00,
    categoria: 'Pratos Principais',
    informacoesExtras: { serve: '1 pessoa' }
  },
  {
    nome: 'Petit Gâteau com Sorvete',
    precoBase: 24.90,
    categoria: 'Sobremesas',
    informacoesExtras: { saborSorvete: 'Creme' }
  },
  {
    nome: 'Tiramisù Clássico',
    precoBase: 29.00,
    categoria: 'Sobremesas',
    informacoesExtras: { alcoolico: true }
  },
  {
    nome: 'Vinho Tinto Cabernet Sauvignon (Taça)',
    precoBase: 22.00,
    categoria: 'Bebidas'
  },
  {
    nome: 'Suco Natural de Laranja',
    precoBase: 12.00,
    categoria: 'Bebidas'
  },
  {
    nome: 'Água Mineral sem Gás',
    precoBase: 6.00,
    categoria: 'Bebidas'
  }
];

// Pedidos pré-existentes para alimentar o fluxo de cozinha e histórico financeiro de teste.
const PEDIDOS_INICIAIS = [
  {
    id: 'PED-001',
    mesaNumero: 'Mesa 3',
    clienteNome: 'Maria Santos',
    itens: [
      { nome: 'Risoto de Camarão com Limão Siciliano', quantidade: 1, precoUnitario: 85.00, categoria: 'Prato Principal' },
      { nome: 'Suco Natural de Laranja', quantidade: 1, precoUnitario: 12.00, categoria: 'Bebida' }
    ],
    valorTotal: 97.00,
    status: 'Preparando',
    observacoes: 'Sem cebola no risoto',
    dataAbertura: '2026-06-16T19:30'
  },
  {
    id: 'PED-002',
    mesaNumero: 'Mesa 5',
    clienteNome: 'João Silva',
    itens: [
      { nome: 'Bruschetta di Pomodoro', quantidade: 2, precoUnitario: 28.90, categoria: 'Entrada' },
      { nome: 'Filé Mignon ao Molho Madeira', quantidade: 2, precoUnitario: 78.00, categoria: 'Prato Principal' },
      { nome: 'Vinho Tinto Cabernet Sauvignon (Taça)', quantidade: 2, precoUnitario: 22.00, categoria: 'Bebida' }
    ],
    valorTotal: 257.80,
    status: 'Aberto',
    observacoes: 'Trazer os vinhos primeiro',
    dataAbertura: '2026-06-16T20:00'
  },
  {
    id: 'PED-003',
    mesaNumero: 'Mesa 8',
    clienteNome: 'Ana Paula',
    itens: [
      { nome: 'Fettuccine Alfredo com Frango', quantidade: 1, precoUnitario: 65.00, categoria: 'Prato Principal' },
      { nome: 'Petit Gâteau com Sorvete', quantidade: 1, precoUnitario: 24.90, categoria: 'Sobremesa' },
      { nome: 'Água Mineral sem Gás', quantidade: 1, precoUnitario: 6.00, categoria: 'Bebida' }
    ],
    valorTotal: 95.90,
    status: 'Entregue',
    observacoes: '',
    dataAbertura: '2026-06-16T19:45'
  }
];

// Usuários iniciais do sistema com perfis administrativos e de atendimento operacional.
const USUARIOS_INICIAIS = [
  {
    nome: 'Administrador Principal',
    email: 'admin@restaurante.com',
    senha: 'admin123',
    perfil: 'ADMIN'
  },
  {
    nome: 'Carlos Atendente',
    email: 'carlos@restaurante.com',
    senha: 'carlos123',
    perfil: 'ATENDENTE'
  },
  {
    nome: 'Mariana Silva',
    email: 'mariana@restaurante.com',
    senha: 'mariana123',
    perfil: 'ATENDENTE'
  }
];

/**
 * @function semearBanco
 * @description Apaga os registros anteriores de mesas, reservas, produtos, pedidos e usuários, inserindo novos dados de teste estruturados.
 * @returns {Promise<void>}
 */
async function semearBanco() {
  try {
    await conectarBanco();

    console.log('>>> [Seed] Limpando coleções antigas...');
    await MesaModel.deleteMany({});
    await ReservaModel.deleteMany({});
    await PedidoModel.deleteMany({});
    await ProdutoCardapioModel.deleteMany({});
    await UsuarioModel.deleteMany({});

    console.log('>>> [Seed] Semeando mesas padrão...');
    await MesaModel.insertMany(MESAS_INICIAIS);

    console.log('>>> [Seed] Semeando reservas de teste...');
    await ReservaModel.insertMany(RESERVAS_INICIAIS);

    console.log('>>> [Seed] Semeando produtos do cardápio...');
    await ProdutoCardapioModel.insertMany(PRODUTOS_INICIAIS);

    console.log('>>> [Seed] Semeando pedidos de teste...');
    await PedidoModel.insertMany(PEDIDOS_INICIAIS);

    console.log('>>> [Seed] Semeando usuários padrão...');
    await UsuarioModel.insertMany(USUARIOS_INICIAIS);

    console.log('>>> [Seed] Carga de dados de teste concluída com sucesso!');
  } catch (erro) {
    console.error('>>> [Seed] Erro catastrófico ao semear o banco:', erro.message);
  } finally {
    // Desconecta do banco de dados para liberar a execução do script
    await mongoose.disconnect();
    console.log('>>> [Seed] Desconectado do MongoDB.');
    process.exit(0);
  }
}

semearBanco();
