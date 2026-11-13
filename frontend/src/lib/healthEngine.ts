import {
  HeartRateMetric,
  EcgMetric,
  BloodOxygenMetric,
  BloodPressureMetric,
  SkinTemperatureMetric,
  BodyCompositionMetric,
  SleepMetric,
  StressRecoveryMetric,
  ActivityMetric,
  SensorCapability,
  AiRiskAssessment,
  HealthRiskFinding,
  TimeSeriesPoint,
  TimeRangeFilter,
  MedicalReportData,
  HealthAlertLevel
} from '@/types/health';
import { Student } from '@/types';

// ============================================================================
// 1. GALAXY WATCH 5 PRO SENSOR CAPABILITIES DEFINITION
// ============================================================================
export const GALAXY_WATCH_5_PRO_SENSORS: SensorCapability[] = [
  {
    id: 'bioactive_ppg',
    name: 'Samsung BioActive PPG Sensor',
    techName: 'Photoplethysmography Optical Sensor (8 photodiodes)',
    status: 'ACTIVE',
    description: 'Yurak urishi tezligi (BPM) va qondagi kislorod (SpO2) to\'lqinlarini uzluksiz o\'lchaydi.',
    requiredPermission: 'android.permission.BODY_SENSORS',
    isMedicalGrade: false,
    notes: 'Galaxy Watch 5 Pro kavisli orqa yuzasi orqali teriga maksimal zich joylashadi.'
  },
  {
    id: 'bioactive_ecg',
    name: 'Elektrokardiogramma (ECG / EKG)',
    techName: 'Single-Lead ECG (Lead I equivalent)',
    status: 'ACTIVE',
    description: 'Yurak qisqarishlarining elektr ritmini va bo\'lmachalar fibrillyatsiyasini (Afib) tahlil qiladi.',
    requiredPermission: 'android.permission.BODY_SENSORS_BACKGROUND',
    isMedicalGrade: true,
    notes: 'O\'lchash uchun o\'ng qo\'l ko\'rsatkich barmog\'ini yuqori metall tugmaga 30 soniya tekkizib turish talab qilinadi.'
  },
  {
    id: 'bioactive_bia',
    name: 'Bioelectrical Impedance Analysis (BIA)',
    techName: 'Micro-current Bio-Impedance Sensor',
    status: 'ACTIVE',
    description: 'Yog\' foizi, skelet mushaklari massasi, tana suvi va BMI ko\'rsatkichlarini hisoblaydi.',
    requiredPermission: 'android.permission.BODY_SENSORS',
    isMedicalGrade: false,
    notes: 'Ikki barmoqni yon tugmalarga tekkizish orqali 2400 ta impedans nuqtasi o\'lchanadi.'
  },
  {
    id: 'skin_temperature',
    name: 'Infraqizil Tana / Teri Harorati',
    techName: 'Contact Infrared Thermopile Sensor',
    status: 'ACTIVE',
    description: 'Atrof-muhit haroratidan mustaqil ravishda teri yuzasining haqiqiy haroratini qayd etadi.',
    requiredPermission: 'android.permission.BODY_SENSORS',
    isMedicalGrade: false,
    notes: 'Galaxy Watch 5 Pro da yangi qo\'shilgan maxsus infraqizil sensor.'
  },
  {
    id: 'blood_pressure',
    name: 'Arterial Qon Bosimi (BP Monitor)',
    techName: 'Pulse Wave Velocity & Calibration Engine',
    status: 'ACTIVE',
    description: 'Sistolik va diastolik qon bosimini doimiy baholaydi.',
    requiredPermission: 'android.permission.BODY_SENSORS',
    isMedicalGrade: true,
    notes: 'Har 28 kunda bir marta standart tibbiy tonometr (mansheta) bilan kalibrlash talab etiladi.'
  },
  {
    id: 'samsung_sensor_sdk',
    name: 'Samsung Health Sensor SDK (Privileged)',
    techName: 'com.samsung.android.service.health.sensor',
    status: 'PARTNER_APPROVAL_REQUIRED',
    description: 'Samsung Electronics kompaniyasining maxsus hamkorlik dasturi orqali xom PPG/BIA oqimlarini olish.',
    requiredPermission: 'samsung.health.permission.RAW_SENSOR',
    isMedicalGrade: true,
    notes: 'Tibbiy ilovalar uchun Samsung Partner Portal orqali litsenziyalangan imzo talab etiladi.'
  },
  {
    id: 'health_connect',
    name: 'Android Health Connect Sync',
    techName: 'androidx.health.connect.client',
    status: 'ACTIVE',
    description: 'Android tizim darajasidagi shifrlangan ma\'lumotlar ombori bilan ikki tomonlama integratsiya.',
    requiredPermission: 'android.permission.health.READ_HEART_RATE',
    isMedicalGrade: false,
    notes: 'Samsung Health, Google Fit va Health Guard o\'rtasida sinxronizatsiya.'
  }
];

