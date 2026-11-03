# -*- coding: utf-8 -*-
import os

INDEX_PATH = r"c:\users\steamuser\.gemini\antigravity-ide\scratch\maktab-nazorati\backend\public\index.html"

with open(INDEX_PATH, "r", encoding="utf-8") as f:
    raw = f.read()

# Normalize line endings to \n for consistent matching
content = raw.replace("\r\n", "\n")

# 1. Add SVG icon CSS definitions & modern SaaS styling
svg_css = """
    /* --- 2026 SaaS Professional SVG Icons & Design System --- */
    .svg-icon {
      width: 15px;
      height: 15px;
      stroke: currentColor;
      stroke-width: 1.85;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      flex-shrink: 0;
      display: inline-block;
      vertical-align: middle;
    }
    .svg-icon-sm { width: 12px; height: 12px; stroke-width: 2; }
    .svg-icon-lg { width: 18px; height: 18px; stroke-width: 1.85; }
    .svg-icon-xl { width: 22px; height: 22px; stroke-width: 1.75; }

    .badge-version {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 1px 6px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.25);
      text-transform: uppercase;
    }

    .status-dot-pulse {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
      animation: pulse 1.5s infinite;
      display: inline-block;
    }

    /* Refined Bento KPI Cards */
    .kpi-card {
      position: relative;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: var(--shadow-sm);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
    }
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: rgba(16, 185, 129, 0.35);
      box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(16, 185, 129, 0.15);
    }

    /* Modal Close Button */
    .modal-close {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-dim);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .modal-close:hover {
      background: var(--bg-card-hover);
      color: var(--text-main);
      border-color: var(--border);
    }

    /* Responsive adjustments */
    @media (max-width: 1024px) {
      .header-middle { display: none !important; }
      .map-sidebar { width: 300px !important; }
    }
    @media (max-width: 768px) {
      header { padding: 0 10px !important; height: 56px !important; }
      .brand-text h1 { font-size: 13px !important; }
      .badge-version { display: none !important; }
      .map-sidebar { display: none !important; }
      .tab-btn span:last-child { display: none; }
      .tab-btn { padding: 0 9px !important; }
    }
"""

if ".svg-icon {" not in content:
    content = content.replace("</style>", svg_css + "\n  </style>")

# 2. Modernize Header Brand
content = content.replace(
    '<div class="brand-icon">🛡️</div>',
    '<div class="brand-icon"><svg class="svg-icon-lg" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></div>'
)
content = content.replace(
    '<h1>SMART CHILD</h1>',
    '<div style="display: flex; align-items: center; gap: 6px;"><h1>SMART CHILD</h1><span class="badge-version">2026 PRO</span></div>'
)

# 3. Modernize Middle Selectors (Role & School)
content = content.replace(
    '<span style="font-size: 13px;">👤</span>',
    '<svg class="svg-icon text-muted" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
)
content = content.replace(
    '<span style="font-size: 13px;">🏫</span>',
    '<svg class="svg-icon text-muted" viewBox="0 0 24 24"><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 22V5l-6-3-6 3v17"/><path d="M4 10h16"/></svg>'
)
content = content.replace(
    '➕ Maktab',
    '<svg class="svg-icon-sm" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> <span>Maktab</span>'
)
content = content.replace(
    '<option value="SUPER_ADMIN">👑 Super Admin (Sardor Alimov)</option>',
    '<option value="SUPER_ADMIN">Super Admin (Sardor Alimov)</option>'
)
content = content.replace(
    '<option value="SCHOOL_ADMIN">🏫 Maktab Admini (SCH001)</option>',
    '<option value="SCHOOL_ADMIN">Maktab Admini (SCH001)</option>'
)
content = content.replace(
    '<option value="TEACHER">👩‍🏫 O\'qituvchi (5-B Sinf)</option>',
    '<option value="TEACHER">O\'qituvchi (5-B Sinf)</option>'
)
content = content.replace(
    '<option value="PARENT">📱 Ota-ona (Jasur Bekmirzayev)</option>',
    '<option value="PARENT">Ota-ona (Jasur Bekmirzayev)</option>'
)
content = content.replace(
    '<option value="ALL">🌐 Barcha Maktablar</option>',
    '<option value="ALL">Barcha Maktablar</option>'
)

