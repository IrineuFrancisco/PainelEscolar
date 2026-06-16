import React, { useState, useEffect, useRef } from 'react';
import './Noticias.css';

// ✅ DETECTA AUTOMATICAMENTE O PROXY
const getProxyURL = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' 
    ? 'http://localhost:3001'
    : `http://${hostname}:3001`;
};

const CATEGORIAS = [
  { label: 'Avisos da Escola', isAvisos: true },
  { label: 'TecMundo', url: 'https://rss.tecmundo.com.br/feed' },
  { label: 'Olhar Digital', url: 'https://olhardigital.com.br/rss' },
  { label: 'Canaltech', url: 'https://canaltech.com.br/rss/' },
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
        const PROXY = getProxyURL();
        
        if (cat.isAvisos) {
          const url = `${PROXY}/api/get-avisos?t=${Date.now()}`;
          const timeUrl = `${PROXY}/api/hora-brasilia?t=${Date.now()}`;
          console.log('[Notícias] Buscando Avisos de:', url);
          
          const [res, timeRes] = await Promise.all([
            fetch(url),
            fetch(timeUrl).catch(() => null)
          ]);
          
          if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
          const data = await res.json();
          
          if (active && data.articles && data.articles.length > 0) {
            let serverDate = new Date();
            if (timeRes && timeRes.ok) {
              try {
                const timeData = await timeRes.json();
                if (timeData.datetime) {
                  serverDate = new Date(timeData.datetime);
                  window.serverTimeOffset = serverDate.getTime() - Date.now();
                }
              } catch (e) {
                console.error('[Notícias] Erro ao ler hora do servidor', e);
              }
            }

            const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            const hojeStr = diasSemana[serverDate.getDay()];
            
            const avisosFiltrados = data.articles.filter(a => {
              if (a.tipo === 'cardapio') {
                return a.titulo.toLowerCase().includes(hojeStr.toLowerCase());
              }
              return true; // Mantém os outros avisos/lembretes
            });

            setItems(
              avisosFiltrados.map(a => ({
                isAviso: true,
                title: a.titulo || 'Aviso',
                source: (a.tipo || 'Escola').toUpperCase(),
                url: '#',
                pubDate: a.updated_at || a.created_at || new Date().toISOString(),
                thumbnail: '',
                cor: a.cor || '#111',
                icone: a.icone || '📢',
                originalDesc: a.mensagem || '',
                description: a.mensagem || '',
              }))
            );
          } else if (active) {
            setErro('Nenhum aviso encontrado.');
            setItems([]);
          }
        } else {
          // ✅ USA ROTA /api/rss DO PROXY
          const url = `${PROXY}/api/rss?url=${encodeURIComponent(cat.url)}`;
          
          console.log('[Notícias] Buscando RSS de:', url);
          
          const res = await fetch(url);
          
          if (!res.ok) {
            throw new Error(`Erro HTTP ${res.status}`);
          }
          
          const text = await res.text();
          const parser = new DOMParser();
          const xml = parser.parseFromString(text, 'text/xml');
          
          const itemsNode = xml.querySelectorAll('item');
          const parsedItems = Array.from(itemsNode).slice(0, 15).map(item => {
            let thumb = '';
            const mediaContent = item.getElementsByTagName('media:content')[0];
            if (mediaContent) {
              thumb = mediaContent.getAttribute('url');
            } else {
              const desc = item.querySelector('description')?.textContent || '';
              const match = desc.match(/<img[^>]+src="([^">]+)"/);
              if (match) thumb = match[1];
            }

            return {
              title: item.querySelector('title')?.textContent || 'Sem título',
              source: cat.label,
              url: item.querySelector('link')?.textContent || '#',
              pubDate: item.querySelector('pubDate')?.textContent || '',
              thumbnail: thumb ? `${PROXY}/api/image-proxy?url=${encodeURIComponent(thumb)}` : '',
              description: (item.querySelector('description')?.textContent || '').replace(/<[^>]+>/g, '').trim().slice(0, 180),
            };
          });

          if (active && parsedItems.length > 0) {
            setItems(parsedItems);
          } else if (active) {
            setErro('Nenhuma notícia encontrada neste feed.');
            setItems([]);
          }
        }
      } catch (e) {
        console.error('[Notícias] Erro:', e);
        if (active) setErro('Erro ao buscar o RSS: ' + e.message);
      } finally {
        if (active) setCarregando(false);
      }
    };

    buscar();
    // GNews Grátis: 100 req/dia. 30min = ~48 req/dia se ficar aberto 24h
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

  const nextNewsRef = useRef(1);

  useEffect(() => {
    if (!items.length) return;
    const id = setInterval(() => {
      setSelecionado(p => {
        // Se chegou na última notícia da aba atual
        if (p + 1 >= items.length) {
          setCatIdx(atual => {
             // Se estamos na aba de Avisos (0), vamos para a próxima notícia
             if (atual === 0) {
               return nextNewsRef.current;
             } 
             // Se estamos numa aba de Notícia, preparamos a próxima e voltamos para Avisos (0)
             else {
               let prox = atual + 1;
               if (prox >= CATEGORIAS.length) prox = 1; // ignora o 0 pois é Avisos
               nextNewsRef.current = prox;
               return 0; 
             }
          });
          return 0;
        }
        // Senão, vai para a próxima notícia da mesma aba
        return p + 1;
      });
    }, 8000); // Troca a cada 8 segundos
    return () => clearInterval(id);
  }, [items]);

  const noticiaRaw = items[selecionado];
  let noticia = noticiaRaw ? { ...noticiaRaw } : null;

  // Filtro de horário para o cardápio
  if (noticia && noticia.isAviso && noticia.source === 'CARDAPIO' && noticia.originalDesc && noticia.originalDesc.includes('|')) {
    const partes = noticia.originalDesc.split('|').map(p => p.trim());
    // Usa o offset global de tempo, se existir, para corrigir a hora da TV
    const now = window.serverTimeOffset ? new Date(Date.now() + window.serverTimeOffset) : new Date();
    const tempoAtual = now.getHours() + now.getMinutes() / 60;
    
    let filtroStr = 'MANHÃ:';
    if (tempoAtual > 9.25 && tempoAtual < 11.0) {
      filtroStr = 'ALMOÇO:';
    } else if (tempoAtual >= 11.0) {
      filtroStr = 'TARDE:';
    }

    const parte = partes.find(p => p.toUpperCase().startsWith(filtroStr));
    if (parte) {
      noticia.description = `<span style="color:var(--aviso-cor); filter:brightness(1.5); font-weight:900; font-size:1.1em; letter-spacing:0.05em">${filtroStr}</span><br/><br/>${parte.substring(filtroStr.length).trim()}`;
    }
  }

  return (
    <div className="noticias-wrap">
      <div className="noticias-header">
        <div className="noticias-header-left">
          <span className="noticias-header-icon">📡</span>
          <span className="noticias-header-title">Radar de Inovação</span>
          <span className="noticias-powered">RSS Feed Grátis</span>
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
              className={`card-destaque ${noticia?.isAviso ? 'aviso-mode' : ''}`}
              style={noticia?.isAviso ? {
                '--aviso-cor': noticia.cor
              } : (noticia?.thumbnail ? {
                backgroundImage: `linear-gradient(to top, rgba(5,9,15,1) 15%, rgba(5,9,15,0.4) 100%), url(${noticia.thumbnail})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : { backgroundColor: '#111' })}
            >
              <div className="card-destaque-top">
                <span className="card-fonte-badge" style={noticia?.isAviso ? { backgroundColor: noticia.cor } : {}}>{noticia?.source}</span>
                {!noticia?.isAviso && <span className="card-tempo">{tempoRelativo(noticia?.pubDate)}</span>}
              </div>

              {noticia?.isAviso ? (
                <div className="aviso-main-content">
                  {noticia?.icone && (
                    <div className="aviso-icone-wrap">
                      <span className="aviso-icone">{noticia.icone}</span>
                    </div>
                  )}
                  <h2 className="card-titulo">{noticia?.title}</h2>
                </div>
              ) : (
                <h2 className="card-titulo">
                  {noticia?.title}
                </h2>
              )}
              
              {noticia?.description && (
                <div 
                  className="card-desc" 
                  dangerouslySetInnerHTML={{ 
                    __html: noticia.isAviso 
                      ? noticia.description.replace(/\|/g, '<br/><br/>') 
                      : noticia.description 
                  }} 
                />
              )}
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
                  <p className="lista-titulo">
                    {n.isAviso && n.icone && <span style={{marginRight: '6px'}}>{n.icone}</span>}
                    {n.title}
                  </p>
                  <div className="lista-meta">
                    <span className="lista-fonte" style={n.isAviso ? { color: n.cor } : {}}>{n.source}</span>
                    {!n.isAviso && <span className="lista-tempo">{tempoRelativo(n.pubDate)}</span>}
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