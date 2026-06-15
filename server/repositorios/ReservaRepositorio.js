/* ==============================
   CONFIGURAÇÕES DO SCRIPT
   ============================== */
import { ReservaModel } from '../modelos/Reserva.js';

/**
 * @class ReservaRepositorio
 * @description Encapsula as operações do MongoDB para acesso a dados das reservas.
 * Oferece uma camada de abstração limpa de persistência para as regras de negócio.
 */
export class ReservaRepositorio {

  /**
   * Obtém todas as reservas cadastradas.
   * @returns {Promise<Array<Object>>} Lista de todas as reservas.
   */
  async obterTodasReservas() {
    // Usa lean() para obter JSON puro e economizar recursos do wrapper do Mongoose
    return await ReservaModel.find({}).lean();
  }

  /**
   * Salva uma lista completa de reservas (usado pelo motor de expiração automática ou sincronizações).
   * @param {Array<Object>} reservas - Lista de reservas atualizada.
   * @returns {Promise<boolean>}
   */
  async salvarReservas(reservas) {
    // Executa atualizações e inserções em lote de forma atômica
    const operacoes = reservas.map(res => ({
      updateOne: {
        filter: { id: res.id },
        update: { 
          $set: { 
            clienteNome: res.clienteNome,
            dataHora: res.dataHora,
            quantidadePessoas: res.quantidadePessoas,
            mesaNumero: res.mesaNumero,
            status: res.status,
            observacaoAuto: res.observacaoAuto
          } 
        },
        upsert: true
      }
    }));

    if (operacoes.length > 0) {
      await ReservaModel.bulkWrite(operacoes);
    }
    return true;
  }

  /**
   * Remove uma reserva pelo código identificador único.
   * @param {string} id - Código da reserva.
   * @returns {Promise<boolean>}
   */
  async excluirReserva(id) {
    const resultado = await ReservaModel.deleteOne({ id });
    return resultado.deletedCount > 0;
  }
}