# 4. Modernize Navigation Tabs
content = content.replace(
    '<span>🗺️</span> <span id="nav-tab-map">Xarita & Chegara</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg> <span id="nav-tab-map">Xarita & Chegara</span>'
)
content = content.replace(
    '<span>👑</span> <span id="nav-tab-super">Super Admin</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg> <span id="nav-tab-super">Super Admin</span>'
)
content = content.replace(
    '<span>📋</span> <span id="nav-tab-att">Aqlli Davomat</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg> <span id="nav-tab-att">Aqlli Davomat</span>'
)
content = content.replace(
    '<span>👥</span> <span id="nav-tab-std">O\'quvchilar</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> <span id="nav-tab-std">O\'quvchilar</span>'
)
content = content.replace(
    '<span>❤️</span> <span id="nav-tab-health">Salomatlik</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> <span id="nav-tab-health">Salomatlik</span>'
)
content = content.replace(
    '<span>📱</span> <span id="nav-tab-parent">Ota-ona Ilovasi</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg> <span id="nav-tab-parent">Ota-ona Ilovasi</span>'
)
content = content.replace(
    '<span>📊</span> <span id="nav-tab-reports">Hisobotlar</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg> <span id="nav-tab-reports">Hisobotlar</span>'
)

# 5. Right Actions
content = content.replace(
    '<span>🔔</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>'
)
content = content.replace(
    '<span>🚶‍♂️</span> <span id="txt-walk-test">GPS Sinov</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M13 4a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"/><path d="m7 21 3-7-1.5-3 2.5-4h4l1 3 2.5 1.5"/><path d="m14 14 3 7"/></svg> <span id="txt-walk-test">GPS Sinov</span>'
)
content = content.replace(
    '<button class="btn-action" id="theme-btn" title="Yorug\'/Tungi rejim">🌙</button>',
    '<button class="btn-action" id="theme-btn" title="Yorug\'/Tungi rejim"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg></button>'
)

# 6. Map Drawing Toolbar
content = content.replace(
    '<span>🔍</span>',
    '<svg class="svg-icon text-muted" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>'
)
content = content.replace(
    '<span>✏️</span> <span id="txt-draw-btn">Yashil Chegara Chizish</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> <span id="txt-draw-btn">Yashil Chegara Chizish</span>'
)
content = content.replace(
    '<span>💾</span> <span id="txt-save-boundary">Chegarani Saqlash</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> <span id="txt-save-boundary">Chegarani Saqlash</span>'
)
content = content.replace(
    '<span>✖</span> <span id="txt-cancel-draw">Bekor qilish</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> <span id="txt-cancel-draw">Bekor qilish</span>'
)

# 7. Super Admin Tab
content = content.replace(
    '<span>🏫</span> <span>Yangi Maktab Qo\'shish</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 22V5l-6-3-6 3v17"/><path d="M4 10h16"/></svg> <span>Yangi Maktab Qo\'shish</span>'
)
content = content.replace(
    '<span>👤</span> <span>Admin / O\'qituvchi Qo\'shish</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> <span>Admin / O\'qituvchi Qo\'shish</span>'
)
content = content.replace(
    '<div class="kpi-icon-wrap" style="background: rgba(59, 130, 246, 0.15); color: var(--primary);">🏫</div>',
    '<div class="kpi-icon-wrap" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa;"><svg class="svg-icon-lg" viewBox="0 0 24 24"><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 22V5l-6-3-6 3v17"/><path d="M4 10h16"/></svg></div>'
)
content = content.replace(
    '<div class="kpi-icon-wrap" style="background: rgba(16, 185, 129, 0.15); color: var(--success);">👥</div>',
    '<div class="kpi-icon-wrap" style="background: rgba(16, 185, 129, 0.15); color: var(--success);"><svg class="svg-icon-lg" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>'
)
content = content.replace(
    '<div class="kpi-icon-wrap" style="background: rgba(6, 182, 212, 0.15); color: var(--accent);">📈</div>',
    '<div class="kpi-icon-wrap" style="background: rgba(6, 182, 212, 0.15); color: var(--accent);"><svg class="svg-icon-lg" viewBox="0 0 24 24"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg></div>'
)
content = content.replace(
    '<div class="kpi-icon-wrap" style="background: rgba(245, 158, 11, 0.15); color: var(--warning);">⌚</div>',
    '<div class="kpi-icon-wrap" style="background: rgba(245, 158, 11, 0.15); color: var(--warning);"><svg class="svg-icon-lg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83"/></svg></div>'
)
content = content.replace(
    '<h3 style="font-size: 15px; font-weight: 800;">🏫 Ro\'yxatdan O\'tgan Maktablar va GPS Chegaralari</h3>',
    '<h3 style="font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px;"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 22V5l-6-3-6 3v17"/><path d="M4 10h16"/></svg> Ro\'yxatdan O\'tgan Maktablar va GPS Chegaralari</h3>'
)
content = content.replace(
    '<button class="btn-action" onclick="fetchSchoolsAndRender()">🔄 Yangilash</button>',
    '<button class="btn-action" onclick="fetchSchoolsAndRender()"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg> <span>Yangilash</span></button>'
)
content = content.replace(
    '<h3 style="font-size: 15px; font-weight: 800;">👤 Foydalanuvchilar va Ruxsatlar Boshqaruvi</h3>',
    '<h3 style="font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px;"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> Foydalanuvchilar va Ruxsatlar Boshqaruvi</h3>'
)

