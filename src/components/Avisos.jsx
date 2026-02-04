import React, { useState, useEffect } from 'react';
import './Avisos.css';

function Avisos() {
  const [avisoAtual, setAvisoAtual] = useState(0);

  const avisos = [
    {
      tipo: 'importante',
      icone: '⚠️',
      titulo: 'Reunião de Pais',
      mensagem: 'Reunião geral na sexta-feira às 18h no auditório principal.',
      cor: '#EF476F'
    },
    {
      tipo: 'evento',
      icone: '🎉',
      titulo: 'Festa Junina',
      mensagem: 'Dia 15 de junho! Venha com sua roupa caipira!',
      cor: '#FEC601'
    },
    {
      tipo: 'lembrete',
      icone: '📚',
      titulo: 'Biblioteca',
      mensagem: 'Não esqueça de devolver os livros emprestados até sexta-feira.',
      cor: '#06D6A0'
    },
    {
      tipo: 'informacao',
      icone: '💡',
      titulo: 'Horário de Verão',
      mensagem: 'Lembre-se: o horário de entrada continua sendo 07:00h.',
      cor: '#118AB2'
    },
    {
      tipo: 'saude',
      icone: '🏥',
      titulo: 'Campanha de Vacinação',
      mensagem: 'Vacinação contra gripe disponível na enfermaria.',
      cor: '#FF6B35'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setAvisoAtual((prev) => (prev + 1) % avisos.length);
    }, 8000); // Troca de aviso a cada 8 segundos

    return () => clearInterval(timer);
  }, [avisos.length]);

  const aviso = avisos[avisoAtual];

  return (
    <div className="card avisos-card">
      <h2 className="card-titulo">
        <span className="card-icone">📢</span>
        Avisos Importantes
      </h2>

      <div className="aviso-destaque" style={{ borderColor: aviso.cor }}>
        <div className="aviso-icone" style={{ backgroundColor: aviso.cor }}>
          {aviso.icone}
        </div>
        <div className="aviso-conteudo">
          <h3 className="aviso-titulo" style={{ color: aviso.cor }}>
            {aviso.titulo}
          </h3>
          <p className="aviso-mensagem">{aviso.mensagem}</p>
        </div>
      </div>

      <div className="avisos-lista">
        {avisos.map((item, index) => (
          <div
            key={index}
            className={`aviso-mini ${index === avisoAtual ? 'ativo' : ''}`}
            onClick={() => setAvisoAtual(index)}
            style={{ borderColor: index === avisoAtual ? item.cor : 'transparent' }}
          >
            <span className="aviso-mini-icone">{item.icone}</span>
            <span className="aviso-mini-titulo">{item.titulo}</span>
          </div>
        ))}
      </div>

      <div className="avisos-indicadores">
        {avisos.map((_, index) => (
          <div
            key={index}
            className={`indicador ${index === avisoAtual ? 'ativo' : ''}`}
            onClick={() => setAvisoAtual(index)}
            style={{ backgroundColor: index === avisoAtual ? aviso.cor : 'rgba(255, 255, 255, 0.2)' }}
          />
        ))}
      </div>
    </div>
  );
}

export default Avisos;
