import React from 'react';
import { useNavigate } from 'react-router-dom';
import GerenciadorReservas from '../components/GerenciadorReservas';
import logoImg from '../assets/logo.png';
import '../App.css';
export default function PublicReservas() {
  const navigate = useNavigate();
  return (
    <div className="reservas-publicas-container">
      <div className="reservas-publicas-card">
        {}
        <div className="text-center mb-2">
          <img
            src={logoImg}
            alt="Logo Varanda do Nazo"
            className="logo-publica shadow-sm"
            onClick={() => navigate('/login')}
            title="Voltar para a tela inicial"
          />
        </div>
        <p className="subtitle" style={{ fontSize: '15px', fontWeight: '500', marginBottom: '15px' }}>
          Agendamento Online de Reservas de Mesas
        </p>
        {}
        <main className="reservas-conteudo text-start">
          <GerenciadorReservas modoPublico={true} />
        </main>
        <footer className="text-center text-muted small mt-3">
          <p className="m-0">© 2026 Varanda do Nazo Restaurante. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
