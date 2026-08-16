const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

const adresRouter = require('../api/adres');
const telefonRouter = require('../api/telefonnumarasi');
const yoneticilerRouter = require('../api/yoneticiler');
const ogretmenlerRouter = require('../api/ogretmenler');

app.use('/api/adres', adresRouter);
app.use('/api/telefonnumarasi', telefonRouter);
app.use('/api/yoneticiler', yoneticilerRouter);
app.use('/api/ogretmenler', ogretmenlerRouter);

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        endpoints: [
            'GET /api/adres?url=',
            'GET /api/telefonnumarasi?url=',
            'GET /api/yoneticiler?url=',
            'GET /api/ogretmenler?url='
        ]
    });
});

app.listen(PORT, () => {
    console.log(`[*] Server running: http://localhost:${PORT}`);
    console.log(`[*] Endpoints ready:`);
    console.log(`    - /api/adres?url=`);
    console.log(`    - /api/telefonnumarasi?url=`);
    console.log(`    - /api/yoneticiler?url=`);
    console.log(`    - /api/ogretmenler?url=`);
});