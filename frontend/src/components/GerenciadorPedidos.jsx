import React, { useState, useEffect, useCallback } from 'react';
import { PedidoServico } from '../servicos/PedidoServico';
import { buscarProdutos } from '../servicos/produtoServico';
import './GerenciadorPedidos.css';

/* ==============================
   CONFIGURAÇÕES DO COMPONENTE
   ============================== */
const servicoPedidos = new PedidoServico();

/** Sequência de avanço de status do ciclo de vida do pedido */
const FLUXO_STATUS = {
  Aberto: 'Preparando',
  Preparando: 'Pronto',
  Pronto: 'Entregue'
};

/** Mapeamento de status para classe CSS e rótulo */
const CONFIG_STATUS = {
  Aberto:     { classe: 'badge-aberto',     rotulo: 'Aberto' },
  Preparando: { classe: 'badge-preparando', rotulo: 'Preparando' },
  Pronto:     { classe: 'badge-pronto',     rotulo: 'Pronto' },
  Entregue:   { classe: 'badge-entregue',   rotulo: 'Entregue' },
  Cancelado:  { classe: 'badge-cancelado',  rotulo: 'Cancelado' }
};

/** Estado inicial de um item de pedido vazio */
const ITEM_VAZIO = { nome: '', quantidade: 1, precoUnitario: '', categoria: 'Prato Principal' };

/** Estado inicial do formulário de pedido */
const FORMULARIO_VAZIO = {
  mesaNumero: '',
  clienteNome: '',
  itens: [{ ...ITEM_VAZIO }],
  observacoes: ''
};

/* ============================================================
   SUB-COMPONENTES
   ============================================================ */

/**
 * @function BadgeStatus
 * @description Exibe um badge colorido de acordo com o status do pedido.
 * @param {{ status: string }} props
 */
function BadgeStatus({ status }) {
  const config = CONFIG_STATUS[status] || { classe: '', rotulo: status };
  return (
    <span className={`badge-status-pedido ${config.classe}`}>
      {config.rotulo}
    </span>
  );
}

/**
 * @function CardMetrica
 * @description Exibe um card de métrica com contagem de pedidos por status.
 * @param {{ rotulo: string, valor: number, corBorda: string }} props
 */
function CardMetrica({ rotulo, valor, corBorda }) {
  return (
    <div className="pedido-metrica-card" style={{ '--cor-status': corBorda }}>
      <span className="pedido-metrica-label">{rotulo}</span>
      <span className="pedido-metrica-valor">{valor}</span>
    </div>
  );
}

/**
 * @function LinhaItemPedido
 * @description Linha de formulário para um único item do pedido com seleção baseada no cardápio.
 * @param {{ item: Object, indice: number, produtosCardapio: Array, onAlterarItem: Function, onRemoverItem: Function }} props
 */
