import React from 'react';
import './AlertaSonoro.css';

function AlertaSonoro({ mostrar, tipo, nome }) {
  if (!mostrar) return null;

  const getIcone = (tipo) => {
    const icones = {
      'entrada': '🔔',
      'cafe': '☕',
      'almoco': '🍽️',
      'saida': '👋'
    };
    return icones[tipo] || '⏰';
  };

  const getCor = (tipo) => {
    const cores = {
      'entrada': '#06D6A0',
      'cafe': '#FEC601',
      'almoco': '#FF6B35',
      'saida': '#EF476F'
    };
    return cores[tipo] || '#118AB2';
  };

  return (
    <div className="alerta-overlay">
      <div className="alerta-container" style={{ borderColor: getCor(tipo) }}>
        <div className="alerta-icone-grande" style={{ backgroundColor: getCor(tipo) }}>
          {getIcone(tipo)}
        </div>
        
        <div className="alerta-conteudo">
          <h1 className="alerta-titulo" style={{ color: getCor(tipo) }}>
            {nome}
          </h1>
          <p className="alerta-subtitulo">É hora de {nome.toLowerCase()}!</p>
        </div>

        <div className="alerta-ondas">
          <div className="onda" style={{ borderColor: getCor(tipo) }}></div>
          <div className="onda" style={{ borderColor: getCor(tipo) }}></div>
          <div className="onda" style={{ borderColor: getCor(tipo) }}></div>
        </div>
      </div>
    </div>
  );
}

export default AlertaSonoro;
