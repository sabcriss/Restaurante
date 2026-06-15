import { MesaModel } from '../modelos/Mesa.js';

/**
 * @class MesaRepositorio
 * @description Encapsula as operações do bd pra acessar os dados das mesas.
 * Facilita a manutenção e migração de bd.
 */
export class MesaRepositorio {

  /**
   * Busca as mesas cadastradas no bd.
   * @returns {Promise<Array<Object>>} Lista de mesas obtidas do banco.
   */
  async obterTodasMesas() {
    const mesas = await MesaModel.find({}).lean();
    return mesas;
  }

  /**
   * Atualiza a lista de mesas ou uma mesa individualmente.
   * @param {Array<Object>} mesas - Lista de mesas pra atualizar ou sobrescrever no banco.
   * @returns {Promise<boolean>} Retorna true se a operação foi bem sucedida.
   */
  async salvarMesas(mesas) {
    const operacoes = mesas.map(mesa => ({
      updateOne: {
        filter: { numero: mesa.numero },
        update: { $set: { status: mesa.status, capacidade: mesa.capacidade } },
        upsert: true // cria a mesa se ela não existir
      }
    }));

    await MesaModel.bulkWrite(operacoes);
    return true;
  }
}
