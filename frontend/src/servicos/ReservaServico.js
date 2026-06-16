import { ReservaRepositorio } from '../repositorios/ReservaRepositorio';

/**
 * @class ReservaServico
 * @description Classe de serviço contendo as regras de negócio para o gerenciamento de reservas e sincronização com o status das mesas.
 */
export class ReservaServico {

  /**
   * Construtor da classe. Inicializa o repositório de reservas.
   * @param {ReservaRepositorio} [repositorio] - Instância opcional do repositório para injeção de dependência.
   */
  constructor(repositorio = new ReservaRepositorio()) {
    /** @private */
    this.repositorio = repositorio;
  }

  /**
   * Obtém a lista de todas as reservas, aplicando antes a expiração automática de reservas pendentes.
   * @returns {Promise<Array<Object>>} Lista de reservas atualizadas.
   */
  async obterTodasReservas() {
    const listaReservas = await this.repositorio.obterTodasReservas();
    const agora = new Date();
    let houveAlteracao = false;

    // Normaliza os dados e aplica a regra de negócio da expiração do status Pendente
    const reservasAtualizadas = listaReservas.map(reserva => {
      // Identifica e converte propriedades legadas
      let quantidadePessoas = reserva.quantidadePessoas;
      if (quantidadePessoas === undefined || quantidadePessoas === null) {
        // Mapeia chaves antigas (pessoas/people) para a propriedade unificada quantidadePessoas
        quantidadePessoas = reserva.pessoas !== undefined ? reserva.pessoas : (reserva.people !== undefined ? reserva.people : 2);
      }

      let clienteNome = reserva.clienteNome || reserva.client || reserva.cliente || 'Cliente Anônimo';
      let mesaNumero = reserva.mesaNumero || reserva.table || reserva.mesa || 'Mesa 1';

      let dataHora = reserva.dataHora;
      if (!dataHora) {
        if (reserva.date) {
          const horaStr = reserva.time || '12:00';
          dataHora = `${reserva.date}T${horaStr}`;
        } else {
          const defaultData = new Date();
          defaultData.setMinutes(defaultData.getMinutes() - defaultData.getTimezoneOffset());
          dataHora = defaultData.toISOString().slice(0, 16);
        }
      }

      const reservaNormalizada = {
        ...reserva,
        clienteNome,
        mesaNumero,
        dataHora,
        quantidadePessoas: parseInt(quantidadePessoas, 10) || 2,
        status: reserva.status || 'Pendente'
      };

      // Exclui chaves obsoletas do objeto normalizado para manter a persistência limpa
      const chavesAntigas = ['client', 'date', 'time', 'people', 'table', 'pessoas'];
      chavesAntigas.forEach(chave => {
        if (chave in reservaNormalizada) {
          delete reservaNormalizada[chave];
          houveAlteracao = true;
        }
      });

      // Compara se houve mudança de estrutura
      if (
        reserva.clienteNome !== reservaNormalizada.clienteNome ||
        reserva.mesaNumero !== reservaNormalizada.mesaNumero ||
        reserva.dataHora !== reservaNormalizada.dataHora ||
        reserva.quantidadePessoas !== reservaNormalizada.quantidadePessoas
      ) {
        houveAlteracao = true;
      }

      // Regra de negócio: Se a reserva estiver como Pendente ao chegar o horário da reserva, o status deve ser atualizado para Cancelada.
      if (reservaNormalizada.status === 'Pendente' && agora >= new Date(reservaNormalizada.dataHora)) {
        reservaNormalizada.status = 'Cancelada';
        reservaNormalizada.observacaoAuto = 'Cancelada automaticamente por decurso de prazo sem confirmação.';
        houveAlteracao = true;
      }

      return reservaNormalizada;
    });

    if (houveAlteracao) {
      await this.repositorio.salvarReservas(reservasAtualizadas);
    }

    return reservasAtualizadas;
  }

