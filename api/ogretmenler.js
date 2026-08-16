const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { 
    cleanText, 
    fetchParallel, 
    parsePersonelLinks, 
    parsePersonelDetail, 
    extractNameAndTitle,
    formatName 
} = require('./utils');

const router = express.Router();

router.get('/', async (req, res) => {
    let baseUrl = (req.query.url || '').trim().replace(/\/+$/, '');

    if (!baseUrl) {
        return res.json({ success: false, error: 'URL parametresi eksik' });
    }

    if (!/^https?:\/\//i.test(baseUrl)) baseUrl = 'https://' + baseUrl;

    try {
        let pages = await fetchParallel({
            teskilat: baseUrl + '/tema/teskilat.php',
        });

        if (!pages.teskilat) {
            const fb = await fetchParallel({ t: baseUrl + '/index.php' });
            pages.teskilat = fb.t || '';
        }

        const teskilatHtml = pages.teskilat || '';
        const personelLinks = parsePersonelLinks(teskilatHtml);

        const detailUrlMap = {};
        for (const [key, info] of Object.entries(personelLinks)) {
            if (info.href) detailUrlMap[key] = baseUrl + '/' + info.href.replace(/^\//, '');
        }

        const detailPages = Object.keys(detailUrlMap).length
            ? await fetchParallel(detailUrlMap, 10000)
            : {};

        const defaultPhoto = baseUrl + '/www/images/mansetresim.png';
        const ogretmenler = [];

        const ogretmenKeywords = [
            'ÖĞRETMENİ',
            'ÖĞRETMEN',
            'ÖĞRETMENLİĞİ'
        ];

        const yoneticiKeywords = [
            'MÜDÜR',
            'BAŞKAN',
            'YÖNETİCİ'
        ];

        for (const [key, info] of Object.entries(personelLinks)) {
            const nameInfo = extractNameAndTitle(info.nameHtml);
            const name = cleanText(nameInfo.name);
            const title = cleanText(info.title || nameInfo.title);
            
            if (!name) continue;

            const titleUpper = title.toUpperCase();

            const hasOgretmenKeyword = ogretmenKeywords.some(k => titleUpper.includes(k));
            const hasYoneticiKeyword = yoneticiKeywords.some(k => titleUpper.includes(k));

            const isOgretmen = hasOgretmenKeyword && !hasYoneticiKeyword;

            if (!isOgretmen) continue;

            const detail = parsePersonelDetail(detailPages[key] || '');
            const fotograf = detail.fotograf || defaultPhoto;
            const formatted = formatName(name);

            ogretmenler.push({
                ad: formatted.adFormatted,
                unvan: title,
                seviye: info.seviye,
                link: detailUrlMap[key] || '',
                fotograf,
                isim_soyisim: name,
                detay_unvan: title,
                isim: formatted.isim,
                soyisim: formatted.soyisim,
                aciklama: detail.aciklama,
            });
        }

        return res.json({
            success: true,
            ogretmen_sayisi: ogretmenler.length,
            ogretmenler: ogretmenler
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;