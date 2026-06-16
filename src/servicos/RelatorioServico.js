/* ==============================
   CONFIGURAÇÕES DO SCRIPT
   ============================== */

/** URL base dos endpoints de dados */
const URL_RESERVAS = '/api/reservas';
const URL_PEDIDOS = '/api/pedidos';

/** Delimitador padrão para arquivos CSV */
const DELIMITADOR_CSV = ';';

/**
 * @class RelatorioServico
 * @description Serviço responsável por agregar, filtrar e formatar
 * os dados de reservas e pedidos para geração de relatórios exportáveis.
 * Não persiste dados — opera sobre snapshots dos endpoints existentes.
 */
export class RelatorioServico {

  /* ── Métodos de Busca de Dados ─────────────────────────────────── */

  /**
   * Busca todas as reservas cadastradas no sistema.
   * @returns {Promise<Array<Object>>} Lista de reservas.
   */
  async buscarReservas() {
    try {
      const resposta = await fetch(URL_RESERVAS);
      if (!resposta.ok) throw new Error(`Erro ${resposta.status} ao buscar reservas.`);
      return await resposta.json();
    } catch (erro) {
      console.error('[RelatorioServico] buscarReservas:', erro);
      throw erro;
    }
  }

  /**
   * Busca todos os pedidos cadastrados no sistema.
   * @returns {Promise<Array<Object>>} Lista de pedidos.
   */
  async buscarPedidos() {
    try {
      const resposta = await fetch(URL_PEDIDOS);
      if (!resposta.ok) throw new Error(`Erro ${resposta.status} ao buscar pedidos.`);
      return await resposta.json();
    } catch (erro) {
      console.error('[RelatorioServico] buscarPedidos:', erro);
      throw erro;
    }
  }

  /* ── Métodos de Filtragem ──────────────────────────────────────── */