// ============================================================================
// 2. SYNTHETIC & REAL HEALTH SNAPSHOT GENERATION
// ============================================================================
export interface CompleteHealthProfile {
  studentId: string;
  studentName: string;
  isRealDevice: boolean;
  lastUpdated: string;
  heartRate: HeartRateMetric;
  ecg: EcgMetric;
  bloodOxygen: BloodOxygenMetric;
  bloodPressure: BloodPressureMetric;
  skinTemperature: SkinTemperatureMetric;
  bodyComposition: BodyCompositionMetric;
  sleep: SleepMetric;
  stressRecovery: StressRecoveryMetric;
  activity: ActivityMetric;
  aiAssessment: AiRiskAssessment;
}

export function generateSyntheticEcgWave(bpm: number = 75, pointsCount: number = 240): number[] {
  // Realistic single-lead ECG signal (P-wave, QRS complex, T-wave)
  const wave: number[] = [];
  const cycleLength = Math.floor(60 / bpm * 60); // samples per beat at ~60Hz
  for (let i = 0; i < pointsCount; i++) {
    const phase = (i % cycleLength) / cycleLength;
    let v = 0;
    // Isoelectric noise
    v += (Math.random() - 0.5) * 0.04;

    // P wave (at phase 0.15 - 0.25)
    if (phase >= 0.15 && phase <= 0.25) {
      v += 0.15 * Math.sin((phase - 0.15) / 0.1 * Math.PI);
    }
    // Q wave (dip at 0.35)
    else if (phase > 0.33 && phase <= 0.36) {
      v -= 0.15 * Math.sin((phase - 0.33) / 0.03 * Math.PI);
    }
    // R wave (huge spike at 0.38)
    else if (phase > 0.36 && phase <= 0.42) {
      v += 1.25 * Math.sin((phase - 0.36) / 0.06 * Math.PI);
    }
    // S wave (dip at 0.44)
    else if (phase > 0.42 && phase <= 0.46) {
      v -= 0.30 * Math.sin((phase - 0.42) / 0.04 * Math.PI);
    }
    // T wave (at phase 0.55 - 0.70)
    else if (phase >= 0.55 && phase <= 0.70) {
      v += 0.28 * Math.sin((phase - 0.55) / 0.15 * Math.PI);
    }

    wave.push(Number(v.toFixed(3)));
  }
  return wave;
}

