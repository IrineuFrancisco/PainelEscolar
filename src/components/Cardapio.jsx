import React, { useState, useEffect } from 'react';
import './Cardapio.css';

function Cardapio() {
  const slides = [
   { id: 1, tipo: 'CARDÁPIO', url: '/cardapio_semanal.png' },
    { id: 2, tipo: 'AVISOS', url: '/aviso_reuniao.png' },
    { id: 3, tipo: 'EVENTOS', url: '/aviso_evento.jpeg' }
  ];

  const [indexAtual, setIndexAtual] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndexAtual((prevIndex) => (prevIndex + 1) % slides.length);
    }, 10000); // 10 segundos

    return () => clearInterval(intervalo);
  }, [slides.length]);

  return (
    <div className="cardapio-carousel-container">
      <div className="carousel-badge">
        {slides[indexAtual].tipo}
      </div>

      <div className="carousel-slide">
        {/* A classe slide-image garante o ajuste ao container */}
        <img 
          src={slides[indexAtual].url} 
          alt={slides[indexAtual].tipo} 
          className="slide-image" 
        />
      </div>

      <div className="carousel-dots">
        {slides.map((_, i) => (
          <div key={i} className={`dot ${i === indexAtual ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}

export default Cardapio;