  /**
   * Filtra uma lista de registros com base em um intervalo de datas.
   * @param {Array<Object>} registros - Lista de registros com campo de data.
   * @param {string} campoDatas - Nome do campo de data/hora no objeto.
   * @param {string} dataInicio - Data de início no formato YYYY-MM-DD.
   * @param {string} dataFim - Data de fim no formato YYYY-MM-DD.
   * @returns {Array<Object>} Registros dentro do intervalo.
   */
  filtrarPorPeriodo(registros, campoDatas, dataInicio, dataFim) {
    // PORQUÊ: Comparamos apenas datas (sem hora) para incluir registros no dia inteiro de início e fim.
    const inicio = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T23:59:59`);

    return registros.filter(registro => {
      const dataRegistro = new Date(registro[campoDatas]);
      return dataRegistro >= inicio && dataRegistro <= fim;
    });
  }

  /* ── Métodos de Formatação de Dados ───────────────────────────── */

  /**
   * Formata uma lista de reservas para estrutura de relatório tabular.
   * @param {Array<Object>} reservas - Lista de reservas a formatar.
   * @returns {Array<Object>} Registros formatados prontos para exportação.
   */
  formatarRelatorioReservas(reservas) {
    return reservas.map(reserva => ({
      'Código': reserva.id || '—',
      'Cliente': reserva.clienteNome || '—',
      'Mesa': reserva.mesaNumero || '—',
      'Pessoas': reserva.quantidadePessoas ?? '—',
      'Data': reserva.dataHora
        ? new Date(reserva.dataHora).toLocaleDateString('pt-BR')
        : '—',
      'Hora': reserva.dataHora
        ? new Date(reserva.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '—',
      'Status': reserva.status || '—',
      'Observação Auto': reserva.observacaoAuto || ''
    }));
  }

  /**
   * Formata uma lista de pedidos para estrutura de relatório tabular.
   * @param {Array<Object>} pedidos - Lista de pedidos a formatar.
   * @returns {Array<Object>} Registros formatados prontos para exportação.
   */
  formatarRelatorioPedidos(pedidos) {
    return pedidos.map(pedido => ({
      'Código': pedido.id || '—',
      'Mesa': pedido.mesaNumero || '—',
      'Cliente': pedido.clienteNome || '—',
      'Itens': pedido.itens?.map(i => `${i.quantidade}x ${i.nome}`).join(' | ') || '—',
      'Total (R$)': (pedido.valorTotal ?? 0).toFixed(2).replace('.', ','),
      'Status': pedido.status || '—',
      'Abertura': pedido.dataAbertura
        ? new Date(pedido.dataAbertura).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—',
      'Observações': pedido.observacoes || ''
    }));
  }

  /**
   * Gera dados de faturamento agrupados por dia a partir dos pedidos entregues.
   * @param {Array<Object>} pedidos - Lista de pedidos.
   * @returns {Array<Object>} Resumo de faturamento por data.
   */
  formatarRelatorioFaturamento(pedidos) {
    // PORQUÊ: Somente pedidos com status "Entregue" são considerados faturamento real.
    const pedidosEntregues = pedidos.filter(p => p.status === 'Entregue');

    const agrupado = pedidosEntregues.reduce((mapa, pedido) => {
      const data = pedido.dataAbertura
        ? new Date(pedido.dataAbertura).toLocaleDateString('pt-BR')
        : 'Sem Data';

      if (!mapa[data]) {
        mapa[data] = { totalPedidos: 0, faturamento: 0 };
      }
      mapa[data].totalPedidos += 1;
      mapa[data].faturamento += pedido.valorTotal ?? 0;
      return mapa;
    }, {});

    return Object.entries(agrupado)
      .sort(([dataA], [dataB]) => {
        // Ordena por data no formato dd/mm/yyyy
        const [dA, mA, aA] = dataA.split('/');
        const [dB, mB, aB] = dataB.split('/');
        return new Date(`${aA}-${mA}-${dA}`) - new Date(`${aB}-${mB}-${dB}`);
      })
      .map(([data, valores]) => ({
        'Data': data,
        'Total de Pedidos Entregues': valores.totalPedidos,
        'Faturamento Total (R$)': valores.faturamento.toFixed(2).replace('.', ',')
      }));
  }

  /**
   * Gera dados de ocupação de mesas a partir das reservas.
   * @param {Array<Object>} reservas - Lista de reservas.
   * @returns {Array<Object>} Resumo de ocupação por mesa.
   */
  formatarRelatorioOcupacao(reservas) {
    const agrupado = reservas.reduce((mapa, reserva) => {
      const mesa = reserva.mesaNumero || 'Desconhecida';
      if (!mapa[mesa]) {
        mapa[mesa] = { total: 0, confirmadas: 0, canceladas: 0, pendentes: 0, totalPessoas: 0 };
      }
      mapa[mesa].total += 1;
      mapa[mesa].totalPessoas += reserva.quantidadePessoas ?? 0;
      if (reserva.status === 'Confirmada' || reserva.status === 'Ocupada') mapa[mesa].confirmadas += 1;
      if (reserva.status === 'Cancelada') mapa[mesa].canceladas += 1;
      if (reserva.status === 'Pendente') mapa[mesa].pendentes += 1;
      return mapa;
    }, {});

    return Object.entries(agrupado)
      .sort(([mesaA], [mesaB]) => mesaA.localeCompare(mesaB))
      .map(([mesa, dados]) => ({
        'Mesa': mesa,
        'Total de Reservas': dados.total,
        'Confirmadas/Ocupadas': dados.confirmadas,
        'Canceladas': dados.canceladas,
        'Pendentes': dados.pendentes,
        'Total de Pessoas Atendidas': dados.totalPessoas
      }));
  }

  /* ── Exportação CSV ────────────────────────────────────────────── */

  /**
   * Converte uma lista de objetos em string no formato CSV.
   * @param {Array<Object>} dados - Registros a converter.
   * @returns {string} Conteúdo CSV com cabeçalho e linhas de dados.
   */
  converterParaCsv(dados) {
    if (!dados || dados.length === 0) return '';

    const cabecalho = Object.keys(dados[0]);

    // PORQUÊ: Envolve valores com aspas para garantir que delimitadores e quebras de linha internas não corrompam o CSV.
    const escaparValor = (valor) => {
      const valorStr = String(valor ?? '');
      if (valorStr.includes(DELIMITADOR_CSV) || valorStr.includes('"') || valorStr.includes('\n')) {
        return `"${valorStr.replace(/"/g, '""')}"`;
      }
      return valorStr;
    };

    const linhaCabecalho = cabecalho.map(escaparValor).join(DELIMITADOR_CSV);
    const linhasDados = dados.map(registro =>
      cabecalho.map(chave => escaparValor(registro[chave])).join(DELIMITADOR_CSV)
    );

    // PORQUÊ: BOM (Byte Order Mark) garante que o Excel abra o CSV em UTF-8 corretamente no Windows.
    return '\uFEFF' + [linhaCabecalho, ...linhasDados].join('\r\n');
  }

  /**
   * Dispara o download de um arquivo CSV no navegador.
   * @param {string} conteudoCsv - String CSV a ser salva.
   * @param {string} nomeArquivo - Nome do arquivo sem extensão.
   */
  baixarCsv(conteudoCsv, nomeArquivo) {
    const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const linkDownload = document.createElement('a');
    linkDownload.href = url;
    linkDownload.download = `${nomeArquivo}.csv`;
    document.body.appendChild(linkDownload);
    linkDownload.click();

    // PORQUÊ: Limpa o objeto URL e remove o elemento do DOM após o download para evitar vazamento de memória.
    document.body.removeChild(linkDownload);
    URL.revokeObjectURL(url);
  }
}
