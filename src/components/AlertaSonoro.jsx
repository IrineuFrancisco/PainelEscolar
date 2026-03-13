import React from 'react';
import './AlertaSonoro.css';

const CONFIG = {
  entrada: { icone: '🔔', cor: '#00E5A0', label: 'Entrada'  },
  cafe:    { icone: '☕', cor: '#FFD23F', label: 'Café'     },
  almoco:  { icone: '🍽️', cor: '#FF6B35', label: 'Almoço'  },
  saida:   { icone: '👋', cor: '#FF3B5C', label: 'Saída'    },
};

function AlertaSonoro({ mostrar, tipo, nome }) {
  if (!mostrar) return null;

  const cfg = CONFIG[tipo] || { icone: '⏰', cor: '#00C8FF', label: nome };

  return (
    <div className="alerta-overlay">
      <div className="alerta-container" style={{ borderColor: cfg.cor }}>
        <div className="alerta-icone" style={{ background: cfg.cor }}>
          {cfg.icone}
        </div>

        <h1 className="alerta-titulo" style={{ color: cfg.cor }}>
          {nome || cfg.label}
        </h1>
        <p className="alerta-sub">É hora de {(nome || cfg.label).toLowerCase()}!</p>

        <div className="alerta-ondas">
          {[1, 2, 3].map(i => (
            <div key={i} className="onda" style={{ borderColor: cfg.cor }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AlertaSonoro;