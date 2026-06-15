import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { conectarBanco } from './db.js';
import { ReservaRepositorio } from './repositorios/ReservaRepositorio.js';
import { MesaRepositorio } from './repositorios/MesaRepositorio.js';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();
const PORTA = process.env.PORT || 5001;

// Instanciação dos repositórios NoSQL de backend
const repositorioReservas = new ReservaRepositorio();
const repositorioMesas = new MesaRepositorio();

// Middlewares
app.use(cors());
app.use(express.json()); // Processa requisições em JSON

/* ==============================
   ROTAS DA API REST
   ============================== */

/**
 * @route GET /api/reservas
 * @description Retorna a lista das reservas no BD.
 */
app.get('/api/reservas', async (req, res) => {
  try {
    const reservas = await repositorioReservas.obterTodasReservas();
    res.json(reservas);
  } catch (erro) {
    console.error('Erro ao buscar reservas:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao carregar reservas.' });
  }
});

/**
 * @route POST /api/reservas
 * @description Atualiza ou insere em lote a lista de reservas.
 */
app.post('/api/reservas', async (req, res) => {
  try {
    const reservas = req.body;
    if (!Array.isArray(reservas)) {
      return res.status(400).json({ erro: 'O payload de reservas deve ser uma lista (Array).' });
    }
    await repositorioReservas.salvarReservas(reservas);
    res.json({ sucesso: true, mensagem: 'Reservas salvas com sucesso no MongoDB.' });
  } catch (erro) {
    console.error('Erro ao salvar reservas:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao salvar reservas.' });
  }
});

/**
 * @route GET /api/mesas
 * @description Retorna a lista das mesas no BD.
 */
app.get('/api/mesas', async (req, res) => {
  try {
    const mesas = await repositorioMesas.obterTodasMesas();
    res.json(mesas);
  } catch (erro) {
    console.error('Erro ao buscar mesas:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao carregar mesas.' });
  }
});

/**
 * @route POST /api/mesas
 * @description Atualiza ou insere em lote a lista das mesas.
 */
app.post('/api/mesas', async (req, res) => {
  try {
    const mesas = req.body;
    if (!Array.isArray(mesas)) {
      return res.status(400).json({ erro: 'O payload de mesas deve ser uma lista (Array).' });
    }
    await repositorioMesas.salvarMesas(mesas);
    res.json({ sucesso: true, mensagem: 'Mesas salvas com sucesso no MongoDB.' });
  } catch (erro) {
    console.error('Erro ao salvar mesas:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao salvar mesas.' });
  }
});

/**
 * Inicializa o servidor com conexão prévia ao bd.
 */
async function iniciarServidor() {
  await conectarBanco();

  app.listen(PORTA, () => {
    console.log(`>>> [Backend] Servidor rodando com sucesso na porta ${PORTA}.`);
  });
}

iniciarServidor();