function LinhaItemPedido({ item, indice, produtosCardapio, onAlterarItem, onRemoverItem }) {
  /**
   * Propaga a alteração de um campo do item para o componente pai.
   * Auto-preenche o preço e a categoria correspondente ao selecionar o produto.
   * @param {React.ChangeEvent} evento
   */
  const handleAlteracao = (evento) => {
    const { name, value } = evento.target;
    
    if (name === 'nome') {
      const produtoSelecionado = produtosCardapio.find(prod => prod.nome === value);
      if (produtoSelecionado) {
        // PORQUÊ: O banco exige categorias no singular (ex: 'Prato Principal'),
        // enquanto o cardápio no banco está no plural (ex: 'Pratos Principais').
        const MAPA_CATEGORIAS = {
          'Entradas': 'Entrada',
          'Pratos Principais': 'Prato Principal',
          'Bebidas': 'Bebida',
          'Sobremesas': 'Sobremesa'
        };
        const categoriaMapeada = MAPA_CATEGORIAS[produtoSelecionado.categoria] || 'Prato Principal';

        onAlterarItem(indice, {
          nome: produtoSelecionado.nome,
          precoUnitario: produtoSelecionado.precoBase,
          categoria: categoriaMapeada
        });
      } else {
        onAlterarItem(indice, {
          nome: '',
          precoUnitario: '',
          categoria: 'Prato Principal'
        });
      }
    } else {
      onAlterarItem(indice, name, value);
    }
  };

  return (
    <div className="pedido-item-linha">
      <select
        name="nome"
        value={item.nome}
        onChange={handleAlteracao}
        required
      >
        <option value="">Selecione um produto</option>
        {produtosCardapio.map(prod => (
          <option key={prod._id || prod.nome} value={prod.nome}>
            {prod.nome} (R$ {(prod.precoBase || 0).toFixed(2).replace('.', ',')})
          </option>
        ))}
      </select>
      <input
        type="number"
        name="quantidade"
        placeholder="Qtd"
        min="1"
        value={item.quantidade}
        onChange={handleAlteracao}
      />
      <input
        type="number"
        name="precoUnitario"
        placeholder="R$ 0,00"
        min="0"
        step="0.01"
        value={item.precoUnitario}
        onChange={handleAlteracao}
        readOnly
        style={{ backgroundColor: '#f7fafc', cursor: 'not-allowed' }}
      />
      <button
        type="button"
        className="btn-remover-item"
        onClick={() => onRemoverItem(indice)}
        title="Remover item"
        aria-label={`Remover item ${item.nome || indice + 1}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

/**
 * @function ModalPedido
 * @description Modal de criação e edição de pedido com formulário dinâmico de itens.
 * Carrega a lista de produtos disponíveis do cardápio para vinculação nos itens.
 * @param {{ modoEdicao: boolean, pedidoInicial: Object|null, mesas: string[], onSalvar: Function, onFechar: Function }} props
 */
function ModalPedido({ modoEdicao, pedidoInicial, mesas, onSalvar, onFechar }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  const [produtosCardapio, setProdutosCardapio] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erroModal, setErroModal] = useState('');

  // Carrega os produtos do cardápio ao renderizar o modal para alimentar o dropdown
  useEffect(() => {
    async function carregarProdutosCardapio() {
      try {
        const dados = await buscarProdutos();
        setProdutosCardapio(dados);
      } catch (erro) {
        console.error('Erro ao buscar produtos do cardápio no modal:', erro);
      }
    }
    carregarProdutosCardapio();
  }, []);

  // Preenche o formulário ao abrir em modo de edição
  useEffect(() => {
    if (modoEdicao && pedidoInicial) {
      setFormulario({
        mesaNumero: pedidoInicial.mesaNumero,
        clienteNome: pedidoInicial.clienteNome,
        itens: pedidoInicial.itens?.length > 0 ? pedidoInicial.itens : [{ ...ITEM_VAZIO }],
        observacoes: pedidoInicial.observacoes || ''
      });
    } else {
      setFormulario({ ...FORMULARIO_VAZIO, itens: [{ ...ITEM_VAZIO }] });
    }
  }, [modoEdicao, pedidoInicial]);

  /** Calcula o total atual com base nos itens preenchidos */
  const totalCalculado = formulario.itens.reduce((acc, item) => {
    const preco = parseFloat(item.precoUnitario) || 0;
    const qtd = parseInt(item.quantidade, 10) || 0;
    return acc + preco * qtd;
  }, 0);

  const handleCampoGeral = (evento) => {
    const { name, value } = evento.target;
    setFormulario(ant => ({ ...ant, [name]: value }));
  };

  const handleAlterarItem = (indice, campoOuObjeto, valor) => {
    setFormulario(ant => {
      const novosItens = [...ant.itens];
      if (typeof campoOuObjeto === 'object' && campoOuObjeto !== null) {
        novosItens[indice] = { ...novosItens[indice], ...campoOuObjeto };
      } else {
        novosItens[indice] = { ...novosItens[indice], [campoOuObjeto]: valor };
      }
      return { ...ant, itens: novosItens };
    });
  };

  const handleAdicionarItem = () => {
    setFormulario(ant => ({
      ...ant,
      itens: [...ant.itens, { ...ITEM_VAZIO }]
    }));
  };

  const handleRemoverItem = (indice) => {
    setFormulario(ant => ({
      ...ant,
      itens: ant.itens.filter((_, i) => i !== indice)
    }));
  };

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    setErroModal('');
    setCarregando(true);
    try {
      const dadosNormalizados = {
        ...formulario,
        itens: formulario.itens.map(item => ({
          ...item,
          quantidade: parseInt(item.quantidade, 10),
          precoUnitario: parseFloat(item.precoUnitario) || 0
        }))
      };
      await onSalvar(dadosNormalizados, pedidoInicial?.id);
    } catch (erro) {
      setErroModal(erro.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="pedido-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-pedido-titulo">
      <div className="pedido-modal">
        <div className="pedido-modal-cabecalho">
          <h2 id="modal-pedido-titulo">{modoEdicao ? 'Editar Pedido' : 'Novo Pedido'}</h2>
          <button className="btn-fechar-modal" onClick={onFechar} aria-label="Fechar modal">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pedido-modal-corpo">
            {erroModal && (
              <div className="pedidos-feedback erro" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {erroModal}
              </div>
            )}

            <div className="pedido-form-linha">
              <div className="pedido-form-grupo">
                <label htmlFor="pedido-mesa">Mesa *</label>
                <select
                  id="pedido-mesa"
                  name="mesaNumero"
                  value={formulario.mesaNumero}
                  onChange={handleCampoGeral}
                  required
                >
                  <option value="">Selecione a mesa</option>
                  {mesas.map(mesa => (
                    <option key={mesa} value={mesa}>{mesa}</option>
                  ))}
                </select>
              </div>
              <div className="pedido-form-grupo">
                <label htmlFor="pedido-cliente">Nome do Cliente *</label>
                <input
                  id="pedido-cliente"
                  type="text"
                  name="clienteNome"
                  placeholder="Ex: João Silva"
                  value={formulario.clienteNome}
                  onChange={handleCampoGeral}
                  required
                />
              </div>
            </div>

            {/* Seção de itens dinâmicos */}
            <div className="pedido-itens-secao">
              <div className="pedido-itens-titulo">
                <span>Itens do Pedido *</span>
                <button type="button" className="btn-add-item" onClick={handleAdicionarItem}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Adicionar Item
                </button>
              </div>

              {/* Cabeçalho da tabela de itens */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 36px', gap: '8px', padding: '0 10px', marginBottom: '-4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#718096', textTransform: 'uppercase' }}>Item</span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#718096', textTransform: 'uppercase' }}>Qtd</span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#718096', textTransform: 'uppercase' }}>Preço Unit.</span>
                <span />
              </div>

              {formulario.itens.map((item, indice) => (
                <LinhaItemPedido
                  key={indice}
                  item={item}
                  indice={indice}
                  produtosCardapio={produtosCardapio}
                  onAlterarItem={handleAlterarItem}
                  onRemoverItem={handleRemoverItem}
                />
              ))}
            </div>

            {/* Preview do total */}
            <div className="pedido-total-preview">
              <span>Total do Pedido</span>
              <span className="pedido-total-valor">
                R$ {totalCalculado.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="pedido-form-grupo">
              <label htmlFor="pedido-observacoes">Observações</label>
              <textarea
                id="pedido-observacoes"
                name="observacoes"
                rows="2"
                placeholder="Alergias, pedidos especiais..."
                value={formulario.observacoes}
                onChange={handleCampoGeral}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="pedido-modal-rodape">
            <button type="button" className="btn-cancelar-modal" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn-salvar-modal" disabled={carregando} id="btn-salvar-pedido">
              {carregando ? 'Salvando...' : (modoEdicao ? 'Salvar Alterações' : 'Abrir Pedido')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * @function ModalConfirmacaoExclusao
 * @description Modal de confirmação antes de excluir um pedido.
 * @param {{ pedido: Object, onConfirmar: Function, onCancelar: Function }} props
 */
function ModalConfirmacaoExclusao({ pedido, onConfirmar, onCancelar }) {
  return (
    <div className="modal-confirmacao-overlay" role="dialog" aria-modal="true">
      <div className="modal-confirmacao">
        <div className="modal-confirmacao-icone">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <h3>Excluir Pedido</h3>
        <p>Tem certeza que deseja excluir o pedido <strong>{pedido?.id}</strong>? Esta ação não pode ser desfeita.</p>
        <div className="modal-confirmacao-acoes">
          <button className="btn-cancelar-modal" onClick={onCancelar}>Cancelar</button>
          <button className="btn-confirmar-exclusao" onClick={onConfirmar} id="btn-confirmar-exclusao">Excluir</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

/**
 * @function GerenciadorPedidos
 * @description Componente principal de gerenciamento de pedidos do restaurante.
 * Oferece CRUD completo (listar, criar, editar, excluir) e avanço do ciclo de
 * vida dos pedidos (Aberto → Preparando → Pronto → Entregue).
 * @returns {React.JSX.Element}
 */
function GerenciadorPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [carregando, setCarregando] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Controle de modais
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState(null);

  /**
   * Exibe uma mensagem de feedback temporária por 3 segundos.
   * @param {string} mensagem - Texto a exibir.
   * @param {'sucesso'|'erro'} tipo - Tipo do feedback visual.
   */
  const exibirFeedback = useCallback((mensagem, tipo = 'sucesso') => {
    setFeedback({ mensagem, tipo });
    setTimeout(() => setFeedback(null), 3500);
  }, []);

  /**
   * Carrega a lista de pedidos e mesas do backend.
   */
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [listaPedidos, listaMesas] = await Promise.all([
        servicoPedidos.obterTodosPedidos(),
        fetch('/api/mesas').then(r => r.json())
      ]);
      setPedidos(listaPedidos);
      // PORQUÊ: Extrai apenas os números das mesas para popular o select do formulário.
      setMesas(listaMesas.map(m => m.numero));
    } catch (erro) {
      console.error('Erro ao carregar pedidos:', erro);
      exibirFeedback('Erro ao carregar pedidos. Tente novamente.', 'erro');
    } finally {
      setCarregando(false);
    }
  }, [exibirFeedback]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // --- Handlers de CRUD ---

  const handleAbrirNovoPedido = () => {
    setModoEdicao(false);
    setPedidoSelecionado(null);
    setModalAberto(true);
  };

  const handleAbrirEdicao = (pedido) => {
    setModoEdicao(true);
    setPedidoSelecionado(pedido);
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setPedidoSelecionado(null);
  };

  /**
   * Salva ou edita um pedido conforme o modo atual do modal.
   * @param {Object} dadosFormulario - Dados vindos do formulário.
   * @param {string|undefined} idPedido - ID do pedido em edição (undefined se novo).
   */
  const handleSalvarPedido = async (dadosFormulario, idPedido) => {
    if (modoEdicao && idPedido) {
      await servicoPedidos.editarPedido(idPedido, dadosFormulario);
      exibirFeedback(`Pedido ${idPedido} atualizado com sucesso!`);
    } else {
      const novoPedido = await servicoPedidos.criarPedido(dadosFormulario);
      exibirFeedback(`Pedido ${novoPedido.id} aberto com sucesso!`);
    }
    handleFecharModal();
    await carregarDados();
  };

  /**
   * Avança o status do pedido para a próxima etapa do fluxo.
   * @param {Object} pedido - O pedido a ter o status avançado.
   */
  const handleAvancarStatus = async (pedido) => {
    const proximoStatus = FLUXO_STATUS[pedido.status];
    if (!proximoStatus) return;

    try {
      await servicoPedidos.atualizarStatusPedido(pedido.id, proximoStatus);
      exibirFeedback(`Pedido ${pedido.id} → ${proximoStatus}`);
      await carregarDados();
    } catch (erro) {
      exibirFeedback(erro.message, 'erro');
    }
  };

  const handleSolicitarExclusao = (pedido) => {
    setPedidoParaExcluir(pedido);
  };

  const handleConfirmarExclusao = async () => {
    if (!pedidoParaExcluir) return;
    try {
      await servicoPedidos.excluirPedido(pedidoParaExcluir.id);
      exibirFeedback(`Pedido ${pedidoParaExcluir.id} excluído.`);
      setPedidoParaExcluir(null);
      await carregarDados();
    } catch (erro) {
      exibirFeedback(erro.message, 'erro');
      setPedidoParaExcluir(null);
    }
  };

  // --- Filtragem e Métricas ---

  const pedidosFiltrados = pedidos.filter(pedido => {
    const correspondeStatus = filtroStatus === 'Todos' || pedido.status === filtroStatus;
    const termoBaixo = termoBusca.toLowerCase();
    const correspondeBusca =
      pedido.id?.toLowerCase().includes(termoBaixo) ||
      pedido.clienteNome?.toLowerCase().includes(termoBaixo) ||
      pedido.mesaNumero?.toLowerCase().includes(termoBaixo);
    return correspondeStatus && correspondeBusca;
  });

  const metricas = [
    { rotulo: 'Abertos', valor: pedidos.filter(p => p.status === 'Aberto').length, cor: '#1565c0' },
    { rotulo: 'Preparando', valor: pedidos.filter(p => p.status === 'Preparando').length, cor: '#e65100' },
    { rotulo: 'Prontos', valor: pedidos.filter(p => p.status === 'Pronto').length, cor: '#1b5e20' },
    { rotulo: 'Entregues Hoje', valor: pedidos.filter(p => p.status === 'Entregue').length, cor: '#6a1b9a' },
    { rotulo: 'Cancelados', valor: pedidos.filter(p => p.status === 'Cancelado').length, cor: '#822727' }
  ];

  // --- Renderização ---

  return (
    <div className="gerenciador-pedidos">

      {/* Mensagem de feedback */}
      {feedback && (
        <div className={`pedidos-feedback ${feedback.tipo}`} role="status" aria-live="polite">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {feedback.tipo === 'sucesso'
              ? <><polyline points="20 6 9 17 4 12"/></>
              : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
            }
          </svg>
          {feedback.mensagem}
        </div>
      )}

      {/* Cards de Métricas */}
      <section className="pedidos-metricas" aria-label="Métricas de pedidos">
        {metricas.map(m => (
          <CardMetrica key={m.rotulo} rotulo={m.rotulo} valor={m.valor} corBorda={m.cor} />
        ))}
      </section>

      {/* Barra de Ações */}
      <div className="pedidos-barra-acoes">
        <div className="pedidos-campo-busca">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            id="busca-pedidos"
            placeholder="Buscar por ID, cliente ou mesa..."
            value={termoBusca}
            onChange={e => setTermoBusca(e.target.value)}
            aria-label="Buscar pedidos"
          />
        </div>

        <select
          id="filtro-status-pedidos"
          className="pedidos-filtro-status"
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          aria-label="Filtrar por status"
        >
          <option value="Todos">Todos os Status</option>
          <option value="Aberto">Aberto</option>
          <option value="Preparando">Preparando</option>
          <option value="Pronto">Pronto</option>
          <option value="Entregue">Entregue</option>
          <option value="Cancelado">Cancelado</option>
        </select>

        <button id="btn-novo-pedido" className="btn-novo-pedido" onClick={handleAbrirNovoPedido}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Pedido
        </button>
      </div>

      {/* Tabela de Pedidos */}
      <div className="pedidos-tabela-card">
        <div className="pedidos-tabela-header">
          <h3>Lista de Pedidos</h3>
          <span className="pedidos-contagem">
            {pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {carregando ? (
          <div className="pedidos-estado-vazio">
            <p>Carregando pedidos...</p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="pedidos-estado-vazio">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
            <p>Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="pedidos-tabela-container">
            <table className="pedidos-tabela" aria-label="Tabela de pedidos">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Mesa</th>
                  <th>Cliente</th>
                  <th>Itens</th>
                  <th>Total</th>
                  <th>Abertura</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map(pedido => (
                  <tr key={pedido.id || pedido._id}>
                    <td>
                      <span className="pedido-id-cell">{pedido.id}</span>
                    </td>
                    <td>
                      <div className="pedido-mesa-cell">
                        <div className="pedido-mesa-icone">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 18v3"/><path d="M20 18v3"/><path d="M19 14v4"/><path d="M5 14v4"/>
                            <path d="M3 8h18v6H3z"/>
                          </svg>
                        </div>
                        {pedido.mesaNumero}
                      </div>
                    </td>
                    <td>{pedido.clienteNome}</td>
                    <td>
                      <span className="pedido-itens-resumo" title={pedido.itens?.map(i => i.nome).join(', ')}>
                        {pedido.itens?.length > 0
                          ? `${pedido.itens.length} item${pedido.itens.length > 1 ? 'ns' : ''} — ${pedido.itens[0]?.nome}${pedido.itens.length > 1 ? ', ...' : ''}`
                          : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="pedido-valor-total">
                        R$ {(pedido.valorTotal || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </td>
                    <td>
                      {pedido.dataAbertura
                        ? new Date(pedido.dataAbertura).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })
                        : '—'}
                    </td>
                    <td>
                      <BadgeStatus status={pedido.status} />
                    </td>
                    <td>
                      <div className="pedido-acoes-linha">
                        {/* Botão de edição — somente pedidos não finalizados */}
                        {pedido.status !== 'Entregue' && pedido.status !== 'Cancelado' && (
                          <button
                            className="btn-acao-pedido editar"
                            title="Editar pedido"
                            aria-label={`Editar pedido ${pedido.id}`}
                            onClick={() => handleAbrirEdicao(pedido)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        )}

                        {/* Botão de avanço de status — somente pedidos no fluxo */}
                        {FLUXO_STATUS[pedido.status] && (
                          <button
                            className="btn-acao-pedido avancar-status"
                            title={`Avançar para "${FLUXO_STATUS[pedido.status]}"`}
                            aria-label={`Avançar status de ${pedido.id}`}
                            onClick={() => handleAvancarStatus(pedido)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          </button>
                        )}

                        {/* Botão de exclusão */}
                        <button
                          className="btn-acao-pedido excluir"
                          title="Excluir pedido"
                          aria-label={`Excluir pedido ${pedido.id}`}
                          onClick={() => handleSolicitarExclusao(pedido)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}
      {modalAberto && (
        <ModalPedido
          modoEdicao={modoEdicao}
          pedidoInicial={pedidoSelecionado}
          mesas={mesas}
          onSalvar={handleSalvarPedido}
          onFechar={handleFecharModal}
        />
      )}

      {pedidoParaExcluir && (
        <ModalConfirmacaoExclusao
          pedido={pedidoParaExcluir}
          onConfirmar={handleConfirmarExclusao}
          onCancelar={() => setPedidoParaExcluir(null)}
        />
      )}
    </div>
  );
}

export default GerenciadorPedidos;
