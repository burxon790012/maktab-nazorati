# MaktabWatch Serverini Internetga (Serverga) Joylash Qo'llanmasi

Ushbu loyihani internetga joylashning 3 ta eng qulay va sinovdan o'tgan usuli mavjud:

---

## 🚀 1-USUL: Render.com (Mutlaqo BEPUL, 24/7 ishlaydigan Cloud Server)
*Eng tavsiya etiladigan usul. Sizga avtomatik bepul **HTTPS** domen (masalan, `https://maktab-nazorati.onrender.com`) beradi. Soat ham, ota-ona mobil ilovasi ham internet orqali ulanadi.*

### Bosqichlar:
1. [Render.com](https://render.com) saytida bepul ro'yxatdan o'ting.
2. **"New +"** tugmasini bosib, **"Web Service"** ni tanlang.
3. Loyiha kodini GitHub'ingizga yuklab, Render'ga ulang (yoki to'g'ridan-to'g'ri `backend` papkasini ko'rsating).
4. Sozlamalar:
   * **Runtime:** Node
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
5. **"Create Web Service"** tugmasini bosing.
6. 1 daqiqa ichida sizga tayyor `https://...onrender.com` havolasi beriladi!

---

## ⚡ 2-USUL: Kompyuteringizdan Turib 1 Daqiqada Internetga Chiqarish (Localtunnel)
*Hech qanday server sotib olmasdan yoki ro'yxatdan o'tmasdan, o'z kompyuteringizdagi serverni darhol butun dunyo internetiga ochish.*

### Bosqichlar:
1. Terminalda serverni ishga tushiring:
   ```bash
   node server.js
   ```
2. Yangi terminal ochib, ushbu buyruqni bering:
   ```bash
   npx localtunnel --port 3000 --subdomain maktab-nazorati
   ```
3. Sizga darhol quyidagicha havola beradi:
   `https://maktab-nazorati.loca.lt`
4. Ushbu havolani xohlagan telefondan yoki brauzerdan ochsangiz, loyihangiz internetda ishlaydi!

---

## 🏢 3-USUL: O'zingizning VPS / Linux Serveringizga Joylash (Docker orqali)
*Agar sizda shaxsiy VPS server (Ubuntu/Debian) bo'lsa:*

1. Loyiha papkasiga kiring:
   ```bash
   cd backend
   ```
2. Docker orqali 1 ta buyruq bilan ishga tushiring:
   ```bash
   docker compose up -d
   ```
3. Server avtomatik ravishda fonda (background) 24/7 ishlab turadi va kompyuter qayta yoqilganda ham o'zi avtomatik qayta ishga tushadi.
