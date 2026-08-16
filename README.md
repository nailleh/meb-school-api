> [!WARNING]
> Bu proje yalnızca **eğitim ve araştırma amaçlıdır**. Kullanımından doğabilecek hukuki, etik veya teknik sonuçlardan **kullanıcı tamamen sorumludur**. Proje sahipleri hiçbir sorumluluk kabul etmez.

---

<div align="center">

# 🏫 MEB School API Server

**Node.js tabanlı, MEB okul verilerine yönelik eğitim amaçlı sorgulama API'si**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/Lisans-MIT-blue)](#lisans)
[![Status](https://img.shields.io/badge/Durum-Eğitim%20Amaçlı-orange)]()
[![PRs Welcome](https://img.shields.io/badge/PR-Kabul%20Edilir-brightgreen)](https://github.com/firstcontributions/first-contributions)

</div>

---

## 📋 İçindekiler

- [Yasal Uyarı](#%EF%B8%8F-yasal-uyarı)
- [Proje Hakkında](#-proje-hakkında)
- [Gereksinimler](#-gereksinimler)
- [Kurulum](#-kurulum)
- [Çalıştırma](#-çalıştırma)
- [API Referansı](#-api-referansı)
- [Lisans](#-lisans)

---

## ⚠️ Yasal Uyarı

> **Dikkat:** Bu depo, yalnızca **eğitim, akademik araştırma ve güvenlik farkındalığı** amacıyla oluşturulmuştur.

- Bu yazılım aracılığıyla elde edilen veriler **kesinlikle ticari veya kötü niyetli amaçlarla kullanılamaz.**
- Üçüncü taraf sistemlere izinsiz erişim, **5651 sayılı Kanun** ve **Türk Ceza Kanunu'nun 243-245. maddeleri** kapsamında suç teşkil edebilir.
- Proje geliştiricileri, bu yazılımın **hatalı veya kötü amaçlı kullanımından** doğan hiçbir hukuki, maddi ya da manevi sorumluluk kabul etmez.
- **Kullanıcı, bu aracı kullanmadan önce kendi ülkesinin ve bölgesinin yasalarını incelemekle yükümlüdür.**

---

## 📖 Proje Hakkında

Bu proje, yalnızca **`meb.k12.tr`** alt alan adına sahip, MEB'e bağlı devlet okullarına ait kamuya açık verileri standart bir REST API arayüzüyle sunan **Node.js** tabanlı hafif bir sunucu uygulamasıdır. Özel okullar ve diğer kurumlar kapsam dışındadır. Temel amacı; ağ programlama, API tasarımı ve veri işleme konularında öğrencilere ve geliştiricilere pratik bir öğrenme ortamı sağlamaktır.

### ✨ Özellikler

- ⚡ Hafif ve hızlı Node.js sunucusu
- 🔌 RESTful API mimarisi
- 🏫 Yalnızca `*.meb.k12.tr` alan adlı **devlet okulları** desteklenir
- 🪟 Windows için hazır başlatma betiği (`run.bat`)
- 🐧 Linux/macOS desteği

---

## 🔧 Gereksinimler

| Bağımlılık | Minimum Sürüm |
|---|---|
| [Node.js](https://nodejs.org) | `v18.0.0` |
| npm | `v8.0.0` |

---

## 📦 Kurulum

Depoyu klonlayın ve bağımlılıkları yükleyin:

```bash
git clone https://github.com/kullanici-adi/meb-school-api.git
cd meb-school-api
npm install
```

---

## 🚀 Çalıştırma

**Windows:**
```bat
run.bat
```

**Linux / macOS:**
```bash
node server/start.js
# veya
npm start
```

Sunucu varsayılan olarak `http://localhost:3000` adresinde çalışır.

---

## 📡 API Referansı

Tüm endpoint'ler `GET` metoduyla çalışır.

| Endpoint | Açıklama |
|---|---|
| `GET /api/adres` | Okul adres bilgilerini döndürür |
| `GET /api/ogretmenler` | Öğretmen listesini döndürür |
| `GET /api/telefonnumarasi` | Okul telefon numaralarını döndürür |
| `GET /api/yoneticiler` | Yönetici bilgilerini döndürür |

### Örnek Modül Adres Sorgu Yanıtı

```json
{
  "success": true,
  "adres": "Osmangazi Mah. Fatih Sultan Mehmet Cad. No81 Darıca/KOCAELİ",
  "web": "https://denizyildizlari.meb.k12.tr"
}
```

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.  
Kullanım koşulları için `LICENSE` dosyasını inceleyiniz.

---

<div align="center">

**Yalnızca eğitim amaçlıdır · Tüm sorumluluk kullanıcıya aittir**

</div>
