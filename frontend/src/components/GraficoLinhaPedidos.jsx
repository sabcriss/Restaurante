import React, { useState } from 'react';

/**
 * @component GraficoLinhaPedidos
 * @description Gráfico de linha interativo em SVG para exibir o volume de pedidos por dia.
 * @param {Object} props - Propriedades do componente.
 * @param {Array<Object>} props.dados - Array contendo os dados do gráfico.
 * @param {string} props.dados[].rotulo - Rótulo do eixo X (ex: '15/06').
 * @param {number} props.dados[].valor - Quantidade de pedidos.
 * @returns {React.JSX.Element} Gráfico de linha renderizado.
 */
export default function GraficoLinhaPedidos({ dados = [] }) {
  const [pontoFocado, setPontoFocado] = useState(null);

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
        <p>Nenhum dado de pedido disponível</p>
      </div>
    );
  }

  // Determina o valor máximo para escala vertical (garante no mínimo 5 para uma visualização elegante)
  const valorMaximo = Math.max(...dados.map(item => item.valor), 5);

  // Calcula as coordenadas X e Y para cada ponto
  const pontosCalculados = dados.map((item, indice) => {
    const coordenadaX = margemEsquerda + (indice * (larguraGrafico / (dados.length - 1 || 1)));
    const coordenadaY = margemSuperior + alturaGrafico - ((item.valor / valorMaximo) * alturaGrafico);
    return {
      x: coordenadaX,
      y: coordenadaY,
      rotulo: item.rotulo,
      valor: item.valor
    };
  });

  // Constrói a linha contínua do gráfico (path SVG)
  let definicaoCaminhoLinha = '';
  if (pontosCalculados.length > 0) {
    definicaoCaminhoLinha = `M ${pontosCalculados[0].x} ${pontosCalculados[0].y}`;
    for (let i = 1; i < pontosCalculados.length; i++) {
      definicaoCaminhoLinha += ` L ${pontosCalculados[i].x} ${pontosCalculados[i].y}`;
    }
  }

  // Constrói o preenchimento sob a linha (área com gradiente)
  let definicaoCaminhoArea = '';
  if (pontosCalculados.length > 0) {
    definicaoCaminhoArea = `${definicaoCaminhoLinha} L ${pontosCalculados[pontosCalculados.length - 1].x} ${margemSuperior + alturaGrafico} L ${pontosCalculados[0].x} ${margemSuperior + alturaGrafico} Z`;
  }

  // Linhas de grade horizontais (25%, 50%, 75%, 100%)
  const linhasGrade = [0.25, 0.5, 0.75, 1];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${larguraSvg} ${alturaSvg}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          {/* Gradiente para a área sob a linha */}
          <linearGradient id="gradienteArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4caf50" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4caf50" stopOpacity="0.0" />
          </linearGradient>
          {/* Efeito de sombra (glow) sob a linha principal */}
          <filter id="brilhoLinha" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4caf50" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Linhas de grade de fundo */}
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
        {pontosCalculados.map((ponto, indice) => (
          <text
            key={indice}
            x={ponto.x}
            y={margemSuperior + alturaGrafico + 20}
            textAnchor="middle"
            fill="#a0aec0"
            fontSize="11px"
            fontWeight="500"
          >
            {ponto.rotulo}
          </text>
        ))}

        {/* Área preenchida sob a linha */}
        {definicaoCaminhoArea && (
          <path
            d={definicaoCaminhoArea}
            fill="url(#gradienteArea)"
          />
        )}

        {/* Linha principal do gráfico */}
        {definicaoCaminhoLinha && (
          <path
            d={definicaoCaminhoLinha}
            fill="none"
            stroke="#4caf50"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#brilhoLinha)"
          />
        )}

        {/* Pontos (círculos interativos) */}
        {pontosCalculados.map((ponto, indice) => {
          const estaAtivo = pontoFocado === indice;
          return (
            <g key={indice}>
              <circle
                cx={ponto.x}
                cy={ponto.y}
                r={estaAtivo ? 6 : 4}
                fill="#ffffff"
                stroke="#4caf50"
                strokeWidth={estaAtivo ? 3 : 2}
                style={{ transition: 'all 0.15s ease-out' }}
              />
              <circle
                cx={ponto.x}
                cy={ponto.y}
                r="18"
                fill="white"
                fillOpacity="0"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setPontoFocado(indice)}
                onMouseLeave={() => setPontoFocado(null)}
              />
            </g>
          );
        })}

        {/* Tooltip renderizado dinamicamente dentro do SVG */}
        {pontoFocado !== null && (
          <g transform={`translate(${pontosCalculados[pontoFocado].x}, ${pontosCalculados[pontoFocado].y - 35})`}>
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
              {pontosCalculados[pontoFocado].valor} {pontosCalculados[pontoFocado].valor === 1 ? 'pedido' : 'pedidos'}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