# 8. Attendance Tab
content = content.replace(
    '<span>📥</span> <span>Excel (CSV) Yuklash</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> <span>Excel (CSV) Yuklash</span>'
)
content = content.replace(
    '<span>🖨️</span> <span>Chop etish (PDF)</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> <span>Chop etish (PDF)</span>'
)

# 9. Students Tab
content = content.replace(
    '<span>➕</span> <span>Yakka O\'quvchi</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> <span>Yakka O\'quvchi</span>'
)
content = content.replace(
    '<span>📊</span> <span>Ommaviy CSV/Excel Import</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> <span>Ommaviy Import</span>'
)
content = content.replace(
    '<span>🔄</span> <span>Maktab O\'tkazish (Transfer)</span>',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg> <span>Maktab O\'tkazish</span>'
)

# 10. Medical Disclaimer Banner
content = content.replace(
    '<span style="font-size: 28px;">ℹ️</span>',
    '<svg class="svg-icon-xl" style="color: var(--primary);" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
)

# 11. Parent App Mobile Frame
content = content.replace(
    '➕ Farzand qo\'shish',
    '<svg class="svg-icon-sm" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> <span>Farzand qo\'shish</span>'
)
content = content.replace(
    '🚨 SOS FAVQULODDA SIGNAL',
    '<svg class="svg-icon" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> SOS FAVQULODDA SIGNAL'
)

# 12. Audit Logs Header
content = content.replace(
    '<h3 style="font-size: 15px; font-weight: 800;">🔒 Tizim Harakatlari va Xavfsizlik Auditi (Audit Logs)</h3>',
    '<h3 style="font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px;"><svg class="svg-icon" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Tizim Harakatlari va Xavfsizlik Auditi (Audit Logs)</h3>'
)

# 13. Modal Headers
modal_headers = [
    ("<h3>✏️ Maktab Nomi va Ma'lumotlarini Tahrirlash</h3>", "<h3><svg class=\"svg-icon\" style=\"margin-right:6px;\" viewBox=\"0 0 24 24\"><path d=\"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z\"/><path d=\"m15 5 4 4\"/></svg>Maktab Nomi va Ma'lumotlarini Tahrirlash</h3>"),
    ("<h3>👤 Yangi Foydalanuvchi / Maktab Ma'muri</h3>", "<h3><svg class=\"svg-icon\" style=\"margin-right:6px;\" viewBox=\"0 0 24 24\"><path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/></svg>Yangi Foydalanuvchi / Maktab Ma'muri</h3>"),
    ("<h3>➕ Yakka O'quvchini Ro'yxatdan O'tkazish</h3>", "<h3><svg class=\"svg-icon\" style=\"margin-right:6px;\" viewBox=\"0 0 24 24\"><line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/></svg>Yakka O'quvchini Ro'yxatdan O'tkazish</h3>"),
    ("<h3>📊 Ommaviy O'quvchilarni Import Qilish (CSV / Excel)</h3>", "<h3><svg class=\"svg-icon\" style=\"margin-right:6px;\" viewBox=\"0 0 24 24\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><polyline points=\"14 2 14 8 20 8\"/></svg>Ommaviy O'quvchilarni Import Qilish</h3>"),
    ("<h3>🔄 O'quvchini Boshqa Maktabga Ko'chirish (School Transfer)</h3>", "<h3><svg class=\"svg-icon\" style=\"margin-right:6px;\" viewBox=\"0 0 24 24\"><path d=\"m16 3 4 4-4 4\"/><path d=\"M20 7H4\"/><path d=\"m8 21-4-4 4-4\"/><path d=\"M4 17h16\"/></svg>O'quvchini Boshqa Maktabga Ko'chirish</h3>"),
    ("<h3>✏️ O'qituvchi Tomonidan Davomatni Tuzatish</h3>", "<h3><svg class=\"svg-icon\" style=\"margin-right:6px;\" viewBox=\"0 0 24 24\"><path d=\"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z\"/><path d=\"m15 5 4 4\"/></svg>O'qituvchi Tomonidan Davomatni Tuzatish</h3>"),
    ("<h3>📱 Farzandni Ota-ona Profiliga Ulash</h3>", "<h3><svg class=\"svg-icon\" style=\"margin-right:6px;\" viewBox=\"0 0 24 24\"><rect width=\"14\" height=\"20\" x=\"5\" y=\"2\" rx=\"2\" ry=\"2\"/><path d=\"M12 18h.01\"/></svg>Farzandni Ota-ona Profiliga Ulash</h3>")
]
for old_h, new_h in modal_headers:
    content = content.replace(old_h, new_h)

