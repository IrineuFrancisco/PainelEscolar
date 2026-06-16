/**
 * server.js — Proxy local para o Painel SENAI
 *
 *  node server.js para subir o servidor
 */

const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const os = require('os');
const path = require('path');

const app = express();
const PORT = 3001;

const APITUBE_KEY = 'api_live_HwLpYGTKC0ZwiNhK2C0mbb6iPUdNKB70qFJDggtEDdWIte';
const GNEWS_KEY = '882ae3c30eaafdc8c011a2605ce82408';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qfnibnhjdnczxoublxif.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_rZf4HnUkAiO16oaQwserjg_Axj-2BwL';

let avisosCache = [];
const apiCache = {
  noticias: { data: null, timestamp: 0 },
  gnews: { data: null, timestamp: 0 }
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Função fetchUrl centralizada para evitar memory leaks, tratar redirects em loop e payloads gigantes
function fetchUrl(url, options = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Muitos redirecionamentos'));

    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === 'https:' ? https : http;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      rejectUnauthorized: false
    };

    const req = lib.request(reqOptions, (res) => {
      // Segue redirecionamentos internamente (evita redirecionar a TV)
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, parsedUrl.origin).href;
        }
        return fetchUrl(redirectUrl, options, redirects + 1).then(resolve).catch(reject);
      }

      let data = Buffer.alloc(0);
      let totalLength = 0;
      const MAX_PAYLOAD_SIZE = 2 * 1024 * 1024; // Limite de 2MB por resposta

      res.on('data', chunk => {
        totalLength += chunk.length;
        if (totalLength > MAX_PAYLOAD_SIZE) {
          res.destroy();
          return reject(new Error('Payload excedeu o limite de 2MB'));
        }
        data = Buffer.concat([data, chunk]);
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data.toString('utf-8')
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout de requisição (10s)'));
    });

    req.setTimeout(10000); // Aborta após 10 segundos
    req.end();
  });
}

function buscarAvisosSupabase() {
  const url = `${SUPABASE_URL}/rest/v1/avisos?select=*&ativo=eq.true&order=ordem.asc&created_at=lte.2030-01-01T00:00:00.${Date.now()}Z`;
  const options = {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  };

  fetchUrl(url, options)
    .then(response => {
      if (response.statusCode === 200) {
        try {
          avisosCache = JSON.parse(response.data);
          console.log(`[Supabase] Avisos atualizados: ${avisosCache.length} itens encontrados.`);
        } catch (e) {
          console.error('[Supabase] Erro ao fazer parse dos avisos:', e.message);
        }
      } else {
        console.error(`[Supabase] Erro HTTP ${response.statusCode}: ${response.data}`);
      }
    })
    .catch(err => console.error('[Supabase] Erro na requisição:', err.message));
}

// Busca inicial para já ter dados ao ligar
buscarAvisosSupabase();

// Verificador contínuo: checa a cada 1 minuto se é a hora exata de atualizar
setInterval(() => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  // Atualiza pontualmente às 06:00, 10:00 e 14:00
  if ((h === 6 || h === 10 || h === 14) && m === 0) {
    console.log(`[Agendamento] Atualizando avisos programados para as ${h}:00...`);
    buscarAvisosSupabase();
  }
}, 60 * 1000);

