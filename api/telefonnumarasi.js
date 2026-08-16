const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { cleanText, fetchParallel, parseIletisim } = require('./utils');

const router = express.Router();

router.get('/', async (req, res) => {
    let baseUrl = (req.query.url || '').trim().replace(/\/+$/, '');

    if (!baseUrl) {
        return res.json({ success: false, error: 'URL parametresi eksik. Örnek: ?url=denizyildizlari.meb.k12.tr' });
    }

    if (!/^https?:\/\//i.test(baseUrl)) baseUrl = 'https://' + baseUrl;

    try {
        const pages = await fetchParallel({
            iletisim: baseUrl + '/tema/iletisim.php',
        });

        const iletisim = parseIletisim(pages.iletisim || '', baseUrl);

        return res.json({
            success: true,
            telefon: iletisim.telefon
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;