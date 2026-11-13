import React, { useState, useMemo } from 'react';
import { Student } from '@/types';
import {
  TimeRangeFilter,
  AiAssistantMessage
} from '@/types/health';
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
  CheckCircle2
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

type HealthNavTab =
  | 'overview'
  | 'heart'
  | 'ecg'
  | 'spo2'
  | 'bp'
  | 'sleep'
  | 'stress'
  | 'body_comp'
  | 'ai_assistant'
  | 'reports'
  | 'notifications'
  | 'device'
  | 'privacy';

export const AiHealthGuard: React.FC<AiHealthGuardProps> = ({ students, initialStudentId }) => {
  // 1. Selected Student
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

  // 2. Active Tab & Time Range
  const [activeTab, setActiveTab] = useState<HealthNavTab>('overview');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('24H');

  // 3. Computed Health Profile & Time Series
  const profile = useMemo(() => {
    return getHealthProfileForStudent(activeStudent);
  }, [activeStudent]);

  const timeSeries = useMemo(() => {
    return getTimeSeriesData(timeRange, profile.heartRate.currentBpm);
  }, [timeRange, profile.heartRate.currentBpm]);

  // 4. AI Assistant Chat State
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
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  // Status Badge Colors
  const alertColorMap = {
    GREEN: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    YELLOW: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    ORANGE: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
    RED: 'border-rose-500/40 bg-rose-500/10 text-rose-400 animate-pulse'
  };

  return (
    <div className="space-y-6 text-[#e2e8f0]">
      {/* ==================================================================== */}
      {/* HEADER SECTION: PLATFORM TITLE & STUDENT SELECTOR                    */}
      {/* ==================================================================== */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0d1527] border border-[#1e293b] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0074e4] to-[#00b4d8] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Heart className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                AI HEALTH GUARD
                <Badge className="bg-[#0074e4]/20 text-[#38bdf8] border-[#0074e4]/40 text-[10px] font-mono">
                  Galaxy Watch 5 Pro Edition
                </Badge>
              </h1>
              <p className="text-xs text-[#94a3b8]">
                Sun'iy intellekt asosida ko'p parametrli tibbiy va fiziologik monitoring platformasi
              </p>
            </div>
          </div>
        </div>

        {/* Student Selector & Real/Demo Pill */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
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
            {profile.isRealDevice ? 'Jonli Telemetriya (Real Device)' : 'Demo Simulyatsiya'}
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
          <span>
            <b>Tibbiy ogohlantirish (Medical Disclaimer):</b> AI Health Guard klinik tashxis vositasi emas. Barcha o'lchovlar axborot va wellness maqsadlarida ko'rsatiladi. Ko'krak qafasida og'riq yoki o'tkir holsizlikda darhol <b>103 Tez tibbiy yordam</b>ga murojaat qiling.
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-500/40 hidden md:inline-flex">
          103 Shoshilinch
        </Badge>
      </div>

      {/* ==================================================================== */}
      {/* MAIN NAVIGATION TABS (ALL 13 MODULES)                                */}
      {/* ==================================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#1e293b] scrollbar-none text-xs font-medium">
        {[
          { id: 'overview', label: 'Umumiy Ko\'rinish', icon: Activity },
          { id: 'heart', label: 'Yurak Salomatligi', icon: Heart },
          { id: 'ecg', label: 'EKG Tahlili', icon: Zap },
          { id: 'spo2', label: 'Qondagi Kislorod', icon: Radio },
          { id: 'bp', label: 'Qon Bosimi', icon: Layers },
          { id: 'sleep', label: 'Uyqu Tahlili', icon: Moon },
          { id: 'stress', label: 'Stress va Tiklanish', icon: Sparkles },
          { id: 'body_comp', label: 'Tana Tarkibi (BIA)', icon: Activity },
          { id: 'ai_assistant', label: 'AI Tibbiy Yordamchi', icon: Cpu },
          { id: 'reports', label: 'Tibbiy Hisobotlar', icon: FileText },
          { id: 'notifications', label: 'Ogohlantirishlar', icon: Bell },
          { id: 'device', label: 'Qurilma Ulanishi', icon: Watch },
          { id: 'privacy', label: 'Maxfiylik va Ruxsatlar', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as HealthNavTab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0074e4] text-white font-bold shadow-md shadow-blue-500/20'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TIME RANGE SELECTOR (FOR HISTORICAL CHARTS)                          */}
      {/* ==================================================================== */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-[#94a3b8] flex items-center gap-2">
          <span>Oxirgi yangilanish: <b className="text-white">{new Date(profile.lastUpdated).toLocaleTimeString('uz-UZ')}</b></span>
          <span>•</span>
          <span>Manba: <span className="font-mono text-[#38bdf8]">{profile.heartRate.source}</span></span>
        </div>

        <div className="flex items-center gap-1 bg-[#141f36] p-1 rounded-xl border border-[#243452] text-xs font-semibold">
          {(['24H', '7D', '30D', '90D'] as TimeRangeFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-lg transition ${
                timeRange === r
                  ? 'bg-[#0074e4] text-white shadow'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: OVERVIEW DASHBOARD                                           */}
      {/* ==================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Heart Rate */}
            <Card className="bg-[#10192e] border-[#1e2d4a] hover:border-[#0074e4]/50 transition-all cursor-pointer" onClick={() => setActiveTab('heart')}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span className="text-xs font-medium">Yurak Urishi</span>
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white font-mono">{profile.heartRate.currentBpm}</span>
                  <span className="text-xs text-[#94a3b8]">BPM</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.06]">
                  <span className="text-emerald-400">Tinch: {profile.heartRate.restingBpm} BPM</span>
                  <span className="text-[#94a3b8]">HRV: {profile.heartRate.hrvRmssdMs}ms</span>
                </div>
              </CardContent>
            </Card>

            {/* SpO2 */}
            <Card className="bg-[#10192e] border-[#1e2d4a] hover:border-[#0074e4]/50 transition-all cursor-pointer" onClick={() => setActiveTab('spo2')}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span className="text-xs font-medium">SpO2 Kislorod</span>
                  <Radio className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white font-mono">{profile.bloodOxygen.spo2Percentage}%</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.06]">
                  <span className="text-emerald-400">Me'yor (95-100%)</span>
                  <span className="text-[#94a3b8]">Min: {profile.bloodOxygen.minSpo2}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Blood Pressure */}
            <Card className="bg-[#10192e] border-[#1e2d4a] hover:border-[#0074e4]/50 transition-all cursor-pointer" onClick={() => setActiveTab('bp')}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span className="text-xs font-medium">Qon Bosimi</span>
                  <Layers className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white font-mono">
                    {profile.bloodPressure.systolic}/{profile.bloodPressure.diastolic}
                  </span>
                  <span className="text-xs text-[#94a3b8]">mm Hg</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.06]">
                  <span className="text-emerald-400">{profile.bloodPressure.category}</span>
                  <span className="text-[#94a3b8]">MAP: {profile.bloodPressure.meanArterialPressure}</span>
                </div>
              </CardContent>
            </Card>

            {/* Sleep Score */}
            <Card className="bg-[#10192e] border-[#1e2d4a] hover:border-[#0074e4]/50 transition-all cursor-pointer" onClick={() => setActiveTab('sleep')}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span className="text-xs font-medium">Uyqu Sifati</span>
                  <Moon className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white font-mono">{profile.sleep.sleepScore}</span>
                  <span className="text-xs text-[#94a3b8]">/ 100</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.06]">
                  <span className="text-purple-400">{Math.floor(profile.sleep.totalMinutes / 60)}s {profile.sleep.totalMinutes % 60}d</span>
                  <span className="text-emerald-400">{profile.sleep.efficiencyPercentage}% samarali</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Risk Assessment Card */}
          <Card className="bg-[#10192e] border-[#1e2d4a]">
            <CardHeader className="p-4 pb-2 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#0074e4]" />
                  AI Tibbiy Xavf Baholashi (Intelligent Health Assessment)
                </CardTitle>
                <Badge variant="outline" className={`font-mono text-xs ${alertColorMap[profile.aiAssessment.level]}`}>
                  {profile.aiAssessment.level} rejim
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#141f36] border border-[#243452]">
                <h4 className="font-bold text-sm text-white mb-1">{profile.aiAssessment.title}</h4>
                <p className="text-xs text-[#cbd5e1] leading-relaxed">{profile.aiAssessment.summary}</p>
              </div>

              {/* Module Findings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {profile.aiAssessment.findings.map((f) => (
                  <div key={f.id} className="p-3 rounded-xl bg-[#0b1222] border border-[#1e293b] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{f.metricName}</span>
                      <span className="font-mono text-[#38bdf8] font-bold">{f.currentValue}</span>
                    </div>
                    <p className="text-[#94a3b8] text-[11px]">{f.explanation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interactive Trend Chart */}
          <Card className="bg-[#10192e] border-[#1e2d4a]">
            <CardHeader className="p-4 pb-2 border-b border-white/[0.06] flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0074e4]" />
                Ko'p parametrli dinamik tendensiya ({timeRange})
              </CardTitle>
              <span className="text-xs text-[#94a3b8]">Yurak urishi va SpO2 korrelyatsiyasi</span>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis yAxisId="left" domain={[50, 140]} stroke="#f43f5e" fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" domain={[90, 100]} stroke="#06b6d4" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="bpm" name="Puls (BPM)" stroke="#f43f5e" fillOpacity={1} fill="url(#colorBpm)" strokeWidth={2} />
                    <Area yAxisId="right" type="monotone" dataKey="spo2" name="SpO2 (%)" stroke="#06b6d4" fillOpacity={1} fill="url(#colorSpo2)" strokeWidth={2} />
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-[#94a3b8]">Tinch holatdagi puls (Resting HR)</span>
                <div className="text-3xl font-black text-white font-mono">{profile.heartRate.restingBpm} <span className="text-sm font-normal text-[#94a3b8]">BPM</span></div>
                <span className="text-xs text-emerald-400">Yosh toifasi me'yorida (60-80)</span>
              </CardContent>
            </Card>
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-[#94a3b8]">Yurak ritmi o'zgaruvchanligi (HRV)</span>
                <div className="text-3xl font-black text-cyan-400 font-mono">{profile.heartRate.hrvRmssdMs} <span className="text-sm font-normal text-[#94a3b8]">ms (rMSSD)</span></div>
                <span className="text-xs text-cyan-400">Parasimpato-vagal tonus yaxshi</span>
              </CardContent>
            </Card>
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-[#94a3b8]">Kunlik oralig'i (Min / Max)</span>
                <div className="text-3xl font-black text-rose-400 font-mono">
                  {profile.heartRate.minBpm} - {profile.heartRate.maxBpm} <span className="text-sm font-normal text-[#94a3b8]">BPM</span>
                </div>
                <span className="text-xs text-emerald-400">Fiziologik adaptatsiya me'yorda</span>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#10192e] border-[#1e2d4a]">
            <CardHeader className="p-4 pb-2 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Yurak urishi dinamikasi ({timeRange})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis domain={[50, 140]} stroke="#f43f5e" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="bpm" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', r: 3 }} name="Puls (BPM)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 3: ECG ANALYSIS                                                 */}
      {/* ==================================================================== */}
      {activeTab === 'ecg' && (
        <div className="space-y-6">
          <Card className="bg-[#10192e] border-[#1e2d4a]">
            <CardHeader className="p-4 pb-2 border-b border-white/[0.06] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Elektrokardiogramma (ECG Lead I Waveform)
                </CardTitle>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Samsung Galaxy Watch 5 Pro bioelektrik sensori (250 Hz namuna chastotasi)
                </p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-mono text-xs">
                {profile.ecg.rhythmType} (96% aniqlik)
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* ECG Graph Canvas Simulator */}
              <div className="h-44 w-full bg-[#050811] rounded-xl p-2 border border-[#1b263b] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profile.ecg.leadI.map((val, idx) => ({ idx, val }))}>
                    <YAxis domain={[-0.6, 1.6]} hide />
                    <Line type="monotone" dataKey="val" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* ECG Intervals Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#141f36] border border-[#243452]">
                  <span className="text-[#94a3b8]">O'rtacha Puls</span>
                  <div className="text-lg font-black text-white font-mono">{profile.ecg.averageBpm} BPM</div>
                </div>
                <div className="p-3 rounded-xl bg-[#141f36] border border-[#243452]">
                  <span className="text-[#94a3b8]">QTc Interval</span>
                  <div className="text-lg font-black text-white font-mono">{profile.ecg.qtcIntervalMs} ms</div>
                  <span className="text-[10px] text-emerald-400">Me'yorda (&lt;450 ms)</span>
                </div>
                <div className="p-3 rounded-xl bg-[#141f36] border border-[#243452]">
                  <span className="text-[#94a3b8]">PR Interval</span>
                  <div className="text-lg font-black text-white font-mono">{profile.ecg.prIntervalMs} ms</div>
                  <span className="text-[10px] text-emerald-400">Me'yorda (120-200 ms)</span>
                </div>
                <div className="p-3 rounded-xl bg-[#141f36] border border-[#243452]">
                  <span className="text-[#94a3b8]">Afib Tahlili</span>
                  <div className="text-lg font-black text-emerald-400">ANIQLANMADI</div>
                  <span className="text-[10px] text-[#94a3b8]">Fibrillyatsiya yo'q</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 4: BLOOD OXYGEN (SPO2)                                          */}
      {/* ==================================================================== */}
      {activeTab === 'spo2' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-[#94a3b8]">Hozirgi SpO2</span>
                <div className="text-3xl font-black text-cyan-400 font-mono">{profile.bloodOxygen.spo2Percentage}%</div>
                <span className="text-xs text-emerald-400">Oksigenatsiya a'lo darajada</span>
              </CardContent>
            </Card>
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-[#94a3b8]">Tungi eng past SpO2</span>
                <div className="text-3xl font-black text-white font-mono">{profile.bloodOxygen.lowestNightSpo2}%</div>
                <span className="text-xs text-emerald-400">Gipoksiya kuzatilmadi (&gt;90%)</span>
              </CardContent>
            </Card>
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-[#94a3b8]">Tungi desaturatsiyalar</span>
                <div className="text-3xl font-black text-white font-mono">{profile.bloodOxygen.nocturnalDipsCount} <span className="text-sm font-normal text-[#94a3b8]">marta</span></div>
                <span className="text-xs text-emerald-400">Me'yoriy chegarada (&lt;5)</span>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#10192e] border-[#1e2d4a]">
            <CardHeader className="p-4 pb-2 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                SpO2 va gipoksiya monitoringi ({timeRange})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis domain={[90, 100]} stroke="#06b6d4" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="spo2" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} name="SpO2 (%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 5: BLOOD PRESSURE                                               */}
      {/* ==================================================================== */}
      {activeTab === 'bp' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-[#94a3b8]">Oxirgi ko'rsatkich</span>
                <div className="text-3xl font-black text-indigo-400 font-mono">
                  {profile.bloodPressure.systolic}/{profile.bloodPressure.diastolic} <span className="text-sm font-normal text-[#94a3b8]">mm Hg</span>
                </div>
                <span className="text-xs text-emerald-400">{profile.bloodPressure.category} (AHA)</span>
              </CardContent>
            </Card>
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-[#94a3b8]">O'rtacha arterial bosim (MAP)</span>
                <div className="text-3xl font-black text-white font-mono">{profile.bloodPressure.meanArterialPressure} <span className="text-sm font-normal text-[#94a3b8]">mm Hg</span></div>
                <span className="text-xs text-emerald-400">Organlar perfuziyasi optimal</span>
              </CardContent>
            </Card>
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-[#94a3b8]">Soat kalibratsiyasi</span>
                <div className="text-lg font-bold text-white mt-1">Faol va Tasdiqlangan</div>
                <span className="text-xs text-[#94a3b8]">Oxirgi kalibratsiya: {profile.bloodPressure.calibrationDate}</span>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#10192e] border-[#1e2d4a]">
            <CardHeader className="p-4 pb-2 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Sistolik va diastolik bosim tendensiyasi ({timeRange})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis domain={[50, 160]} stroke="#6366f1" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Bar dataKey="systolic" name="Sistolik (mm Hg)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="diastolic" name="Diastolik (mm Hg)" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 6: SLEEP ANALYSIS                                               */}
      {/* ==================================================================== */}
      {activeTab === 'sleep' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-[#94a3b8]">Umumiy Uyqu</span>
                <div className="text-2xl font-black text-purple-400 font-mono">
                  {Math.floor(profile.sleep.totalMinutes / 60)}s {profile.sleep.totalMinutes % 60}d
                </div>
                <span className="text-xs text-emerald-400">Me'yor (8-9 soat)</span>
              </CardContent>
            </Card>
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-[#94a3b8]">Chuqur Uyqu (Deep)</span>
                <div className="text-2xl font-black text-white font-mono">{profile.sleep.deepMinutes} <span className="text-xs text-[#94a3b8]">daqiqa</span></div>
                <span className="text-xs text-purple-400">{Math.round((profile.sleep.deepMinutes / profile.sleep.totalMinutes) * 100)}% ulush</span>
              </CardContent>
            </Card>
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-[#94a3b8]">REM Fazasi</span>
                <div className="text-2xl font-black text-white font-mono">{profile.sleep.remMinutes} <span className="text-xs text-[#94a3b8]">daqiqa</span></div>
                <span className="text-xs text-cyan-400">Kognitiv tiklanish yaxshi</span>
              </CardContent>
            </Card>
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-[#94a3b8]">Uyqu Apnoe Xavfi</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">{profile.sleep.apneaRiskIndicator}</div>
                <span className="text-xs text-[#94a3b8]">AHI &lt; 5 hodisa/soat</span>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 7: STRESS & RECOVERY                                            */}
      {/* ==================================================================== */}
      {activeTab === 'stress' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-5 space-y-3">
                <span className="text-xs text-[#94a3b8]">Stress Ko'rsatkichi</span>
                <div className="text-4xl font-black text-emerald-400 font-mono">{profile.stressRecovery.stressScore} <span className="text-base text-[#94a3b8]">/ 100</span></div>
                <p className="text-xs text-[#94a3b8]">
                  Avtonom asab tizimi simpatik va parasimpatik muvozanatda. Bola dars va mashg'ulotlarda o'zini erkin his qilmoqda.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#10192e] border-[#1e2d4a]">
              <CardContent className="p-5 space-y-3">
                <span className="text-xs text-[#94a3b8]">Tiklanish Sifati (Recovery Score)</span>
                <div className="text-4xl font-black text-cyan-400 font-mono">{profile.stressRecovery.recoveryScore} <span className="text-base text-[#94a3b8]">/ 100</span></div>
                <p className="text-xs text-[#94a3b8]">
                  O'tgan tungi uyqu va tanaffuslardagi dam olish samaradorligi tufayli tana to'liq quvvatga to'lgan.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 8: BODY COMPOSITION (BIA)                                       */}
      {/* ==================================================================== */}
      {activeTab === 'body_comp' && (
        <div className="space-y-6">
          <Card className="bg-[#10192e] border-[#1e2d4a]">
            <CardHeader className="p-4 pb-2 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Samsung BioActive BIA Tana Tarkibi Tahlili
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-xs text-[#94a3b8]">Tana Yog'i (Body Fat)</span>
                <div className="text-2xl font-black text-white font-mono">{profile.bodyComposition.bodyFatPercentage}%</div>
                <span className="text-[11px] text-emerald-400">Me'yorda (14-20%)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-xs text-[#94a3b8]">Skelet Mushagi</span>
                <div className="text-2xl font-black text-white font-mono">{profile.bodyComposition.skeletalMuscleKg} kg</div>
                <span className="text-[11px] text-emerald-400">Jismoniy rivojlangan</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-xs text-[#94a3b8]">Tana Suyuqligi</span>
                <div className="text-2xl font-black text-white font-mono">{profile.bodyComposition.bodyWaterPercentage}%</div>
                <span className="text-[11px] text-cyan-400">Gidratatsiya yetarli</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141f36] border border-[#243452]">
                <span className="text-xs text-[#94a3b8]">Tana Massasi Indeksi (BMI)</span>
                <div className="text-2xl font-black text-white font-mono">{profile.bodyComposition.bmi}</div>
                <span className="text-[11px] text-emerald-400">Normal vazn</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 9: AI MEDICAL ASSISTANT (INTERACTIVE CHAT)                      */}
      {/* ==================================================================== */}
      {activeTab === 'ai_assistant' && (
        <div className="space-y-4">
          <Card className="bg-[#10192e] border-[#1e2d4a]">
            <CardHeader className="p-4 pb-2 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0074e4]" />
                Interaktiv AI Tibbiy Yordamchi (Galaxy Watch 5 Pro Data Assistant)
              </CardTitle>
              <p className="text-xs text-[#94a3b8]">
                {activeStudent.name}ning barcha haqiqiy o'lchovlari bo'yicha sun'iy intellektdan tezkor maslahat oling.
              </p>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Pre-built Prompt Chips */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  'Yurak urishi nega baland?',
                  'SpO2 ko\'rsatkichi nimani anglatadi?',
                  'Uyqu sifati va tiklanish qanday?',
                  'Qon bosimi me\'yordami?',
                  'Shifokorga qaysi ko\'rsatkichlarni aytishim kerak?'
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-3 py-1.5 rounded-lg bg-[#141f36] hover:bg-[#1e2d4a] text-[#38bdf8] border border-[#243452] transition flex items-center gap-1.5"
                  >
                    <span>{prompt}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ))}
              </div>

              {/* Chat Thread */}
              <div className="h-80 overflow-y-auto space-y-3 p-3 bg-[#080d19] rounded-xl border border-[#1b263b] scrollbar-thin">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                        msg.sender === 'user'
                          ? 'bg-[#0074e4] text-white rounded-tr-none'
                          : 'bg-[#141f36] text-[#e2e8f0] border border-[#243452] rounded-tl-none'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Metric References */}
                      {msg.referencedMetrics && msg.referencedMetrics.length > 0 && (
                        <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px]">
                          {msg.referencedMetrics.map((rm, idx) => (
                            <div key={idx} className="p-1.5 rounded bg-black/20">
                              <span className="text-[#94a3b8]">{rm.label}:</span> <b className="text-white">{rm.value}</b>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.disclaimer && (
                        <div className="text-[10px] text-amber-300/80 italic pt-1">
                          ⚠️ {msg.disclaimer}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-[#64748b] mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}
              </div>

              {/* Chat Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Bolaning salomatligi yoki o'lchovlari haqida savol bering..."
                  className="flex-1 bg-[#141f36] border border-[#243452] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#0074e4]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#0074e4] hover:bg-[#0062c4] text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Yuborish</span>
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 10: MEDICAL REPORTS (PRINTABLE & EXPORTABLE)                     */}
      {/* ==================================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-[#141f36] p-1 rounded-xl border border-[#243452] text-xs font-semibold">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setReportPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    reportPeriod === p ? 'bg-[#0074e4] text-white' : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {p === 'DAILY' ? 'Kunlik' : p === 'WEEKLY' ? 'Haftalik' : 'Oylik'}
                </button>
              ))}
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-[#141f36] hover:bg-[#1e2d4a] text-white border border-[#243452] text-xs font-bold flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4 text-[#38bdf8]" />
              <span>Chop etish / PDF Saqlash</span>
            </button>
          </div>

          <Card className="bg-[#10192e] border-[#1e2d4a]">
            <CardHeader className="p-6 border-b border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">TIBBIY VA FIZIOLOGIK XULOSA HISOBOTI</h2>
                  <p className="text-xs text-[#94a3b8]">Hujjat raqami: {currentReport.id} • Sana: {currentReport.generatedAt}</p>
                </div>
                <Badge className={`font-mono ${alertColorMap[currentReport.overallStatus]}`}>
                  Status: {currentReport.overallStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-xs">
              <p className="text-[#cbd5e1] leading-relaxed p-4 rounded-xl bg-[#141f36] border border-[#243452]">
                {currentReport.summaryText}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#0b1222] border border-[#1e293b] space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    1. Kardiologik Ko'rsatkichlar
                  </h4>
                  <ul className="space-y-1 text-[#94a3b8]">
                    <li>• O'rtacha puls: <b className="text-white">{currentReport.heartHealthSection.avgBpm} BPM</b></li>
                    <li>• Tinch holatdagi puls: <b className="text-white">{currentReport.heartHealthSection.restingBpm} BPM</b></li>
                    <li>• HRV (rMSSD): <b className="text-white">{currentReport.heartHealthSection.hrvAvg} ms</b></li>
                    <li>• Aritmiya hodisalari: <b className="text-emerald-400">0 ta (Norma)</b></li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#0b1222] border border-[#1e293b] space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    2. Oksigenatsiya va Qon Bosimi
                  </h4>
                  <ul className="space-y-1 text-[#94a3b8]">
                    <li>• O'rtacha SpO2: <b className="text-white">{currentReport.oxygenSection.avgSpo2}%</b></li>
                    <li>• Tungi desaturatsiyalar: <b className="text-emerald-400">{currentReport.oxygenSection.nocturnalEvents} ta</b></li>
                    <li>• O'rtacha qon bosimi: <b className="text-white">{currentReport.bloodPressureSection.avgSystolic}/{currentReport.bloodPressureSection.avgDiastolic} mm Hg</b></li>
                    <li>• Toifa: <b className="text-emerald-400">{currentReport.bloodPressureSection.category}</b></li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141f36] border border-[#243452] space-y-2">
                <h4 className="font-bold text-white">Shifokor va Ekspert Xulosasi:</h4>
                <p className="text-[#94a3b8] italic">{currentReport.doctorReviewNotes}</p>
                <div className="pt-4 flex items-center justify-between text-[11px] text-[#64748b]">
                  <span>AI Health Guard avtomatlashtirilgan klinik tahlilchi</span>
                  <span>Imzo / Tasdiq: _______________________</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 11: NOTIFICATIONS & THRESHOLDS                                  */}
      {/* ==================================================================== */}
      {activeTab === 'notifications' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Tibbiy chegara ko'rsatkichlari va ogohlantirish sozlamalari
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#141f36]">
              <div>
                <h4 className="font-bold text-white">Tezkor ogohlantirishlar (Alerts)</h4>
                <p className="text-[11px] text-[#94a3b8]">Chegaradan chiqqanda ota-ona va maktab hamshirasiga SMS va push-xabar yuborish</p>
              </div>
              <input
                type="checkbox"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#0074e4]"
              />
            </div>

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
      {/* VIEW 12: DEVICE CONNECTION (GALAXY WATCH 5 PRO SENSORS)               */}
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
      {/* VIEW 13: PRIVACY & PERMISSIONS                                       */}
      {/* ==================================================================== */}
      {activeTab === 'privacy' && (
        <Card className="bg-[#10192e] border-[#1e2d4a]">
          <CardHeader className="p-4 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Tibbiy Ma'lumotlar Maxfiyligi va Xavfsizlik Kafolati
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
