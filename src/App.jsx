import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Horarios     from './components/Horarios';
import AlertaSonoro from './components/AlertaSonoro';
import Noticias     from './components/Noticias';

const LOGO = '/SENAI_Logo.png';

const getProxyURL = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost'
    ? 'http://localhost:3001'
    : `http://${hostname}:3001`;
};

const TICKER_FEED = 'https://tecnoblog.net/feed/';

function parseRSS(xmlText) {
  try {
    const doc   = new DOMParser().parseFromString(xmlText, 'application/xml');
    const items = Array.from(doc.querySelectorAll('item'));
    return items
      .map(item => item.querySelector('title')?.textContent?.trim() || '')
      .filter(Boolean);
  } catch { return []; }
}

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

  const audioRef        = useRef(null);
  const offsetMs        = useRef(0);
  const alarmeDisparado = useRef(new Set());

  // ── 1. Sincroniza com hora oficial de Brasília ────────────────────────────
  const sincronizar = async () => {
    try {
      const PROXY = getProxyURL();
      const res = await fetch(`${PROXY}/api/hora-brasilia`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      offsetMs.current = new Date(data.datetime).getTime() - Date.now();
    } catch (e) {
      console.warn('[Hora Brasília] usando hora local:', e.message);
    }
  };

  useEffect(() => {
    sincronizar();
    const id = setInterval(sincronizar, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // ── 2. Relógio com offset ─────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setHoraAtual(new Date(Date.now() + offsetMs.current));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ── 4. Verificação de alarmes ─────────────────────────────────────────────
  useEffect(() => {
    const hh    = String(horaAtual.getHours()).padStart(2, '0');
    const mm    = String(horaAtual.getMinutes()).padStart(2, '0');
    const ss    = horaAtual.getSeconds();
    const chave = `${hh}:${mm}`;

    if (ss === 0) {
      HORARIOS.forEach(h => {
        if (h.hora === chave && !alarmeDisparado.current.has(chave)) {
          alarmeDisparado.current.add(chave);
          dispararAlerta(h.tipo, h.nome);
          setTimeout(() => alarmeDisparado.current.delete(chave), 90_000);
        }
      });
    }
  }, [horaAtual]);

  // ── 5. Disparo do alerta ──────────────────────────────────────────────────
  const dispararAlerta = (tipo, nome) => {
    setTipoAlerta(tipo);
    setNomeAlerta(nome);
    setMostrarAlerta(true);

    const getSrc = AUDIO_MAP[tipo];
    const src    = getSrc ? getSrc(nome) : '/alarme1.mp3';

    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.play().catch(err =>
        console.warn('[Alarme] autoplay bloqueado:', err.message)
      );
    }

    setTimeout(() => {
      setMostrarAlerta(false);
      if (audioRef.current) audioRef.current.pause();
    }, 10_000);
  };

  // ── 6. Ticker RSS ─────────────────────────────────────────────────────────
  useEffect(() => {
    const buscar = async () => {
      try {
        const PROXY = getProxyURL();
        const res = await fetch(`${PROXY}/api/rss?url=${encodeURIComponent(TICKER_FEED)}`);
        if (!res.ok) throw new Error('Falha no proxy');
        const xml = await res.text();
        const itens = parseRSS(xml);
        if (itens.length) setTickerItens(itens);
      } catch (err) {
        console.error('[Ticker] Erro:', err.message);
      }
    };
    buscar();
    const id = setInterval(buscar, 20 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const horaDisplay = horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dataDisplay = horaAtual.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const textoTicker = tickerItens.length
    ? tickerItens.map(t => `◆  ${t}`).join('          ')
    : '◆  Carregando notícias de tecnologia…';

  return (
    <div className="app">
      <div className="app-grid-bg" aria-hidden="true" />

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

      <AlertaSonoro mostrar={mostrarAlerta} tipo={tipoAlerta} nome={nomeAlerta} />

      <main className="main">
        <aside className="col-horarios">
          <Horarios horarios={HORARIOS} horaAtual={horaAtual} />
        </aside>
        <section className="col-noticias">
          <Noticias />
        </section>
      </main>

      {/* Aviso de áudio removido para o Fully Kiosk Browser */}

      <footer className="footer">
        <span>© 2026 SENAI-SP</span>
        <span className="footer-diamond">◆</span>
        <span>Serviço Nacional de Aprendizagem Industrial</span>
        <span className="footer-diamond">◆</span>
        <span>Painel Digital v3.0</span>
      </footer>

      <audio ref={audioRef} preload="auto" />
    </div>
  );
}