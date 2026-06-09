import React, { useState } from 'react';
import logoImg from '../assets/logo.png';
import '../App.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@restaurante.com' && password === 'admin123') {
      alert('Login feito com sucesso!');
    } else {
      alert('Usuário ou senha incorretos.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* Container da Imagem da Logo */}
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
              placeholder="Ex: gerente@restaurante.com" 
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
            />
          </div>

          <button type="submit" className="login-button">
            ENTRAR
          </button>
        </form>

        <p className="test-credentials">
          Usuário de teste: admin@restaurante.com / admin123
        </p>
      </div>
    </div>
  );
}

export default Login;