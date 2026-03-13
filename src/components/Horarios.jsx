import React from 'react';
import './Horarios.css';

const ICONES = {
  entrada: '🔔',
  cafe:    '☕',
  almoco:  '🍽️',
  saida:   '🚪',
};

function Horarios({ horarios, horaAtual }) {
  const toMin = (h) => {
    const [hh, mm] = h.split(':').map(Number);
    return hh * 60 + mm;
  };

  const agoraMin = horaAtual.getHours() * 60 + horaAtual.getMinutes();

  const proximo = horarios.find(h => toMin(h.hora) > agoraMin) || horarios[0];

  const getStatus = (h) => {
    const m = toMin(h.hora);
    if (m < agoraMin)  return 'passou';
    if (h === proximo) return 'proximo';
    return '';
  };

  return (
    <div className="horarios-wrap">
      <div className="horarios-header">
        <span className="horarios-header-icon">⏱</span>
        <span className="horarios-header-title">Programação</span>
      </div>

      {/* Próximo evento */}
      <div className="proximo-box">
        <div className="proximo-label">Próximo evento</div>
        <div className="proximo-row">
          <span className="proximo-icone">{ICONES[proximo.tipo] || '⏰'}</span>
          <div>
            <div className="proximo-hora">{proximo.hora}</div>
            <div className="proximo-nome">{proximo.nome}</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline">
        {horarios.map((h, i) => {
          const status = getStatus(h);
          return (
            <div key={i} className={`timeline-item ${status}`}>
              <div className="timeline-line-wrap">
                <div className="timeline-dot" />
                {i < horarios.length - 1 && <div className="timeline-connector" />}
              </div>
              <div className="timeline-info">
                <div className="timeline-hora">{h.hora}</div>
                <div className="timeline-nome">{h.nome}</div>
              </div>
              {status === 'passou' && <span className="timeline-check">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Horarios;