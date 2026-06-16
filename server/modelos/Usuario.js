import mongoose from 'mongoose';

const UsuarioSchema = new mongoose.Schema({
  nome: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true,
    unique: true // Garante que não teremos dois usuários com o mesmo email
  },
  senha: { 
    type: String, 
    required: true 
  },
  perfil: {
    type: String,
    required: true,
    enum: ['ADMIN', 'ATENDENTE'], // Restringe os perfis aos que já existem no seu sistema
    default: 'ATENDENTE'
  }
});

export default mongoose.model('Usuario', UsuarioSchema);