  /**
   * Obtém a lista de todas as mesas com o status de ocupação calculado DINAMICAMENTE para o horário atual.
   * @returns {Promise<Array<Object>>} Lista de mesas com status dinâmicos atualizados.
   */
  async obterTodasMesas() {
    const mesas = await this.repositorio.obterTodasMesas();
    const reservas = await this.obterTodasReservas();
    const agora = new Date();

    // Regra de negócio: O status das mesas deve corresponder à janela de tempo da reserva (reservas de 6h).
    return mesas.map(mesa => {
      // Filtrar reservas que estão na janela ativa da mesa (Hora atual entre HoraReserva e HoraReserva + 6 horas)
      const reservasAtivasMesa = reservas.filter(r => {
        if (r.mesaNumero !== mesa.numero) return false;

        // Regra de negócio: A mesa só deve constar como reservada/ocupada se o status for Confirmada ou Ocupada.
        // Se for Pendente, ao chegar no horário ela já é cancelada pelo obterTodasReservas.
        if (r.status !== 'Confirmada' && r.status !== 'Ocupada') return false;

        const inicioReserva = new Date(r.dataHora);
        const fimReserva = new Date(inicioReserva.getTime() + 6 * 60 * 60 * 1000); // + 6 horas

        return agora >= inicioReserva && agora < fimReserva;
      });

      // Determinar o status da mesa com base nas reservas ativas correspondentes à janela de tempo
      let novoStatus = 'Disponível';

      const temOcupada = reservasAtivasMesa.some(r => r.status === 'Ocupada');
      const temConfirmada = reservasAtivasMesa.some(r => r.status === 'Confirmada');

      if (temOcupada) {
        novoStatus = 'Ocupada';
      } else if (temConfirmada) {
        novoStatus = 'Reservada';
      }

      return {
        ...mesa,
        status: novoStatus
      };
    });
  }

  /**
   * Cria uma nova reserva, executando todas as validações de regras de negócio.
   * @param {Object} dadosReserva - Objeto contendo os dados da reserva.
   * @returns {Promise<Object>} A reserva criada.
   */
  async criarReserva(dadosReserva) {
    // Validar horário de funcionamento (10:00 às 22:00)
    this.validarHorarioFuncionamento(dadosReserva.dataHora);

    // Validar capacidade máxima da mesa
    await this.validarCapacidadeMesa(dadosReserva.mesaNumero, dadosReserva.quantidadePessoas);

    // Validar janela de conflito de 6 horas
    await this.validarJanelaOcupacao(dadosReserva.mesaNumero, dadosReserva.dataHora);

    const reservas = await this.repositorio.obterTodasReservas();
    const novoId = `RES-${Math.floor(100 + Math.random() * 900)}`;
    const novaReserva = {
      id: novoId,
      clienteNome: dadosReserva.clienteNome,
      dataHora: dadosReserva.dataHora,
      quantidadePessoas: parseInt(dadosReserva.quantidadePessoas, 10),
      mesaNumero: dadosReserva.mesaNumero,
      status: dadosReserva.status || 'Pendente'
    };

    reservas.push(novaReserva);
    await this.repositorio.salvarReservas(reservas);

    return novaReserva;
  }

  /**
   * Atualiza uma reserva existente executando as validações de negócio necessárias.
   * @param {string} id - Código identificador da reserva.
   * @param {Object} dadosAtualizados - Novos dados da reserva.
   * @returns {Promise<boolean>} Verdadeiro se atualizado com sucesso.
   */
  async editarReserva(id, dadosAtualizados) {
    const reservas = await this.repositorio.obterTodasReservas();
    const indice = reservas.findIndex(r => r.id === id);

    if (indice === -1) {
      throw new Error(`Reserva com código ${id} não foi encontrada.`);
    }

    const reservaAtual = reservas[indice];
    const mesaAlvo = dadosAtualizados.mesaNumero || reservaAtual.mesaNumero;
    const dataHoraAlvo = dadosAtualizados.dataHora || reservaAtual.dataHora;
    const qtdPessoasAlvo = dadosAtualizados.quantidadePessoas || reservaAtual.quantidadePessoas;

    // Se houve alteração de horário, valida funcionamento
    if (dadosAtualizados.dataHora) {
      this.validarHorarioFuncionamento(dataHoraAlvo);
    }

    // Se houve alteração de mesa ou quantidade, valida capacidade
    if (dadosAtualizados.mesaNumero || dadosAtualizados.quantidadePessoas) {
      await this.validarCapacidadeMesa(mesaAlvo, qtdPessoasAlvo);
    }

    // Se houve alteração de mesa ou data/hora, valida janela de conflito de 6h (ignorando a própria reserva sendo editada)
    if (dadosAtualizados.mesaNumero || dadosAtualizados.dataHora) {
      await this.validarJanelaOcupacao(mesaAlvo, dataHoraAlvo, id);
    }

    reservas[indice] = {
      ...reservaAtual,
      ...dadosAtualizados,
      quantidadePessoas: dadosAtualizados.quantidadePessoas ? parseInt(dadosAtualizados.quantidadePessoas, 10) : reservaAtual.quantidadePessoas,
      id
    };

    await this.repositorio.salvarReservas(reservas);
    return true;
  }

