import Usuario from '../modelos/Usuario.js';

export class UsuarioRepositorio {
  // CREATE
  async criar(dadosUsuario) {
    const novoUsuario = new Usuario(dadosUsuario);
    return await novoUsuario.save();
  }

  // READ
  async buscarTodos() {
    return await Usuario.find();
  }

  // UPDATE
  async atualizar(id, dadosAtualizados) {
    return await Usuario.findByIdAndUpdate(id, dadosAtualizados, { new: true });
  }

  // DELETE
  async deletar(id) {
    return await Usuario.findByIdAndDelete(id);
  }
}