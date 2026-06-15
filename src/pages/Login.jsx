import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import '../App.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Tentando logar com:", email);

    // Validação dos perfis do trabalho
    if (email === 'admin@restaurante.com' && password === 'admin123') {
      const usuario = { email, perfil: 'ADMIN' };
      localStorage.setItem('user_session', JSON.stringify(usuario));
      console.log("Sessão Admin salva! Navegando...");
      navigate('/');
    }
    else if (email === 'atendente@restaurante.com' && password === 'atendente123') {
      const usuario = { email, perfil: 'ATENDENTE' };
      localStorage.setItem('user_session', JSON.stringify(usuario));
      console.log("Sessão Atendente salva! Navegando...");
      navigate('/');
    }
    else {
      alert('Usuário ou senha incorretos! Use as credenciais de teste.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="logo-container-sistema">
          <img src={logoImg} alt="Logo Varanda do Nazo" className="sistema-logo" />
        </div>

        <p className="subtitle">Faça login para gerenciar seus pedidos</p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">E-mail ou Usuário</label>
            <input
              type="email"
              id="email"
              placeholder="admin@restaurante.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            /> {/* <--- Tag fechada corretamente aqui! */}
          </div>

          <button type="submit" className="login-button">
            ENTRAR
          </button>

          <button
            type="button"
            className="login-button-secondary"
            onClick={() => navigate('/reservar')}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#f8f9fa',
              color: '#ff6e35',
              border: '2px solid #ff6e35',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              marginTop: '12px'
            }}
          >
            Fazer uma Reserva (Sem Login)
          </button>
        </form>

        <p className="test-credentials">
          <strong>ADMIN:</strong> admin@restaurante.com / admin123 <br />
          <strong>ATENDENTE:</strong> atendente@restaurante.com / atendente123
        </p>
      </div>
    </div>
  );
}

export default Login;