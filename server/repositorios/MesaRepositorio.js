import { MesaModel } from '../modelos/Mesa.js';
export class MesaRepositorio {
  async obterTodasMesas() {
    const mesas = await MesaModel.find({}).lean();
    return mesas;
  }
  async salvarMesas(mesas) {
    const operacoes = mesas.map(mesa => ({
      updateOne: {
        filter: { numero: mesa.numero },
        update: { $set: { status: mesa.status, capacidade: mesa.capacidade } },
        upsert: true 
      }
    }));
    await MesaModel.bulkWrite(operacoes);
    return true;
  }
}
