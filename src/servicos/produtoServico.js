const API_URL = 'http://localhost:5001/api/produtos'; 

// READ
export const buscarProdutos = async () => {
  const resposta = await fetch(API_URL);
  return resposta.json();
};

// CREATE
export const criarProduto = async (produto) => {
  const resposta = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(produto),
  });
  return resposta.json();
};

// UPDATE
export const atualizarProduto = async (id, produtoAtualizado) => {
  const resposta = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(produtoAtualizado),
  });
  return resposta.json();
};

// DELETE
export const deletarProduto = async (id) => {
  const resposta = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  return resposta.json();
};