import mongoose from 'mongoose';
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
    type: String, 
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
  timestamps: true 
});
export const ReservaModel = mongoose.models.Reserva || mongoose.model('Reserva', reservaSchema);