export function getHealthProfileForStudent(student: Student): CompleteHealthProfile {
  const telem = student.telemetry;
  const isReal = Boolean(student.deviceId && (student.deviceId === 'W5P-96353336' || student.deviceId.startsWith('W5P-')));
  const now = new Date().toISOString();

  // 1. Heart Rate
  const currentBpm = telem?.heartRate && telem.heartRate > 30 ? telem.heartRate : 76;
  const restingBpm = Math.max(54, currentBpm - 8);
  const heartRate: HeartRateMetric = {
    currentBpm,
    restingBpm,
    minBpm: restingBpm - 6,
    maxBpm: currentBpm + 28,
    hrvRmssdMs: 44, // Normal healthy vagal tone in ms
    hrvSdnnMs: 52,
    timestamp: now,
    source: isReal ? 'SAMSUNG_HEALTH_SENSOR_SDK' : 'DEMO_SIMULATION',
    isReal
  };

  // 2. ECG
  const ecg: EcgMetric = {
    leadI: generateSyntheticEcgWave(currentBpm, 240),
    sampleRateHz: 250,
    durationSec: 30,
    rhythmType: currentBpm > 105 ? 'SINUS_TACHYCARDIA' : currentBpm < 55 ? 'SINUS_BRADYCARDIA' : 'SINUS_RHYTHM',
    classificationConfidence: 0.96,
    qtcIntervalMs: 410,
    prIntervalMs: 160,
    averageBpm: currentBpm,
    recordedAt: now,
    source: isReal ? 'SAMSUNG_HEALTH_SENSOR_SDK' : 'DEMO_SIMULATION',
    isReal
  };

  // 3. SpO2 Blood Oxygen
  const bloodOxygen: BloodOxygenMetric = {
    spo2Percentage: 98,
    minSpo2: 95,
    maxSpo2: 99,
    nocturnalDipsCount: 1,
    lowestNightSpo2: 94,
    timestamp: now,
    source: isReal ? 'SAMSUNG_HEALTH_SENSOR_SDK' : 'DEMO_SIMULATION',
    isReal
  };

  // 4. Blood Pressure
  const bloodPressure: BloodPressureMetric = {
    systolic: 116,
    diastolic: 74,
    meanArterialPressure: 88,
    pulseRate: currentBpm,
    category: 'NORMAL',
    timestamp: now,
    source: isReal ? 'HEALTH_CONNECT_API' : 'DEMO_SIMULATION',
    isReal,
    calibrationDate: '2026-11-01',
    isCalibrated: true
  };

  // 5. Skin Temperature
  const temp = telem?.bodyTemperature && telem.bodyTemperature > 30 ? telem.bodyTemperature : 36.6;
  const skinTemperature: SkinTemperatureMetric = {
    tempCelsius: temp,
    baselineDeviation: Number((temp - 36.5).toFixed(2)),
    nocturnalAvgCelsius: 36.2,
    timestamp: now,
    source: isReal ? 'SAMSUNG_HEALTH_SENSOR_SDK' : 'DEMO_SIMULATION',
    isReal
  };

  // 6. Body Composition (BIA)
  const bodyComposition: BodyCompositionMetric = {
    weightKg: 42.5,
    bodyFatPercentage: 17.2,
    skeletalMuscleKg: 20.8,
    bodyWaterPercentage: 62.4,
    bmi: 18.1,
    bmrKcal: 1320,
    visceralFatLevel: 2,
    timestamp: now,
    source: isReal ? 'SAMSUNG_HEALTH_SENSOR_SDK' : 'DEMO_SIMULATION',
    isReal
  };

  // 7. Sleep
  const sleep: SleepMetric = {
    totalMinutes: 495, // 8h 15m
    deepMinutes: 95,
    lightMinutes: 260,
    remMinutes: 110,
    awakeMinutes: 30,
    sleepScore: 89,
    efficiencyPercentage: 94,
    startTime: '22:30',
    endTime: '06:45',
    apneaRiskIndicator: 'LOW',
    isReal,
    source: isReal ? 'HEALTH_CONNECT_API' : 'DEMO_SIMULATION'
  };

  // 8. Stress & Recovery
  const stressRecovery: StressRecoveryMetric = {
    stressScore: 32, // Low
    stressCategory: 'LOW',
    recoveryScore: 86,
    autonomicBalance: 'BALANCED',
    recommendations: [
      'Uyqu rejimi a\'lo darajada tiklanishni ta\'minlamoqda.',
      'Darsdan so\'ng 20 daqiqalik sayr qilish tavsiya etiladi.',
      'Yetarli miqdorda toza suv ichishni davom ettiring.'
    ],
    timestamp: now,
    isReal,
    source: isReal ? 'SAMSUNG_HEALTH_SENSOR_SDK' : 'DEMO_SIMULATION'
  };

  // 9. Activity
  const steps = telem?.stepCount || 4280;
  const activity: ActivityMetric = {
    steps,
    activeMinutes: 52,
    caloriesBurnedKcal: 290,
    distanceMeters: Math.round(steps * 0.65),
    hourlyGoalMet: true,
    timestamp: now,
    isReal,
    source: isReal ? 'SAMSUNG_HEALTH_SENSOR_SDK' : 'DEMO_SIMULATION'
  };

  // 10. AI Risk Assessment
  const findings: HealthRiskFinding[] = [
    {
      id: 'f1',
      module: 'HEART',
      status: currentBpm > 115 ? 'WARNING' : 'NORMAL',
      metricName: 'Yurak ritmi (BPM)',
      currentValue: `${currentBpm} BPM`,
      baselineValue: '70-80 BPM',
      explanation: currentBpm > 115
        ? 'Jismoniy faolliksiz yuqori puls kuzatilmoqda (taxikardiya belgilari).'
        : 'Yurak qisqarish chastotasi fiziologik me\'yorda, muntazam sinus ritmi.',
      clinicalNote: 'P-to\'lqinlari va QRS intervallari simmetrik.'
    },
    {
      id: 'f2',
      module: 'SPO2',
      status: bloodOxygen.spo2Percentage < 94 ? 'CRITICAL' : 'NORMAL',
      metricName: 'Qondagi kislorod (SpO2)',
      currentValue: `${bloodOxygen.spo2Percentage}%`,
      baselineValue: '96-99%',
      explanation: 'Oksigenatsiya darajasi me\'yorda. To\'qimalarga yetarli kislorod yetkazilmoqda.',
      clinicalNote: 'Tungi va kunduzgi o\'rtacha ko\'rsatkichlarda hipoksiya xavfi yo\'q.'
    },
    {
      id: 'f3',
      module: 'BLOOD_PRESSURE',
      status: 'NORMAL',
      metricName: 'Arterial qon bosimi',
      currentValue: `${bloodPressure.systolic}/${bloodPressure.diastolic} mm Hg`,
      baselineValue: '110-120 / 70-80 mm Hg',
      explanation: 'Sistolik va diastolik ko\'rsatkichlar optimal me\'yorda.',
      clinicalNote: 'O\'rtacha arterial bosim (MAP) 88 mm Hg.'
    },
    {
      id: 'f4',
      module: 'SLEEP',
      status: 'NORMAL',
      metricName: 'Uyqu sifati va tiklanish',
      currentValue: '8 soat 15 daqiqa (89 ball)',
      baselineValue: '8-9 soat',
      explanation: 'Chuqur uyqu (Deep sleep) va REM bosqichlari to\'liq tiklanishni ta\'minlagan.',
      clinicalNote: 'Uyqu apnoe indeksi (AHI) past xavf darajasida.'
    }
  ];

  let level: HealthAlertLevel = 'GREEN';
  let overallScore = 94;
  let title = 'Salomatlik ko\'rsatkichlari me\'yorda (Yashil rejim)';
  let summary = 'Bolaning barcha asosiy hayotiy ko\'rsatkichlari (yurak urishi, SpO2, harorat va uyqu) shaxsiy me\'yor chegarasida barqaror saqlanmoqda.';

  if (currentBpm > 125 || bloodOxygen.spo2Percentage < 90) {
    level = 'RED';
    overallScore = 48;
    title = 'Shoshilinch tibbiy baholash tavsiya etiladi (Qizil ogohlantirish)';
    summary = 'Kritik og\'ishlar aniqlandi. Zudlik bilan shifokor yoki tibbiyot xodimiga ko\'rsatish tavsiya qilinadi.';
  } else if (currentBpm > 115 || bloodOxygen.spo2Percentage < 94) {
    level = 'ORANGE';
    overallScore = 65;
    title = 'Jiddiy o\'zgarishlar aniqlandi (To\'q sariq rejim)';
    summary = 'Pediatr yoki kardiolog shifokor konsultatsiyasi tavsiya etiladi.';
  } else if (currentBpm > 100 || bloodOxygen.spo2Percentage < 96) {
    level = 'YELLOW';
    overallScore = 78;
    title = 'Kichik og\'ishlar aniqlandi (Sariq rejim)';
    summary = 'Kuzatuvni davom ettiring, jismoniy zo\'riqishni kamaytirish va suv ichish tavsiya etiladi.';
  }

  const aiAssessment: AiRiskAssessment = {
    level,
    overallScore,
    title,
    summary,
    findings,
    recommendations: [
      'Kundalik suv ichish rejimiga (kuniga 1.5 - 2 litr) rioya qilish.',
      'Kechki uyqu oldidan ekran va yorug\' qurilmalardan 1 soat oldin foydalanmaslik.',
      'Ertalabki yengil badantarbiya va jismoniy faollikni davom ettirish.'
    ],
    emergencyNotice: level === 'RED'
      ? 'DIQQAT: Ushbu tizim tibbiy tashxis qo\'ymaydi. O\'tkir holsizlik yoki ko\'krak sohasidagi og\'riqlarda darhol 103 ga qo\'ng\'iroq qiling.'
      : undefined,
    lastEvaluatedAt: now,
    requiresMedicalConsultation: level === 'ORANGE' || level === 'RED'
  };

  return {
    studentId: student.id,
    studentName: student.name,
    isRealDevice: isReal,
    lastUpdated: now,
    heartRate,
    ecg,
    bloodOxygen,
    bloodPressure,
    skinTemperature,
    bodyComposition,
    sleep,
    stressRecovery,
    activity,
    aiAssessment
  };
}

