import mongoose from 'mongoose';
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
  timestamps: true 
});
export const MesaModel = mongoose.models.Mesa || mongoose.model('Mesa', mesaSchema);
