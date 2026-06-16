const URL_RESERVAS = '/api/reservas';
const URL_MESAS = '/api/mesas';

/**
 * @class ReservaRepositorio
 * @description Camada de persistência de reservas e mesas.
 * Faz requisições HTTP assíncronas pra API REST no backend e conecta no bd.
 */
export class ReservaRepositorio {

  constructor() {
  }

  /**
   * Recebe as reservas cadastradas fazendo requisição GET pro backend.
   * @returns {Promise<Array<Object>>} Uma promise que se resolve com a lista de reservas.
   */
  async obterTodasReservas() {
    try {
      // Fetch pra pegar os dados de forma assíncrona da API do backend
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

  /**
   * Salva a lista de reservas fazendo requisição POST pro backend.
   * @param {Array<Object>} reservas - Lista de reservas atualizada.
   * @returns {Promise<boolean>} Retorna true quando salva com sucesso.
   */
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

  /**
   * Recebe as mesas cadastradas fazendo requisição GET pro backend.
   * @returns {Promise<Array<Object>>} Uma promise que se resolve com a lista de mesas.
   */
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

  /**
   * Salva a lista de mesas fazendo requisição POST pro backend.
   * @param {Array<Object>} mesas - Lista de mesas atualizada.
   * @returns {Promise<boolean>} Retorna true quando salva com sucesso.
   */
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
