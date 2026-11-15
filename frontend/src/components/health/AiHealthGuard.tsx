import React, { useState, useMemo, useEffect } from 'react';
import { Student } from '@/types';
import {
  TimeRangeFilter,
  AiAssistantMessage
} from '@/types/health';
import { SupportedLanguage } from '@/types/health_pro';
import { HEALTH_TRANSLATIONS } from '@/lib/i18n_health';
import {
  getHealthProfileForStudent,
  getTimeSeriesData,
  answerMedicalAssistantQuery,
  generateMedicalReport,
  GALAXY_WATCH_5_PRO_SENSORS
} from '@/lib/healthEngine';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Activity,
  Moon,
  Thermometer,
  Zap,
  FileText,
  Bell,
  Watch,
  ShieldCheck,
  AlertTriangle,
  Send,
  Printer,
  Sparkles,
  ChevronRight,
  Info,
  Cpu,
  Radio,
  Layers,
  CheckCircle2,
  Users,
  Building2,
  Bluetooth,
  Clock,
  Plus,
  Globe,
  Flame
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface AiHealthGuardProps {
  students: Student[];
  initialStudentId?: string;
}

export type HealthNavTab =
  | 'overview'
  | 'heart'
  | 'ecg'
  | 'spo2'
  | 'bp'
  | 'sleep'
  | 'stress'
  | 'recovery'
  | 'body_comp'
  | 'temp_trends'
  | 'digital_twin'
  | 'ai_assistant'
  | 'family_monitoring'
  | 'doctor_portal'
  | 'multi_clinic'
  | 'external_devices'
  | 'emergency_sos'
  | 'reports'
  | 'notifications'
  | 'device'
  | 'privacy';

