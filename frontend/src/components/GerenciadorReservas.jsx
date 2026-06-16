import React, { useState, useEffect } from 'react';
import { ReservaServico } from '../servicos/ReservaServico';
import './GerenciadorReservas.css';
const servicoReservas = new ReservaServico();
export default function GerenciadorReservas({ aoAlterarReservas, modoPublico = false }) {
  const [reservas, setReservas] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [exibirFormulario, setExibirFormulario] = useState(false);
  const [reservaEmEdicao, setReservaEmEdicao] = useState(null);
  const [clienteNome, setClienteNome] = useState('');
  const [mesaNumero, setMesaNumero] = useState('Mesa 1');
  const [dataHora, setDataHora] = useState('');
  const [quantidadePessoas, setQuantidadePessoas] = useState(2);
  const [statusReserva, setStatusReserva] = useState('Pendente');
  useEffect(() => {
    carregarDados();
    const temporizador = setInterval(() => {
      carregarDados();
    }, 30000);
    return () => clearInterval(temporizador);
  }, []);
  const carregarDados = async () => {
    try {
      const listaReservas = await servicoReservas.obterTodasReservas();
      const listaMesas = await servicoReservas.obterTodasMesas();
      setReservas(listaReservas);
      setMesas(listaMesas);
    } catch (e) {
      setErro('Erro ao carregar dados do restaurante: ' + e.message);
    } finally {
      setCarregando(false);
    }
  };
  const iniciarNovaReserva = () => {
    setReservaEmEdicao(null);
    setClienteNome('');
    setMesaNumero(mesas.length > 0 ? mesas[0].numero : 'Mesa 1');
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    setDataHora(agora.toISOString().slice(0, 16));
    setQuantidadePessoas(2);
    setStatusReserva('Pendente');
    setExibirFormulario(true);
  };
  const iniciarEdicaoReserva = (reserva) => {
    if (modoPublico) return; 
    setReservaEmEdicao(reserva);
    setClienteNome(reserva.clienteNome);
    setMesaNumero(reserva.mesaNumero);
    setDataHora(reserva.dataHora);
    setQuantidadePessoas(reserva.quantidadePessoas);
    setStatusReserva(reserva.status);
    setExibirFormulario(true);
  };
  const salvarReserva = async (e) => {
    e.preventDefault();
    if (!clienteNome.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    try {
      const dados = {
        clienteNome,
        mesaNumero,
        dataHora,
        quantidadePessoas,
        status: modoPublico ? 'Pendente' : statusReserva
      };
      if (reservaEmEdicao) {
        if (modoPublico) {
          alert('Ação não permitida para visitantes.');
          return;
        }
        await servicoReservas.editarReserva(reservaEmEdicao.id, dados);
      } else {
        await servicoReservas.criarReserva(dados);
        alert('Reserva solicitada com sucesso! Ela ficará Pendente até que o restaurante a confirme.');
      }
      setExibirFormulario(false);
      setReservaEmEdicao(null);
      await carregarDados();
      if (aoAlterarReservas) {
        aoAlterarReservas();
      }
    } catch (e) {
      alert('Erro ao salvar reserva: ' + e.message);
    }
  };
  const excluirReserva = async (id) => {
    if (modoPublico) {
      alert('Ação não permitida. Faça login para excluir ou cancelar reservas.');
      return;
    }
    if (window.confirm('Tem certeza que deseja remover esta reserva?')) {
      try {
        await servicoReservas.excluirReserva(id);
        await carregarDados();
        if (aoAlterarReservas) {
          aoAlterarReservas();
        }
      } catch (e) {
        alert('Erro ao excluir reserva: ' + e.message);
      }
    }
  };
  const alterarStatusRapido = async (id, novoStatus) => {
    if (modoPublico) return;
    try {
      await servicoReservas.editarReserva(id, { status: novoStatus });
      await carregarDados();
      if (aoAlterarReservas) {
        aoAlterarReservas();
      }
    } catch (e) {
      alert('Erro ao alterar status da reserva: ' + e.message);
    }
  };
  const alterarQuantidadePessoasRapido = async (id, novaQtd) => {
    if (modoPublico) return;
    try {
      await servicoReservas.editarReserva(id, { quantidadePessoas: novaQtd });
      await carregarDados();
      if (aoAlterarReservas) {
        aoAlterarReservas();
      }
    } catch (e) {
      alert('Erro ao alterar quantidade de pessoas: ' + e.message);
    }
  };
  const selecionarMesaRapida = (numeroMesa) => {
    iniciarNovaReserva();
    setMesaNumero(numeroMesa);
  };
  const obterCapacidadeMesaSelecionada = () => {
    const mesaEncontrada = mesas.find(m => m.numero === mesaNumero);
    return mesaEncontrada ? mesaEncontrada.capacidade : 10;
  };
  const obterCapacidadeMesa = (numMesa) => {
    const mesaEncontrada = mesas.find(m => m.numero === numMesa);
    if (mesaEncontrada) {
      return mesaEncontrada.capacidade;
    }
    const capacidadesPadrao = {
      'Mesa 1': 4,
      'Mesa 2': 4,
      'Mesa 3': 2,
      'Mesa 4': 2,
      'Mesa 5': 6,
      'Mesa 6': 6,
      'Mesa 7': 8,
      'Mesa 8': 8
    };
    return capacidadesPadrao[numMesa] || 4;
  };
  const reservasFiltradas = reservas.filter(reserva => {
    const atendeStatus = filtroStatus === 'Todos' || reserva.status === filtroStatus;
    const buscaMinuscula = buscaCliente.toLowerCase();
    const termoNome = modoPublico ? '' : reserva.clienteNome.toLowerCase();
    const atendeBusca = termoNome.includes(buscaMinuscula) ||
      reserva.mesaNumero.toLowerCase().includes(buscaMinuscula) ||
      reserva.id.toLowerCase().includes(buscaMinuscula);
    return atendeStatus && atendeBusca;
  });
  return (
    <div className="gerenciador-reservas container-fluid px-0">
      {erro && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {erro}
          <button type="button" className="btn-close" onClick={() => setErro(null)} aria-label="Close"></button>
        </div>
      )}
      {modoPublico && (
        <p className="m-0 small text-center">
          Você pode visualizar a ocupação das mesas e solicitar uma nova reserva para o mesmo dia ou datas futuras.
        </p>
      )}
      {}
      <section className="mb-4">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="card-title fw-bold m-0 text-dark">Mapa de Mesas</h3>
              <div className="d-flex gap-3 text-muted small">
                <span className="d-flex align-items-center gap-1">
                  <span className="indicador-status disponivel"></span> Disponível
                </span>
                <span className="d-flex align-items-center gap-1">
                  <span className="indicador-status reservada"></span> Reservada (Confirmada)
                </span>
                <span className="d-flex align-items-center gap-1">
                  <span className="indicador-status ocupada"></span> Ocupada
                </span>
              </div>
            </div>
            {carregando ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
              </div>
            ) : (
              <div className={modoPublico ? "grid-mesas-flex" : "grid-mesas"}>
                {mesas.map((mesa) => (
                  <div
                    key={mesa.numero}
                    className={`card-mesa ${mesa.status.toLowerCase()}`}
                    onClick={() => selecionarMesaRapida(mesa.numero)}
                    title="Clique para criar uma reserva para esta mesa"
                  >
                    <div className="mesa-numero">{mesa.numero}</div>
                    <div className="mesa-capacidade">{mesa.capacidade} Lugares</div>
                    <span className="mesa-status-badge">{mesa.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p> Janela de ocupação padrão: 6 horas por reserva. Funcionamento: 10:00 às 22:00.</p>
        </div>
      </section>
      {}
      {exibirFormulario && (
        <section className="mb-4">
          <div className="card shadow-sm border-top-4 premium-form-card">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-3">
                {reservaEmEdicao ? `Editar Reserva ${reservaEmEdicao.id}` : 'Nova Reserva'}
              </h5>
              <form onSubmit={salvarReserva}>
                <div className="flex-form-container">
                  <div className="flex-form-item col-larga">
                    <label htmlFor="clienteNome" className="form-label fw-bold">Nome do Cliente</label>
                    <input
                      type="text"
                      className="form-control premium-input"
                      id="clienteNome"
                      placeholder={modoPublico ? "Seu nome completo" : "Nome completo do cliente"}
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex-form-item col-curta">
                    <label htmlFor="mesaNumero" className="form-label fw-bold">Mesa</label>
                    <select
                      className="form-select premium-select"
                      id="mesaNumero"
                      value={mesaNumero}
                      onChange={(e) => {
                        const novaMesa = e.target.value;
                        setMesaNumero(novaMesa);
                        const mesaObj = mesas.find(m => m.numero === novaMesa);
                        if (mesaObj && quantidadePessoas > mesaObj.capacidade) {
                          setQuantidadePessoas(mesaObj.capacidade);
                        }
                      }}
                    >
                      {mesas.map((m) => (
                        <option key={m.numero} value={m.numero}>
                          {m.numero} ({m.capacidade} lug. - {m.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-form-item col-media">
                    <label htmlFor="dataHora" className="form-label fw-bold">Data & Hora</label>
                    <input
                      type="datetime-local"
                      className="form-control premium-input"
                      id="dataHora"
                      value={dataHora}
                      onChange={(e) => setDataHora(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex-form-item col-curta">
                    <label htmlFor="quantidadePessoas" className="form-label fw-bold">Pessoas</label>
                    <input
                      type="number"
                      className="form-control premium-input"
                      id="quantidadePessoas"
                      min="1"
                      max={obterCapacidadeMesaSelecionada()}
                      value={quantidadePessoas}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value, 10) || 0;
                        const maxCapacidade = obterCapacidadeMesaSelecionada();
                        if (valor < 1) {
                          setQuantidadePessoas(1);
                        } else if (valor > maxCapacidade) {
                          setQuantidadePessoas(maxCapacidade);
                        } else {
                          setQuantidadePessoas(valor);
                        }
                      }}
                      required
                    />
                  </div>
                  {!modoPublico && (
                    <div className="flex-form-item col-curta">
                      <label htmlFor="status" className="form-label fw-bold">Status</label>
                      <select
                        className="form-select premium-select"
                        id="status"
                        value={statusReserva}
                        onChange={(e) => setStatusReserva(e.target.value)}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Confirmada">Confirmada</option>
                        <option value="Ocupada">Ocupada</option>
                        <option value="Cancelada">Cancelada</option>
                        <option value="Concluída">Concluída</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-premium-cancel"
                    onClick={() => {
                      setExibirFormulario(false);
                      setReservaEmEdicao(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary px-4 btn-premium-submit">
                    {reservaEmEdicao ? 'Salvar Alterações' : 'Confirmar Reserva'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      )}
      {}
      <section className="card shadow-sm border-0">
        <div className="card-body">
          <h5 className="card-title fw-bold m-0 text-dark">Lista de Reservas</h5>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div className="d-flex flex-wrap gap-2">
              <input
                type="text"
                className="form-control form-control-sm busca-input premium-input"
                placeholder={modoPublico ? "Buscar mesa..." : "Buscar cliente, mesa..."}
                value={buscaCliente}
                onChange={(e) => setBuscaCliente(e.target.value)}
              />
              <select
                className="form-select form-select-sm filtro-select premium-select"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="Todos">Todos os Status</option>
                <option value="Pendente">Pendente</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Ocupada">Ocupada</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Concluída">Concluída</option>
              </select>
              <button
                type="button"
                className="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1 btn-premium"
                onClick={iniciarNovaReserva}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                Fazer Reserva
              </button>
            </div>
          </div>
          {carregando ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando reservas...</span>
              </div>
            </div>
          ) : reservasFiltradas.length === 0 ? (
            <div className="text-center py-5 text-muted">
              Nenhuma reserva encontrada.
            </div>
          ) : (
            <div className="table-responsive">
              <table className={`table table-hover align-middle ${modoPublico ? 'tabela-fina' : ''}`}>
                <thead>
                  <tr>
                    <th>Código</th>
                    {!modoPublico && <th>Cliente</th>}
                    <th>Data & Hora</th>
                    {!modoPublico && <th>Pessoas</th>}
                    <th>Mesa</th>
                    <th>Status</th>
                    {!modoPublico && <th className="text-end">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {reservasFiltradas.map((res) => (
                    <tr key={res.id}>
                      <td><strong>{res.id}</strong></td>
                      {}
                      {!modoPublico && (
                        <td className="fw-semibold text-muted">
                          {res.clienteNome}
                        </td>
                      )}
                      <td>
                        {new Date(res.dataHora).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      {}
                      {!modoPublico && (
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <input
                              type="number"
                              className="premium-input-tabela"
                              min="1"
                              max={obterCapacidadeMesa(res.mesaNumero)}
                              value={res.quantidadePessoas}
                              onChange={(e) => {
                                const valor = parseInt(e.target.value, 10) || 1;
                                const maxCapacidade = obterCapacidadeMesa(res.mesaNumero);
                                const novoValor = Math.min(Math.max(1, valor), maxCapacidade);
                                alterarQuantidadePessoasRapido(res.id, novoValor);
                              }}
                            />
                            <span className="text-muted">/ {obterCapacidadeMesa(res.mesaNumero)}</span>
                          </div>
                        </td>
                      )}
                      <td><span className="fw-medium text-dark">{res.mesaNumero}</span></td>
                      <td>
                        {modoPublico ? (
                          <span className={`badge-status d-inline-block text-center ${res.status.toLowerCase()}`}>
                            {res.status}
                          </span>
                        ) : (
                          <select
                            className={`select-status-badge ${res.status.toLowerCase()}`}
                            value={res.status}
                            onChange={(e) => alterarStatusRapido(res.id, e.target.value)}
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Confirmada">Confirmada</option>
                            <option value="Ocupada">Ocupada</option>
                            <option value="Concluída">Concluída</option>
                            <option value="Cancelada">Cancelada</option>
                          </select>
                        )}
                      </td>
                      {!modoPublico && (
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-1">
                            <button
                              className="btn btn-icon btn-light-danger btn-sm"
                              onClick={() => excluirReserva(res.id)}
                              title="Excluir Reserva"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
