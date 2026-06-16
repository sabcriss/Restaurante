const URL_RESERVAS = '/api/reservas';
const URL_MESAS = '/api/mesas';
export class ReservaRepositorio {
  constructor() {
  }
  async obterTodasReservas() {
    try {
      const resposta = await fetch(URL_RESERVAS);
      if (!resposta.ok) {
        throw new Error(`Erro de rede: Código ${resposta.status}`);
      }
      const dados = await resposta.json();
      return dados;
    } catch (erro) {
      console.error('Erro ao obter reservas do backend:', erro);
      throw erro;
    }
  }
  async salvarReservas(reservas) {
    try {
      const resposta = await fetch(URL_RESERVAS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservas)
      });
      if (!resposta.ok) {
        throw new Error(`Erro de rede ao salvar: Código ${resposta.status}`);
      }
      return true;
    } catch (erro) {
      console.error('Erro ao salvar reservas no backend:', erro);
      throw erro;
    }
  }
  async obterTodasMesas() {
    try {
      const resposta = await fetch(URL_MESAS);
      if (!resposta.ok) {
        throw new Error(`Erro de rede: Código ${resposta.status}`);
      }
      const dados = await resposta.json();
      return dados;
    } catch (erro) {
      console.error('Erro ao obter mesas do backend:', erro);
      throw erro;
    }
  }
  async salvarMesas(mesas) {
    try {
      const resposta = await fetch(URL_MESAS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mesas)
      });
      if (!resposta.ok) {
        throw new Error(`Erro de rede ao salvar mesas: Código ${resposta.status}`);
      }
      return true;
    } catch (erro) {
      console.error('Erro ao salvar mesas no backend:', erro);
      throw erro;
    }
  }
}
