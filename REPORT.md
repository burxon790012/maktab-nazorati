# SMART CHILD (maktab-nazorati) — Texnik Hisobot (Technical Report)

**Loyiha:** SMART CHILD (Maktab nazorati va bolalar xavfsizligi monitoring tizimi)  
**Sana:** 2026-11-05  
**Hozirgi Branch:** `cleanup/remove-dead-code` (Asosiy branch: `main`)  
**Ishlab chiqarish muhiti (Production):** Docker konteyneri orqali Render platformasida (`https://maktab-nazorati.onrender.com`) deploy qilingan.

---

## 1. ABOUT THE PROJECT (Loyiha Haqida)

### 1.1 Loyihaning Maqsadi
"SMART CHILD" — O'zbekiston maktablaridagi o'quvchilar xavfsizligini ta'minlash, ularning maktab hududiga kirish-chiqishini geozonalar (GPS Geofencing) orqali avtomatik monitoring qilish, aqlli soatlar (Samsung Galaxy Watch5 Pro va mos Wear OS qurilmalari) orqali real vaqtda biometrik va telemetrik ma'lumotlarni (GPS, yurak urishi, batareya quvvati, SOS signallari, qurilmaning qo'lda taqilganligi) kuzatish uchun mo'ljallangan yagona dispetcherlik (fleet-tracking) platformasi.

### 1.2 Asosiy Funksiyalari
- **Real-vaqtli GPS Geozonalar (Geofencing):** Maktab hududi ko'pburchak (polygon) yoki doira (circle) shaklida xaritada chiziladi. O'quvchining geozona holati: `INSIDE` (Maktabda / Yashil), `OUTSIDE` (Tashqarida / Qizil), yoki `VERIFYING` (Chegarada, GPS noaniqlik buferi / Sariq).
- **Haqiqiy Soat Telemetriyasi va Monitoring:** Samsung Galaxy Watch5 Pro bilan Wear OS / HTTP API orqali aloqa:
  - Jonli GPS koordinatalari (kenglik, uzunlik, aniqlik radiusi).
  - Qurilma holati: `ONLINE`, `OFFLINE`, batareya foizi (yarim doira progress), yurak urishi (BPM), qo'lda taqilganligi (`isWorn: true/false`), favqulodda `isSos` signali.
- **KPI Boshqaruv Paneli (Fleet Dashboard):** 6 ta jonli status kartochkasi:
  1. *Maktabda* (Inside)
  2. *Tashqarida* (Outside)
  3. *Chegarada* (Verifying)
  4. *Favqulodda SOS* (Pulsatsiya animatsiyasi)
  5. *Soatlar Holati* (Online / Offline nisbati)
  6. *O'rtacha Batareya* (Progress bar)
- **Geozona Muharriri:** Xaritada to'g'ridan-to'g'ri yangi maktab chegaralarini interaktiv chizish (Poligon nuqtalari yoki Doira markazi va radiusi bo'yicha) va backend DB'ga saqlash.
- **Smart Manzil va Maktab Qidiruvi:** Mahalliy baza, Google Places Autocomplete va Nominatim proksi orqali O'zbekiston maktablari va manzillarini aqlli qidirish (Avtomatik transliteratsiya, variantlar generatsiyasi).
- **Favqulodda Ogohlantirishlar (Alerts Engine):** Geozonadan ruxsatsiz chiqish, soat batareyasi < 15%, yurak urishi me'yordan chetlanishi, soat yechilishi yoki SOS signali bosilganda real vaqtli bildirishnomalar.

### 1.3 Foydalanuvchi Rollari (User Roles)
Tizimda 4 ta asosiy rol mavjud (`schema.sql` va `auth.js` bo'yicha):
1. **SUPER_ADMIN:** Barcha maktablarni qo'shish, o'chirish, tahrirlash, tizim geozonalarini boshqarish, butun tizim monitoringi va audit loglarini ko'rish.
2. **SCHOOL_ADMIN (Maktab Administratori / Inspektor):** O'z maktabi chegaralarini belgilash, o'quvchilarni va o'qituvchilarni boshqarish, sinflar bo'yicha davomat va xavfsizlik hisobotlarini shakllantirish.
3. **TEACHER (Sinf Rahbari / O'qituvchi):** O'z sinfidagi o'quvchilarning real vaqtdagi geozona holati, kechikishi, davomati va sog'liq ko'rsatkichlarini kuzatish.
4. **PARENT (Ota-ona):** Faqat o'z farzandining jonli koordinatalari, xavfsiz marshruti, batareyasi va SOS xabarlarini ko'rish.

---

## 2. TECHNOLOGIES (Texnologik Stek va Kutubxonalar)

### 2.1 Frontend Kutubxonalari (`frontend/package.json`)
- **Node.js muhiti:** Node `>=22`
- **Frontend Framework:** React `^18.3.1` + React DOM `^18.3.1`
- **Til:** TypeScript `^5.6.3`
- **Build vositasi:** Vite `^5.4.8` (ishlab chiqarish buildi: `v5.4.21`)
- **Stillashtirish:** Tailwind CSS `^3.4.13`, PostCSS `^8.4.47`, Autoprefixer `^10.4.20`
- **UI Komponentlar va Yordamchilar:**
  - `clsx` `^2.1.1` va `tailwind-merge` `^2.5.4`
  - `class-variance-authority` `^0.7.0`
  - `@radix-ui/react-dialog` `^1.1.2`
  - `@radix-ui/react-dropdown-menu` `^2.1.2`
  - `@radix-ui/react-label` `^2.1.0`
  - `@radix-ui/react-select` `^2.1.2`
  - `@radix-ui/react-slot` `^1.1.0`
  - `@radix-ui/react-tabs` `^1.1.1`
- **Ikonkalar:** `lucide-react` `^0.453.0`
- **Xarita Kutubxonasi:**
  - `leaflet` `^1.9.4`
  - `@types/leaflet` `^1.9.14`
  - Google Maps JavaScript API (Dinamik skript inyeksiyasi orqali, `@googlemaps/js-api-loader` o'rniga yengil xavfsiz yuklovchi `googleLoader.ts`).

### 2.2 Backend Kutubxonalari (`backend/package.json` va ildizdagi `package.json`)
- **Runtime:** Node.js `>=22` (ES Modules & CommonJS aralash/Express)
- **Web Server:** `express` `^4.19.2`
- **Ma'lumotlar Bazasi va ORM/Query Builder:**
  - `knex` `^3.3.0` (SQL so'rovlar va migratsiyalar uchun)
  - `pg` `^8.23.1` (PostgreSQL drayveri — Production uchun)
  - `better-sqlite3` `^13.0.3` (Lokal va sinov muhiti uchun SQLite drayveri)
- **Xavfsizlik va Autentifikatsiya:**
  - `jsonwebtoken` `^9.0.3` (JWT tokenlar)
  - `bcryptjs` `^3.0.3` (Parollarni xeshlash)
  - `express-rate-limit` `^8.7.3` (DDoS va brute-force himoyasi)
  - `cors` `^2.8.5`
- **Validatsiya:** `zod` `^4.6.7`
- **Test Freymvorki:** `vitest` `^5.1.0`, `supertest` `^7.3.1`

### 2.3 Xarita Kutubxonalari va Arxitekturasi
Loyiha **Ko'p dvigatelli gibrid xarita arxitekturasi (Multi-Engine Map Adapter Architecture)** asosida qurilgan:
1. **Google Maps Platform (Asosiy / Primary):**
   - Agar muhitda `GOOGLE_MAPS_API_KEY` mavjud bo'lsa va to'g'ri ishlasa, Google Maps JavaScript API yuklanadi (`marker`, `geometry`, `places` kutubxonalari bilan).
   - Qorong'i dizayn uslubi (`GOOGLE_DARK_STYLES`), `google.maps.Polygon`, `google.maps.Circle` va `google.maps.marker.AdvancedMarkerElement` vositalari ishlatiladi.
2. **Leaflet + OpenStreetMap / Esri (Zaxira / Automatic Fallback):**
   - Kutubxona: `leaflet` `v1.9.4`.
   - Agar Google API kaliti kiritilmagan bo'lsa, noto'g'ri bo'lsa yoki autentifikatsiya xatosi (`gm_authFailure`) yuz bersa, tizim bir lahzada foydalanuvchiga xalaqit bermasdan Leaflet adapteriga o'tadi.
   - Plitkalar (Tiles):
     - Standart qatlam: `https://tile.openstreetmap.de/{z}/{x}/{y}.png` (OpenStreetMap German cluster — bulutli serverlar va Render IP'laridan 403 bermaydi).
     - Zaxira qatlam: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}` (Esri World Street Map).
     - Sun'iy yo'ldosh (Satellite) qatlami: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` (Esri World Imagery).

### 2.4 O'rnatish va Ishga Tushirish Buyruqlari (Install & Run)
```bash
# 1. Repozitoriyani klonlash
git clone https://github.com/burxon790012/maktab-nazorati.git
cd maktab-nazorati

# 2. Backend va root bog'liqliklarini o'rnatish
npm install
cd backend && npm install && cd ..

# 3. Frontend bog'liqliklarini o'rnatish
cd frontend && npm install && cd ..

# 4. Frontendni ishlab chiqarishga build qilish
cd frontend && npm run build && cd ..

# 5. Build qilingan frontend fayllarini backend/public ga ko'chirish
cp -r frontend/dist/. backend/public/

# 6. Testlarni ishga tushirish (Vitest)
npm test

# 7. Lokal serverni ishga tushirish (SQLite fallback bilan)
node backend/server.js
# Brauzerda ochish: http://localhost:5000
```

---

## 3. FILE STRUCTURE (Fayllar Tuzilmasi)

```text
maktab-nazorati/
├── Dockerfile                        # Render va Railway uchun ko'p bosqichli Docker build konfiguratsiyasi
├── render.yaml                       # Render.com infratuzilma deklaratsiyasi (Web service + PG)
├── package.json                      # Ildiz package.json (Backend test va scriptlari bilan)
├── CLEANUP_REPORT.md                 # Ishlatilmayotgan kodlar auditi hisoboti
├── REPORT.md                         # Ushbu to'liq texnik hisobot
├── tools/
│   └── smoke.js                      # 5 ta endpoints bo'yicha avtomatlashtirilgan backend smoke testi
├── backend/
│   ├── server.js                     # Asosiy Express serveri: REST API, telemetriya, auth, statik fayllar (~103KB)
│   ├── db.js                         # Knex bazasi proksisi (PostgreSQL / SQLite avto-seleksiya)
│   ├── knexfile.js                   # Knex ulanish sozlamalari (pg vs better-sqlite3)
│   ├── schema.sql                    # PostgreSQL to'liq reliesion sxemasi (PostGIS/JSONB)
│   ├── data/
│   │   ├── smart_child_multischool_db.json # Boshlang'ich multi-maktab, o'quvchi va geozona ma'lumotlari
│   │   └── child_safety.sqlite       # Lokal test vaqtida yaratiladigan SQLite fayli
│   ├── public/                       # Vite build qilingan tayyor frontend aktivlari (index.html, js, css)
│   └── tests/
│       ├── child_safety.test.js      # O'quvchi xavfsizligi va geofence bo'yicha 29 ta test
│       ├── search_geocoding.test.js  # Manzil va maktab qidiruvi bo'yicha 4 ta test
│       └── telemetry_and_devices.test.js # Soat telemetriyasi bo'yicha 7 ta test
├── frontend/
│   ├── index.html                    # Frontend bosh sahifasi (CSP, Leaflet CSS)
│   ├── package.json                  # Frontend React, Vite, Leaflet, Tailwind bog'liqliklari
│   ├── vite.config.ts                # Vite konfiguratsiyasi (@/ path alias)
│   └── src/
│       ├── main.tsx                  # React DOM boshlang'ich nuqtasi
│       ├── App.tsx                   # Asosiy boshqaruv sahifasi: State management, Sidebar, Tablar
│       ├── index.css                 # Global stillar, qorong'i dizayn o'zgaruvchilari, .dark-tiles filtrlari
│       ├── types/
│       │   └── index.ts              # TypeScript interfeyslari: Student, School, Telemetry, User
│       ├── components/
│       │   ├── MapView.tsx           # Asosiy xarita konteyneri, asboblar paneli, geozona chizish boshqaruvi
│       │   ├── KpiCards.tsx          # 6 ta jonli monitoring kartasi (Maktabda, Tashqarida, SOS, ...)
│       │   ├── Topbar.tsx            # Yuqori panel: maktab tanlash, qidiruv, profil, rejimlar
│       │   ├── Sidebar.tsx           # Chap tomon navigatsiya paneli (yig'iladigan, zamonaviy)
│       │   ├── SearchCombobox.tsx    # Maktab va manzillarni aqlli qidirish komponenti
│       │   ├── StudentsTab.tsx       # O'quvchilar ro'yxati va filtrlash
│       │   ├── DevicesTab.tsx        # Smart soatlar holati va ulash bo'limi
│       │   ├── Modals.tsx            # O'quvchi va maktab qo'shish modallari
│       │   └── ...                   # Boshqa yordamchi tablar (Reports, Parent, Health)
│       └── lib/
│           ├── geoUtils.ts           # Geometrik formulalar (Ray-casting, Haversine masofa, doira radiusi)
│           └── mapAdapter/
│               ├── types.ts          # Xarita dvigateli interfeysi (MapAdapter, MapInitOptions)
│               ├── index.ts          # createMapAdapter zavodi (Google primary, Leaflet fallback)
│               ├── googleLoader.ts   # Google Maps SDK asinxron yuklovchisi
│               ├── googleMapAdapter.ts # Google Maps dvigateli realizatsiyasi
│               └── leafletOsmAdapter.ts# Leaflet + OSM / Esri dvigateli realizatsiyasi
└── watch-app/                        # Samsung Galaxy Watch (Wear OS) mijozi yoki prototipi
```

---

## 4. COMPLETED WORK (Bajarilgan Ishlar Holati)

### 4.1 Sahifalar va Modullar Holati
| Modul / Sahifa | Holati | Tavsif |
|---|---|---|
| **Xarita (MapView)** | **Tugallangan (95%)** | Bitta singleton instansiya barcha tablar uchun ishlaydi, markerlar, geozonalar, o'lchov asbobi bor. Chizish paytida fon tiles'ning yo'qolishi masalasi hal etilmoqda. |
| **KPI Kartalar (KpiCards)** | **Tugallangan (100%)** | 6 ta KPI kartasi, bosganda status bo'yicha xarita va ro'yxat filtrlanadi, toggle tozalash imkoni bor. |
| **Manzil va Maktab Qidiruvi** | **Tugallangan (100%)** | Mahalliy DB + Google Places + Nominatim server proksi. Transliteratsiya (lotin/kirill), xatolik toastlari bilan. |
| **O'quvchilar Boshqaruvi** | **Tugallangan (100%)** | Ro'yxat, qidiruv, statuslar (INSIDE/OUTSIDE/VERIFYING), har bir o'quvchi soati telemetriyasi. |
| **Qurilmalar (DevicesTab)** | **Tugallangan (90%)** | Soat holati (Galaxy Watch5 Pro), batareya, signal, real vaqtli ulanish simulyatori. |
| **Ogohlantirishlar (Alerts)** | **Tugallangan (90%)** | SOS signallari, geozonadan chiqish, batareya pastligi xabarlari ro'yxati. |
| **Super Admin Paneli** | **Tugallangan (85%)** | Maktablar qo'shish/tahrirlash, DB statusini ko'rish. |
| **Ota-ona Ilovasi (ParentTab)** | **Qisman (60%)** | Prototip ko'rinishida, asosiy API integratsiyasi qilingan. |
| **Salomatlik (HealthTab)** | **Qisman (60%)** | Puls (yurak urishi) va qadamlar diagrammalari. |
| **Hisobotlar (ReportsTab)** | **Qisman (50%)** | Davomat eksporti va statistika ko'rinishlari. |

### 4.2 Ma'lumotlar Bazasi Tuzilmasi (Database Structure)

Baza ikki xil rejimda ishlaydi:
1. `DATABASE_URL` mavjud bo'lganda: **PostgreSQL** (`schema.sql` bo'yicha).
2. Lokal yoki sinov muhitida: **SQLite** (`backend/data/child_safety.sqlite`) hamda tezkor xotiradagi `backend/data/smart_child_multischool_db.json`.

#### Maktablar jadvali (`schools`):
- `id` (VARCHAR(50), PRIMARY KEY): Maktab identifikatori (masalan: `"SCH001"`, `"SCH002"`).
- `name` (VARCHAR(255)): Maktab nomi (masalan: `"30-sonli umumta'lim maktabi"`).
- `address` (TEXT): Maktab manzili.
- **`latitude`** (DOUBLE PRECISION): **Maktab markazining kenglik koordinatasi** (masalan: `41.311081`).
- **`longitude`** (DOUBLE PRECISION): **Maktab markazining uzunlik koordinatasi** (masalan: `69.240562`).
- **`geofence_polygon`** (JSONB yoki TEXT): **Maktab xavfsiz hududining ko'pburchak koordinatalari massivi**, `[[lat, lng], [lat, lng], ...]`.
- `school_start_time` (TIME), `school_end_time` (TIME): Dars boshlanish va tugash vaqtlari.

#### O'quvchilar jadvali (`students`):
- `id` (VARCHAR(50), PRIMARY KEY): Masalan: `"10001"`.
- `full_name` (VARCHAR(255)): O'quvchining F.I.Sh.
- `school_id` (VARCHAR(50)): `schools(id)` ga bog'langan tashqi kalit.
- `device_id` (VARCHAR(100)): O'quvchiga biriktirilgan Galaxy Watch qurilma identifikatori.

#### Telemetriya jadvali (`telemetry`):
- `device_id` (VARCHAR(100)): Qurilma ID'si.
- **`latitude`** (DOUBLE PRECISION): O'quvchi turgan joriy GPS kenglik.
- **`longitude`** (DOUBLE PRECISION): O'quvchi turgan joriy GPS uzunlik.
- `accuracy_radius` (REAL): GPS xatolik radiusi (metrda).
- `heart_rate` (INT): Yurak urishi (BPM).
- `battery_level` (INT): Soat batareya quvvati (0-100%).
- `geofence_status` (VARCHAR): `'INSIDE'`, `'OUTSIDE'`, yoki `'VERIFYING'`.
- `is_sos` (BOOLEAN): SOS favqulodda tugmasi faollashtirilganligi.
- `is_worn` (BOOLEAN): Soat qo'lda ekanligi datchigi.
- `created_at` (TIMESTAMP): Vaqt tamg'asi.

---

## 5. MAP SECTION (Xarita Bo'limi — ENG MUHIM QISM)

### 5.1 Xarita Amalga Oshirilgan Aniq Fayllar
- **Xarita Boshqaruv Komponenti:** `frontend/src/components/MapView.tsx`
- **Xarita Adapter Interfeysi:** `frontend/src/lib/mapAdapter/types.ts`
- **Adapter Fabrikasi (Factory):** `frontend/src/lib/mapAdapter/index.ts`
- **Google Maps SDK Yuklovchi:** `frontend/src/lib/mapAdapter/googleLoader.ts`
- **Google Maps Dvigateli:** `frontend/src/lib/mapAdapter/googleMapAdapter.ts`
- **Leaflet OSM Dvigateli:** `frontend/src/lib/mapAdapter/leafletOsmAdapter.ts`
- **Xarita CSS Stili:** `frontend/src/index.css`

### 5.2 API Kalit qayerda saqlanadi va qanday ulanadi?
- **Joylashuvi:** Server muhit o'zgaruvchisida: `.env` yoki server environment'ida `GOOGLE_MAPS_API_KEY`.
- **Yuklanish mexanizmi:**
  1. Brauzer yuklanganda `frontend/src/lib/mapAdapter/index.ts` ichidagi `createMapAdapter()` chaqiriladi.
  2. Frontend backendga `GET /api/v1/config` so'rovini yuboradi.
  3. Backend (`backend/server.js` 672-qator) xavfsiz tarzda o'zining `process.env.GOOGLE_MAPS_API_KEY` qiymatini JSON sifatida qaytaradi:
     ```javascript
     app.get('/api/v1/config', (req, res) => {
       res.json({
         success: true,
         googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
         systemTime: new Date().toISOString()
       });
     });
     ```
  4. Agar `googleMapsApiKey` bo'sh bo'lsa yoki xato bersa, tizim avtomatik ravishda **hech qanday kalit talab qilmaydigan** `LeafletOsmAdapter` ga o'tadi.

### 5.3 Xarita Ma'lumotlarni Qayerdan Oladi?
- **Maktablar va Geozonalar:** `GET /api/v1/schools` endpointi orqali (har bir maktab ob'ektida `lat`, `lng` va `polygon: [[lat, lng], ...]` mavjud).
- **O'quvchilar va Soat Telemetriyasi:** `GET /api/v1/students` endpointi orqali (har bir o'quvchi ob'ektida `telemetry: { latitude, longitude, geofenceStatus, batteryLevel, heartRate, isSos }` mavjud).
- **Yangi Geozonani Saqlash:** `POST /api/v1/schools/:id/geofence` endpointiga `{ polygon: [[lat, lng], ...] }` yuboriladi.

### 5.4 Xarita Konteyneri CSS va O'lchamlari
`frontend/src/components/MapView.tsx`:
```tsx
<div
  className={`relative w-full h-full flex flex-col min-h-0 bg-[#1b1b33] overflow-hidden select-none ${
    isFullscreen ? 'fixed inset-0 z-50 p-0' : ''
  }`}
>
  {/* MAP ENGINE CANVAS */}
  <div
    ref={containerRef}
    className="w-full h-full flex-1 min-h-0 relative z-0"
    style={{ width: '100%', height: '100%', minHeight: '100%' }}
  />
</div>
```
`frontend/src/index.css`:
```css
.leaflet-container {
  width: 100% !important;
  height: 100% !important;
  min-height: 100% !important;
  background: var(--bg) !important; /* #1b1b33 */
  font-family: inherit;
}

/* Qorong'i rejim CSS filtri (Leaflet OSM plitkalari uchun) */
.dark-tiles .leaflet-tile-pane {
  filter: invert(1) hue-rotate(190deg) brightness(0.9) contrast(0.95) saturate(0.8) !important;
  -webkit-filter: invert(1) hue-rotate(190deg) brightness(0.9) contrast(0.95) saturate(0.8) !important;
}

/* Sun'iy yo'ldosh (Satellite) rejimida filtr o'chiriladi */
.satellite-mode .leaflet-tile-pane {
  filter: none !important;
  -webkit-filter: none !important;
}
```

### 5.5 To'liq Xarita Kodlari

#### A. Adapter Fabrikasi (`frontend/src/lib/mapAdapter/index.ts`):
```typescript
import { MapAdapter, MapProviderType } from './types';
import { loadGoogleMapsScript, isGoogleMapsAuthFailed } from './googleLoader';
import { GoogleMapAdapter } from './googleMapAdapter';
import { LeafletOsmAdapter } from './leafletOsmAdapter';

export * from './types';
export * from './googleLoader';
export * from './googleMapAdapter';
export * from './leafletOsmAdapter';

export interface MapAdapterInitResult {
  adapter: MapAdapter;
  provider: MapProviderType;
  isFallback: boolean;
  message?: string;
}

export async function createMapAdapter(preferredApiKey?: string): Promise<MapAdapterInitResult> {
  let googleApiKey = preferredApiKey || '';

  if (!googleApiKey) {
    try {
      const res = await fetch('/api/v1/config');
      const data = await res.json();
      if (data && data.googleMapsApiKey) {
        googleApiKey = data.googleMapsApiKey.trim();
      }
    } catch (_) {
      // Backend config unreachable
    }
  }

  // 1. Google Maps agar kalit mavjud bo'lsa
  if (googleApiKey && !isGoogleMapsAuthFailed()) {
    try {
      const isLoaded = await loadGoogleMapsScript(googleApiKey);
      if (isLoaded && window.google && window.google.maps) {
        return {
          adapter: new GoogleMapAdapter(),
          provider: 'google',
          isFallback: false,
          message: 'Google Maps platformasi faol',
        };
      }
    } catch (err: any) {
      console.warn('Google Maps yuklashda xatolik:', err.message);
    }
  }

  // 2. OpenStreetMap (OSM) Leaflet Fallback
  console.info('ℹ️ Google Maps kaliti mavjud emas yoki yuklanmadi. OpenStreetMap (OSM) zaxira rejimiga o\'tildi.');
  return {
    adapter: new LeafletOsmAdapter(),
    provider: 'leaflet-osm',
    isFallback: true,
    message: 'OpenStreetMap zaxira rejimi faol (Kalit talab etilmaydi)',
  };
}
```

#### B. Leaflet OSM Dvigateli (`frontend/src/lib/mapAdapter/leafletOsmAdapter.ts` dan muhim bo'laklar):
```typescript
import L from 'leaflet';
import { School, Student } from '@/types';
import { MapAdapter, MapInitOptions, MapLayerType, MapProviderType } from './types';

// High-availability Keyless Tile URLs
const OSM_GERMAN_URL = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png';
const ESRI_STREET_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const ESRI_SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export class LeafletOsmAdapter implements MapAdapter {
  private map: L.Map | null = null;
  private tileLayer: L.TileLayer | null = null;
  private container: HTMLElement | null = null;
  private options!: MapInitOptions;

  private studentMarkers: Map<string, L.Marker> = new Map();
  private schoolPolygons: Map<string, L.Polygon> = new Map();
  private schoolBadges: Map<string, L.Marker> = new Map();
  private trailPolylines: Map<string, L.Polyline> = new Map();

  // Custom Drawing state
  private activeDrawLayer: L.Polygon | L.Polyline | null = null;
  private isDrawPolygonReady = false;
  private activeDrawCircle: L.Circle | null = null;
  private drawPoints: [number, number][] = [];
  private drawMarkers: L.Marker[] = [];
  private mapClickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;
  private isDrawing = false; // Guard: prevents tile recovery during drawing
  private currentMapType: MapLayerType = 'roadmap';

  getProviderName(): MapProviderType {
    return 'leaflet-osm';
  }

  async init(container: HTMLElement, options: MapInitOptions): Promise<void> {
    this.container = container;
    this.options = options;

    this.map = L.map(container, {
      center: options.center,
      zoom: options.zoom,
      zoomControl: true,
      attributionControl: false,
    });

    this.setMapType(options.mapType || 'roadmap');
    this.setTheme(options.isDark);

    setTimeout(() => {
      this.resize();
    }, 200);
  }

  setMapType(type: MapLayerType): void {
    if (!this.map) return;
    this.currentMapType = type;

    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
      this.tileLayer = null;
    }

    const isSatellite = type === 'satellite' || type === 'hybrid';

    if (isSatellite) {
      this.container?.classList.add('satellite-mode');
      this.container?.classList.remove('dark-tiles');
      this.tileLayer = L.tileLayer(ESRI_SATELLITE_URL, {
        maxZoom: 19,
        attribution: 'Tiles © Esri',
      });
    } else {
      this.container?.classList.remove('satellite-mode');
      if (this.options?.isDark) {
        this.container?.classList.add('dark-tiles');
      } else {
        this.container?.classList.remove('dark-tiles');
      }

      // Primary: OpenStreetMap German cluster (never blocks cloud/Render IPs)
      this.tileLayer = L.tileLayer(OSM_GERMAN_URL, {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      });

      // Fallback: Esri Street Map on 2 consecutive errors
      let errorCount = 0;
      this.tileLayer.on('tileerror', () => {
        errorCount++;
        if (errorCount >= 2 && this.map) {
          console.warn('⚠️ OSM plitkasi xatosi, Esri World Street Map ga avtomatik o\'tkazilmoqda...');
          if (this.tileLayer) {
            this.map.removeLayer(this.tileLayer);
          }
          this.tileLayer = L.tileLayer(ESRI_STREET_URL, {
            maxZoom: 19,
            attribution: 'Tiles © Esri',
          }).addTo(this.map);
        }
      });
    }

    this.tileLayer.addTo(this.map);
  }

  // Geozona doirasini chizish
  startDrawingCircle(center?: [number, number], initialRadius = 200): void {
    this.cancelDrawing();
    if (!this.map) return;

    this.isDrawing = true;
    let initialCenter: [number, number] = [41.311081, 69.240562];
    if (center && Array.isArray(center) && isFinite(center[0]) && isFinite(center[1])) {
      initialCenter = center;
    } else {
      const c = this.map.getCenter();
      if (c && isFinite(c.lat) && isFinite(c.lng)) {
        initialCenter = [c.lat, c.lng];
      }
    }

    this.activeDrawCircle = L.circle(initialCenter, {
      radius: initialRadius,
      color: '#2ee59d',
      weight: 3,
      fillColor: '#2ee59d',
      fillOpacity: 0.25,
      dashArray: '6, 6',
    }).addTo(this.map);

    this.mapClickHandler = (e: L.LeafletMouseEvent) => {
      if (e && e.latlng && isFinite(e.latlng.lat) && isFinite(e.latlng.lng)) {
        if (this.activeDrawCircle) {
          this.activeDrawCircle.setLatLng(e.latlng);
        }
      }
    };
    this.map.on('click', this.mapClickHandler);
  }

  // Poligon chizish
  startDrawingPolygon(onPointAdded?: (pointsCount: number) => void): void {
    this.cancelDrawing();
    if (!this.map) return;

    this.isDrawing = true;
    this.drawPoints = [];
    this.drawMarkers = [];

    this.mapClickHandler = (e: L.LeafletMouseEvent) => {
      if (!e || !e.latlng || !isFinite(e.latlng.lat) || !isFinite(e.latlng.lng)) return;
      const pt: [number, number] = [e.latlng.lat, e.latlng.lng];
      this.drawPoints.push(pt);

      const markerIndex = this.drawPoints.length;
      const vertexIcon = L.divIcon({
        className: 'draw-vertex-pin',
        html: `<div style="background:#ff2d78;color:#fff;width:22px;height:22px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;border:2px solid #fff;">${markerIndex}</div>`,
        iconSize: [0, 0],
      });

      const vertexMarker = L.marker([pt[0], pt[1]], { icon: vertexIcon, zIndexOffset: 3000 }).addTo(this.map!);
      this.drawMarkers.push(vertexMarker);

      if (this.drawPoints.length === 2) {
        if (this.activeDrawLayer) this.map!.removeLayer(this.activeDrawLayer);
        this.activeDrawLayer = L.polyline(this.drawPoints, { color: '#ff2d78', weight: 3, dashArray: '4, 4' }).addTo(this.map!);
      } else if (this.drawPoints.length >= 3) {
        if (this.activeDrawLayer && !this.isDrawPolygonReady) {
          this.map!.removeLayer(this.activeDrawLayer);
          this.activeDrawLayer = null;
        }
        if (!this.activeDrawLayer) {
          this.activeDrawLayer = L.polygon(this.drawPoints, { color: '#ff2d78', weight: 3, fillColor: '#ff2d78', fillOpacity: 0.25, dashArray: '4, 4' }).addTo(this.map!);
          this.isDrawPolygonReady = true;
        } else {
          (this.activeDrawLayer as any).setLatLngs(this.drawPoints);
        }
      }
      onPointAdded?.(this.drawPoints.length);
    };

    this.map.on('click', this.mapClickHandler);
  }

  cancelDrawing(): void {
    this.isDrawing = false;
    if (this.mapClickHandler && this.map) {
      this.map.off('click', this.mapClickHandler);
      this.mapClickHandler = null;
    }
    if (this.activeDrawLayer && this.map) {
      this.map.removeLayer(this.activeDrawLayer);
      this.activeDrawLayer = null;
    }
    this.isDrawPolygonReady = false;
    if (this.activeDrawCircle && this.map) {
      this.map.removeLayer(this.activeDrawCircle);
      this.activeDrawCircle = null;
    }
    if (this.drawMarkers && this.map) {
      this.drawMarkers.forEach((m) => this.map?.removeLayer(m));
      this.drawMarkers = [];
    }
    this.drawPoints = [];
  }

  checkAndRecoverTileLayer(): void {
    if (!this.map) return;
    if (this.isDrawing) return; // Chizish paytida tegilmaydi

    if (!this.tileLayer || !this.map.hasLayer(this.tileLayer)) {
      console.warn('⚠️ Xarita plitkasi (tiles) yo\'qolgan, qayta tiklanmoqda...');
      this.setMapType(this.currentMapType);
    }
  }

  resize(): void {
    if (!this.map) return;
    this.checkAndRecoverTileLayer();
    this.map.invalidateSize({ pan: false });
  }
}
```

---

## 6. THE MAP PROBLEM (Xarita Muammosi)

### 6.1 Muammoning Aniq Ko'rinishi (What is wrong)
- Foydalanuvchi Render'da ochilgan veb-sahifada (`https://maktab-nazorati.onrender.com`) **"Poligon"** yoki **"Aylana"** tugmasini bosib maktab geozonasini chizishni boshlaganda yoki xarita ustiga bosganda:
  - Chizilayotgan geometrik shakl (masalan: qizil ko'pburchak chiziqlari, burchakdagi 1, 2, 3, 4, 5 pinlari, yoki yashil doira) xaritada aniq ko'rinadi.
  - Lekin **orqa fondagi xarita plitkalari (ko'chalar, binolar, rel'ef, OSM/Esri tiles) butunlay yo'qolib qoladi** va uning o'rnida faqat qorong'i bo'shliq (`#1b1b33`) ko'rinadi (Foydalanuvchi ilova qilgan so'nggi ikkita skrinshotda aniq ko'rsatilgan).
  - Natijada foydalanuvchi ko'cha yoki bino qayerdaligini ko'rmay, ko'r-ko'rona geozona chizishga majbur bo'lmoqda.

### 6.2 Konsol va Tarmoqdagi Xatolar (Console & Network tab)
1. **OSM Tile Block (Oldingi holat):**
   - So'rov: `GET https://tile.openstreetmap.org/16/43516/24220.png`
   - Status: `403 Forbidden` yoki javob headerlarida: `x-blocked: Access denied`.
   - Sababi: OpenStreetMap Foundation siyosati bo'yicha cloud hosting provayderlari (Render, AWS, DigitalOcean) server IP'laridan tushadigan so'rovlar avtomatik bloklanadi.
2. **Kesh yoki Qayta Chaqiruv Xatolari:**
   - Konsolda ba'zan `ResizeObserver loop completed with undelivered notifications` ogohlantirishi.
   - `⚠️ OSM plitkasi xatosi, Esri World Street Map ga avtomatik o'tkazilmoqda...`

### 6.3 Muammo Qachon Boshlandi va Undan Oldin Nimalar Qilindi?
1. Dastlab xarita CartoDB (`basemaps.cartocdn.com`) plitkalaridan foydalangan. CartoDB bepul foydalanish uchun majburiy API kalit joriy qilgach, xaritada "API KEY REQUIRED carto.com/basemaps/apikey" suv belgisi paydo bo'ldi.
2. CartoDB o'rniga OpenStreetMap (`tile.openstreetmap.org`) ga o'tildi.
3. Keyin Render deployida OSM plitkalari 403 blokirovka bergani sababli `tile.openstreetmap.de` (German mirror) va `server.arcgisonline.com` (Esri fallback) ga o'tildi.
4. Foydalanuvchi geozona chizish vositalarini ishlatganda plitkalar yo'qolib qolishi kuzatildi.

### 6.4 Sinab Ko'rilgan Yechimlar va Natijalar
| Qilingan Harakat | Maqsad | Natija |
|---|---|---|
| CartoDB → OSM standard | Suv belgisini yo'qotish | Suv belgisi yo'qoldi, lekin Render IP lari bloklandi (403). |
| OSM → OSM German + Esri fallback | Render blokirovkasini aylanib o'tish | Plitkalar to'g'ridan-to'g'ri yuklanadi (curl 200 OK qaytardi). |
| CSS Dark Mode filtri (`invert(1) hue-rotate...`) | Qorong'i dashboardga moslash | Xarita foni qorong'ilashdi, lekin yuklanmagan tile'lar qora rangga aylanib ketdi. |
| `isDrawing` flagi qo'shildi (`commit e809a9a`) | Chizish paytida `checkAndRecoverTileLayer` chaqirilib tiles o'chirilishini to'xtatish | Commit main'ga push qilindi. |

### 6.5 Muammoning Ehtimoliy Sabablari (Likely Causes)
1. **Leaflet TilePane Z-Index yoki Overflow:**
   Geozona chizish vositasi (`L.polygon`, `L.circle`) marker yoki path qo'shganda, Leaflet DOM'dagi SVG overlay-pane tile-pane ustini yopib qo'yayotgan bo'lishi yoki CSS `.leaflet-tile-pane` `visibility: hidden` yoki `opacity: 0` ga tushib qolayotgan bo'lishi mumkin.
2. **CSS Dark-Tiles filtri ta'siri:**
   `.dark-tiles .leaflet-tile-pane` dagi CSS filtr (`filter: invert(1) hue-rotate(190deg)...`) brauzer apparat tezlatgichi (GPU compositing) bilan ziddiyatga kirib, dinamik SVG chizilganda tile pane'ni qayta render qilmay, bo'sh ko'rsatishi mumkin.
3. **MapView re-render va adapter desinxronizatsiyasi:**
   React `MapView.tsx` komponentida `drawingMode` (`'POLYGON'` yoki `'CIRCLE'`) state'i o'zgarganda, React butun komponentni qayta chizadi. Agar container yoki adapter qayta inisializatsiya bo'lsa yoki container `key` orqali qayta yaratilsa, Leaflet xaritasi bo'shab qoladi.
4. **Google Maps API kaliti mavjud emasligi:**
   Hozirda `GOOGLE_MAPS_API_KEY` kiritilmagani uchun tizim faqat Leaflet OSM zaxirasida ishlamoqda. Agar Google Maps API kaliti ulansa, uchinchi tomon OSM plitkalari va CSS filtrlariga umuman ehtiyoj qolmaydi.

---

## 7. OTHER KNOWN BUGS AND GAPS (Boshqa Ma'lum Xatolar va Chala Qismlar)

1. **`CLEANUP_REPORT.md` dagi keraksiz fayllar:**
   - Repoda 11 ta eski sinov skriptlari va ishlatilmayotgan fayllar mavjud (`backend/server.py`, `backend/schema.sql` (knex migratsiyalaridan tashqari), `Navbar.tsx`, `AttendanceTab.tsx` va h.k.). Ular xavfsiz tozalanishi kutilmoqda.
2. **PostgreSQL Production Guard:**
   - Hozirgi kunda `DATABASE_URL` berilmasa, server SQLite rejimiga tushadi. Agar Render konteyneri qayta yuklansa (restart), SQLite ma'lumotlari o'chib ketadi. Production uchun Render dashboardida haqiqiy `DATABASE_URL` (PostgreSQL) va `REQUIRE_PG=true` ulanishi shart.
3. **Google Maps API Key berilmagan:**
   - `.env.example` da `GOOGLE_MAPS_API_KEY=` bo'sh turibdi. Productionda kalit berilmagani uchun sistema har doim fallback rejimida qolmoqda.

---

## 8. NEXT STEPS (Keyingi Qadamlar — Ustuvorlik Tartibida)

1. **1-USTUVORLIK: Xarita Fon Plitkalarini Chizish Paytida Saqlab Qolish:**
   - Brauzer DevTools (Inspect Element) orqali chizish jarayonida `.leaflet-tile-pane` va `.leaflet-tile-container img` elementlarining mavjudligi va ularning CSS xususiyatlarini (`opacity`, `visibility`, `display`, `z-index`) tekshirish.
   - Chizish jarayonida `dark-tiles` filtrini tekshirish: agar CSS filter GPU render bilan xatolik keltirib chiqarayotgan bo'lsa, uni vaqtincha olib tashlab toza OSM plitkalarini ko'rsatish.
   - React state o'zgarganda Leaflet containeri qayta render bo'lmasligini ta'minlash (`memo` yoki container elementini ajratish).
2. **2-USTUVORLIK: Google Maps API Kalitini Ulash (Eng toza yechim):**
   - Render muhit sozlamalariga haqiqiy `GOOGLE_MAPS_API_KEY` kiritilsa, tizim avtomatik Google Maps dvigateliga o'tadi va barcha plitka, blokirovka va filtr muammolari o'z-o'zidan yechiladi.
3. **3-USTUVORLIK: Production Bazasini PostgreSQL ga O'tkazish:**
   - Render PostgreSQL ma'lumotlar bazasini ulab, `DATABASE_URL` ni kiritish, shunda geozona va o'quvchilar koordinatalari doimiy saqlanadi.
4. **4-USTUVORLIK: Ortiqcha Fayllarni Tozalash (Cleanup):**
   - `CLEANUP_REPORT.md` ga binoan tasdiqlangan keraksiz fayllarni o'chirish.

