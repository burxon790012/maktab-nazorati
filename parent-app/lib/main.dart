import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const SmartChildParentApp());
}

class SmartChildParentApp extends StatefulWidget {
  const SmartChildParentApp({super.key});

  @override
  State<SmartChildParentApp> createState() => _SmartChildParentAppState();
}

class _SmartChildParentAppState extends State<SmartChildParentApp> {
  ThemeMode _themeMode = ThemeMode.dark;
  String _currentLang = 'uz'; // 'uz', 'ru', 'en'

  void _toggleTheme() {
    setState(() {
      _themeMode = _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    });
  }

  void _changeLang(String lang) {
    setState(() {
      _currentLang = lang;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SMART CHILD — Ota-ona',
      debugShowCheckedModeBanner: false,
      themeMode: _themeMode,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF2563EB),
          secondary: Color(0xFF10B981),
          surface: Color(0xFFFFFFFF),
          error: Color(0xFFEF4444),
        ),
        fontFamily: 'Roboto',
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0A0F1D),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF3B82F6),
          secondary: Color(0xFF10B981),
          surface: Color(0xFF131C31),
          error: Color(0xFFEF4444),
        ),
        fontFamily: 'Roboto',
        useMaterial3: true,
      ),
      home: ParentMainScreen(
        onToggleTheme: _toggleTheme,
        onChangeLang: _changeLang,
        currentLang: _currentLang,
        isDark: _themeMode == ThemeMode.dark,
      ),
    );
  }
}

class ParentMainScreen extends StatefulWidget {
  final VoidCallback onToggleTheme;
  final Function(String) onChangeLang;
  final String currentLang;
  final bool isDark;

  const ParentMainScreen({
    super.key,
    required this.onToggleTheme,
    required this.onChangeLang,
    required this.currentLang,
    required this.isDark,
  });

  @override
  State<ParentMainScreen> createState() => _ParentMainScreenState();
}

class _ParentMainScreenState extends State<ParentMainScreen> {
  int _currentIndex = 0;

  // Active child state (Ali Valiyev - SCH001)
  String childId = "10001";
  String childName = "Ali Valiyev";
  String uniqueCode = "10001";
  String schoolId = "SCH001";
  String schoolName = "1-Sonli Namunaviy Maktab";
  String childClass = "5-B Sinf";

  // Telemetry & GPS State
  LatLng childPosition = const LatLng(41.311120, 69.240610);
  double childHeading = 45.0;
  double childSpeed = 1.2;
  String geofenceStatus = "INSIDE"; // "INSIDE" or "OUTSIDE"
  String statusDisplay = "PRESENT – INSIDE SCHOOL";
  Color statusColor = Colors.green;
  bool isSos = false;
  int batteryLevel = 89;
  int heartRate = 78;
  double bodyTemperature = 36.6;
  int stepCount = 3410;
  bool isOnline = true;
  String lastSyncTime = "Hozirgina";

  // School Geofence boundary
  final List<LatLng> schoolPolygon = [
    const LatLng(41.312400, 69.238800),
    const LatLng(41.312400, 69.242300),
    const LatLng(41.309700, 69.242300),
    const LatLng(41.309700, 69.238800),
  ];

  // Route playback history
  List<LatLng> routePoints = [
    const LatLng(41.305000, 69.235000),
    const LatLng(41.306500, 69.236800),
    const LatLng(41.308800, 69.238500),
    const LatLng(41.311120, 69.240610),
  ];

  // Attendance history
  List<Map<String, dynamic>> attendanceHistory = [
    {"date": "Bugun", "status": "PRESENT", "arrival": "08:18", "departure": null},
    {"date": "Kecha", "status": "PRESENT", "arrival": "08:24", "departure": "13:35"},
    {"date": "29-Oktabr", "status": "LATE", "arrival": "08:42", "departure": "13:30"},
    {"date": "28-Oktabr", "status": "PRESENT", "arrival": "08:15", "departure": "13:30"},
  ];

  // Safe zones list
  List<Map<String, dynamic>> safeZones = [
    {"name": "21-Maktab", "type": "SAFE", "radius": 250, "lat": 41.311081, "lng": 69.240562},
    {"name": "Uy (Chilonzor)", "type": "SAFE", "radius": 150, "lat": 41.305000, "lng": 69.235000},
    {"name": "Dzyudo / Sport majmuasi", "type": "SAFE", "radius": 180, "lat": 41.298500, "lng": 69.220100},
  ];

  Timer? _pollingTimer;

  // Server endpoint (supports emulator 10.0.2.2 or public backend)
  String serverBaseUrl = "http://10.0.2.2:3000";

