import React, { useState, useEffect } from 'react';
import './Noticias.css';

// ── CONFIGURAÇÃO GNEWS ───────────────────────────────────────────────────────
const API_KEY = '882ae3c30eaafdc8c011a2605ce82408'; // Substitua pela sua chave gratuita
const BASE_URL = 'https://gnews.io/api/v4/search';

const CATEGORIAS = [
  { label: 'Tecnologia', q: 'tecnologia OR software OR hardware' },
  { label: 'Inteligência Artificial', q: '"inteligência artificial" OR "AI"' },
  { label: 'Inovação', q: 'inovação OR startups OR empreendedorismo' },
  { label: 'Brasil Tech', q: 'tecnologia Brasil OR programação' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function tempoRelativo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1)    return 'agora';
  if (diff < 60)   return `${diff}min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

// ── Hook principal ────────────────────────────────────────────────────────────
function useNoticias(catIdx) {
  const [items, setItems] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let active = true;
    setErro('');

    const buscar = async () => {
      setCarregando(true);
      try {
        const cat = CATEGORIAS[catIdx];
        // lang=pt e country=br garantem notícias em português do Brasil
        const url = `${BASE_URL}?q=${encodeURIComponent(cat.q)}&lang=pt&country=br&max=15&apikey=${API_KEY}`;
        
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
           throw new Error(data.errors ? data.errors[0] : `Erro HTTP ${res.status}`);
        }

        if (active && data.articles) {
          setItems(
            data.articles.map(a => ({
              title: (a.title || '').trim(),
              source: a.source?.name || 'Notícia',
              url: a.url || '#',
              pubDate: a.publishedAt || '',
              thumbnail: a.image || '',
              description: (a.description || '').replace(/<[^>]+>/g, '').slice(0, 180),
            }))
          );
        } else if (active && data.articles?.length === 0) {
          setErro('Nenhuma notícia encontrada para este termo.');
        }
      } catch (e) {
        if (active) setErro(e.message);
      } finally {
        if (active) setCarregando(false);
      }
    };

    buscar();
    // GNews Grátis tem limite de 100/dia. 30 min é o ideal para não estourar se tiver muitas abas abertas.
    const id = setInterval(buscar, 30 * 60 * 1000);
    return () => { active = false; clearInterval(id); };
  }, [catIdx]);

  return { items, carregando, erro };
}

// ── Componente ────────────────────────────────────────────────────────────────
function Noticias() {
  const [catIdx, setCatIdx] = useState(0);
  const [selecionado, setSelecionado] = useState(0);
  const { items, carregando, erro } = useNoticias(catIdx);

  useEffect(() => setSelecionado(0), [catIdx, items]);

  useEffect(() => {
    if (!items.length) return;
    const id = setInterval(
      () => setSelecionado(p => (p + 1) % items.length),
      8000
    );
    return () => clearInterval(id);
  }, [items]);

  const noticia = items[selecionado];

  return (
    <div className="noticias-wrap">
      <div className="noticias-header">
        <div className="noticias-header-left">
          <span className="noticias-header-icon">📡</span>
          <span className="noticias-header-title">Radar de Inovação</span>
          <span className="noticias-powered">GNews API</span>
        </div>
        <div className="feed-tabs">
          {CATEGORIAS.map((c, i) => (
            <button
              key={i}
              className={`feed-tab ${i === catIdx ? 'ativo' : ''}`}
              onClick={() => setCatIdx(i)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {carregando && (
        <div className="noticias-loading">
          <div className="spinner" />
          Sincronizando com as principais fontes…
        </div>
      )}

      {!carregando && erro && (
        <div className="noticias-erro">
          <span>⚠️</span>
          <span>{erro}</span>
        </div>
      )}

      {!carregando && !erro && items.length > 0 && (
        <div className="noticias-corpo">
          {/* Card Destaque */}
          <div className="destaque-col">
            <div
              className="card-destaque"
              onClick={() => noticia?.url && window.open(noticia.url, '_blank')}
              style={noticia?.thumbnail ? {
                backgroundImage: `linear-gradient(to top, rgba(5,9,15,1) 15%, rgba(5,9,15,0.4) 100%), url(${noticia.thumbnail})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : { backgroundColor: '#111' }}
            >
              <div className="card-destaque-top">
                <span className="card-fonte-badge">{noticia?.source}</span>
                <span className="card-tempo">{tempoRelativo(noticia?.pubDate)}</span>
              </div>

              <h2 className="card-titulo">{noticia?.title}</h2>
              {noticia?.description && <p className="card-desc">{noticia.description}...</p>}
              <span className="card-ler">Acessar conteúdo completo →</span>
            </div>

            <div className="destaque-dots">
              {items.map((_, i) => (
                <button
                  key={i}
                  className={`destaque-dot ${i === selecionado ? 'ativo' : ''}`}
                  onClick={() => setSelecionado(i)}
                />
              ))}
            </div>
          </div>

          {/* Lista lateral */}
          <div className="lista-col">
            {items.map((n, i) => (
              <div
                key={i}
                className={`lista-item ${i === selecionado ? 'ativo' : ''}`}
                onClick={() => setSelecionado(i)}
              >
                <div className="lista-corpo">
                  <p className="lista-titulo">{n.title}</p>
                  <div className="lista-meta">
                    <span className="lista-fonte">{n.source}</span>
                    <span className="lista-tempo">{tempoRelativo(n.pubDate)}</span>
                  </div>
                </div>
                {n.thumbnail && (
                  <img src={n.thumbnail} alt="" className="lista-thumb" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Noticias;