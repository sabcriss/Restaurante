/* ==============================
   CONFIGURAÇÕES DO SCRIPT
   ============================== */
const URL_PEDIDOS = '/api/pedidos';

/**
 * @class PedidoRepositorio
 * @description Camada de persistência de pedidos no frontend.
 * Faz requisições HTTP assíncronas para a API REST do backend.
 */
export class PedidoRepositorio {

  /**
   * Obtém todos os pedidos cadastrados via requisição GET.
   * @returns {Promise<Array<Object>>} Lista de pedidos.
   */
  async obterTodosPedidos() {
    try {
      const resposta = await fetch(URL_PEDIDOS);
      if (!resposta.ok) {
        throw new Error(`Erro de rede: Código ${resposta.status}`);
      }
      return await resposta.json();
    } catch (erro) {
      console.error('Erro ao obter pedidos do backend:', erro);
      throw erro;
    }
  }

  /**
   * Cria um novo pedido via requisição POST.
   * @param {Object} dadosPedido - Dados do pedido a ser criado.
   * @returns {Promise<Object>} O pedido criado retornado pelo servidor.
   */
  async criarPedido(dadosPedido) {
    try {
      const resposta = await fetch(URL_PEDIDOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosPedido)
      });
      if (!resposta.ok) {
        throw new Error(`Erro de rede ao criar pedido: Código ${resposta.status}`);
      }
      return await resposta.json();
    } catch (erro) {
      console.error('Erro ao criar pedido no backend:', erro);
      throw erro;
    }
  }

  /**
   * Atualiza um pedido existente via requisição PATCH.
   * @param {string} id - Código único do pedido.
   * @param {Object} dadosAtualizados - Campos a serem atualizados.
   * @returns {Promise<Object>} Resposta do servidor.
   */
  async atualizarPedido(id, dadosAtualizados) {
    try {
      const resposta = await fetch(`${URL_PEDIDOS}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizados)
      });
      if (!resposta.ok) {
        throw new Error(`Erro de rede ao atualizar pedido: Código ${resposta.status}`);
      }
      return await resposta.json();
    } catch (erro) {
      console.error('Erro ao atualizar pedido no backend:', erro);
      throw erro;
    }
  }

  /**
   * Remove um pedido via requisição DELETE.
   * @param {string} id - Código único do pedido.
   * @returns {Promise<Object>} Resposta do servidor.
   */
  async excluirPedido(id) {
    try {
      const resposta = await fetch(`${URL_PEDIDOS}/${id}`, {
        method: 'DELETE'
      });
      if (!resposta.ok) {
        throw new Error(`Erro de rede ao excluir pedido: Código ${resposta.status}`);
      }
      return await resposta.json();
    } catch (erro) {
      console.error('Erro ao excluir pedido no backend:', erro);
      throw erro;
    }
  }
}
