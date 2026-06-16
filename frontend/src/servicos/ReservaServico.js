import { ReservaRepositorio } from '../repositorios/ReservaRepositorio';
export class ReservaServico {
  constructor(repositorio = new ReservaRepositorio()) {
    this.repositorio = repositorio;
  }
  async obterTodasReservas() {
    const listaReservas = await this.repositorio.obterTodasReservas();
    const agora = new Date();
    let houveAlteracao = false;
    const reservasAtualizadas = listaReservas.map(reserva => {
      let quantidadePessoas = reserva.quantidadePessoas;
      if (quantidadePessoas === undefined || quantidadePessoas === null) {
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
      const chavesAntigas = ['client', 'date', 'time', 'people', 'table', 'pessoas'];
      chavesAntigas.forEach(chave => {
        if (chave in reservaNormalizada) {
          delete reservaNormalizada[chave];
          houveAlteracao = true;
        }
      });
      if (
        reserva.clienteNome !== reservaNormalizada.clienteNome ||
        reserva.mesaNumero !== reservaNormalizada.mesaNumero ||
        reserva.dataHora !== reservaNormalizada.dataHora ||
        reserva.quantidadePessoas !== reservaNormalizada.quantidadePessoas
      ) {
        houveAlteracao = true;
      }
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
  async obterTodasMesas() {
    const mesas = await this.repositorio.obterTodasMesas();
    const reservas = await this.obterTodasReservas();
    const agora = new Date();
    return mesas.map(mesa => {
      const reservasAtivasMesa = reservas.filter(r => {
        if (r.mesaNumero !== mesa.numero) return false;
        if (r.status !== 'Confirmada' && r.status !== 'Ocupada') return false;
        const inicioReserva = new Date(r.dataHora);
        const fimReserva = new Date(inicioReserva.getTime() + 6 * 60 * 60 * 1000); 
        return agora >= inicioReserva && agora < fimReserva;
      });
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
  async criarReserva(dadosReserva) {
    this.validarHorarioFuncionamento(dadosReserva.dataHora);
    await this.validarCapacidadeMesa(dadosReserva.mesaNumero, dadosReserva.quantidadePessoas);
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
    if (dadosAtualizados.dataHora) {
      this.validarHorarioFuncionamento(dataHoraAlvo);
    }
    if (dadosAtualizados.mesaNumero || dadosAtualizados.quantidadePessoas) {
      await this.validarCapacidadeMesa(mesaAlvo, qtdPessoasAlvo);
    }
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
  async excluirReserva(id) {
    const reservas = await this.repositorio.obterTodasReservas();
    const reservasFiltradas = reservas.filter(r => r.id !== id);
    if (reservas.length === reservasFiltradas.length) {
      throw new Error(`Reserva com código ${id} não foi encontrada.`);
    }
    await this.repositorio.salvarReservas(reservasFiltradas);
    return true;
  }
  validarHorarioFuncionamento(dataHoraStr) {
    const data = new Date(dataHoraStr);
    const horas = data.getHours();
    const minutos = data.getMinutes();
    const horaDecimal = horas + minutos / 60;
    if (horaDecimal < 10 || horaDecimal > 22) {
      throw new Error('O restaurante funciona apenas das 10:00 às 22:00. Escolha um horário válido.');
    }
  }
  async validarCapacidadeMesa(numeroMesa, qtdPessoas) {
    const mesas = await this.repositorio.obterTodasMesas();
    const mesaObj = mesas.find(m => m.numero === numeroMesa);
    if (!mesaObj) {
      throw new Error(`A mesa identificada como "${numeroMesa}" não foi encontrada no cadastro.`);
    }
    const pessoas = parseInt(qtdPessoas, 10);
    if (pessoas > mesaObj.capacidade) {
      throw new Error(`A ${numeroMesa} suporta no máximo ${mesaObj.capacidade} pessoas. Seleção atual: ${pessoas} pessoas.`);
    }
  }
  async validarJanelaOcupacao(numeroMesa, dataHoraStr, idIgnorar = '') {
    const reservas = await this.repositorio.obterTodasReservas();
    const novaDataHora = new Date(dataHoraStr);
    const conflito = reservas.find(reserva => {
      if (idIgnorar && reserva.id === idIgnorar) return false;
      if (reserva.mesaNumero !== numeroMesa) return false;
      if (reserva.status === 'Cancelada' || reserva.status === 'Concluída') return false;
      const dataHoraExistente = new Date(reserva.dataHora);
      const diferencaMs = Math.abs(novaDataHora.getTime() - dataHoraExistente.getTime());
      const diferencaHoras = diferencaMs / (1000 * 60 * 60);
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