app.use(cors({ origin: '*' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── /api/noticias ─────────────────────────────────────────────────────────────
app.get('/api/noticias', async (req, res) => {
  const now = Date.now();
  if (apiCache.noticias.data && (now - apiCache.noticias.timestamp < CACHE_TTL)) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(apiCache.noticias.data);
  }

  const { topic = 'tecnologia technology tech', lang = 'pt,en', count = '20' } = req.query;
  const params = new URLSearchParams({ title: topic, 'language.code': lang, per_page: count, sort_by: 'published_at' });
  const url = `https://api.apitube.io/v1/news/everything?${params}`;

  try {
    const response = await fetchUrl(url, { headers: { 'X-API-Key': APITUBE_KEY, 'Accept': 'application/json' } });
    if (response.statusCode === 200) {
      apiCache.noticias.data = response.data;
      apiCache.noticias.timestamp = now;
    }
    res.setHeader('Content-Type', 'application/json');
    res.status(response.statusCode).send(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── /api/gnews ────────────────────────────────────────────────────────────────
app.get('/api/gnews', async (req, res) => {
  const now = Date.now();
  if (apiCache.gnews.data && (now - apiCache.gnews.timestamp < CACHE_TTL)) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(apiCache.gnews.data);
  }

  const { q = 'tecnologia', lang = 'pt', country = 'br', max = '15' } = req.query;
  const params = new URLSearchParams({ q, lang, country, max, apikey: GNEWS_KEY });
  const url = `https://gnews.io/api/v4/search?${params}`;

  try {
    const response = await fetchUrl(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'PainelSENAI/1.0' } });
    if (response.statusCode === 200) {
      apiCache.gnews.data = response.data;
      apiCache.gnews.timestamp = now;
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(response.data);
    } else {
      throw new Error(`GNews returned ${response.statusCode}`);
    }
  } catch (err) {
    // Fallback local se erro (limite de API atingido, etc)
    return res.status(200).json({
      articles: [
        {
          title: "Indústria 4.0: SENAI lidera inovações tecnológicas",
          description: "Avanços em inteligência artificial e robótica transformam o ensino no país.",
          image: "https://via.placeholder.com/600x400.png?text=SENAI+Tech",
          url: "#",
          publishedAt: new Date().toISOString(),
          source: { name: "Portal da Indústria" }
        },
        {
          title: "Nova plataforma digital conecta alunos e mercado",
          description: "Ferramentas interativas facilitam o acesso à informação em tempo real nas escolas.",
          image: "https://via.placeholder.com/600x400.png?text=Educa%C3%A7%C3%A3o",
          url: "#",
          publishedAt: new Date().toISOString(),
          source: { name: "Tech News" }
        }
      ]
    });
  }
});

// ── /api/get-avisos ───────────────────────────────────────────────────────────────
app.get('/api/get-avisos', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.status(200).send(JSON.stringify({ articles: avisosCache }));
});

// ── /api/rss ──────────────────────────────────────────────────────────────────
app.get('/api/rss', async (req, res) => {
  const feedUrl = decodeURIComponent(req.query.url || '');
  if (!feedUrl) return res.status(400).send('url param required');

  try {
    const response = await fetchUrl(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PainelSENAI/1.0)', 'Accept': 'application/rss+xml, application/xml, text/xml, */*' }
    });
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(response.statusCode).send(response.data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ── /api/image-proxy ──────────────────────────────────────────────────────────
app.get('/api/image-proxy', async (req, res) => {
  const imageUrl = decodeURIComponent(req.query.url || '');
  if (!imageUrl) return res.status(400).send('url param required');

  try {
    const parsedUrl = new URL(imageUrl);
    const lib = parsedUrl.protocol === 'https:' ? https : http;
    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      rejectUnauthorized: false
    };

    const imageReq = lib.request(reqOptions, (imageRes) => {
      if ([301, 302, 307, 308].includes(imageRes.statusCode) && imageRes.headers.location) {
        return res.redirect(`/api/image-proxy?url=${encodeURIComponent(imageRes.headers.location)}`);
      }
      res.status(imageRes.statusCode);
      res.setHeader('Content-Type', imageRes.headers['content-type'] || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache de 1 dia na TV
      imageRes.pipe(res);
    });

    imageReq.on('error', (err) => res.status(500).send(err.message));
    imageReq.setTimeout(10000, () => {
      imageReq.destroy();
      res.status(504).send('Timeout');
    });
    imageReq.end();
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ── /api/hora-brasilia ────────────────────────────────────────────────────────
app.get('/api/hora-brasilia', (req, res) => {
  try {
    const now = new Date();
    res.json({
      datetime: now.toISOString(),
      unixtime: Math.floor(now.getTime() / 1000)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Serve o build do React ────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'build')));

// ✅ CORREÇÃO: Express 5 não aceita '*' — usa '/*splat'
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// ── Inicia o servidor ─────────────────────────────────────────────────────────
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
    }
  }
  return ips;
}

app.listen(PORT, '0.0.0.0', () => {
  const localIPs = getLocalIPs();
  console.log(`\n✅ Proxy SENAI rodando!`);
  console.log(`   Local:   http://localhost:${PORT}`);
  localIPs.forEach(ip => console.log(`   Rede:    http://${ip}:${PORT}`));
  console.log(`\n📡 Rotas:`);
  console.log(`   /api/noticias      → APITube (Cache 5m)`);
  console.log(`   /api/gnews         → GNews (Cache 5m)`);
  console.log(`   /api/get-avisos    → Supabase Cache`);
  console.log(`   /api/rss           → RSS proxy (Auto-redirect)`);
  console.log(`   /api/hora-brasilia → Hora oficial\n`);
});