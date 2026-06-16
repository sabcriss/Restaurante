import mongoose from 'mongoose';

const ProdutoCardapioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  precoBase: { type: Number, required: true },
  categoria: { 
    type: String, 
    required: true,
    enum: ['Entradas', 'Pratos Principais', 'Bebidas', 'Sobremesas'] 
  },
  informacoesExtras: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

export default mongoose.model('ProdutoCardapio', ProdutoCardapioSchema);