# Modal close buttons with SVG X
content = content.replace(
    '<button class="modal-close" onclick="closeModal(\'modal-edit-school\')">&times;</button>',
    '<button class="modal-close" onclick="closeModal(\'modal-edit-school\')"><svg class="svg-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
)
content = content.replace(
    '<button class="modal-close" onclick="closeModal(\'modal-add-user\')">&times;</button>',
    '<button class="modal-close" onclick="closeModal(\'modal-add-user\')"><svg class="svg-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
)
content = content.replace(
    '<button class="modal-close" onclick="closeModal(\'modal-add-single-student\')">&times;</button>',
    '<button class="modal-close" onclick="closeModal(\'modal-add-single-student\')"><svg class="svg-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
)
content = content.replace(
    '<button class="modal-close" onclick="closeModal(\'modal-bulk-students\')">&times;</button>',
    '<button class="modal-close" onclick="closeModal(\'modal-bulk-students\')"><svg class="svg-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
)
content = content.replace(
    '<button class="modal-close" onclick="closeModal(\'modal-transfer-student\')">&times;</button>',
    '<button class="modal-close" onclick="closeModal(\'modal-transfer-student\')"><svg class="svg-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
)
content = content.replace(
    '<button class="modal-close" onclick="closeModal(\'modal-correction\')">&times;</button>',
    '<button class="modal-close" onclick="closeModal(\'modal-correction\')"><svg class="svg-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
)
content = content.replace(
    '<button class="modal-close" onclick="closeModal(\'modal-parent-add-child\')">&times;</button>',
    '<button class="modal-close" onclick="closeModal(\'modal-parent-add-child\')"><svg class="svg-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
)

# 14. Modernize Dynamic JS Table Rows
content = content.replace(
    '✏️ Tahrirlash',
    '<svg class="svg-icon-sm" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> <span>Tahrirlash</span>'
)
content = content.replace(
    '🗺️ Xarita',
    '<svg class="svg-icon-sm" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg> <span>Xarita</span>'
)
content = content.replace(
    '🗑️ O\'chirish',
    '<svg class="svg-icon-sm" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> <span>O\'chirish</span>'
)
content = content.replace(
    '✏️ Tuzatish',
    '<svg class="svg-icon-sm" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> <span>Tuzatish</span>'
)

# Health Dashboard Cards icons
content = content.replace(
    '<span>💓</span>',
    '<svg class="svg-icon" style="color: var(--primary);" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
)
content = content.replace(
    '<span>🌡️</span>',
    '<svg class="svg-icon" style="color: var(--success);" viewBox="0 0 24 24"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>'
)
content = content.replace(
    '<span>⌚ ${std.deviceModel',
    '<span><svg class="svg-icon-sm" style="margin-right:4px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/></svg> ${std.deviceModel'
)

# 15. Theme Switcher JS
old_theme_js = """    document.getElementById('theme-btn').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const target = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', target);
      document.getElementById('theme-btn').textContent = target === 'dark' ? '🌙' : '☀️';
      updateMapTiles(target);
      updateParentMapTiles(target);
    });"""

new_theme_js = """    document.getElementById('theme-btn').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const target = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', target);
      document.getElementById('theme-btn').innerHTML = target === 'dark' 
        ? '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'
        : '<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
      updateMapTiles(target);
      updateParentMapTiles(target);
    });"""

content = content.replace(old_theme_js, new_theme_js)

with open(INDEX_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("SUCCESS: Normalized and modernized frontend with SVG icons!")
