/* ==============================
   CONFIGURAÇÕES DO SCRIPT
   ============================== */
import { PedidoRepositorio } from '../repositorios/PedidoRepositorio';

/* Prefixo padrão para geração de IDs únicos de pedido */
const PREFIXO_ID_PEDIDO = 'PED';

/* Status válidos para o ciclo de vida de um pedido */
const STATUS_PERMITIDOS = ['Aberto', 'Preparando', 'Pronto', 'Entregue', 'Cancelado'];

/**
 * @class PedidoServico
 * @description Camada de serviço contendo as regras de negócio para gerenciamento de pedidos.
 * Atua como intermediário entre a camada de apresentação e a camada de repositório.
 */
export class PedidoServico {

  /**
   * Inicializa o serviço com injeção de dependência do repositório.
   * @param {PedidoRepositorio} [repositorio] - Instância opcional para injeção de dependência.
   */
  constructor(repositorio = new PedidoRepositorio()) {
    /** @private */
    this.repositorio = repositorio;
  }

  /**
   * Obtém todos os pedidos cadastrados no sistema.
   * @returns {Promise<Array<Object>>} Lista de pedidos.
   */
  async obterTodosPedidos() {
    return await this.repositorio.obterTodosPedidos();
  }

  /**
   * Cria um novo pedido aplicando as validações de regra de negócio.
   * @param {Object} dadosPedido - Dados do pedido a ser criado.
   * @param {string} dadosPedido.mesaNumero - Número da mesa do pedido.
   * @param {string} dadosPedido.clienteNome - Nome do cliente responsável.
   * @param {Array<Object>} dadosPedido.itens - Lista de itens do pedido.
   * @param {string} [dadosPedido.observacoes] - Observações opcionais.
   * @returns {Promise<Object>} O pedido criado.
   */
  async criarPedido(dadosPedido) {
    this.validarDadosObrigatorios(dadosPedido);
    this.validarItens(dadosPedido.itens);

    const valorTotal = this.calcularValorTotal(dadosPedido.itens);

    // PORQUÊ: O timestamp atual garante unicidade e rastreabilidade do momento de abertura do pedido.
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    const dataAbertura = agora.toISOString().slice(0, 16);

    const novoPedido = {
      id: this.gerarIdUnico(),
      mesaNumero: dadosPedido.mesaNumero,
      clienteNome: dadosPedido.clienteNome.trim(),
      itens: dadosPedido.itens,
      valorTotal,
      status: 'Aberto',
      observacoes: dadosPedido.observacoes?.trim() || '',
      dataAbertura
    };

    return await this.repositorio.criarPedido(novoPedido);
  }

  /**
   * Atualiza o status de um pedido seguindo o fluxo permitido.
   * @param {string} id - Código único do pedido.
   * @param {string} novoStatus - Novo status desejado.
   * @returns {Promise<boolean>} Verdadeiro se atualizado com sucesso.
   */
  async atualizarStatusPedido(id, novoStatus) {
    if (!STATUS_PERMITIDOS.includes(novoStatus)) {
      throw new Error(`Status inválido: "${novoStatus}". Os status permitidos são: ${STATUS_PERMITIDOS.join(', ')}.`);
    }

    return await this.repositorio.atualizarPedido(id, { status: novoStatus });
  }

  /**
   * Atualiza os dados completos de um pedido (itens, observações, etc).
   * @param {string} id - Código único do pedido.
   * @param {Object} dadosAtualizados - Campos atualizados.
   * @returns {Promise<boolean>} Verdadeiro se atualizado com sucesso.
   */
  async editarPedido(id, dadosAtualizados) {
    if (dadosAtualizados.itens) {
      this.validarItens(dadosAtualizados.itens);
      dadosAtualizados.valorTotal = this.calcularValorTotal(dadosAtualizados.itens);
    }

    return await this.repositorio.atualizarPedido(id, dadosAtualizados);
  }

  /**
   * Remove um pedido do sistema. Apenas pedidos Cancelados ou Entregues podem ser excluídos.
   * @param {string} id - Código único do pedido.
   * @returns {Promise<boolean>} Verdadeiro se excluído com sucesso.
   */
  async excluirPedido(id) {
    return await this.repositorio.excluirPedido(id);
  }

  /**
   * Calcula o valor total de um pedido somando preço × quantidade de cada item.
   * @param {Array<Object>} itens - Lista de itens do pedido.
   * @returns {number} O valor total calculado.
   */
  calcularValorTotal(itens) {
    return itens.reduce((acumulador, item) => {
      return acumulador + (item.precoUnitario * item.quantidade);
    }, 0);
  }

  /**
   * Gera um ID único para um novo pedido.
   * @returns {string} ID no formato 'PED-XXX'.
   * @private
   */
  gerarIdUnico() {
    return `${PREFIXO_ID_PEDIDO}-${Math.floor(100 + Math.random() * 900)}`;
  }

  /**
   * Valida a presença dos dados obrigatórios para criação de um pedido.
   * @param {Object} dados - Dados do pedido a serem validados.
   * @throws {Error} Se algum campo obrigatório estiver ausente.
   * @private
   */
  validarDadosObrigatorios(dados) {
    if (!dados.mesaNumero || !dados.clienteNome?.trim()) {
      throw new Error('Mesa e nome do cliente são obrigatórios para abrir um pedido.');
    }
  }

  /**
   * Valida se a lista de itens do pedido é válida e não está vazia.
   * @param {Array<Object>} itens - Itens do pedido a validar.
   * @throws {Error} Se a lista for inválida ou vazia.
   * @private
   */
  validarItens(itens) {
    if (!Array.isArray(itens) || itens.length === 0) {
      throw new Error('O pedido deve conter pelo menos um item.');
    }
    itens.forEach((item, indice) => {
      if (!item.nome?.trim()) {
        throw new Error(`O item na posição ${indice + 1} deve ter um nome válido.`);
      }
      if (!item.quantidade || item.quantidade < 1) {
        throw new Error(`O item "${item.nome}" deve ter quantidade mínima de 1.`);
      }
      if (item.precoUnitario === undefined || item.precoUnitario < 0) {
        throw new Error(`O item "${item.nome}" deve ter um preço unitário válido.`);
      }
    });
  }
}
