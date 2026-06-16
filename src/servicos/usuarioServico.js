const API_URL = '/api/usuarios';

export const buscarUsuarios = async () => {
  const resposta = await fetch(API_URL);
  if (!resposta.ok) throw new Error('Erro ao buscar usuários');
  return resposta.json();
};

export const criarUsuario = async (dadosUsuario) => {
  const resposta = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dadosUsuario),
  });
  if (!resposta.ok) throw new Error('Erro ao criar usuário');
  return resposta.json();
};

export const atualizarUsuario = async (id, dadosUsuario) => {
  const resposta = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dadosUsuario),
  });
  if (!resposta.ok) throw new Error('Erro ao atualizar usuário');
  return resposta.json();
};

export const deletarUsuario = async (id) => {
  const resposta = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!resposta.ok) throw new Error('Erro ao deletar usuário');
  return resposta.json();
};