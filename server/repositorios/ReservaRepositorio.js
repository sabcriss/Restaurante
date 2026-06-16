import { ReservaModel } from '../modelos/Reserva.js';
export class ReservaRepositorio {
  async obterTodasReservas() {
    return await ReservaModel.find({}).lean();
  }
  async salvarReservas(reservas) {
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
  async excluirReserva(id) {
    const resultado = await ReservaModel.deleteOne({ id });
    return resultado.deletedCount > 0;
  }
}
