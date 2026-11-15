import { SupportedLanguage } from '@/types/health_pro';

export const HEALTH_TRANSLATIONS = {
  uz: {
    appTitle: "AI HEALTH GUARD",
    appSubtitle: "Samsung Galaxy Watch 5 Pro Professional Tibbiy Monitoring Ekotizimi",
    emergencyDisclaimer: "TIBBIY OGOHLANTIRISH: Ushbu tizim klinik tashxis vositasi emas. Ko'krak qafasidagi o'tkir og'riq yoki nafas siqilishida darhol 103 Tez Tibbiy Yordamga murojaat qiling.",
    realDeviceBadge: "Jonli Telemetriya (Watch 5 Pro)",
    demoDeviceBadge: "Simulyatsiya (Demo Rejim)",
    timeRanges: {
      "24H": "24 Soat",
      "7D": "7 Kun",
      "30D": "30 Kun",
      "90D": "90 Kun"
    },
    nav: {
      dashboard: "Asosiy Panel",
      heart: "Yurak Salomatligi",
      ecg: "EKG Tahlili",
      spo2: "Qondagi Kislorod",
      bp: "Qon Bosimi",
      sleep: "Uyqu Tahlili",
      stress: "Stress Monitoringi",
      recovery: "Tiklanish va Charchoq",
      body_comp: "Tana Tarkibi (BIA)",
      temp: "Harorat Tendensiyasi",
      digital_twin: "Raqamli Egizak (Twin)",
      ai_assistant: "AI Tibbiy Yordamchi",
      family: "Oila Masofaviy Nazorati",
      doctor_portal: "Shifokor Portali",
      clinic_admin: "Klinika Boshqaruvi",
      external_devices: "Tashqi Tibbiy Qurilmalar",
      emergency_sos: "Favqulodda SOS",
      medical_reports: "Tibbiy Hisobotlar",
      notifications: "Ogohlantirishlar",
      device_connection: "Soat Ulanishi",
      privacy_settings: "Maxfiylik va Sozlamalar"
    },
    statusLevels: {
      GREEN: "Me'yorda (Xavfsiz)",
      YELLOW: "Kichik Og'ish",
      ORANGE: "Shifokor Ko'rigi Tavsiya Qilinadi",
      RED: "Shoshilinch Baholash Talab Qilinadi"
    },
    metrics: {
      bpm: "Puls",
      restingBpm: "Tinch holatdagi puls",
      hrv: "Yurak Ritmi O'zgaruvchanligi (HRV)",
      spo2: "Kislorod (SpO2)",
      bp: "Arterial Bosim",
      glucose: "Qondagi Qand (Glyukoza)",
      temp: "Teri Harorati",
      sleepScore: "Uyqu Balli",
      stressScore: "Stress Darajasi",
      recoveryScore: "Tiklanish Ko'rsatkichi",
      fatPct: "Tana Yog'i",
      muscleKg: "Skelet Mushagi",
      bmi: "Tana Massasi Indeksi"
    },
    emergency: {
      title: "Favqulodda SOS Tizimi",
      countdownText: "Favqulodda xabar yuborilishiga qolgan vaqt",
      cancelButton: "Bekor Qilish (Xavf Yo'q)",
      broadcastedText: "SOS signali ota-onaga, oila a'zolariga va biriktirilgan klinikaga uzatildi!",
      coordinates: "GPS Koordinatalari",
      accuracy: "Aniqlik"
    },
    family: {
      title: "Oila A'zolari va Qaramog'idagilar Masofaviy Nazorati",
      inviteButton: "Yangi A'zo Qo'shish",
      permissionsTitle: "Ruxsatlar va Maxfiylik",
      revokeAccess: "Ruxsatni Bekor Qilish"
    },
    doctor: {
      title: "Shifokor Klinika Portali",
      patientsList: "Mening Bemorlarim",
      clinicalNotes: "Shifokor Klinik Qaydlari",
      addNote: "Qayd Qo'shish",
      prescribeMedication: "Tavsiyanoma Yozish",
      exportClinicalPdf: "Klinik Xulosani Chop Etish (PDF)"
    },
    clinic: {
      title: "Ko'p Tarmoqli Klinika Ma'muriyati",
      activeClinics: "Faol Klinikalar",
      totalPatients: "Ro'yxatdagi Bemorlar",
      totalDoctors: "Shifokorlar Soni",
      tenantIsolationNote: "Har bir klinika ma'lumotlari HIPAA/GDPR standartida to'liq ajratilgan (Tenant Isolation)."
    },
    external: {
      title: "Tashqi Tibbiy Qurilmalar (BLE & Health Connect)",
      glucoseMeters: "Glyukometrlar (Qondagi Qand)",
      bpMonitors: "Raqamli Tonometrlar (Qon Bosimi)",
      pulseOximeters: "Tashqi Oksimetrlar",
      thermometers: "Tibbiy Termometrlar",
      connectBle: "BLE orqali Ulanish",
      manualEntry: "Qo'lda Ko'rsatkich Kiritish"
    }
  },
  ru: {
    appTitle: "AI HEALTH GUARD",
    appSubtitle: "Профессиональная экосистема медицинского мониторинга Samsung Galaxy Watch 5 Pro",
    emergencyDisclaimer: "МЕДИЦИНСКОЕ ПРЕДУПРЕЖДЕНИЕ: Данная система не является средством клинической диагностики. При острой боли в груди или удушье немедленно вызывайте 103 Скорую Помощь.",
    realDeviceBadge: "Телеметрия в реальном времени (Watch 5 Pro)",
    demoDeviceBadge: "Симуляция (Демонстрационный режим)",
    timeRanges: {
      "24H": "24 Часа",
      "7D": "7 Дней",
      "30D": "30 Дней",
      "90D": "90 Дней"
    },
    nav: {
      dashboard: "Главная Панель",
      heart: "Здоровье Сердца",
      ecg: "Анализ ЭКГ",
      spo2: "Кислород в Крови",
      bp: "Артериальное Давление",
      sleep: "Анализ Сна",
      stress: "Мониторинг Стресса",
      recovery: "Восстановление и Усталость",
      body_comp: "Состав Тела (BIA)",
      temp: "Тренды Температуры",
      digital_twin: "Цифровой Двойник",
      ai_assistant: "AI Мед-Ассистент",
      family: "Семейный Мониторинг",
      doctor_portal: "Портал Врача",
      clinic_admin: "Управление Клиниками",
      external_devices: "Внешние Мед-Приборы",
      emergency_sos: "Экстренный SOS",
      medical_reports: "Медицинские Отчеты",
      notifications: "Уведомления",
      device_connection: "Подключение Часов",
      privacy_settings: "Конфиденциальность и Настройки"
    },
    statusLevels: {
      GREEN: "В норме (Безопасно)",
      YELLOW: "Незначительное отклонение",
      ORANGE: "Рекомендуется консультация врача",
      RED: "Требуется срочная медицинская оценка"
    },
    metrics: {
      bpm: "Пульс",
      restingBpm: "Пульс в покое",
      hrv: "Вариабельность ритма сердца (ВРС)",
      spo2: "Кислород (SpO2)",
      bp: "Артериальное давление",
      glucose: "Сахар в крови (Глюкоза)",
      temp: "Температура кожи",
      sleepScore: "Балл сна",
      stressScore: "Уровень стресса",
      recoveryScore: "Индекс восстановления",
      fatPct: "Жировая масса",
      muscleKg: "Скелетные мышцы",
      bmi: "Индекс массы тела"
    },
    emergency: {
      title: "Система Экстренного SOS",
      countdownText: "Времени до отправки экстренного вызова",
      cancelButton: "Отменить (Опасности нет)",
      broadcastedText: "Сигнал SOS успешно передан родственникам и дежурному врачу!",
      coordinates: "Координаты GPS",
      accuracy: "Точность"
    },
    family: {
      title: "Удаленный Мониторинг Членов Семьи",
      inviteButton: "Пригласить Родственника",
      permissionsTitle: "Разрешения и Доступ",
      revokeAccess: "Отозвать Доступ"
    },
    doctor: {
      title: "Клинический Портал Врача",
      patientsList: "Мои Пациенты",
      clinicalNotes: "Клинические Записи Врача",
      addNote: "Добавить Запись",
      prescribeMedication: "Назначить Рекомендации",
      exportClinicalPdf: "Экспорт Заключения (PDF)"
    },
    clinic: {
      title: "Мультитенантное Управление Клиниками",
      activeClinics: "Активные Клиники",
      totalPatients: "Всего Пациентов",
      totalDoctors: "Число Врачей",
      tenantIsolationNote: "Данные каждой клиники изолированы по протоколам HIPAA/GDPR."
    },
    external: {
      title: "Внешние Мед-Приборы (BLE & Health Connect)",
      glucoseMeters: "Глюкометры (Сахар в крови)",
      bpMonitors: "Цифровые Тонометры",
      pulseOximeters: "Внешние Пульсоксиметры",
      thermometers: "Медицинские Термометры",
      connectBle: "Подключить по BLE",
      manualEntry: "Ручной Ввод Данных"
    }
  },
  en: {
    appTitle: "AI HEALTH GUARD",
    appSubtitle: "Samsung Galaxy Watch 5 Pro Professional Medical Ecosystem",
    emergencyDisclaimer: "MEDICAL DISCLAIMER: This system is not a clinical diagnostic device. For acute chest pain or severe distress, call 103 or emergency medical services immediately.",
    realDeviceBadge: "Live Telemetry (Watch 5 Pro)",
    demoDeviceBadge: "Simulation (Demo Mode)",
    timeRanges: {
      "24H": "24 Hours",
      "7D": "7 Days",
      "30D": "30 Days",
      "90D": "90 Days"
    },
    nav: {
      dashboard: "Main Dashboard",
      heart: "Heart Health",
      ecg: "ECG Analysis",
      spo2: "Blood Oxygen",
      bp: "Blood Pressure",
      sleep: "Sleep Analysis",
      stress: "Stress Monitoring",
      recovery: "Recovery & Fatigue",
      body_comp: "Body Composition (BIA)",
      temp: "Temperature Trends",
      digital_twin: "Digital Health Twin",
      ai_assistant: "AI Medical Assistant",
      family: "Family Monitoring",
      doctor_portal: "Doctor Portal",
      clinic_admin: "Clinic Administration",
      external_devices: "External Devices",
      emergency_sos: "Emergency SOS",
      medical_reports: "Medical Reports",
      notifications: "Notifications",
      device_connection: "Watch Connection",
      privacy_settings: "Privacy & Settings"
    },
    statusLevels: {
      GREEN: "Normal (Optimal)",
      YELLOW: "Minor Deviation",
      ORANGE: "Medical Consultation Recommended",
      RED: "Prompt Medical Assessment Required"
    },
    metrics: {
      bpm: "Heart Rate",
      restingBpm: "Resting Heart Rate",
      hrv: "Heart Rate Variability (HRV)",
      spo2: "Blood Oxygen (SpO2)",
      bp: "Blood Pressure",
      glucose: "Blood Glucose",
      temp: "Skin Temperature",
      sleepScore: "Sleep Score",
      stressScore: "Stress Level",
      recoveryScore: "Recovery Index",
      fatPct: "Body Fat",
      muscleKg: "Skeletal Muscle",
      bmi: "Body Mass Index (BMI)"
    },
    emergency: {
      title: "Emergency SOS System",
      countdownText: "Time until emergency dispatch broadcast",
      cancelButton: "Cancel Alert (Safe)",
      broadcastedText: "SOS alert successfully broadcasted to family members and assigned clinic!",
      coordinates: "GPS Coordinates",
      accuracy: "Accuracy"
    },
    family: {
      title: "Family Remote Caregiver Monitoring",
      inviteButton: "Invite Family Member",
      permissionsTitle: "Permissions & Data Consent",
      revokeAccess: "Revoke Access"
    },
    doctor: {
      title: "Doctor Clinical Portal",
      patientsList: "Assigned Patients",
      clinicalNotes: "Physician Clinical Notes",
      addNote: "Add Clinical Note",
      prescribeMedication: "Clinical Recommendations",
      exportClinicalPdf: "Export Clinical Report (PDF)"
    },
    clinic: {
      title: "Multi-Tenant Clinic Administration",
      activeClinics: "Active Clinics",
      totalPatients: "Registered Patients",
      totalDoctors: "Medical Staff",
      tenantIsolationNote: "Clinic databases are isolated with strict row-level security per HIPAA/GDPR."
    },
    external: {
      title: "External Medical Devices (BLE & Health Connect)",
      glucoseMeters: "Blood Glucose Meters",
      bpMonitors: "Digital Blood Pressure Cuffs",
      pulseOximeters: "External Pulse Oximeters",
      thermometers: "Medical Thermometers",
      connectBle: "Connect via Bluetooth LE",
      manualEntry: "Manual Measurement Entry"
    }
  }
};
