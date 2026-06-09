import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; 

function Dashboard() {
  const navigate = useNavigate();
  const sessionData = localStorage.getItem('user_session');
  const user = sessionData ? JSON.parse(sessionData) : { perfil: 'ADMIN' }; 
  const isAdmin = user.perfil === 'ADMIN';

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('user_session');
    navigate('/login');
  };

  // Dados das Reservas baseados no seu print
  const reservationsData = [
    { id: 'RES-001', client: 'João Silva', date: '04/06/2026', time: '19:00', people: 4, table: 'Mesa 5', status: 'Confirmada' },
    { id: 'RES-002', client: 'Maria Santos', date: '04/06/2026', time: '20:00', people: 2, table: 'Mesa 3', status: 'Confirmada' },
    { id: 'RES-003', client: 'Ana Paula', date: '05/06/2026', time: '19:30', people: 6, table: 'Mesa 8', status: 'Pendente' },
    { id: 'RES-004', client: 'Pedro Costa', date: '03/06/2026', time: '18:00', people: 3, table: 'Mesa 2', status: 'Cancelada' },
  ];

  const cardsData = [
    { id: 1, title: 'Total de Reservas', value: '4', color: '#ff6e35', icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg> ) },
    { id: 2, title: 'Pedidos do Dia', value: '3', color: '#4caf50', icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg> ) },
    { id: 3, title: 'Mesas Ocupadas', value: '2', color: '#2196f3', icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18v3"/><path d="M20 18v3"/><path d="M19 14v4"/><path d="M5 14v4"/><path d="M3 8h18v6H3z"/></svg> ) },
    ...(isAdmin ? [{ id: 4, title: 'Faturamento', value: 'R$ 459,50', color: '#9c27b0', icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> ) }] : []),
  ];

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo"><h2>Varanda do Nazo</h2></div>
        <nav className="sidebar-nav">
          <a href="#dashboard" className="nav-item active"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>Dashboard</a>
          {isAdmin && ( <a href="#usuarios" className="nav-item"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Usuários</a> )}
          <a href="#reservas" className="nav-item"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>Reservas</a>
          <a href="#pedidos" className="nav-item"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>Pedidos</a>
          {isAdmin && ( <a href="#relatorios" className="nav-item"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>Relatórios</a> )}
        </nav>
        <div className="sidebar-footer">
          <a href="#logout" className="nav-item logout" onClick={handleLogout}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>Logout</a>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h1>Dashboard</h1>
          <div className="user-profile">
            <span className="notification-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3c.2.6.8 1 1.7 1s1.5-.4 1.7-1"/></svg><span className="badge">3</span></span>
            <div className="user-info">
              <p className="user-name">{user.perfil === 'ADMIN' ? 'Admin' : 'Atendente'}</p>
              <p className="user-role">{user.perfil}</p>
            </div>
          </div>
        </header>

        <section className="metrics-grid">
          {cardsData.map((card) => (
            <div key={card.id} className="metric-card">
              <div className="metric-content"><p className="metric-title">{card.title}</p><h3 className="metric-value">{card.value}</h3></div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: `${card.color}15`, color: card.color }}>{card.icon}</div>
            </div>
          ))}
        </section>

        <section className="charts-grid">
          <div className="chart-card">
            <h3>Pedidos por Dia</h3>
            <div className="chart-placeholder"><p className="placeholder-text">Gráfico de Linhas</p></div>
          </div>
          <div className="chart-card">
            <h3>Reservas por Período</h3>
            <div className="chart-placeholder"><p className="placeholder-text">Gráfico de Barras</p></div>
          </div>
        </section>

        {/* NOVA SEÇÃO: TABELA DE RESERVAS */}
        <section className="table-section">
          <div className="table-card">
            <h3>Últimas Reservas</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Hora</th>
                    <th>Pessoas</th>
                    <th>Mesa</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reservationsData.map((res) => (
                    <tr key={res.id}>
                      <td><strong>{res.id}</strong></td>
                      <td>{res.client}</td>
                      <td>{res.date}</td>
                      <td>{res.time}</td>
                      <td>{res.people}</td>
                      <td>{res.table}</td>
                      <td>
                        <span className={`status-badge ${res.status.toLowerCase()}`}>
                          {res.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;