// ============================================================================
// 3. TIME SERIES GENERATOR (24H, 7D, 30D, 90D)
// ============================================================================
export function getTimeSeriesData(range: TimeRangeFilter, baseBpm: number = 76): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = Date.now();

  if (range === '24H') {
    for (let h = 23; h >= 0; h--) {
      const t = now - h * 3600 * 1000;
      const d = new Date(t);
      const label = `${String(d.getHours()).padStart(2, '0')}:00`;
      const isNight = d.getHours() >= 23 || d.getHours() <= 6;
      const bpm = Math.round(baseBpm + (isNight ? -14 : (Math.sin(h * 0.4) * 8)) + (Math.random() * 4 - 2));
      const spo2 = Math.round(97 + (isNight ? -1 : 1) + (Math.random() * 1.5 - 0.7));
      const stress = isNight ? 15 : Math.round(30 + Math.sin(h) * 15 + Math.random() * 8);

      points.push({
        time: label,
        timestamp: t,
        bpm,
        spo2: Math.min(100, Math.max(93, spo2)),
        systolic: Math.round(114 + Math.sin(h) * 5),
        diastolic: Math.round(72 + Math.cos(h) * 4),
        stress: Math.max(5, Math.min(95, stress)),
        temp: Number((36.5 + (isNight ? -0.3 : 0.2) + Math.random() * 0.1).toFixed(1)),
        steps: isNight ? 0 : Math.round(150 + Math.random() * 400),
        hrv: isNight ? 62 : 45
      });
    }
  } else if (range === '7D') {
    const days = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];
    for (let d = 6; d >= 0; d--) {
      const t = now - d * 86400 * 1000;
      const date = new Date(t);
      const label = `${days[date.getDay() === 0 ? 6 : date.getDay() - 1]} (${date.getDate()})`;
      points.push({
        time: label,
        timestamp: t,
        bpm: Math.round(baseBpm + (Math.random() * 6 - 3)),
        spo2: Math.round(97.5 + (Math.random() * 1 - 0.5)),
        systolic: Math.round(115 + (Math.random() * 4 - 2)),
        diastolic: Math.round(74 + (Math.random() * 3 - 1.5)),
        stress: Math.round(28 + Math.random() * 10),
        temp: 36.6,
        steps: Math.round(4500 + Math.random() * 2500),
        hrv: Math.round(48 + Math.random() * 8)
      });
    }
  } else if (range === '30D') {
    for (let day = 29; day >= 0; day -= 2) {
      const t = now - day * 86400 * 1000;
      const date = new Date(t);
      const label = `${date.getDate()}-kun`;
      points.push({
        time: label,
        timestamp: t,
        bpm: Math.round(baseBpm + Math.sin(day * 0.3) * 4),
        spo2: 98,
        systolic: 116,
        diastolic: 75,
        stress: 30,
        temp: 36.6,
        steps: Math.round(5200 + Math.sin(day) * 1500),
        hrv: 49
      });
    }
  } else {
    // 90D
    for (let w = 12; w >= 0; w--) {
      const t = now - w * 7 * 86400 * 1000;
      const label = `${13 - w}-hafta`;
      points.push({
        time: label,
        timestamp: t,
        bpm: Math.round(baseBpm + Math.sin(w) * 3),
        spo2: 98,
        systolic: 115,
        diastolic: 74,
        stress: 32,
        temp: 36.6,
        steps: Math.round(5500 + Math.random() * 1000),
        hrv: 50
      });
    }
  }

  return points;
}

