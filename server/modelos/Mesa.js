import mongoose from 'mongoose';

/**
 * Schema do Mongoose representando uma mesa no restaurante.
 */
const mesaSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  capacidade: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    required: true,
    enum: ['Disponível', 'Reservada', 'Ocupada'],
    default: 'Disponível'
  }
}, {
  timestamps: true // Comentário explicativo do PORQUÊ: Criar registros automáticos de data de criação e modificação para auditorias.
});

// Comentário explicativo do PORQUÊ: Exportar o modelo compilado ou retornar o modelo já existente para evitar erros de compilação em hot reload.
export const MesaModel = mongoose.models.Mesa || mongoose.model('Mesa', mesaSchema);
