const fs = require('fs');
const path = require('path');
const { hashPassword, verifyPassword, signToken, verifyToken } = require('../auth');

const defaultPublishedCms = {
  seo: {
    title: "SMART CHILD — Maktab Nazorati va Bolalar Xavfsizligi Intellektual Tizimi",
    description: "Maktablar, o'quvchilar va ota-onalarni aqlli soatlar va real vaqt rejimidagi GPS monitoring orqali birlashtiruvchi xavfsizlik ekotizimi.",
    keywords: "smart child, maktab nazorati, bolalar xavfsizligi, gps monitoring, aqlli soat, o'zbekiston ta'lim",
    ogImage: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80",
    canonicalUrl: "https://maktab-nazorati.onrender.com"
  },
  appearance: {
    brandName: "SMART CHILD",
    badgeText: "INTELLEKTUAL MAKTAB XAVFSIZLIGI PLATFORMASI",
    primaryColor: "#22d3ee",
    accentColor: "#2563eb",
    themeMode: "dark"
  },
  banner: {
    enabled: true,
    badge: "YANGILIK",
    text: "2026-o'quv yili uchun umumta'lim maktablarida GPS monitoring va xavfsizlik tizimi integratsiyasi boshlandi!",
    linkText: "Batafsil tanishing",
    linkUrl: "#about"
  },
  hero: {
    badge: "XALQARO TA'LIM TEXNOLOGIYASI",
    headline: "SMART CHILD — Har bir bola uchun xavfsiz kelajak",
    subtitle: "Maktablar, o'qituvchilar va oilalarni zamonaviy texnologiyalar orqali birlashtiruvchi intellektual maktab xavfsizligi va GPS monitoring tizimi.",
    primaryCta: {
      text: "Platformani o'rganish",
      link: "#features"
    },
    secondaryCta: {
      text: "Tizimga kirish",
      link: "/login"
    },
    heroImage: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80",
    stats: [
      { label: "Ulangan maktablar", value: "15+" },
      { label: "Kuzatuvdagi o'quvchilar", value: "1,200+" },
      { label: "GPS aniqligi", value: "±3 metr" },
      { label: "SOS javob vaqti", value: "< 2 soniya" }
    ]
  },
  about: {
    badge: "BIZNING MISSIYAMIZ",
    title: "SMART CHILD platformasi qanday yaratildi va nima uchun muhim?",
    subtitle: "Farzandlarimizning maktabga borish va qaytish yo'lidagi har bir qadami xavfsiz, ota-onalar va ta'lim maskanlari esa xotirjam bo'lishi shart.",
    story: "SMART CHILD — zamonaviy axborot texnologiyalari, IoT aqlli soatlar va sun'iy yo'ldosh navigatsiyasini uyg'unlashtirgan innovatsion milliy loyihadir. Platforma orqali maktab rahbariyati o'quvchilar davomati va hududdagi xavfsizlikni, ota-onalar esa o'z farzandlarining joriy geolokatsiyasi va salomatlik holatini to'liq shaffof nazorat qila oladilar.",
    features: [
      {
        title: "To'liq avtomatlashtirilgan davomat",
        desc: "O'quvchi maktab darvozasidan o'tishi bilanoq virtual geozona orqali tizimga avtomatik belgi qo'yiladi."
      },
      {
        title: "24/7 Favqulodda SOS himoyasi",
        desc: "Xavf yuzaga kelganda soatdagi bitta tugma orqali maktab xavfsizlik xizmati va ota-onaga tezkor signal boradi."
      },
      {
        title: "Maxfiylik va qat'iy ma'lumotlar xavfsizligi",
        desc: "O'quvchining shaxsiy koordinatalari faqat qonuniy ota-onasi va vakolatli xavfsizlik ma'muriga ko'rinadi."
      }
    ]
  },
  features: [
    {
      id: "feat-1",
      title: "Jonli GPS Kuzatuv",
      desc: "O'quvchining harakatlanish trayektoriyasi va joriy koordinatalarini real vaqtda yuqori aniqlikda xaritada ko'rish.",
      icon: "Compass",
      tag: "Real-vaqt",
      enabled: true
    },
    {
      id: "feat-2",
      title: "Aqlli Soatlar Integratsiyasi",
      desc: "Samsung Galaxy Watch va bolalar GPS soatlari bilan to'liq avtomatik uzluksiz sinxronizatsiya.",
      icon: "Watch",
      tag: "IoT Qurilmalar",
      enabled: true
    },
    {
      id: "feat-3",
      title: "Maktab Boshqaruvi",
      desc: "Ko'p maktabli arxitektura, binolar xaritasi, sinflar va o'quvchilar kontingentini markazlashgan boshqaruv.",
      icon: "School",
      tag: "Ma'muriyat",
      enabled: true
    },
    {
      id: "feat-4",
      title: "O'quvchilar Monitoringi",
      desc: "O'quvchining maktab hududida, tashqarisida yoki chegarada ekanligini avtomatik aniqlash.",
      icon: "UserCheck",
      tag: "Monitoring",
      enabled: true
    },
    {
      id: "feat-5",
      title: "Sinf Rahbari Paneli",
      desc: "O'qituvchi o'z sinfidagi o'quvchilarning darsdagi davomati va holatini tezkor kuzatishi uchun qulay interfeys.",
      icon: "LayoutDashboard",
      tag: "O'qituvchilar",
      enabled: true
    },
    {
      id: "feat-6",
      title: "Xavfsizlik Geozonalari",
      desc: "Maktab atrofi, xavfli yo'llar va hududlarni poligon shaklida chizish hamda chegarani kesib o'tishni qayd etish.",
      icon: "ShieldAlert",
      tag: "Geozonalar",
      enabled: true
    },
    {
      id: "feat-7",
      title: "Favqulodda SOS Signallari",
      desc: "Soatdagi SOS tugmasi 3 soniya bosilganda zudlik bilan koordinatalar bilan birga audio va vizual signal yuboriladi.",
      icon: "BellRing",
      tag: "Favqulodda",
      enabled: true
    },
    {
      id: "feat-8",
      title: "Batareya Quvvati Nazorati",
      desc: "Soat quvvati 20% dan pastga tushganda ota-ona va maktabga qurilmani quvvatlantirish haqida eslatma yuboriladi.",
      icon: "BatteryCharging",
      tag: "Texnik holat",
      enabled: true
    },
    {
      id: "feat-9",
      title: "Harakatlanish Tarixi",
      desc: "Kun, hafta yoki oy davomida bosib o'tilgan yo'nalishlar, to'xtash nuqtalari va tezlik tahlilini xaritada qayta o'ynash.",
      icon: "History",
      tag: "Tahlil",
      enabled: true
    },
    {
      id: "feat-10",
      title: "Maktab Tahliliyoti",
      desc: "Davomat foizi, kechikishlar statistikasi va xavfsizlik hisobotlarini avtomatik generatsiya qilish.",
      icon: "BarChart3",
      tag: "Statistika",
      enabled: true
    },
    {
      id: "feat-11",
      title: "Xavfsiz Huquqlar Tizimi",
      desc: "Super Admin, Maktab Admini, O'qituvchi va Ota-onalar uchun qat'iy cheklangan, shifrlangan kirish huquqlari.",
      icon: "Lock",
      tag: "Xavfsizlik",
      enabled: true
    },
    {
      id: "feat-12",
      title: "Markazlashgan Ma'muriyat",
      desc: "Barcha maktablar, qurilmalar va veb-sayt kontentini yagona qulay boshqaruv panelidan nazorat qilish.",
      icon: "Sliders",
      tag: "CMS Boshqaruv",
      enabled: true
    }
  ],
  howItWorks: {
    badge: "BOSQICHMA-BOSQICH",
    title: "SMART CHILD tizimi qanday ishlaydi?",
    subtitle: "Maktabdan to ota-ona smartfonigacha bo'lgan 4 ta oson va ishonchli qadam",
    steps: [
      {
        number: "01",
        title: "Maktab ro'yxatdan o'tadi",
        desc: "Ta'lim muassasasi platformaga ulanadi, maktab binosi va uning xavfsiz geozona chegaralari xaritada belgilanadi."
      },
      {
        number: "02",
        title: "Sinflar va o'quvchilar kiritiladi",
        desc: "Direktor va mas'ul o'qituvchilar sinflar ro'yxatini shakllantirib, o'quvchilar va ularning ota-onalari ma'lumotlarini biriktiradi."
      },
      {
        number: "03",
        title: "Aqlli soatlar xavfsiz bog'lanadi",
        desc: "Har bir o'quvchining shaxsiy profiliga xavfsiz token orqali Samsung Galaxy Watch yoki GPS soat biriktiriladi."
      },
      {
        number: "04",
        title: "Xavfsizlik va davomat nazorat qilinadi",
        desc: "Vakolatli shaxslar real vaqt rejimida o'quvchining joylashuvi, davomati va xavfsizlik holatini uzluksiz kuzatib boradi."
      }
    ]
  },
  forSchools: {
    badge: "MAKTABLAR VA DIREKTORLAR UCHUN",
    title: "Ta'lim muassasasi uchun zamonaviy xavfsizlik standarti",
    subtitle: "Maktab nufuzini oshirish, ota-onalar ishonchini qozonish va har bir o'quvchining xavfsizligini kafolatlash",
    benefits: [
      {
        title: "Davomatni 100% shaffoflashtirish",
        desc: "Qog'oz jurnallarsiz, inson omilisiz avtomatik elektron davomat hisoboti."
      },
      {
        title: "Xavfsizlik hodisalarini 95% ga kamaytirish",
        desc: "Dars vaqtida maktab hududini ruxsatsiz tark etish holatlarini oldini olish."
      },
      {
        title: "Vazirlik va shahar ta'lim boshqarmasi integratsiyasi",
        desc: "Yagona tizim orqali markazlashgan hisobotlar va tahliliy ma'lumotlar taqdim etish."
      }
    ]
  },
  technology: {
    badge: "TEXNOLOGIK ARXITEKTURA",
    title: "Ishonchli va zamonaviy texnologiyalar ustiga qurilgan",
    subtitle: "Uzluksiz 99.9% faoliyat ko'rsatish va milliy xavfsizlik talablariga mos keluvchi backend infratuzilmasi",
    items: [
      {
        title: "GPS & LBS Multi-Positioning",
        desc: "Sun'iy yo'ldosh GPS va mobil baza stantsiyalari (LBS) orqali bino ichida va ochiq maydonda aniq geolokatsiya.",
        badge: "Yuqori aniqlik"
      },
      {
        title: "Yandex Maps & OpenStreetMap",
        desc: "O'zbekistonning barcha viloyat, shahar va mahallalari bo'yicha to'liq yangilangan vektor va sun'iy yo'ldosh xaritalari.",
        badge: "Mahalliy xaritalar"
      },
      {
        title: "Samsung Galaxy Watch Integratsiyasi",
        desc: "WearOS tizimida ishlovchi Samsung soatlari bilan integratsiya va telemetriya protokoli.",
        badge: "WearOS / Tizen"
      },
      {
        title: "Real-time WebSocket & SSE",
        desc: "Kechikishlarsiz soniyali ma'lumot almashinuvi va zudlik bilan yetib boruvchi hodisalar kanali.",
        badge: "< 50ms kechikish"
      },
      {
        title: "Ray-Casting Geofencing Algoritmi",
        desc: "Matematik poligon algoritmi orqali maktab binosi va nozik zonalarni 100% aniqlik bilan nazorat qilish.",
        badge: "Matematik model"
      },
      {
        title: "TLS Shifrlash & JWT Autentifikatsiya",
        desc: "Bank darajasidagi 256-bitli ma'lumotlar shifrlanishi va foydalanuvchi huquqlarining qat'iy himoyasi.",
        badge: "Xavfsiz kirish"
      }
    ]
  },
  gallery: [
    {
      id: "gal-1",
      title: "30-sonli maktab binosi va hududi",
      category: "schools",
      url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1000&q=80",
      alt: "Maktab binosi va sport maydoni"
    },
    {
      id: "gal-2",
      title: "Samsung Galaxy Watch bolalar soati",
      category: "watches",
      url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
      alt: "Aqlli soat bilaguzukda"
    },
    {
      id: "gal-3",
      title: "Fleet Management xarita interfeysi",
      category: "platform",
      url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
      alt: "Platforma tahliliy paneli"
    },
    {
      id: "gal-4",
      title: "O'quvchilar xavfsizligi va dars jarayoni",
      category: "schools",
      url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=80",
      alt: "Maktab o'quvchilari sinfxonada"
    },
    {
      id: "gal-5",
      title: "Mobil ilova orqali joylashuv monitoringi",
      category: "platform",
      url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1000&q=80",
      alt: "Smartfon ekrani va xarita"
    },
    {
      id: "gal-6",
      title: "GPS Telemetriya va sensorlar",
      category: "watches",
      url: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80",
      alt: "Soat datchiklari va yurak urishi monitoringi"
    }
  ],
  news: [
    {
      id: "news-1",
      title: "Urganch shahridagi 30-maktabda tizim to'liq ishga tushirildi",
      date: "2026-11-05",
      summary: "Tajriba tariqasida barcha boshlang'ich sinf o'quvchilari aqlli soatlar va xavfsizlik geozonalari bilan ta'minlandi."
    },
    {
      id: "news-2",
      title: "Yangi avlod favqulodda SOS audio-uzatish moduli qo'shildi",
      date: "2026-11-01",
      summary: "Endilikda SOS signali bosilganda 10 soniyali qisqa audio yozuv ham xavfsizlik paneliga yetkaziladi."
    }
  ],
  contact: {
    phone: "+998 97 200-12-79",
    mobile: "+998 97 200-12-79",
    email: "burxonturayev7900@gmail.com",
    address: "O'zbekiston Respublikasi, Urganch sh., Xonqa ko'chasi, 26-uy",
    workingHours: "Dushanba - Shanba: 08:30 - 18:30",
    telegram: "https://t.me/MMSA571",
    instagram: "https://instagram.com/smartchild_uz",
    youtube: "https://youtube.com/@smartchild_uz"
  },
  navigation: {
    headerLinks: [
      { id: "home", label: "Asosiy", href: "#hero" },
      { id: "about", label: "Biz haqimizda", href: "#about" },
      { id: "features", label: "Imkoniyatlar", href: "#features" },
      { id: "how", label: "Qanday ishlaydi", href: "#how-it-works" },
      { id: "schools", label: "Maktablar uchun", href: "#for-schools" },
      { id: "tech", label: "Texnologiya", href: "#technology" },
      { id: "status", label: "Tizim holati", href: "#status" },
      { id: "gallery", label: "Galereya", href: "#gallery" },
      { id: "contact", label: "Bog'lanish", href: "#contact" }
    ],
    footerLinks: [
      { label: "Asosiy sahifa", href: "#hero" },
      { label: "Imkoniyatlar", href: "#features" },
      { label: "Tizim holati", href: "#status" },
      { label: "Tizimga kirish", href: "/login" },
      { label: "Maxfiylik siyosati", href: "#" },
      { label: "Foydalanish shartlari", href: "#" }
    ]
  }
};