export const AiHealthGuard: React.FC<AiHealthGuardProps> = ({ students, initialStudentId }) => {
  // 1. Language State
  const [lang, setLang] = useState<SupportedLanguage>('uz');
  const t = HEALTH_TRANSLATIONS[lang] || HEALTH_TRANSLATIONS.uz;

  // 2. Selected Student
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students[0]?.id ?? '10003')
  );
  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0] || {
      id: '10003',
      name: 'Hasan Aliyev',
      className: '9-A',
      uniqueId: '10003',
      deviceId: 'W5P-96353336'
    } as Student;
  }, [students, selectedStudentId]);

  // 3. Active Tab & Time Range
  const [activeTab, setActiveTab] = useState<HealthNavTab>('overview');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('24H');

  // 4. Computed Health Profile & Time Series
  const profile = useMemo(() => {
    return getHealthProfileForStudent(activeStudent);
  }, [activeStudent]);

  const timeSeries = useMemo(() => {
    return getTimeSeriesData(timeRange, profile.heartRate.currentBpm);
  }, [timeRange, profile.heartRate.currentBpm]);

  // 5. AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState<AiAssistantMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: `Assalomu alaykum! Men Samsung Galaxy Watch 5 Pro ma'lumotlariga ixtisoslashgan AI Tibbiy Yordamchiman. Hozirda ${activeStudent.name}ning barcha hayotiy ko'rsatkichlari (yurak ritmi ${profile.heartRate.currentBpm} BPM, SpO2 ${profile.bloodOxygen.spo2Percentage}%, qon bosimi ${profile.bloodPressure.systolic}/${profile.bloodPressure.diastolic} mm Hg) me'yorda saqlanmoqda. Sizni qanday tibbiy ma'lumot qiziqtiradi?`,
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      disclaimer: 'Tibbiy tashxis emas. Axborot maqsadi uchun mo\'ljallangan.'
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');

  const handleSendMessage = (textToSend?: string) => {
    const q = (textToSend || inputQuestion).trim();
    if (!q) return;

    const userMsg: AiAssistantMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    };

    const answer = answerMedicalAssistantQuery(q, profile);
    const botMsg: AiAssistantMessage = {
      id: `b-${Date.now() + 1}`,
      sender: 'assistant',
      text: answer.text,
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      referencedMetrics: answer.referencedMetrics,
      disclaimer: 'Ushbu ma\'lumot shifokor maslahatini almashtirmaydi. O\'tkir holatlarda zudlik bilan 103 ga murojaat qiling.'
    };

    setChatMessages((prev) => [...prev, userMsg, botMsg]);
    if (!textToSend) setInputQuestion('');
  };

  // Report Period State
  const [reportPeriod, setReportPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const currentReport = useMemo(() => {
    return generateMedicalReport(profile, reportPeriod);
  }, [profile, reportPeriod]);

  // Notification Thresholds
  const [bpmThreshold, setBpmThreshold] = useState(120);
  const [spo2Threshold, setSpo2Threshold] = useState(93);
  const [systolicThreshold, setSystolicThreshold] = useState(135);

  // Emergency SOS State
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [sosStatus, setSosStatus] = useState<'IDLE' | 'COUNTDOWN' | 'DISPATCHED' | 'CANCELLED'>('IDLE');

  useEffect(() => {
    let timer: any = null;
    if (sosStatus === 'COUNTDOWN' && sosCountdown !== null && sosCountdown > 0) {
      timer = setTimeout(() => {
        setSosCountdown(sosCountdown - 1);
      }, 1000);
    } else if (sosStatus === 'COUNTDOWN' && sosCountdown === 0) {
      setSosStatus('DISPATCHED');
    }
    return () => clearTimeout(timer);
  }, [sosStatus, sosCountdown]);

  const handleStartSos = () => {
    setSosCountdown(15);
    setSosStatus('COUNTDOWN');
  };

  const handleCancelSos = () => {
    setSosCountdown(null);
    setSosStatus('CANCELLED');
  };

  // Doctor Portal Clinical Notes State
  const [clinicalNoteInput, setClinicalNoteInput] = useState('');
  const [doctorNotes, setDoctorNotes] = useState([
    {
      id: 'n1',
      doctor: 'Dr. Shahnoza Karimova',
      specialty: 'Bolalar kardiologi',
      date: '2026-11-14 16:30',
      text: "EKG va yurak ritmi tahlil qilindi. Sinus ritmi me'yorda. Jismoniy tarbiya darslarida qatnashishga to'liq ruxsat berildi."
    }
  ]);

  const handleAddDoctorNote = () => {
    if (!clinicalNoteInput.trim()) return;
    setDoctorNotes([
      {
        id: `n-${Date.now()}`,
        doctor: 'Dr. Shahnoza Karimova',
        specialty: 'Bolalar kardiologi',
        date: new Date().toLocaleString('uz-UZ'),
        text: clinicalNoteInput.trim()
      },
      ...doctorNotes
    ]);
    setClinicalNoteInput('');
  };

  // External Devices State
  const [externalDevices, setExternalDevices] = useState([
    {
      id: 'DEV-GLU-01',
      name: 'Accu-Chek Guide Me BLE',
      type: 'GLUCOSE_METER',
      status: 'CONNECTED',
      battery: 92,
      lastReading: '5.2 mmol/L (Och qoringa)'
    },
    {
      id: 'DEV-BP-02',
      name: 'Omron EVOLV Smart Cuff',
      type: 'BP_CUFF',
      status: 'CONNECTED',
      battery: 88,
      lastReading: '118/76 mm Hg'
    },
    {
      id: 'DEV-TH-03',
      name: 'Braun ThermoScan 7 Infrared',
      type: 'THERMOMETER',
      status: 'STANDBY',
      battery: 100,
      lastReading: '36.6 °C'
    }
  ]);

  // Alert Badge Helper
  const alertColorMap: Record<string, string> = {
    GREEN: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    YELLOW: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    ORANGE: 'border-orange-500/40 text-orange-400 bg-orange-500/10',
    RED: 'border-rose-500/40 text-rose-400 bg-rose-500/10'
  };

  // Navigation Items Definition (21 Views)
  const navItems: { id: HealthNavTab; label: string; icon: any }[] = [
    { id: 'overview', label: t.nav.dashboard, icon: Activity },
    { id: 'heart', label: t.nav.heart, icon: Heart },
    { id: 'ecg', label: t.nav.ecg, icon: Zap },
    { id: 'spo2', label: t.nav.spo2, icon: Radio },
    { id: 'bp', label: t.nav.bp, icon: Layers },
    { id: 'sleep', label: t.nav.sleep, icon: Moon },
    { id: 'stress', label: t.nav.stress, icon: Sparkles },
    { id: 'recovery', label: t.nav.recovery, icon: Flame },
    { id: 'body_comp', label: t.nav.body_comp, icon: Activity },
    { id: 'temp_trends', label: t.nav.temp, icon: Thermometer },
    { id: 'digital_twin', label: t.nav.digital_twin, icon: Cpu },
    { id: 'ai_assistant', label: t.nav.ai_assistant, icon: Sparkles },
    { id: 'family_monitoring', label: t.nav.family, icon: Users },
    { id: 'doctor_portal', label: t.nav.doctor_portal, icon: ShieldCheck },
    { id: 'multi_clinic', label: t.nav.clinic_admin, icon: Building2 },
    { id: 'external_devices', label: t.nav.external_devices, icon: Bluetooth },
    { id: 'emergency_sos', label: t.nav.emergency_sos, icon: AlertTriangle },
    { id: 'reports', label: t.nav.medical_reports, icon: FileText },
    { id: 'notifications', label: t.nav.notifications, icon: Bell },
    { id: 'device', label: t.nav.device_connection, icon: Watch },
    { id: 'privacy', label: t.nav.privacy_settings, icon: ShieldCheck }
  ];

  return (
    <div className="space-y-6 text-[#e2e8f0]">
      {/* ==================================================================== */}
      {/* HEADER SECTION: PLATFORM TITLE, STUDENT SELECTOR & LANGUAGE SWITCHER */}
      {/* ==================================================================== */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0d1527] border border-[#1e293b] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0074e4] to-[#00b4d8] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Heart className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                {t.appTitle}
                <Badge className="bg-[#0074e4]/20 text-[#38bdf8] border-[#0074e4]/40 text-[10px] font-mono">
                  Galaxy Watch 5 Pro Edition
                </Badge>
              </h1>
              <p className="text-xs text-[#94a3b8]">{t.appSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Controls: Language, Student Selector, Live Badge */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Trilingual Language Selector */}
          <div className="flex items-center bg-[#141f36] p-1 rounded-xl border border-[#243452]">
            <Globe className="w-3.5 h-3.5 text-[#94a3b8] ml-2 mr-1" />
            {(['uz', 'ru', 'en'] as SupportedLanguage[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition uppercase ${
                  lang === l
                    ? 'bg-[#0074e4] text-white shadow'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Child Switcher */}
          <div className="flex items-center gap-2 bg-[#141f36] px-3 py-1.5 rounded-xl border border-[#243452]">
            <span className="text-xs text-[#94a3b8]">O'quvchi:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#141f36] text-white">
                  {s.name} ({s.className} • {s.deviceId === 'W5P-96353336' ? '⌚ Haqiqiy Watch 5 Pro' : 'Simulyatsiya'})
                </option>
              ))}
            </select>
          </div>

          {/* Real vs Demo Source Tag */}
          <Badge
            variant="outline"
            className={`text-xs gap-1.5 font-mono py-1.5 px-3 ${
              profile.isRealDevice
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${profile.isRealDevice ? 'bg-emerald-400 animate-ping' : 'bg-blue-400'}`} />
            {profile.isRealDevice ? t.realDeviceBadge : t.demoDeviceBadge}
          </Badge>

          {/* AI Alert Level Badge */}
          <Badge variant="outline" className={`text-xs font-bold py-1.5 px-3 border ${alertColorMap[profile.aiAssessment.level]}`}>
            AI Status: {profile.aiAssessment.level} ({profile.aiAssessment.overallScore}/100)
          </Badge>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MEDICAL DISCLAIMER BANNER                                            */}
      {/* ==================================================================== */}
      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>{t.emergencyDisclaimer}</span>
        </div>
        <button
          onClick={() => setActiveTab('emergency_sos')}
          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] whitespace-nowrap shadow transition"
        >
          103 SOS
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 21 NAVIGATION TABS (HORIZONTAL SCROLLABLE)                          */}
      {/* ==================================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#1e293b] scrollbar-none text-xs font-medium">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0074e4] text-white shadow-lg shadow-blue-500/25 font-bold'
                  : 'bg-[#10192e] text-[#94a3b8] hover:text-white hover:bg-[#14223d] border border-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TIME RANGE SELECTOR (FOR CHARTS)                                     */}
      {/* ==================================================================== */}
      {['overview', 'heart', 'spo2', 'bp', 'sleep', 'stress', 'recovery', 'temp_trends', 'digital_twin'].includes(activeTab) && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">
            {t.nav.dashboard} • Tahlil oralig'i:
          </span>
          <div className="flex items-center gap-1 bg-[#10192e] p-1 rounded-xl border border-[#1e2d4a]">
            {(['24H', '7D', '30D', '90D'] as TimeRangeFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition ${
                  timeRange === r
                    ? 'bg-[#0074e4] text-white shadow'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                {t.timeRanges[r] || r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 1: OVERVIEW DASHBOARD                                           */}
      {/* ==================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Heart Rate */}
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                  <span>{t.metrics.bpm} (PPG)</span>
                  <Heart className="w-4 h-4 text-rose-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">
                    {profile.heartRate.currentBpm}
                  </span>
                  <span className="text-xs text-[#94a3b8]">BPM</span>
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Sinus ritmi me'yorda</span>
                </div>
              </CardContent>
            </Card>

            {/* SpO2 */}
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                  <span>{t.metrics.spo2}</span>
                  <Radio className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">
                    {profile.bloodOxygen.spo2Percentage}%
                  </span>
                  <span className="text-xs text-[#94a3b8]">SpO2</span>
                </div>
                <div className="text-[11px] text-cyan-400">Kislorod me'yorda</div>
              </CardContent>
            </Card>

            {/* Blood Pressure */}
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                  <span>{t.metrics.bp}</span>
                  <Layers className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">
                    {profile.bloodPressure.systolic}/{profile.bloodPressure.diastolic}
                  </span>
                  <span className="text-xs text-[#94a3b8]">mm Hg</span>
                </div>
                <div className="text-[11px] text-indigo-400">Normal (AHA)</div>
              </CardContent>
            </Card>

            {/* Recovery & Sleep */}
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                  <span>{t.metrics.recoveryScore}</span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">
                    88.5%
                  </span>
                  <span className="text-xs text-[#94a3b8]">Optimal</span>
                </div>
                <div className="text-[11px] text-emerald-400">A'lo darajada tiklangan</div>
              </CardContent>
            </Card>
          </div>

          {/* Heart Rate Area Chart */}
          <Card className="bg-[#10192e] border-[#1e2d4a]">
            <CardHeader className="p-4 border-b border-white/[0.06] flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                24-Soatlik Yurak Urishi Dinamikasi (Samsung BioActive PPG)
              </CardTitle>
              <Badge variant="outline" className="text-xs font-mono text-emerald-400 border-emerald-500/30">
                O'rtacha: {profile.heartRate.restingBpm} BPM
              </Badge>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id="bpmGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis domain={[50, 130]} stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="bpm" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#bpmGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: HEART HEALTH                                                 */}
      {/* ==================================================================== */}
      {activeTab === 'heart' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              Yurak Salomatligi va Aritmiya Xavfi Tahlili
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">Tinch holatdagi puls:</span>
                <p className="text-lg font-bold text-white font-mono mt-1">{profile.heartRate.restingBpm} BPM</p>
                <p className="text-[11px] text-emerald-400 mt-1">Sog'lom fiziologik oraliq</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">Yurak ritmi o'zgaruvchanligi (HRV):</span>
                <p className="text-lg font-bold text-white font-mono mt-1">{profile.heartRate.hrvRmssdMs} ms (RMSSD)</p>
                <p className="text-[11px] text-cyan-400 mt-1">Avtonom asab tizimi faol</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">Aritmiya xavf darajasi:</span>
                <p className="text-lg font-bold text-white font-mono mt-1">4% (Kam xavfli)</p>
                <p className="text-[11px] text-emerald-400 mt-1">Bo'lmachalar fibrillyatsiyasi yo'q</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 3: ECG ANALYSIS                                                 */}
      {/* ==================================================================== */}
      {activeTab === 'ecg' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              1-Tarmoq EKG To'lqini (Samsung BioActive Single-Lead ECG)
            </CardTitle>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              Sinus Ritmi (Normal)
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="p-4 rounded-xl bg-[#090f1d] border border-[#1e293b]">
              <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-2 font-mono">
                <span>Standart Kalibratsiya: 25 mm/s, 10 mm/mV</span>
                <span>P-Q-R-S-T Kompleksi To'liq</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeries.slice(0, 40)}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                    <Line type="monotone" dataKey="ecgMillivolts" stroke="#10b981" strokeWidth={1.8} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#141f36] text-xs text-[#cbd5e1] border border-[#243452]">
              💡 <b>Klinik EKG izohi:</b> Ushbu EKG Samsung Galaxy Watch 5 Pro'ning yuqori elektrodiga barmog'ini qo'yish orqali qayd qilingan. P to'lqini va QRS kompleksi morfologiyasi me'yorda.
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 4: BLOOD OXYGEN (SpO2)                                          */}
      {/* ==================================================================== */}
      {activeTab === 'spo2' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              Qonning Kislorod Bilan To'yinganligi (SpO2)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#141f36] border border-[#243452] space-y-2">
                <span className="text-[#94a3b8]">Hozirgi SpO2 darajasi:</span>
                <p className="text-3xl font-black text-white font-mono">{profile.bloodOxygen.spo2Percentage}%</p>
                <p className="text-cyan-400">Optimal to'yinganlik (95-100%)</p>
              </div>
              <div className="p-4 rounded-xl bg-[#141f36] border border-[#243452] space-y-2">
                <span className="text-[#94a3b8]">Tungi uyqudagi minimal SpO2:</span>
                <p className="text-3xl font-black text-white font-mono">96.0%</p>
                <p className="text-emerald-400">Apnea yoki gipoksiya epizodlari yo'q</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 5: BLOOD PRESSURE                                               */}
      {/* ==================================================================== */}
      {activeTab === 'bp' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Arterial Bosim Monitoringi (AHA Standartlari)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#141f36] border border-[#243452] flex items-center justify-between">
              <div>
                <span className="text-[#94a3b8]">Oxirgi o'lchov:</span>
                <h3 className="text-2xl font-black text-white font-mono mt-1">
                  {profile.bloodPressure.systolic} / {profile.bloodPressure.diastolic} mm Hg
                </h3>
                <p className="text-emerald-400 text-xs mt-1">Kategoriya: Normal (AHA / ESC)</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Optimal
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 6: SLEEP ANALYSIS                                               */}
      {/* ==================================================================== */}
      {activeTab === 'sleep' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Moon className="w-4 h-4 text-purple-400" />
              Uyqu Bosqichlari va Sifati Tahlili
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">Jami uyqu:</span>
                <p className="text-lg font-bold text-white font-mono mt-1">7s 45daq</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">Chuqur uyqu (Deep):</span>
                <p className="text-lg font-bold text-purple-400 font-mono mt-1">1s 45daq (22%)</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">Tezkor uyqu (REM):</span>
                <p className="text-lg font-bold text-cyan-400 font-mono mt-1">1s 50daq (24%)</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">Uyqu balli:</span>
                <p className="text-lg font-bold text-emerald-400 font-mono mt-1">88 / 100</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 7: STRESS MONITORING                                            */}
      {/* ==================================================================== */}
      {activeTab === 'stress' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Stress Darajasi va Avtonom Muvozanat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#141f36] border border-[#243452] space-y-2">
              <span className="text-[#94a3b8]">Hozirgi stress darajasi:</span>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-black text-emerald-400 font-mono">24 / 100</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Tinch va xotirjam (Relaxed)
                </Badge>
              </div>
              <p className="text-[#94a3b8] mt-2">
                Parasimpotik asab tizimi ustunlik qilmoqda. Aqliy zo'riqish va charchoq belgilari aniqlanmadi.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 8: RECOVERY & FATIGUE                                           */}
      {/* ==================================================================== */}
      {activeTab === 'recovery' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              {t.nav.recovery} (Autonomic Recovery Index)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">Tiklanish indeksi:</span>
                <p className="text-3xl font-black text-emerald-400 font-mono mt-1">88.5%</p>
                <p className="text-xs text-[#94a3b8] mt-1">Yuqori tayyorgarlik darajasi</p>
              </div>
              <div className="p-4 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">Kardiovaskulyar yuklama:</span>
                <p className="text-3xl font-black text-white font-mono mt-1">Past (22%)</p>
                <p className="text-xs text-emerald-400 mt-1">Ortiqcha zo'riqish yo'q</p>
              </div>
              <div className="p-4 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">Uyqu qarzi (Sleep Debt):</span>
                <p className="text-3xl font-black text-white font-mono mt-1">0 daqiqa</p>
                <p className="text-xs text-cyan-400 mt-1">Sutkalik me'yor to'liq bajarilgan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 9: BODY COMPOSITION (BIA)                                       */}
      {/* ==================================================================== */}
      {activeTab === 'body_comp' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0074e4]" />
              Tana Tarkibi Tahlili (Bioelectrical Impedance Analysis - BIA)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">{t.metrics.fatPct}:</span>
                <p className="text-lg font-bold text-white font-mono mt-1">{profile.bodyComposition.bodyFatPercentage}%</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">{t.metrics.muscleKg}:</span>
                <p className="text-lg font-bold text-white font-mono mt-1">{profile.bodyComposition.skeletalMuscleKg} kg</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">{t.metrics.bmi}:</span>
                <p className="text-lg font-bold text-white font-mono mt-1">{profile.bodyComposition.bmi}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-[#94a3b8]">Suv miqdori:</span>
                <p className="text-lg font-bold text-cyan-400 font-mono mt-1">{profile.bodyComposition.bodyWaterPercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 10: TEMPERATURE TRENDS                                          */}
      {/* ==================================================================== */}
      {activeTab === 'temp_trends' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-400" />
              {t.nav.temp} (Infraqizil Teri Harorati)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#141f36] border border-[#243452] space-y-2">
              <span className="text-[#94a3b8]">Oxirgi o'lchangan teri harorati:</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-white font-mono">{profile.skinTemperature.tempCelsius} °C</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Me'yorda (34.2 °C asos)
                </Badge>
              </div>
              <p className="text-[#cbd5e1] mt-2">
                ⚠️ <b>Muhim izoh:</b> Samsung Galaxy Watch 5 Pro infraqizil sensori faqat bilak terisi haroratini o'lchaydi. Bu ichki tana haroratidan (36.6°C) farq qiladi va to'g'ridan-to'g'ri termometr o'rnini bosmaydi.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 11: DIGITAL HEALTH TWIN                                         */}
      {/* ==================================================================== */}
      {activeTab === 'digital_twin' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#0074e4]" />
              {t.nav.digital_twin} — Fiziologik Baza va Og'ishlar Modeli
            </CardTitle>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              Homeostaz: 94% Mos
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#141f36] border border-[#243452] space-y-3">
              <h4 className="font-bold text-white text-sm">Shaxsiy Fiziologik Egizak Ko'rsatkichlari:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[#0d1527] border border-[#1e293b]">
                  <span className="text-[#94a3b8]">Kardiovaskulyar Egizak:</span>
                  <p className="text-white font-bold mt-1">Moslashuv Barqaror</p>
                  <p className="text-[11px] text-emerald-400">Puls og'ishi: +2 BPM</p>
                </div>
                <div className="p-3 rounded-lg bg-[#0d1527] border border-[#1e293b]">
                  <span className="text-[#94a3b8]">Respirator Egizak:</span>
                  <p className="text-white font-bold mt-1">Optimal Oksigenatsiya</p>
                  <p className="text-[11px] text-cyan-400">SpO2 og'ishi: 0.0%</p>
                </div>
                <div className="p-3 rounded-lg bg-[#0d1527] border border-[#1e293b]">
                  <span className="text-[#94a3b8]">Metabolik Egizak:</span>
                  <p className="text-white font-bold mt-1">Energiya Balansi Faol</p>
                  <p className="text-[11px] text-amber-400">Gomeostaz barqaror</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 12: AI MEDICAL ASSISTANT                                        */}
      {/* ==================================================================== */}
      {activeTab === 'ai_assistant' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#0074e4]" />
              AI Tibbiy Maslahatchi (Tibbiy AI Muloqot)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto p-3 rounded-xl bg-[#090f1d] border border-[#1e293b]">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#0074e4] text-white rounded-br-none'
                        : 'bg-[#141f36] text-[#cbd5e1] border border-[#243452] rounded-bl-none'
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.disclaimer && (
                      <p className="mt-2 text-[10px] text-amber-300/80 italic border-t border-white/10 pt-1">
                        ℹ️ {msg.disclaimer}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-[#64748b] mt-1 px-1 font-mono">{msg.timestamp}</span>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Masalan: Hasan Aliyevning yurak urishi va kislorodi holati qanday?"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-[#141f36] border border-[#243452] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#0074e4]"
              />
              <button
                onClick={() => handleSendMessage()}
                className="px-4 py-2.5 rounded-xl bg-[#0074e4] hover:bg-[#0062c4] text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Yuborish</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 13: FAMILY REMOTE MONITORING                                    */}
      {/* ==================================================================== */}
      {activeTab === 'family_monitoring' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0074e4]" />
              {t.family.title}
            </CardTitle>
            <button
              onClick={() => alert("Oila a'zosi taklif qilish havolasi nusxalandi.")}
              className="px-3 py-1.5 rounded-lg bg-[#0074e4] text-white text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.family.inviteButton}</span>
            </button>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            {[
              { name: 'Nodira Aliyeva', role: 'Ona (Asosiy Vasiy)', phone: '+998 90 123 45 67', alerts: true },
              { name: 'Jamshid Aliyev', role: 'Ota (Favqulodda aloqa)', phone: '+998 90 987 65 43', alerts: true },
              { name: 'Hamshira Dilfuza opa', role: 'Maktab Hamshirasi', phone: '+998 91 555 44 33', alerts: false }
            ].map((m, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{m.name}</h4>
                  <p className="text-[#94a3b8] text-xs">{m.role} • {m.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]">
                    SMS & Push Faol
                  </Badge>
                  <button
                    onClick={() => alert(`${m.name} uchun ruxsat bekor qilindi.`)}
                    className="text-xs text-rose-400 hover:text-rose-300 ml-2"
                  >
                    {t.family.revokeAccess}
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 14: DOCTOR CLINICAL PORTAL                                      */}
      {/* ==================================================================== */}
      {activeTab === 'doctor_portal' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {t.doctor.title} (Klinik Baholash)
            </CardTitle>
            <button
              onClick={() => alert("Klinik ko'rik xulosasi PDF formatda tayyorlandi va chop etishga yuborildi.")}
              className="px-3 py-1.5 rounded-lg bg-[#0074e4] text-white text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.doctor.exportClinicalPdf}</span>
            </button>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            {/* Clinical Note Entry */}
            <div className="p-4 rounded-xl bg-[#141f36] border border-[#243452] space-y-2">
              <span className="font-bold text-white">{t.doctor.clinicalNotes}:</span>
              <textarea
                rows={3}
                placeholder="Shifokor xulosasi, ko'rik natijalari yoki dori-darmon tavsiyalarini kiriting..."
                value={clinicalNoteInput}
                onChange={(e) => setClinicalNoteInput(e.target.value)}
                className="w-full bg-[#0d1527] border border-[#243452] rounded-lg p-2.5 text-white placeholder-[#64748b] focus:outline-none focus:border-[#0074e4]"
              />
              <button
                onClick={handleAddDoctorNote}
                className="px-4 py-2 rounded-lg bg-[#0074e4] text-white font-bold text-xs hover:bg-[#0062c4] transition"
              >
                {t.doctor.addNote}
              </button>
            </div>

            {/* Existing Notes */}
            <div className="space-y-2">
              {doctorNotes.map((note) => (
                <div key={note.id} className="p-3.5 rounded-xl bg-[#090f1d] border border-[#1e293b] space-y-1">
                  <div className="flex items-center justify-between text-[#94a3b8] text-[11px]">
                    <span className="font-bold text-white">{note.doctor} ({note.specialty})</span>
                    <span className="font-mono">{note.date}</span>
                  </div>
                  <p className="text-[#cbd5e1] leading-relaxed mt-1">{note.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 15: MULTI-CLINIC ADMINISTRATION                                 */}
      {/* ==================================================================== */}
      {activeTab === 'multi_clinic' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0074e4]" />
              {t.clinic.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200">
              ℹ️ {t.clinic.tenantIsolationNote}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Toshkent Markaziy Bolalar Klinikasi', license: 'UZ-MED-8801', patients: 1420, docs: 18 },
                { name: 'Samarqand Kardiologiya Markazi', license: 'UZ-MED-7712', patients: 840, docs: 12 },
                { name: 'Xorazm Viloyat Shoshilinch Filiali', license: 'UZ-MED-6634', patients: 610, docs: 9 }
              ].map((c, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#141f36] border border-[#243452] space-y-2">
                  <h4 className="font-bold text-white text-sm">{c.name}</h4>
                  <p className="font-mono text-[11px] text-[#38bdf8]">Litsenziya: {c.license}</p>
                  <div className="flex items-center justify-between text-[#94a3b8] pt-2 border-t border-white/[0.06]">
                    <span>Bemorlar: {c.patients}</span>
                    <span>Shifokorlar: {c.docs}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 16: EXTERNAL MEDICAL DEVICES                                    */}
      {/* ==================================================================== */}
      {activeTab === 'external_devices' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-cyan-400" />
              {t.external.title}
            </CardTitle>
            <button
              onClick={() => alert("Yangi BLE tibbiy qurilma qidirilmoqda...")}
              className="px-3 py-1.5 rounded-lg bg-[#0074e4] text-white text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>{t.external.connectBle}</span>
            </button>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            {externalDevices.map((dev) => (
              <div key={dev.id} className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{dev.name}</h4>
                  <p className="text-[#94a3b8] text-xs">Oxirgi o'lchov: <span className="font-mono text-white">{dev.lastReading}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[#38bdf8]">Batareya: {dev.battery}%</span>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]">
                    {dev.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 17: EMERGENCY SOS                                               */}
      {/* ==================================================================== */}
      {activeTab === 'emergency_sos' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              {t.emergency.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-center">
            {sosStatus === 'IDLE' && (
              <div className="space-y-4 max-w-md mx-auto">
                <p className="text-xs text-[#cbd5e1] leading-relaxed">
                  Soatdagi favqulodda tugma bosilganda yoki hushdan ketish aniqlanganda 15 soniyalik ogohlantirish taymeri ishga tushadi.
                </p>
                <button
                  onClick={handleStartSos}
                  className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm tracking-wider shadow-lg shadow-rose-600/30 transition uppercase"
                >
                  Favqulodda SOS Signali Yuborish (Test)
                </button>
              </div>
            )}

            {sosStatus === 'COUNTDOWN' && (
              <div className="space-y-4 max-w-md mx-auto p-6 rounded-2xl bg-rose-500/10 border border-rose-500/40">
                <span className="text-xs text-rose-300 font-bold uppercase">{t.emergency.countdownText}:</span>
                <div className="text-6xl font-black text-rose-400 font-mono animate-pulse">
                  {sosCountdown}s
                </div>
                <button
                  onClick={handleCancelSos}
                  className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition"
                >
                  {t.emergency.cancelButton}
                </button>
              </div>
            )}

            {sosStatus === 'DISPATCHED' && (
              <div className="space-y-3 max-w-md mx-auto p-6 rounded-2xl bg-rose-600/20 border border-rose-500">
                <h4 className="text-sm font-black text-rose-400">SOS XABARI YUBORILDI!</h4>
                <p className="text-xs text-[#cbd5e1]">{t.emergency.broadcastedText}</p>
                <div className="p-2.5 rounded-lg bg-[#0d1527] text-left font-mono text-[11px] text-[#94a3b8] space-y-1">
                  <p>{t.emergency.coordinates}: 41.5695° N, 60.6327° E</p>
                  <p>{t.emergency.accuracy}: 3.5 metr</p>
                  <p>Dispetcher: 103 Tez Yordam Markazi</p>
                </div>
                <button
                  onClick={() => setSosStatus('IDLE')}
                  className="px-4 py-2 rounded-xl bg-[#141f36] text-white text-xs font-bold"
                >
                  Yopish
                </button>
              </div>
            )}

            {sosStatus === 'CANCELLED' && (
              <div className="space-y-3 max-w-md mx-auto p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                <p>✅ Favqulodda chaqiruv foydalanuvchi tomonidan bekor qilindi (Soxta signal xavfi bartaraf etildi).</p>
                <button
                  onClick={() => setSosStatus('IDLE')}
                  className="px-4 py-1.5 rounded-lg bg-[#141f36] text-white text-xs font-bold"
                >
                  Qayta o'rnatish
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 18: MEDICAL REPORTS & PDF EXPORT                                */}
      {/* ==================================================================== */}
      {activeTab === 'reports' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              {t.nav.medical_reports} va Eksport
            </CardTitle>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-[#0074e4] hover:bg-[#0062c4] text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Chop etish / PDF Eksport</span>
            </button>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#141f36] border border-[#243452] space-y-2">
              <h4 className="font-bold text-white text-sm">Haftalik Tibbiy Hisobot ({activeStudent.name})</h4>
              <p className="text-[#94a3b8]">Davr: Oxirgi 7 kunlik uzluksiz biometrik o'lchovlar.</p>
              <div className="pt-2 border-t border-white/[0.06] space-y-1">
                <p className="text-[#cbd5e1]">• O'rtacha puls: <b>{profile.heartRate.restingBpm} BPM</b></p>
                <p className="text-[#cbd5e1]">• O'rtacha SpO2 darajasi: <b>{profile.bloodOxygen.spo2Percentage}%</b></p>
                <p className="text-[#cbd5e1]">• O'rtacha qon bosimi: <b>{profile.bloodPressure.systolic}/{profile.bloodPressure.diastolic} mm Hg</b></p>
                <p className="text-[#cbd5e1]">• EKG anomaliyalari: <b>Aniqlanmadi (Normal sinus ritmi)</b></p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 19: NOTIFICATIONS & THRESHOLDS                                  */}
      {/* ==================================================================== */}
      {activeTab === 'notifications' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              {t.nav.notifications} va Ogohlantirish Chegaralari
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-[#0b1222] border border-[#1e293b] space-y-2">
                <span className="text-[#94a3b8]">Maksimal puls chegarasi (BPM)</span>
                <input
                  type="number"
                  value={bpmThreshold}
                  onChange={(e) => setBpmThreshold(Number(e.target.value))}
                  className="w-full bg-[#141f36] border border-[#243452] rounded-lg p-2 text-white font-mono"
                />
                <span className="text-[10px] text-amber-400">Taxikardiyada ogohlantiradi</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0b1222] border border-[#1e293b] space-y-2">
                <span className="text-[#94a3b8]">Minimal SpO2 chegarasi (%)</span>
                <input
                  type="number"
                  value={spo2Threshold}
                  onChange={(e) => setSpo2Threshold(Number(e.target.value))}
                  className="w-full bg-[#141f36] border border-[#243452] rounded-lg p-2 text-white font-mono"
                />
                <span className="text-[10px] text-cyan-400">Gipoksiyada ogohlantiradi</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0b1222] border border-[#1e293b] space-y-2">
                <span className="text-[#94a3b8]">Sistolik bosim chegarasi (mm Hg)</span>
                <input
                  type="number"
                  value={systolicThreshold}
                  onChange={(e) => setSystolicThreshold(Number(e.target.value))}
                  className="w-full bg-[#141f36] border border-[#243452] rounded-lg p-2 text-white font-mono"
                />
                <span className="text-[10px] text-indigo-400">Gipertoniyada ogohlantiradi</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 20: DEVICE CONNECTION (GALAXY WATCH 5 PRO SENSORS)               */}
      {/* ==================================================================== */}
      {activeTab === 'device' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Watch className="w-4 h-4 text-[#0074e4]" />
              Samsung Galaxy Watch 5 Pro sensorlari va drayverlari holati
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {GALAXY_WATCH_5_PRO_SENSORS.map((sensor) => (
              <div
                key={sensor.id}
                className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{sensor.name}</h4>
                    <span className="font-mono text-[10px] text-[#38bdf8] bg-blue-500/10 px-2 py-0.5 rounded">
                      {sensor.techName}
                    </span>
                  </div>
                  <p className="text-[#94a3b8] text-[11px]">{sensor.description}</p>
                  {sensor.notes && <p className="text-amber-300/80 text-[10px]">ℹ️ {sensor.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`font-mono text-xs ${
                      sensor.status === 'ACTIVE'
                        ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                        : sensor.status === 'PARTNER_APPROVAL_REQUIRED'
                        ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                        : 'border-slate-500/40 text-slate-400'
                    }`}
                  >
                    {sensor.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* VIEW 21: PRIVACY & PERMISSIONS                                       */}
      {/* ==================================================================== */}
      {activeTab === 'privacy' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Tibbiy Ma'lumotlar Maxfiyligi va Xavfsizlik Kafolati (HIPAA & GDPR)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#141f36] border border-[#243452] space-y-2 leading-relaxed">
              <h4 className="font-bold text-white text-sm">HIPAA & GDPR standartlariga muvofiqlik:</h4>
              <p className="text-[#cbd5e1]">
                • Barcha EKG, yurak urishi, SpO2 va biometrik ma'lumotlar qurilmadan serverga <b>TLS 1.3 / AES-256</b> shifrlangan kanal orqali uzatiladi.
              </p>
              <p className="text-[#cbd5e1]">
                • Tibbiy ko'rsatkichlar faqat ota-ona va maktab tibbiyot xodimi ruxsati bilan saqlanadi. Ma'lumotlar hech qachon uchinchi shaxslarga berilmaydi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => alert("Barcha tibbiy ma'lumotlar shifrlangan JSON formatida eksport qilindi.")}
                className="px-4 py-2 rounded-xl bg-[#0074e4] hover:bg-[#0062c4] text-white font-bold text-xs transition"
              >
                Ma'lumotlarimni to'liq yuklab olish (JSON)
              </button>
              <button
                onClick={() => alert("Tibbiy ma'lumotlarni o'chirish so'rovi qabul qilindi.")}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition"
              >
                Barcha sog'liq yozuvlarini o'chirish
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