  /**
   * Remove uma reserva do sistema.
   * @param {string} id - Código identificador da reserva.
   * @returns {Promise<boolean>} Verdadeiro se removido com sucesso.
   */
  async excluirReserva(id) {
    const reservas = await this.repositorio.obterTodasReservas();
    const reservasFiltradas = reservas.filter(r => r.id !== id);

    if (reservas.length === reservasFiltradas.length) {
      throw new Error(`Reserva com código ${id} não foi encontrada.`);
    }

    await this.repositorio.salvarReservas(reservasFiltradas);
    return true;
  }

  /**
   * Valida se a hora escolhida está dentro do horário de funcionamento (10:00 às 22:00).
   * @param {string} dataHoraStr - String de data/hora a validar.
   * @private
   */
  validarHorarioFuncionamento(dataHoraStr) {
    const data = new Date(dataHoraStr);
    const horas = data.getHours();
    const minutos = data.getMinutes();
    const horaDecimal = horas + minutos / 60;

    // Restringe reservas apenas para o horário de funcionamento do restaurante (10h às 22h)
    if (horaDecimal < 10 || horaDecimal > 22) {
      throw new Error('O restaurante funciona apenas das 10:00 às 22:00. Escolha um horário válido.');
    }
  }

  /**
   * Valida se a quantidade de pessoas excede o número de assentos da mesa.
   * @param {string} numeroMesa - Identificação da mesa.
   * @param {number|string} qtdPessoas - Quantidade de pessoas informadas.
   * @private
   */
  async validarCapacidadeMesa(numeroMesa, qtdPessoas) {
    const mesas = await this.repositorio.obterTodasMesas();
    const mesaObj = mesas.find(m => m.numero === numeroMesa);

    if (!mesaObj) {
      throw new Error(`A mesa identificada como "${numeroMesa}" não foi encontrada no cadastro.`);
    }

    const pessoas = parseInt(qtdPessoas, 10);
    // Impede reservas com quantidade de pessoas superior à capacidade máxima da mesa
    if (pessoas > mesaObj.capacidade) {
      throw new Error(`A ${numeroMesa} suporta no máximo ${mesaObj.capacidade} pessoas. Seleção atual: ${pessoas} pessoas.`);
    }
  }

  /**
   * Valida a regra de intervalo mínimo de 6 horas para reservas na mesma mesa.
   * @param {string} numeroMesa - Número da mesa a ser checada.
   * @param {string} dataHoraStr - Horário planejado para a reserva.
   * @param {string} [idIgnorar] - ID de reserva a ignorar (útil na edição).
   * @private
   */
  async validarJanelaOcupacao(numeroMesa, dataHoraStr, idIgnorar = '') {
    const reservas = await this.repositorio.obterTodasReservas();
    const novaDataHora = new Date(dataHoraStr);

    const conflito = reservas.find(reserva => {
      // Ignorar a própria reserva se for edição
      if (idIgnorar && reserva.id === idIgnorar) return false;
      if (reserva.mesaNumero !== numeroMesa) return false;
      // Reservas canceladas ou concluídas não geram bloqueio
      if (reserva.status === 'Cancelada' || reserva.status === 'Concluída') return false;

      const dataHoraExistente = new Date(reserva.dataHora);
      const diferencaMs = Math.abs(novaDataHora.getTime() - dataHoraExistente.getTime());
      const diferencaHoras = diferencaMs / (1000 * 60 * 60);

      // Garante o intervalo mínimo de 6 horas entre reservas na mesma mesa
      return diferencaHoras < 6;
    });

    if (conflito) {
      const horaFormatada = new Date(conflito.dataHora).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      throw new Error(`Conflito de janela de 6 horas: A ${numeroMesa} já está reservada para ${conflito.clienteNome} em ${horaFormatada}.`);
    }
  }
}
