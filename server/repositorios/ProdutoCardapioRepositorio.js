import ProdutoCardapio from '../modelos/ProdutoCardapio.js';

export class ProdutoCardapioRepositorio {
  async criar(dadosProduto) {
    const novoProduto = new ProdutoCardapio(dadosProduto);
    return await novoProduto.save();
  }

  async buscarTodos() {
    return await ProdutoCardapio.find();
  }

  async atualizar(id, dadosAtualizados) {
    return await ProdutoCardapio.findByIdAndUpdate(id, dadosAtualizados, { new: true });
  }

  async deletar(id) {
    return await ProdutoCardapio.findByIdAndDelete(id);
  }
}