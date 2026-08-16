const axios = require('axios');
const cheerio = require('cheerio');

function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/&nbsp;|&#160;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function formatTelefon(raw) {
    if (!raw || raw === 'Bilinmiyor') return 'Bilinmiyor';
    
    let digits = raw.replace(/[^0-9]/g, '');
    
    if (digits.length === 10 && !digits.startsWith('0')) {
        digits = '0' + digits;
    }
    
    if (digits.length !== 11 || !digits.startsWith('0')) {
        return raw;
    }
    
    return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7, 9)} ${digits.substring(9, 11)}`;
}

function extractNameAndTitle(text) {
    const decoded = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');

    const brMatch = decoded.match(/(.*?)(?:<br\s*\/?>\s*<span>|<br\s*\/?>|\s*<span>)(.*)/is);
    if (brMatch) {
        return {
            name: cleanText(brMatch[1]),
            title: cleanText(brMatch[2] ?? '')
        };
    }

    const titleKeywords = /BİLGİSAYAR|FEN|TÜRKÇE|MATEMATİK|İNGİLİZCE|SOSYAL|BEDEN|MÜZİK|GÖRSEL|DİN|TEKNOLOJİ|REHBERLİK|OKUL|SINIF|MÜDÜR|ÖĞRETMENİ/iu;
    const kwMatch = decoded.match(new RegExp(`(.*?)\\s+(${titleKeywords.source}).*$`, 'iu'));
    if (kwMatch) {
        return {
            name: cleanText(kwMatch[1]),
            title: cleanText(kwMatch[2] ?? '')
        };
    }

    let cleanName = cleanText(text);
    cleanName = cleanName.replace(/^(Baş\.Öğ\.|Baş Öğ\.|Uzm\.|Dr\.|Prof\.|Doç\.|Öğr\.|Öğt\.)\s*/i, '');
    cleanName = cleanName.replace(/^(Baş\.|Baş )\s*/i, '');

    return { name: cleanName, title: '' };
}

function formatName(name) {
    const isAbbreviated = /^[A-ZÇĞİÖŞÜ]\.[A-ZÇĞİÖŞÜ]\.?$/i.test(name.trim());
    
    if (isAbbreviated) {
        const parts = name.split('.').filter(p => p.trim());
        
        if (parts.length >= 2) {
            return {
                isim: parts[0].toUpperCase(),
                soyisim: parts[1].toUpperCase(),
                adFormatted: name.toUpperCase()
            };
        } else {
            return {
                isim: parts[0].toUpperCase(),
                soyisim: '',
                adFormatted: name.toUpperCase()
            };
        }
    } else {
        const parts = name.split(' ').filter(p => p.trim());
        
        if (parts.length === 1) {
            const isim = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
            return { isim, soyisim: '', adFormatted: isim };
        } else if (parts.length === 2) {
            const isim = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
            const soyisim = parts[1].toUpperCase();
            return { isim, soyisim, adFormatted: isim + ' ' + soyisim };
        } else {
            const nameParts = parts.slice(0, -1);
            const isim = nameParts.map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            const soyisim = parts[parts.length - 1].toUpperCase();
            return { isim, soyisim, adFormatted: isim + ' ' + soyisim };
        }
    }
}

const axiosInstance = axios.create({
    timeout: 15000,
    httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    maxRedirects: 5,
});

async function fetchParallel(urlMap, timeout = 15000) {
    const entries = Object.entries(urlMap);
    const results = {};

    await Promise.all(entries.map(async ([key, url]) => {
        if (!url) { results[key] = ''; return; }
        try {
            const res = await axiosInstance.get(url, { timeout });
            results[key] = res.status !== 404 ? res.data : '';
        } catch {
            results[key] = '';
        }
    }));

    return results;
}

function parseIletisim(html, baseUrl) {
    const $ = cheerio.load(html);
    let telefon = '', adres = '', web = baseUrl;

    const table = $('table.table').first();

    if (table.length) {
        table.find('tr').each((_, row) => {
            const rowHtml = $(row).html() || '';
            const tdText = $(row).find('td').last().text();

            if (/fa-phone/.test(rowHtml) && /Telefon/i.test(rowHtml)) {
                telefon = tdText.trim();
            }

            if (/fa-globe/.test(rowHtml) && /WEB/i.test(rowHtml)) {
                web = tdText.trim();
            }

            if (/fa-map-marker/.test(rowHtml) && /Adres/i.test(rowHtml)) {
                const fullText = tdText;
                
                const ulasimPatterns = [
                    /(İl merkezine.*?)$/is,
                    /(İlçe merkezine.*?)$/is,
                    /(Toplu taşıma.*?)$/is,
                    /(Ulaşım.*?)$/is,
                ];

                let cleaned = fullText;
                for (const pattern of ulasimPatterns) {
                    const match = cleaned.match(pattern);
                    if (match) {
                        cleaned = cleaned.substring(0, cleaned.indexOf(match[1])).trim();
                        break;
                    }
                }
                
                adres = cleaned;
            }
        });
    }

    const fullText = $.text();

    if (!telefon) {
        const telPatterns = [
            /Telefon[:\s]+([0-9\(\)\s\-]+)/i,
            /Tel[:\s]+([0-9\(\)\s\-]+)/i,
            /(\(\d{3}\)\s*\d{3}\s*\d{2}\s*\d{2})/,
            /(\(\d{3}\)\s*\d{7})/,
            /(0\d{3}\s*\d{3}\s*\d{2}\s*\d{2})/,
            /(0\d{10})/,
        ];
        for (const pattern of telPatterns) {
            const match = fullText.match(pattern);
            if (match) {
                telefon = match[1];
                break;
            }
        }
    }

    if (!adres) {
        const adresPatterns = [
            /Adres[:\s]+([^\n]+(?:Mah|Cad|Sok|Bulvar|No)[^\n]{10,150})/is,
            /([A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s+Mah[^\n]+)/i,
            /([A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s+(?:Cad|Cadde|Sok|Sokak|Bulvar)[^\n]+)/i,
        ];
        for (const pattern of adresPatterns) {
            const match = fullText.match(pattern);
            if (match) {
                adres = cleanText(match[1]);
                
                const ulasimInAdres = adres.match(/(İl merkezine|İlçe merkezine|Toplu taşıma|Ulaşım).*$/i);
                if (ulasimInAdres) {
                    adres = adres.substring(0, ulasimInAdres.index).trim();
                }
                break;
            }
        }
    }

    if (web === baseUrl) {
        const webMatch = html.match(/https?:\/\/[^\s"']+meb\.k12\.tr/i);
        if (webMatch) web = webMatch[0];
    }

    telefon = formatTelefon(telefon);
    adres = adres || 'Bilinmiyor';

    return { telefon, adres, web };
}

function parsePersonelLinks(html) {
    const links = {};

    const ulRegex = /<ul[^>]*id='seviye(\d+)'[^>]*>(.*?)<\/ul>/gis;
    let ulMatch;
    while ((ulMatch = ulRegex.exec(html)) !== null) {
        const seviye = ulMatch[1];
        const ulBody = ulMatch[2];
        const liRegex = /<li>\s*<a[^>]+href='([^']+)'[^>]*title='([^']*?)'[^>]*>(.*?)<\/a>\s*<\/li>/gis;
        let liMatch, i = 0;
        while ((liMatch = liRegex.exec(ulBody)) !== null) {
            links[`s${seviye}_${i++}`] = {
                href: liMatch[1], title: cleanText(liMatch[2]),
                nameHtml: liMatch[3], seviye
            };
        }
    }

    if (Object.keys(links).length === 0) {
        const $ = cheerio.load(html);
        let counter = 1;
        $('ul[id^="seviye"]').each((_, ul) => {
            const idAttr = $(ul).attr('id') || '';
            const sevNo = (idAttr.match(/seviye(\d+)/) || [, String(counter)])[1];
            $(ul).find('a').each((i, a) => {
                links[`s${sevNo}_${i}`] = {
                    href: $(a).attr('href') || '',
                    title: $(a).attr('title') || '',
                    nameHtml: $(a).html() || '',
                    seviye: sevNo
                };
            });
            counter++;
        });
    }

    return links;
}

function parsePersonelDetail(html) {
    let aciklama = '', fotograf = '';
    if (!html) return { aciklama, fotograf };

    const photoMatch = html.match(/<img[^>]+id="idariresim"[^>]+src="([^"]+)"/i);
    if (photoMatch) fotograf = cleanText(photoMatch[1]);
    else {
        const mebPhotoMatch = html.match(/<img[^>]*src="([^"]*meb_iys_dosyalar[^"]*)"[^>]*>/i);
        if (mebPhotoMatch) fotograf = cleanText(mebPhotoMatch[1]);
    }

    const structuredMatch = html.match(/<div class="dotted_line"><\/div>\s*<p[^>]*>(.*?)<\/p>/is);
    if (structuredMatch) {
        aciklama = cleanText(structuredMatch[1]);
        if (aciklama.length > 50) return { aciklama, fotograf };
    }

    const afterDottedMatch = html.match(/<div class="dotted_line"><\/div>\s*(?:<[^>]+>)?\s*([\s\S]{50,2000}?)(?:<div[^>]*class="[^"]*col-|<\/div>\s*<div|<footer|<script|$)/is);
    if (afterDottedMatch) {
        let rawText = afterDottedMatch[1];
        
        rawText = rawText.replace(/<[^>]+>/g, ' ');
        rawText = rawText
            .replace(/&nbsp;|&#160;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim();
        
        const stopPhrases = [
            'Adres:', 'Telefon', 'e-Posta', 'MEB ©', 'İLETİŞİM', 
            'Gizlilik', 'Tüm Hakları', 'hizmet sunulmaktadır',
            'SK.', 'MAH.', 'BLOK', 'Sokak', 'Cadde'
        ];
        
        let cleaned = rawText;
        for (const phrase of stopPhrases) {
            const idx = cleaned.indexOf(phrase);
            if (idx !== -1) cleaned = cleaned.substring(0, idx);
        }
        
        cleaned = cleaned.trim();
        
        if (cleaned.length > 50 && /\d{4}/.test(cleaned) && /[A-ZÇĞİÖŞÜ]{10,}/.test(cleaned)) {
            aciklama = cleaned;
            return { aciklama, fotograf };
        }
    }

    const $ = cheerio.load(html);
    $('script, style, noscript, header, footer, nav').remove();
    
    const headingText = $('h1, h2, h3').first().text().trim();
    let fullText = $.text();
    
    const headingIndex = fullText.indexOf(headingText);
    if (headingIndex !== -1) {
        let afterHeading = fullText.substring(headingIndex + headingText.length);
        
        afterHeading = afterHeading
            .replace(/\t+/g, ' ')
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        const cutoffPatterns = [
            /Adres:.*$/im, /Telefon.*$/im, /e-Posta.*$/im, /MEB ©.*$/im,
            /İLETİŞİM.*$/im, /Gizlilik.*$/im, /Tüm Hakları Saklıdır.*$/im,
            /hizmet sunulmaktadır.*$/im, /Rıdvanpaşa.*$/im, /M\.E\.B.*$/im, /T\.C\. Mİllî.*$/im
        ];
        
        for (const pattern of cutoffPatterns) {
            afterHeading = afterHeading.replace(pattern, '');
        }
        
        const yearMatch = afterHeading.match(/(\d{4}\s+[A-ZÇĞİÖŞÜ][\s\S]{50,1500}?)(?=\s{3,}|Adres|Telefon|İLETİŞİM|$)/);
        if (yearMatch) {
            let bioText = yearMatch[1].trim();
            bioText = bioText.split(/(?:Rıdvanpaşa|M\.E\.B|T\.C\. Mİllî)/)[0].trim();
            
            if (bioText.length > 50) {
                aciklama = bioText;
                return { aciklama, fotograf };
            }
        }
        
        const uppercaseBlock = afterHeading.match(/([A-ZÇĞİÖŞÜ\s,\.]{200,1000}?)(?=\s{5,}|[a-z]{10,}|Adres|Telefon|$)/);
        if (uppercaseBlock) {
            aciklama = uppercaseBlock[1].trim();
        }
    }

    return { aciklama, fotograf };
}

module.exports = {
    cleanText,
    formatTelefon,
    extractNameAndTitle,
    formatName,
    fetchParallel,
    parseIletisim,
    parsePersonelLinks,
    parsePersonelDetail
};