function ensureCmsStructure(db) {
  if (!db.cms) {
    db.cms = {
      published: JSON.parse(JSON.stringify(defaultPublishedCms)),
      draft: JSON.parse(JSON.stringify(defaultPublishedCms)),
      history: [
        {
          id: 'v-initial',
          version: 'v1.0.0',
          publishedAt: new Date().toISOString(),
          publishedBy: 'burxonturayev7900@gmail.com',
          summary: 'Dastlabki rasmiy veb-sayt kontenti nashr qilindi',
          snapshot: JSON.parse(JSON.stringify(defaultPublishedCms))
        }
      ],
      auditLogs: [
        {
          id: 'audit-1',
          action: 'INIT',
          section: 'ALL',
          updatedBy: 'burxonturayev7900@gmail.com',
          timestamp: new Date().toISOString(),
          details: 'CMS bazasi muvaffaqiyatli ishga tushirildi'
        }
      ]
    };
  } else {
    if (!db.cms.published) {
      db.cms.published = JSON.parse(JSON.stringify(defaultPublishedCms));
    }
    if (!db.cms.draft) {
      db.cms.draft = JSON.parse(JSON.stringify(db.cms.published));
    }
    if (!Array.isArray(db.cms.history)) db.cms.history = [];
    if (!Array.isArray(db.cms.auditLogs)) db.cms.auditLogs = [];
  }
}

function ensureSuperAdmin(db) {
  if (!Array.isArray(db.users)) db.users = [];
  const targetEmail = 'burxonturayev7900@gmail.com';
  let admin = db.users.find(u => u.email && u.email.toLowerCase() === targetEmail.toLowerCase());
  const initialPass = process.env.INITIAL_SUPERADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Burxon#Admin2026';
  
  if (!admin) {
    admin = {
      id: 'usr-superadmin-burxon',
      name: 'Burxon Turayev (Bosh Administrator)',
      email: targetEmail,
      phone: '+998901234567',
      password: hashPassword(initialPass),
      role: 'SUPER_ADMIN',
      mustChangePassword: true,
      createdAt: new Date().toISOString()
    };
    db.users.unshift(admin);
  } else {
    admin.role = 'SUPER_ADMIN';
    if (!admin.password) {
      admin.password = hashPassword(initialPass);
    }
  }
}

module.exports = {
  defaultPublishedCms,
  ensureCmsStructure,
  ensureSuperAdmin
};

