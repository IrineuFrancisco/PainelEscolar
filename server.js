/**
 * server.js — Proxy local para o Painel SENAI
 *
 * Resolve dois problemas:
 *  1. APITube bloqueia CORS direto do browser → fazemos a chamada pelo Node
 *  2. RSS feeds (Canaltech, Tecnoblog etc.) → buscamos e retornamos o XML
 *
 * Como usar:
 *   npm install express cors node-fetch axios   (rode UMA VEZ na pasta raiz)
 *   node server.js                               (deixe rodando em paralelo ao React)
 *
 * O React roda em  http://localhost:3000
 * O proxy roda em  http://localhost:3001
 */

const express  = require('express');
const cors     = require('cors');
const https    = require('https');
const http     = require('http');

const app  = express();
const PORT = 3001;

const APITUBE_KEY = 'api_live_HwLpYGTKC0ZwiNhK2C0mbb6iPUdNKB70qFJDggtEDdWIte';
const APITUBE_URL = 'https://api.apitube.io/v1/news/everything';

// Permite chamadas do React (localhost:3000) e de qualquer origem local
app.use(cors({ origin: '*' }));

// ── /api/noticias?topic=tecnologia&lang=pt&count=20 ───────────────────────────
// Proxy para APITube — faz a requisição server-side, retorna JSON limpo
app.get('/api/noticias', (req, res) => {
  const { topic = 'tecnologia technology tech', lang = 'pt,en', count = '20' } = req.query;

  const params = new URLSearchParams({
    title:           topic,
    'language.code': lang,
    per_page:        count,
    sort_by:         'published_at',
  });

  const url = `${APITUBE_URL}?${params}`;

  const options = {
    hostname: 'api.apitube.io',
    path:     `/v1/news/everything?${params}`,
    method:   'GET',
    headers:  {
      'X-API-Key': APITUBE_KEY,
      'Accept':    'application/json',
    },
  };

  const request = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      try {
        res.setHeader('Content-Type', 'application/json');
        res.status(apiRes.statusCode).send(data);
      } catch {
        res.status(500).json({ error: 'Erro ao processar resposta da APITube' });
      }
    });
  });

  request.on('error', err => {
    console.error('[APITube]', err.message);
    res.status(500).json({ error: err.message });
  });

  request.end();
});

// ── /api/rss?url=<encoded-rss-url> ───────────────────────────────────────────
// Proxy para feeds RSS (contorna CORS dos portais)
app.get('/api/rss', (req, res) => {
  const feedUrl = decodeURIComponent(req.query.url || '');
  if (!feedUrl) return res.status(400).send('url param required');

  const parsed   = new URL(feedUrl);
  const lib      = parsed.protocol === 'https:' ? https : http;

  const options = {
    hostname: parsed.hostname,
    path:     parsed.pathname + parsed.search,
    method:   'GET',
    headers:  {
      'User-Agent': 'Mozilla/5.0 (compatible; PainelSENAI/1.0)',
      'Accept':     'application/rss+xml, application/xml, text/xml, */*',
    },
  };

  const request = lib.request(options, (feedRes) => {
    // Segue redirect 301/302
    if ([301, 302, 307, 308].includes(feedRes.statusCode) && feedRes.headers.location) {
      return res.redirect(`/api/rss?url=${encodeURIComponent(feedRes.headers.location)}`);
    }

    let data = '';
    feedRes.on('data', chunk => data += chunk);
    feedRes.on('end', () => {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.status(feedRes.statusCode).send(data);
    });
  });

  request.on('error', err => {
    console.error('[RSS]', err.message);
    res.status(500).send(err.message);
  });

  request.end();
});

// ── /api/hora-brasilia ────────────────────────────────────────────────────────
// Retorna a hora oficial de Brasília via worldtimeapi.org (contorna CORS do browser)
app.get('/api/hora-brasilia', (req, res) => {
  const options = {
    hostname: 'worldtimeapi.org',
    path:     '/api/timezone/America/Sao_Paulo',
    method:   'GET',
    headers:  {
      'Accept':     'application/json',
      'User-Agent': 'PainelSENAI/1.0',
    },
  };

  const request = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        // datetime ex: "2026-03-13T10:45:30.123456-03:00"
        res.json({ datetime: json.datetime, unixtime: json.unixtime });
      } catch {
        res.status(500).json({ error: 'Erro ao parsear resposta' });
      }
    });
  });

  request.on('error', err => {
    console.error('[Hora Brasília]', err.message);
    res.status(500).json({ error: err.message });
  });

  request.end();
});

app.listen(PORT, () => {
  console.log(`\n✅ Proxy SENAI rodando em http://localhost:${PORT}`);
  console.log(`   /api/noticias      → APITube News API`);
  console.log(`   /api/rss           → Proxy de feeds RSS`);
  console.log(`   /api/hora-brasilia → Hora oficial (worldtimeapi.org)\n`);
});