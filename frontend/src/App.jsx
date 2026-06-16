import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PublicReservas from './pages/PublicReservas';

/**
 * @function ProtectedRoute
 * @description Componente de proteção de rota que valida se existe uma sessão ativa no localStorage.
 * @param {Object} props - Propriedades do componente.
 * @param {React.ReactNode} props.children - Elemento filho a ser renderizado caso autenticado.
 * @returns {React.JSX.Element} Redirecionamento para o login ou renderização dos filhos.
 */
function ProtectedRoute({ children }) {
  const session = localStorage.getItem('user_session');
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * @function App
 * @description Componente principal da aplicação configurando as rotas públicas e administrativas.
 * @returns {React.JSX.Element} Elemento React principal da aplicação.
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* Rota pública de login */}
        <Route path="/login" element={<Login />} />

        {/* Rota pública para criação de reservas por clientes (Sem login) */}
        <Route path="/reservar" element={<PublicReservas />} />

        {/* Rota administrativa protegida de gerenciamento de reservas dentro do Dashboard */}
        <Route 
          path="/reservas" 
          element={
            <ProtectedRoute>
              <Dashboard activeTab="reservas" />
            </ProtectedRoute>
          } 
        />

        {/* Rota administrativa protegida de gerenciamento de pedidos dentro do Dashboard */}
        <Route 
          path="/pedidos" 
          element={
            <ProtectedRoute>
              <Dashboard activeTab="pedidos" />
            </ProtectedRoute>
          } 
        />

        {/* Rota administrativa protegida de geração de relatórios — exclusiva para ADMIN */}
        <Route 
          path="/relatorios" 
          element={
            <ProtectedRoute>
              <Dashboard activeTab="relatorios" />
            </ProtectedRoute>
          } 
        />

        {/* Rota administrativa protegida de gerenciamento de cardápio */}
        <Route 
          path="/cardapio" 
          element={
            <ProtectedRoute>
              <Dashboard activeTab="cardapio" />
            </ProtectedRoute>
          } 
        />

        {/* Rota administrativa protegida de gerenciamento de usuários */}
        <Route 
          path="/usuarios" 
          element={
            <ProtectedRoute>
              <Dashboard activeTab="usuarios" />
            </ProtectedRoute>
          } 
        />

        {/* Rota raiz do dashboard original (Protegida) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard activeTab="dashboard" />
            </ProtectedRoute>
          } 
        />

        {/* Fallback de rotas desconhecidas */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;