  @override
  void initState() {
    super.initState();
    _startLivePolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  void _startLivePolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (_) => _syncFromServer());
  }

  Future<void> _syncFromServer() async {
    try {
      final res = await http.get(Uri.parse("$serverBaseUrl/api/v1/students/$childId")).timeout(const Duration(seconds: 3));
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data['success'] == true && data['telemetry'] != null) {
          final t = data['telemetry'];
          setState(() {
            childPosition = LatLng(t['latitude']?.toDouble() ?? childPosition.latitude, t['longitude']?.toDouble() ?? childPosition.longitude);
            childHeading = (t['heading'] ?? 0).toDouble();
            childSpeed = (t['speed'] ?? 0.0).toDouble();
            geofenceStatus = t['geofenceStatus'] ?? geofenceStatus;
            statusDisplay = t['statusDisplay'] ?? (geofenceStatus == "INSIDE" ? "PRESENT – INSIDE SCHOOL" : "LEFT SCHOOL – OUTSIDE SCHOOL");
            statusColor = (t['statusColor'] == "GREEN" || geofenceStatus == "INSIDE") ? Colors.green : Colors.red;
            isSos = t['isSos'] ?? false;
            batteryLevel = t['batteryLevel'] ?? batteryLevel;
            heartRate = t['heartRate'] ?? heartRate;
            bodyTemperature = (t['bodyTemperature'] ?? bodyTemperature).toDouble();
            stepCount = t['stepCount'] ?? stepCount;
            isOnline = true;
            lastSyncTime = "${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}";
          });
        }
      }
    } catch (_) {
      // Offline fallback
      setState(() {
        isOnline = false;
      });
    }
  }

  String _t(String key) {
    final Map<String, Map<String, String>> dict = {
      "uz": {
        "nav_map": "Xarita",
        "nav_health": "Salomatlik",
        "nav_att": "Davomat",
        "nav_zones": "Hududlar",
        "nav_profile": "Profil",
        "inside_school": "Maktab hududida",
        "outside_school": "Maktabdan tashqarida",
        "battery": "Batareya",
        "bpm": "Yurak urishi",
        "temp": "Tana harorati",
        "steps": "Qadamlar",
        "sos_alert": "🚨 FAVQULODDA SOS SIGNALI!",
        "history": "Harakat Tarixi",
        "add_zone": "Yangi Hudud Qo'shish",
        "pair_child": "Bolani Ulash (ID orqali)"
      },
      "ru": {
        "nav_map": "Карта",
        "nav_health": "Здоровье",
        "nav_att": "Посещаемость",
        "nav_zones": "Геозоны",
        "nav_profile": "Профиль",
        "inside_school": "В школе",
        "outside_school": "Вне школы",
        "battery": "Батарея",
        "bpm": "Пульс",
        "temp": "Температура",
        "steps": "Шаги",
        "sos_alert": "🚨 СИГНАЛ SOS ТРЕВОГА!",
        "history": "История Движения",
        "add_zone": "Добавить Зону",
        "pair_child": "Привязать Ребенка (ID)"
      },
      "en": {
        "nav_map": "Map",
        "nav_health": "Health",
        "nav_att": "Attendance",
        "nav_zones": "Zones",
        "nav_profile": "Profile",
        "inside_school": "Inside School",
        "outside_school": "Outside School",
        "battery": "Battery",
        "bpm": "Heart Rate",
        "temp": "Temperature",
        "steps": "Steps",
        "sos_alert": "🚨 EMERGENCY SOS ALERT!",
        "history": "Movement History",
        "add_zone": "Add New Zone",
        "pair_child": "Pair Child by ID"
      }
    };
    return dict[widget.currentLang]?[key] ?? key;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              childName,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Row(
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: isOnline ? Colors.green : Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  "$childClass • $schoolName ($schoolId) • ID: $uniqueCode",
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(widget.isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: widget.onToggleTheme,
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.language),
            onSelected: widget.onChangeLang,
            itemBuilder: (ctx) => [
              const PopupMenuItem(value: 'uz', child: Text("🇺🇿 O'zbekcha")),
              const PopupMenuItem(value: 'ru', child: Text("🇷🇺 Русский")),
              const PopupMenuItem(value: 'en', child: Text("🇬🇧 English")),
            ],
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildMapTab(),
          _buildHealthTab(),
          _buildAttendanceTab(),
          _buildSafeZonesTab(),
          _buildProfileTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.map_outlined),
            selectedIcon: const Icon(Icons.map),
            label: _t('nav_map'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.favorite_border),
            selectedIcon: const Icon(Icons.favorite),
            label: _t('nav_health'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.fact_check_outlined),
            selectedIcon: const Icon(Icons.fact_check),
            label: _t('nav_att'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.security_outlined),
            selectedIcon: const Icon(Icons.security),
            label: _t('nav_zones'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline),
            selectedIcon: const Icon(Icons.person),
            label: _t('nav_profile'),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 1: LIVE GPS MAP
  // ==========================================
  Widget _buildMapTab() {
    final bool isInside = geofenceStatus == "INSIDE";
    return Stack(
      children: [
        FlutterMap(
          options: MapOptions(
            initialCenter: childPosition,
            initialZoom: 16.0,
          ),
          children: [
            TileLayer(
              urlTemplate: widget.isDark
                  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                  : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'uz.maktab.smartchild',
            ),
            // School geofence polygon
            PolygonLayer(
              polygons: [
                Polygon(
                  points: schoolPolygon,
                  color: Colors.blue.withOpacity(0.18),
                  borderColor: Colors.blue,
                  borderStrokeWidth: 2.0,
                  isDotted: true,
                ),
              ],
            ),
            // Movement route trail
            PolylineLayer(
              polylines: [
                Polyline(
                  points: routePoints,
                  color: Colors.cyanAccent.withOpacity(0.7),
                  strokeWidth: 3.5,
                ),
              ],
            ),
            // Live Child Marker
            MarkerLayer(
              markers: [
                Marker(
                  point: childPosition,
                  width: 55,
                  height: 55,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: (isSos ? Colors.red : (isInside ? Colors.green : Colors.orange)).withOpacity(0.3),
                        ),
                      ),
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isSos ? Colors.red : (isInside ? Colors.green : Colors.orange),
                          border: Border.all(color: Colors.white, width: 2.5),
                          boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 6)],
                        ),
                        child: const Icon(Icons.face, color: Colors.white, size: 22),
                      ),
                      Positioned(
                        top: 0,
                        right: 0,
                        child: Transform.rotate(
                          angle: childHeading * (3.14159 / 180),
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            decoration: const BoxDecoration(
                              color: Colors.black,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.navigation, color: Colors.yellow, size: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),

        // SOS Alert Banner if triggered
        if (isSos)
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.red.shade900,
                borderRadius: BorderRadius.circular(12),
                boxShadow: const [BoxShadow(color: Colors.red, blurRadius: 10)],
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning, color: Colors.white, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _t('sos_alert'),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          ),

        // Quick Telemetry Floating Card
        Positioned(
          bottom: 16,
          left: 16,
          right: 16,
          child: Card(
            elevation: 6,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _metricMiniItem(Icons.location_on, isInside ? "PRESENT – INSIDE" : "LEFT – OUTSIDE", statusColor),
                  _metricMiniItem(Icons.favorite, "$heartRate BPM", Colors.redAccent),
                  _metricMiniItem(Icons.thermostat, "${bodyTemperature.toStringAsFixed(1)}°C", Colors.blue),
                  _metricMiniItem(Icons.battery_charging_full, "$batteryLevel%", Colors.green),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _metricMiniItem(IconData icon, String val, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(val, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
      ],
    );
  }

  // ==========================================
  // TAB 2: HEALTH MONITORING (BPM, TEMP, BATTERY)
  // ==========================================
  Widget _buildHealthTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "${childName}ning Sog'liq Ko'rsatkichlari",
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          const Text("Samsung Galaxy Watch5 Pro biosensor ma'lumotlari", style: TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 16),

          // Heart Rate Card
          _buildHealthCard(
            title: _t('bpm'),
            value: "$heartRate",
            unit: "urish / daqiqa",
            icon: Icons.favorite,
            color: Colors.redAccent,
            subtitle: heartRate > 100 ? "⚠️ Yuqori puls qayd etildi" : "✅ Normal holat (60-95 BPM)",
          ),

          const SizedBox(height: 12),

          // Temperature Card
          _buildHealthCard(
            title: _t('temp'),
            value: "${bodyTemperature.toStringAsFixed(1)}",
            unit: "°C",
            icon: Icons.thermostat,
            color: Colors.blueAccent,
            subtitle: bodyTemperature > 37.5 ? "⚠️ Tana harorati yuqori!" : "✅ Normal harorat (36.6°C)",
          ),

          const SizedBox(height: 12),

          // Battery & Charging Card
          _buildHealthCard(
            title: _t('battery'),
            value: "$batteryLevel",
            unit: "%",
            icon: Icons.battery_charging_full,
            color: batteryLevel < 20 ? Colors.red : Colors.green,
            subtitle: "Taxminiy ishlash vaqti: ~18 soat",
          ),

          const SizedBox(height: 12),

          // Step count
          _buildHealthCard(
            title: _t('steps'),
            value: "$stepCount",
            unit: "qadam",
            icon: Icons.directions_walk,
            color: Colors.orangeAccent,
            subtitle: "Kunlik reja: 6,000 qadam (57% bajarildi)",
          ),
          const SizedBox(height: 16),

          // Medical Disclaimer Card (Section 8)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.blue.withOpacity(0.25)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline, color: Colors.blue, size: 22),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Tibbiy Ogohlantirish (Disclaimer):",
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.blue),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Smartwatch ko'rsatkichlari (puls, tana harorati) faqat bolalar xavfsizligi va jismoniy faolligini masofadan nazorat qilish uchun xizmat qiladi. Ushbu ma'lumotlar tibbiy tashxis (medical diagnosis) hisoblanmaydi.",
                        style: TextStyle(fontSize: 11, color: Colors.grey.shade400, height: 1.4),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthCard({
    required String title,
    required String value,
    required String unit,
    required IconData icon,
    required Color color,
    required String subtitle,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(icon, color: color, size: 22),
                    const SizedBox(width: 8),
                    Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  ],
                ),
                Text(unit, style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 12),
            Text(value, style: TextStyle(fontSize: 34, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 6),
            Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // TAB 3: SMART SCHOOL ATTENDANCE
  // ==========================================
  Widget _buildAttendanceTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text("Maktab Davomati Tarixi", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        const Text("GPS Geofence orqali avtomatik qayd etilgan", style: TextStyle(color: Colors.grey, fontSize: 12)),
        const SizedBox(height: 16),
        ...attendanceHistory.map((att) {
          final isPresent = att['status'] == 'PRESENT';
          final isLate = att['status'] == 'LATE';
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: isPresent ? Colors.green.withOpacity(0.15) : Colors.orange.withOpacity(0.15),
                child: Icon(isPresent ? Icons.check_circle : Icons.alarm, color: isPresent ? Colors.green : Colors.orange),
              ),
              title: Text(att['date'], style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text("Keldi: ${att['arrival']} • Ketdi: ${att['departure'] ?? 'Maktabda'}"),
              trailing: Chip(
                label: Text(
                  isPresent ? "Keldi" : (isLate ? "Kechikdi" : "Kelmadi"),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: isPresent ? Colors.green : Colors.orange,
                  ),
                ),
                backgroundColor: (isPresent ? Colors.green : Colors.orange).withOpacity(0.1),
              ),
            ),
          );
        }),
      ],
    );
  }

  // ==========================================
  // TAB 4: SAFE ZONES MANAGEMENT
  // ==========================================
  Widget _buildSafeZonesTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text("Xavfsiz Hududlar", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add, size: 16),
              label: Text(_t('add_zone')),
            ),
          ],
        ),
        const SizedBox(height: 14),
        ...safeZones.map((zone) {
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            child: ListTile(
              leading: const CircleAvatar(
                backgroundColor: Colors.blueAccent,
                child: Icon(Icons.security, color: Colors.white, size: 20),
              ),
              title: Text(zone['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text("Radius: ${zone['radius']} metr • Xavfsiz zona"),
              trailing: Switch(
                value: true,
                onChanged: (val) {},
              ),
            ),
          );
        }),
      ],
    );
  }

  // ==========================================
  // TAB 5: PROFILE & CHILD PAIRING
  // ==========================================
  Widget _buildProfileTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Center(
          child: CircleAvatar(
            radius: 44,
            backgroundImage: NetworkImage("https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80"),
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: Text(childName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ),
        Center(
          child: Text("Unikal ID: $uniqueCode", style: const TextStyle(color: Colors.grey, fontSize: 13)),
        ),
        const SizedBox(height: 24),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.watch),
                title: const Text("Uланган Smartwatch"),
                subtitle: const Text("Samsung Galaxy Watch5 Pro (watch-5pro-01)"),
                trailing: const Icon(Icons.chevron_right),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.school),
                title: const Text("Maktab"),
                subtitle: const Text("21-Sonli Ixtisoslashtirilgan Maktab (5-B Sinf)"),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.phone),
                title: const Text("Favqulodda Ota-ona Telefoni"),
                subtitle: const Text("+998 90 345 67 89"),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: () {
            // QR / Unique ID Pairing
          },
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          icon: const Icon(Icons.qr_code_scanner),
          label: Text(_t('pair_child')),
        ),
      ],
    );
  }
}
