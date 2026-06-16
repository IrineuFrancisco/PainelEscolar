const express = require('express');
const app = express();
app.get('/*splat', (req, res) => res.send('MATCHED SPLAT'));
app.use((req, res) => res.send('FALLBACK 404'));
app.listen(3002, () => console.log('started'));
