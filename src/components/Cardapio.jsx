import React, { useState, useEffect } from 'react';
import './Cardapio.css';

const SLIDES = [
  { tipo: 'CARDÁPIO', url: '/cardapio_semanal.png'  },
  { tipo: 'AVISOS',   url: '/aviso_reuniao.png'     },
  { tipo: 'EVENTOS',  url: '/aviso_evento.jpeg'     },
];

function Cardapio() {
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setAtual(p => (p + 1) % SLIDES.length), 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="cardapio-wrap">
      <div className="cardapio-header">
        <span className="cardapio-header-icon">🗓</span>
        <span className="cardapio-header-title">Cardápio & Eventos</span>
        <span className="cardapio-badge">{SLIDES[atual].tipo}</span>
      </div>

      <div className="cardapio-slide">
        <img
          key={atual}
          src={SLIDES[atual].url}
          alt={SLIDES[atual].tipo}
        />
      </div>

      <div className="cardapio-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`cardapio-dot ${i === atual ? 'ativo' : ''}`}
            onClick={() => setAtual(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default Cardapio;