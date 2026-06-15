import mongoose from 'mongoose';

/**
 * Schema do Mongoose representando uma reserva de mesa no restaurante.
 */
const reservaSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  clienteNome: {
    type: String,
    required: true,
    trim: true
  },
  dataHora: {
    type: String, // Comentário explicativo do PORQUÊ: Mantemos o formato string ISO 8601 YYYY-MM-DDTHH:MM para alinhamento direto com o input de datetime-local do frontend.
    required: true
  },
  quantidadePessoas: {
    type: Number,
    required: true,
    min: 1
  },
  mesaNumero: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Pendente', 'Confirmada', 'Ocupada', 'Cancelada', 'Concluída'],
    default: 'Pendente'
  },
  observacaoAuto: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Comentário explicativo do PORQUÊ: Monitorar auditoria de criação e última alteração de reservas.
});

// Comentário explicativo do PORQUÊ: Garantir exportação idempotente compatível com reinicializações do node em desenvolvimento.
export const ReservaModel = mongoose.models.Reserva || mongoose.model('Reserva', reservaSchema);
