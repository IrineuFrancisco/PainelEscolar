import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Horarios     from './components/Horarios';
// import Cardapio     from './components/Cardapio';
import AlertaSonoro from './components/AlertaSonoro';
import Noticias     from './components/Noticias';

const LOGO = '/SENAI_Logo.png';

// ── Feeds para o ticker (Canaltech) ─────────────────────────────────────────
const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';
const TICKER_FEED = 'https://canaltech.com.br/rss/';

const HORARIOS = [
  { hora: '07:00', tipo: 'entrada', nome: 'Entrada'       },
  { hora: '09:15', tipo: 'cafe',    nome: 'Café da Manhã' },
  { hora: '11:00', tipo: 'almoco',  nome: 'Almoço'        },
  { hora: '14:15', tipo: 'cafe',    nome: 'Café da Tarde' },
  { hora: '16:00', tipo: 'saida',   nome: 'Saída'         },
];

const AUDIO_MAP = {
  cafe:   (nome) => nome === 'Café da Manhã' ? '/cafe_google.mp3' : '/Quero café - AtilaKw Remix.mp3',
  almoco: () => '/taNaHoraDoPaPa.mp3',
};

export default function App() {
  const [horaAtual,     setHoraAtual]     = useState(new Date());
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [tipoAlerta,    setTipoAlerta]    = useState('');
  const [nomeAlerta,    setNomeAlerta]    = useState('');
  const [tickerItens,   setTickerItens]   = useState([]);
  const audioRef = useRef(null);

  // Relógio
  useEffect(() => {
    const id = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Checa horários de alerta
  useEffect(() => {
    const hms = horaAtual.toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    HORARIOS.forEach(h => {
      if (hms === `${h.hora}:00`) dispararAlerta(h.tipo, h.nome);
    });
  }, [horaAtual]);

  const dispararAlerta = (tipo, nome) => {
    setTipoAlerta(tipo);
    setNomeAlerta(nome);
    setMostrarAlerta(true);
    const getSrc = AUDIO_MAP[tipo];
    const src = getSrc ? getSrc(nome) : '/alarme.mp3';
    new Audio(src).play().catch(() => {});
    setTimeout(() => setMostrarAlerta(false), 10000);
  };

  // Ticker: busca feed RSS
  useEffect(() => {
    fetch(`${RSS2JSON}${encodeURIComponent(TICKER_FEED)}&count=14`)
      .then(r => r.json())
      .then(d => { if (d.items) setTickerItens(d.items); })
      .catch(() => {});
  }, []);

  const horaDisplay = horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dataDisplay = horaAtual.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const textoTicker = tickerItens.length
    ? tickerItens.map(n => `◆  ${n.title}`).join('          ')
    : '◆  Carregando notícias de tecnologia…';

  return (
    <div className="app">
      {/* Fundo decorativo */}
      <div className="app-grid-bg" aria-hidden="true" />

      {/* ── HEADER ── */}
      <header className="header">
        <div className="header-logo-area">
          <img src={LOGO} alt="SENAI" className="header-logo" />
          <div className="header-divider" />
          <div className="header-titles">
            <h1>Painel de Gestão Escolar</h1>
            <p>SENAI-SP · Serviço Nacional de Aprendizagem Industrial</p>
          </div>
        </div>

        <div className="header-clock">
          <div className="clock-time">{horaDisplay}</div>
          <div className="clock-date">{dataDisplay}</div>
        </div>
      </header>

      {/* ── TICKER ── */}
      <div className="ticker">
        <div className="ticker-badge">
          <span className="ticker-badge-dot" />
          AO VIVO
        </div>
        <div className="ticker-track">
          <span className="ticker-content">
            {textoTicker}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{textoTicker}
          </span>
        </div>
      </div>

      {/* ── ALERTA SONORO ── */}
      <AlertaSonoro
        mostrar={mostrarAlerta}
        tipo={tipoAlerta}
        nome={nomeAlerta}
      />

      {/* ── LAYOUT PRINCIPAL ── */}
      <main className="main">
        <aside className="col-horarios">
          <Horarios horarios={HORARIOS} horaAtual={horaAtual} />
        </aside>

        {/* <section className="col-cardapio">
          <Cardapio />
        </section> */}

        <section className="col-noticias">
          <Noticias />
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <span>© 2026 SENAI-SP</span>
        <span className="footer-diamond">◆</span>
        <span>Serviço Nacional de Aprendizagem Industrial</span>
        <span className="footer-diamond">◆</span>
        <span>Painel Digital v3.0</span>
      </footer>

      <audio ref={audioRef} src="/alarme.mp3" preload="auto" />
    </div>
  );
}