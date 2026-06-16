import React, { useState, useEffect } from 'react';
import { buscarUsuarios, criarUsuario, atualizarUsuario, deletarUsuario } from '../servicos/usuarioServico';
// Reutilizando o CSS do cardápio para manter o padrão visual do painel
import './GerenciadorCardapio.css'; 

export default function GerenciadorUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  
  // Estados do Modal e Formulário
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('ATENDENTE');

  // Carrega os usuários ao abrir a tela
  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const dados = await buscarUsuarios();
      setUsuarios(dados);
    } catch (erro) {
      console.error('Erro ao carregar usuários:', erro);
    }
  };

  const abrirModalNovo = () => {
    setUsuarioEmEdicao(null);
    setNome('');
    setEmail('');
    setSenha('');
    setPerfil('ATENDENTE');
    setModalAberto(true);
  };

  const abrirModalEdicao = (usuario) => {
    setUsuarioEmEdicao(usuario);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setSenha(''); // Senha vem vazia por segurança. Se digitar algo, atualiza.
    setPerfil(usuario.perfil);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    
    const dadosUsuario = { nome, email, perfil };
    
    // Só envia a senha se o usuário digitou uma nova (útil na edição)
    if (senha.trim() !== '') {
      dadosUsuario.senha = senha;
    }

    try {
      if (usuarioEmEdicao) {
        await atualizarUsuario(usuarioEmEdicao._id, dadosUsuario);
      } else {
        // Para criação, a senha é obrigatória
        if (senha.trim() === '') {
          alert('A senha é obrigatória para novos usuários.');
          return;
        }
        await criarUsuario(dadosUsuario);
      }
      fecharModal();
      carregarUsuarios();
    } catch (erro) {
      alert('Erro ao salvar usuário. Verifique se o e-mail já está em uso.');
    }
  };

  const handleDeletar = async (id) => {
    if (window.confirm('Tem certeza que deseja remover este acesso do sistema?')) {
      try {
        await deletarUsuario(id);
        carregarUsuarios();
      } catch (erro) {
        alert('Erro ao excluir usuário.');
      }
    }
  };

  return (
    <div className="gerenciador-cardapio">
      
      {/* Barra Superior */}
      <div className="cardapio-barra-acoes" style={{ justifyContent: 'flex-end' }}>
        <button className="btn-novo-produto" onClick={abrirModalNovo}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          Novo Usuário
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="cardapio-tabela-card">
        <div className="cardapio-tabela-header">
          <h3>Usuários do Sistema</h3>
          <span className="cardapio-contagem">
            {usuarios.length} {usuarios.length === 1 ? 'usuário' : 'usuários'}
          </span>
        </div>

        <table className="cardapio-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil de Acesso</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(usuario => (
              <tr key={usuario._id}>
                <td className="produto-nome">{usuario.nome}</td>
                <td>{usuario.email}</td>
                <td>
                  <span className={`badge-categoria ${usuario.perfil === 'ADMIN' ? 'badge-entradas' : 'badge-bebidas'}`}>
                    {usuario.perfil}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#2196f3', marginRight: '10px' }} onClick={() => abrirModalEdicao(usuario)}>
                    Editar
                  </button>
                  <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#e53e3e' }} onClick={() => handleDeletar(usuario._id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Cadastro/Edição */}
      {modalAberto && (
        <div className="cardapio-modal-overlay">
          <div className="cardapio-modal" style={{ padding: '24px', maxWidth: '450px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '18px', color: '#1a202c' }}>
              {usuarioEmEdicao ? 'Editar Usuário' : 'Cadastrar Usuário'}
            </h2>

            <form onSubmit={handleSalvar}>
              <div className="cardapio-form-grupo">
                <label>Nome Completo *</label>
                <input required type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João da Silva" />
              </div>

              <div className="cardapio-form-grupo">
                <label>E-mail *</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@restaurante.com" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="cardapio-form-grupo">
                  <label>{usuarioEmEdicao ? 'Nova Senha' : 'Senha *'}</label>
                  <input type="text" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Digite a senha" />
                  {usuarioEmEdicao && <small style={{ color: '#a0aec0', fontSize: '11px' }}>Deixe em branco para não alterar</small>}
                </div>
                <div className="cardapio-form-grupo">
                  <label>Perfil *</label>
                  <select value={perfil} onChange={e => setPerfil(e.target.value)}>
                    <option value="ATENDENTE">Perfil Atendente</option>
                    <option value="ADMIN">Perfil Administrador</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={fecharModal} style={{ padding: '10px 16px', background: '#edf2f7', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 16px', background: '#ff6e35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Salvar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}