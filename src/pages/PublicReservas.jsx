import React from 'react';
import { useNavigate } from 'react-router-dom';
import GerenciadorReservas from '../components/GerenciadorReservas';
import logoImg from '../assets/Logo.png';
import '../App.css';

/**
 * @function PublicReservas
 * @description Página pública para clientes fazerem reservas, exibindo o mapa de ocupação e formulário.
 * @returns {React.JSX.Element} Elemento React da página pública de reservas.
 */
export default function PublicReservas() {
  const navigate = useNavigate();

  return (
    <div className="reservas-publicas-container">
      <div className="reservas-publicas-card">
        {/* Container do Logotipo grande centralizado e clicável */}
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

        {/* Gerenciador em modo público */}
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

