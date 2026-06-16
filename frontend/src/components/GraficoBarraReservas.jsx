import React, { useState } from 'react';

/**
 * @component GraficoBarraReservas
 * @description Gráfico de barras verticais em SVG para exibir o número de reservas por período do dia.
 * @param {Object} props - Propriedades do componente.
 * @param {Array<Object>} props.dados - Dados a serem representados no gráfico.
 * @param {string} props.dados[].rotulo - O nome do período (ex: 'Almoço (10h-15h)').
 * @param {number} props.dados[].valor - A quantidade de reservas naquele período.
 * @returns {React.JSX.Element} Gráfico de barras renderizado.
 */
export default function GraficoBarraReservas({ dados = [] }) {
  const [barraFocada, setBarraFocada] = useState(null);

  // Parâmetros de layout do SVG
  const larguraSvg = 500;
  const alturaSvg = 260;
  const margemEsquerda = 45;
  const margemDireita = 25;
  const margemSuperior = 30;
  const margemInferior = 40;

  const larguraGrafico = larguraSvg - margemEsquerda - margemDireita;
  const alturaGrafico = alturaSvg - margemSuperior - margemInferior;

  if (dados.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#a0aec0' }}>
        <p>Nenhum dado de reserva disponível</p>
      </div>
    );
  }

  // Determina o valor máximo para escala vertical (garante no mínimo 5)
  const valorMaximo = Math.max(...dados.map(item => item.valor), 5);

  // Linhas de grade horizontais (25%, 50%, 75%, 100%)
  const linhasGrade = [0.25, 0.5, 0.75, 1];

  // Configurações das barras
  const larguraBarra = 60;
  const raioBorda = 8; // Raio dos cantos superiores arredondados

  // Calcula e constrói as coordenadas e caminhos de cada barra
  const barrasCalculadas = dados.map((item, indice) => {
    const secaoLargura = larguraGrafico / dados.length;
    const centroX = margemEsquerda + (indice * secaoLargura) + (secaoLargura / 2);
    const alturaBarraCalculada = (item.valor / valorMaximo) * alturaGrafico;
    
    const xBase = centroX - (larguraBarra / 2);
    const yTopo = margemSuperior + alturaGrafico - alturaBarraCalculada;
    const yBase = margemSuperior + alturaGrafico;

    // Constrói uma barra retangular com apenas os cantos superiores arredondados usando SVG path
    let caminhoBarra = '';
    if (alturaBarraCalculada > raioBorda) {
      caminhoBarra = `
        M ${xBase} ${yBase}
        V ${yTopo + raioBorda}
        A ${raioBorda} ${raioBorda} 0 0 1 ${xBase + raioBorda} ${yTopo}
        H ${xBase + larguraBarra - raioBorda}
        A ${raioBorda} ${raioBorda} 0 0 1 ${xBase + larguraBarra} ${yTopo + raioBorda}
        V ${yBase}
        Z
      `;
    } else {
      caminhoBarra = `
        M ${xBase} ${yBase}
        V ${yTopo}
        H ${xBase + larguraBarra}
        V ${yBase}
        Z
      `;
    }

    return {
      caminho: caminhoBarra,
      centroX,
      yTopo,
      rotulo: item.rotulo,
      valor: item.valor
    };
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${larguraSvg} ${alturaSvg}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          {/* Gradiente vibrante laranja-avermelhado para as barras das reservas */}
          <linearGradient id="gradienteBarra" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6e35" />
            <stop offset="100%" stopColor="#ff9f68" />
          </linearGradient>
          {/* Sombra de desfoque sob a barra focada */}
          <filter id="sombraBarra" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#ff6e35" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Linhas de grade horizontais */}
        {linhasGrade.map((proporcao, i) => {
          const posicaoY = margemSuperior + alturaGrafico - (proporcao * alturaGrafico);
          const valorGrade = Math.round(proporcao * valorMaximo);
          return (
            <g key={i}>
              <line
                x1={margemEsquerda}
                y1={posicaoY}
                x2={larguraSvg - margemDireita}
                y2={posicaoY}
                stroke="#edf2f7"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={margemEsquerda - 10}
                y={posicaoY + 4}
                textAnchor="end"
                fill="#a0aec0"
                fontSize="11px"
                fontWeight="500"
              >
                {valorGrade}
              </text>
            </g>
          );
        })}

        {/* Eixo X - Linha Base */}
        <line
          x1={margemEsquerda}
          y1={margemSuperior + alturaGrafico}
          x2={larguraSvg - margemDireita}
          y2={margemSuperior + alturaGrafico}
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {/* Rótulos do Eixo X */}
        {barrasCalculadas.map((barra, indice) => (
          <text
            key={indice}
            x={barra.centroX}
            y={margemSuperior + alturaGrafico + 20}
            textAnchor="middle"
            fill="#a0aec0"
            fontSize="10px"
            fontWeight="600"
          >
            {barra.rotulo}
          </text>
        ))}

        {/* Desenho das Barras */}
        {barrasCalculadas.map((barra, indice) => {
          const estaAtivo = barraFocada === indice;
          return (
            <path
              key={indice}
              d={barra.caminho}
              fill="url(#gradienteBarra)"
              opacity={barraFocada === null || estaAtivo ? 1 : 0.75}
              filter={estaAtivo ? 'url(#sombraBarra)' : 'none'}
              style={{
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                transform: estaAtivo ? 'scaleY(1.02)' : 'scaleY(1)',
                transformOrigin: `bottom`
              }}
              onMouseEnter={() => setBarraFocada(indice)}
              onMouseLeave={() => setBarraFocada(null)}
            />
          );
        })}

        {/* Tooltip renderizado dinamicamente dentro do SVG */}
        {barraFocada !== null && (
          <g transform={`translate(${barrasCalculadas[barraFocada].centroX}, ${barrasCalculadas[barraFocada].yTopo - 30})`}>
            <rect
              x="-45"
              y="-12"
              width="90"
              height="28"
              rx="6"
              fill="#2d3748"
              filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))"
            />
            <polygon
              points="0,21 -6,16 6,16"
              fill="#2d3748"
            />
            <text
              x="0"
              y="6"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="11px"
              fontWeight="600"
            >
              {barrasCalculadas[barraFocada].valor} {barrasCalculadas[barraFocada].valor === 1 ? 'reserva' : 'reservas'}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