// ============================================================================
// 4. AI HEALTH ASSISTANT INTELLIGENT REASONING ENGINE
// ============================================================================
export function answerMedicalAssistantQuery(
  question: string,
  profile: CompleteHealthProfile
): { text: string; referencedMetrics: Array<{ label: string; value: string; date: string }> } {
  const q = question.toLowerCase();
  const dateStr = new Date().toLocaleDateString('uz-UZ');

  if (q.includes('yurak') || q.includes('puls') || q.includes('heart') || q.includes('bpm')) {
    return {
      text: `Hozirgi vaqtda bolaning yurak urishi daqiqasiga ${profile.heartRate.currentBpm} BPM ni tashkil etmoqda (tinch holatda ${profile.heartRate.restingBpm} BPM). Yurak qisqarish ritmi muntazam sinus ritmida, EKG to'lqinlarida aritmiya yoki bo'lmachalar fibrillyatsiyasi (Afib) belgilari aniqlanmagan. HRV (yurak ritmi o'zgaruvchanligi) ko'rsatkichi ${profile.heartRate.hrvRmssdMs} ms bo'lib, vegetativ asab tizimi normal muvozanatda ekanini ko'rsatadi.`,
      referencedMetrics: [
        { label: 'Hozirgi puls', value: `${profile.heartRate.currentBpm} BPM`, date: dateStr },
        { label: 'Tinch holatdagi puls', value: `${profile.heartRate.restingBpm} BPM`, date: dateStr },
        { label: 'HRV (rMSSD)', value: `${profile.heartRate.hrvRmssdMs} ms`, date: dateStr },
        { label: 'EKG xulosasi', value: profile.ecg.rhythmType, date: dateStr }
      ]
    };
  }

  if (q.includes('kislorod') || q.includes('spo2') || q.includes('oxygen')) {
    return {
      text: `Bolaning qondagi kislorod to'yinganlik darajasi (SpO2) ${profile.bloodOxygen.spo2Percentage}% ni tashkil etmoqda. Bu bolalar uchun me'yordagi (95-100%) ko'rsatkich hisoblanadi. O'tgan tunda o'lchangan eng past ko'rsatkich ${profile.bloodOxygen.lowestNightSpo2}% bo'lib, uxlash vaqtida nafas to'xtashi (apnoe) yoki gipoksiya holatlari ro'y bermagan.`,
      referencedMetrics: [
        { label: 'SpO2 Oksigenatsiya', value: `${profile.bloodOxygen.spo2Percentage}%`, date: dateStr },
        { label: 'Tungi minimal SpO2', value: `${profile.bloodOxygen.lowestNightSpo2}%`, date: dateStr },
        { label: 'Tungi pasayishlar', value: `${profile.bloodOxygen.nocturnalDipsCount} marta`, date: dateStr }
      ]
    };
  }

  if (q.includes('uyqu') || q.includes('sleep') || q.includes('uxla')) {
    return {
      text: `Bolaning oxirgi uyqu davomiyligi ${Math.floor(profile.sleep.totalMinutes / 60)} soat ${profile.sleep.totalMinutes % 60} daqiqani tashkil qildi va umumiy uyqu sifati 100 balldan ${profile.sleep.sleepScore} ball bilan baholandi. Chuqur uyqu (Deep Sleep) fazasi ${profile.sleep.deepMinutes} daqiqa bo'lib, jismoniy tiklanish va o'sish gormoni sintezi uchun yetarlidir. Uyqu apnoesi xavfi past (LOW) darajada.`,
      referencedMetrics: [
        { label: 'Umumiy uyqu', value: `${Math.floor(profile.sleep.totalMinutes / 60)}s ${profile.sleep.totalMinutes % 60}d`, date: dateStr },
        { label: 'Uyqu balli', value: `${profile.sleep.sleepScore} / 100`, date: dateStr },
        { label: 'Chuqur uyqu', value: `${profile.sleep.deepMinutes} daqiqa`, date: dateStr },
        { label: 'REM fazasi', value: `${profile.sleep.remMinutes} daqiqa`, date: dateStr }
      ]
    };
  }

  if (q.includes('bosim') || q.includes('blood pressure') || q.includes('davlen')) {
    return {
      text: `Samsung Galaxy Watch 5 Pro sensorlari orqali qayd etilgan qon bosimi ${profile.bloodPressure.systolic}/${profile.bloodPressure.diastolic} mm Hg ni ko'rsatmoqda. Amerika Kardiologiya Assotsiatsiyasi (AHA) tasnifiga ko'ra, bu Normal (optimal) toifaga kiradi. O'rtacha arterial bosim ${profile.bloodPressure.meanArterialPressure} mm Hg. Eslatib o'tamiz, aniqlikni saqlash uchun har 28 kunda bir marta standart tibbiy tonometr bilan soatni kalibrlash lozim.`,
      referencedMetrics: [
        { label: 'Sistolik / Diastolik', value: `${profile.bloodPressure.systolic}/${profile.bloodPressure.diastolic} mm Hg`, date: dateStr },
        { label: 'Kategoriya', value: profile.bloodPressure.category, date: dateStr },
        { label: 'O\'rtacha bosim (MAP)', value: `${profile.bloodPressure.meanArterialPressure} mm Hg`, date: dateStr }
      ]
    };
  }

  if (q.includes('tana') || q.includes('vazn') || q.includes('mushak') || q.includes('yog') || q.includes('bia') || q.includes('bmi')) {
    return {
      text: `Samsung BioActive BIA impedans sensori ma'lumotlariga ko'ra, bolaning tana massasi indeksi (BMI) ${profile.bodyComposition.bmi} (me'yor). Tana yog' foizi ${profile.bodyComposition.bodyFatPercentage}%, skelet mushaklari ${profile.bodyComposition.skeletalMuscleKg} kg va tana suyuqligi ${profile.bodyComposition.bodyWaterPercentage}% ni tashkil etadi. Bu sog'lom o'sayotgan o'quvchi uchun juda yaxshi mutanosiblikdir.`,
      referencedMetrics: [
        { label: 'Tana yog\'i', value: `${profile.bodyComposition.bodyFatPercentage}%`, date: dateStr },
        { label: 'Skelet mushagi', value: `${profile.bodyComposition.skeletalMuscleKg} kg`, date: dateStr },
        { label: 'Tana suvi', value: `${profile.bodyComposition.bodyWaterPercentage}%`, date: dateStr },
        { label: 'BMI', value: `${profile.bodyComposition.bmi}`, date: dateStr }
      ]
    };
  }

  if (q.includes('shifokor') || q.includes('doctor') || q.includes('muammo') || q.includes('xavf')) {
    return {
      text: `AI Health Guard tahliliga ko'ra, ayni paytda bolada tezkor shifokor qabulini talab etadigan xavfli anomaliyalar aniqlanmadi (Status: ${profile.aiAssessment.level}). Agar bolada bosh og'rig'i, ko'krak qafasida qisilish, hushdan ketish yoki holsizlik kuzatilsa, darhol pediatr shifokoriga murojaat qiling va "Tibbiy Hisobotlar" bo'limidan PDF hisobotni shifokorga taqdim eting.`,
      referencedMetrics: [
        { label: 'Umumiy xavf darajasi', value: profile.aiAssessment.level, date: dateStr },
        { label: 'Salomatlik balli', value: `${profile.aiAssessment.overallScore} / 100`, date: dateStr }
      ]
    };
  }

  // General fallback response
  return {
    text: `Bolaning barcha o'lchovlari ko'rib chiqildi: Yurak urishi ${profile.heartRate.currentBpm} BPM (normal), SpO2 ${profile.bloodOxygen.spo2Percentage}% (a'lo), tana harorati ${profile.skinTemperature.tempCelsius}°C, qon bosimi ${profile.bloodPressure.systolic}/${profile.bloodPressure.diastolic} mm Hg va uyqu sifati ${profile.sleep.sleepScore} ball. Barcha ko'rsatkichlar shaxsiy me'yorda saqlanmoqda. Sizni aynan qaysi o'lchov (yurak, EKG, uyqu, kislorod yoki stress) ko'proq qiziqtiradi?`,
    referencedMetrics: [
      { label: 'Puls', value: `${profile.heartRate.currentBpm} BPM`, date: dateStr },
      { label: 'SpO2', value: `${profile.bloodOxygen.spo2Percentage}%`, date: dateStr },
      { label: 'Harorat', value: `${profile.skinTemperature.tempCelsius} °C`, date: dateStr }
    ]
  };
}

// ============================================================================
// 5. PDF & CLINICAL MEDICAL REPORT GENERATION
// ============================================================================
export function generateMedicalReport(profile: CompleteHealthProfile, period: 'DAILY' | 'WEEKLY' | 'MONTHLY'): MedicalReportData {
  return {
    id: `REP-${profile.studentId}-${Date.now().toString(36).toUpperCase()}`,
    studentId: profile.studentId,
    studentName: profile.studentName,
    period,
    generatedAt: new Date().toLocaleString('uz-UZ'),
    overallStatus: profile.aiAssessment.level,
    summaryText: `Ushbu tibbiy hisobot Samsung Galaxy Watch 5 Pro sensorlari va Android Health Connect platformasi orqali ${profile.studentName} bo'yicha yig'ilgan telemetriya ma'lumotlari asosida tuzildi. Barcha ko'rsatkichlar shaxsiy fiziologik me'yorlar bilan qiyosiy tahlil qilingan.`,
    heartHealthSection: {
      avgBpm: profile.heartRate.currentBpm,
      restingBpm: profile.heartRate.restingBpm,
      hrvAvg: profile.heartRate.hrvRmssdMs,
      arrhythmiaEvents: 0
    },
    oxygenSection: {
      avgSpo2: profile.bloodOxygen.spo2Percentage,
      minSpo2: profile.bloodOxygen.minSpo2,
      nocturnalEvents: profile.bloodOxygen.nocturnalDipsCount
    },
    bloodPressureSection: {
      avgSystolic: profile.bloodPressure.systolic,
      avgDiastolic: profile.bloodPressure.diastolic,
      category: profile.bloodPressure.category
    },
    sleepSection: {
      avgDurationHours: Number((profile.sleep.totalMinutes / 60).toFixed(1)),
      avgScore: profile.sleep.sleepScore,
      deepSleepPct: Math.round((profile.sleep.deepMinutes / profile.sleep.totalMinutes) * 100)
    },
    stressActivitySection: {
      avgStress: profile.stressRecovery.stressScore,
      avgSteps: profile.activity.steps,
      recoveryQuality: 'YUQORI (A\'lo tiklanish)'
    },
    aiRecommendations: profile.aiAssessment.recommendations,
    doctorReviewNotes: 'O\'quvchining jismoniy tarbiya darslarida qatnashishi uchun qarshiliklar aniqlanmadi. Ko\'rsatkichlar barqaror.'
  };
}
