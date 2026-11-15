import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const SmartChildParentApp());
}

// ====================================================================
// AUTH & CHILD MODELS
// ====================================================================

class ParentUser {
  final String id;
  final String name;
  final String username;
  final String? email;
  final String? phone;
  final String role;
  final List<String> childrenIds;

  ParentUser({
    required this.id,
    required this.name,
    required this.username,
    this.email,
    this.phone,
    required this.role,
    required this.childrenIds,
  });

  factory ParentUser.fromJson(Map<String, dynamic> json) {
    final rawIds = json['childrenIds'];
    List<String> cIds = [];
    if (rawIds is List) {
      cIds = rawIds.map((e) => e.toString()).toList();
    }
    return ParentUser(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? "Ota-ona",
      username: json['username']?.toString() ?? json['email']?.toString() ?? '',
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      role: json['role']?.toString() ?? 'PARENT',
      childrenIds: cIds,
    );
  }
}

class ChildRecord {
  final String id;
  final String uniqueId;
  final String name;
  final String schoolId;
  final String schoolName;
  final String className;
  final String? deviceId;
  final String? photo;
  final Map<String, dynamic> telemetry;
  final Map<String, dynamic>? schoolGeofence;

  ChildRecord({
    required this.id,
    required this.uniqueId,
    required this.name,
    required this.schoolId,
    required this.schoolName,
    required this.className,
    this.deviceId,
    this.photo,
    required this.telemetry,
    this.schoolGeofence,
  });

  factory ChildRecord.fromJson(Map<String, dynamic> json) {
    return ChildRecord(
      id: json['id']?.toString() ?? '',
      uniqueId: json['uniqueId']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? "O'quvchi",
      schoolId: json['schoolId']?.toString() ?? '',
      schoolName: json['schoolName']?.toString() ?? "Maktab",
      className: json['className']?.toString() ?? (json['classId']?.toString() ?? "Sinf"),
      deviceId: json['deviceId']?.toString(),
      photo: json['photo']?.toString(),
      telemetry: (json['telemetry'] is Map<String, dynamic>) ? json['telemetry'] : {},
      schoolGeofence: (json['schoolGeofence'] is Map<String, dynamic>) ? json['schoolGeofence'] : null,
    );
  }
}

// ====================================================================
// MAIN APPLICATION
// ====================================================================

class SmartChildParentApp extends StatefulWidget {
  const SmartChildParentApp({super.key});

  @override
  State<SmartChildParentApp> createState() => _SmartChildParentAppState();
}

class _SmartChildParentAppState extends State<SmartChildParentApp> {
  ThemeMode _themeMode = ThemeMode.dark;
  String _currentLang = 'uz'; // 'uz', 'ru', 'en'

  // Global Auth State
  String? _authToken;
  ParentUser? _currentUser;
  List<ChildRecord> _authorizedChildren = [];
  String _serverBaseUrl = "https://maktab-nazorati.onrender.com";

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

  void _onLoginSuccess({
    required String token,
    required ParentUser user,
    required List<ChildRecord> children,
    required String serverUrl,
  }) {
    setState(() {
      _authToken = token;
      _currentUser = user;
      _authorizedChildren = children;
      _serverBaseUrl = serverUrl;
    });
  }

  void _onLogout() {
    setState(() {
      _authToken = null;
      _currentUser = null;
      _authorizedChildren = [];
    });
  }

  void _updateChildrenList(List<ChildRecord> newChildren) {
    setState(() {
      _authorizedChildren = newChildren;
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
      home: _authToken == null || _currentUser == null
          ? ParentLoginScreen(
              serverBaseUrl: _serverBaseUrl,
              onLoginSuccess: _onLoginSuccess,
              currentLang: _currentLang,
              onChangeLang: _changeLang,
              onToggleTheme: _toggleTheme,
              isDark: _themeMode == ThemeMode.dark,
            )
          : ParentMainScreen(
              authToken: _authToken!,
              currentUser: _currentUser!,
              initialChildren: _authorizedChildren,
              serverBaseUrl: _serverBaseUrl,
              onLogout: _onLogout,
              onChildrenUpdated: _updateChildrenList,
              onToggleTheme: _toggleTheme,
              onChangeLang: _changeLang,
              currentLang: _currentLang,
              isDark: _themeMode == ThemeMode.dark,
            ),
    );
  }
}

// ====================================================================
// SCREEN 1: PARENT LOGIN SCREEN (Exact Website Integration)
// ====================================================================

class ParentLoginScreen extends StatefulWidget {
  final String serverBaseUrl;
  final Function({
    required String token,
    required ParentUser user,
    required List<ChildRecord> children,
    required String serverUrl,
  }) onLoginSuccess;
  final String currentLang;
  final Function(String) onChangeLang;
  final VoidCallback onToggleTheme;
  final bool isDark;

  const ParentLoginScreen({
    super.key,
    required this.serverBaseUrl,
    required this.onLoginSuccess,
    required this.currentLang,
    required this.onChangeLang,
    required this.onToggleTheme,
    required this.isDark,
  });

  @override
  State<ParentLoginScreen> createState() => _ParentLoginScreenState();
}

class _ParentLoginScreenState extends State<ParentLoginScreen> {
  final _loginController = TextEditingController();
  final _passwordController = TextEditingController();
  late TextEditingController _serverController;

  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;
  bool _showServerSettings = false;

  @override
  void initState() {
    super.initState();
    _serverController = TextEditingController(text: widget.serverBaseUrl);
  }

  @override
  void dispose() {
    _loginController.dispose();
    _passwordController.dispose();
    _serverController.dispose();
    super.dispose();
  }

  Future<void> _performLogin() async {
    final loginInput = _loginController.text.trim();
    final passwordInput = _passwordController.text;
    final serverUrl = _serverController.text.trim().replaceAll(RegExp(r'/+$'), '');

    if (loginInput.isEmpty) {
      setState(() => _errorMessage = "Login yoki telefon raqamingizni kiriting");
      return;
    }
    if (passwordInput.isEmpty) {
      setState(() => _errorMessage = "Parolni kiriting");
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final loginUri = Uri.parse("$serverUrl/api/v1/auth/login");
      final response = await http
          .post(
            loginUri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'login': loginInput,
              'password': passwordInput,
            }),
          )
          .timeout(const Duration(seconds: 12));

      final data = jsonDecode(utf8.decode(response.bodyBytes));

      if (response.statusCode == 200 && data['success'] == true) {
        final token = data['token'] as String;
        final rawUser = data['user'] as Map<String, dynamic>;

        if (rawUser['role'] != 'PARENT' && rawUser['role'] != 'SUPER_ADMIN') {
          setState(() {
            _isLoading = false;
            _errorMessage = "Ushbu ilova faqat Ota-onalar uchun mo'ljallangan.";
          });
          return;
        }

        final parentUser = ParentUser.fromJson(rawUser);

        // Fetch authorized children list using the Bearer token
        List<ChildRecord> childrenList = [];
        try {
          final childrenUri = Uri.parse("$serverUrl/api/v1/parent/children");
          final chRes = await http.get(
            childrenUri,
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          ).timeout(const Duration(seconds: 8));

          if (chRes.statusCode == 200) {
            final chData = jsonDecode(utf8.decode(chRes.bodyBytes));
            if (chData['success'] == true && chData['children'] is List) {
              childrenList = (chData['children'] as List)
                  .map((item) => ChildRecord.fromJson(item as Map<String, dynamic>))
                  .toList();
            }
          }
        } catch (_) {
          // If children endpoint fails, fallback to user.children array from login response
          if (rawUser['children'] is List) {
            childrenList = (rawUser['children'] as List)
                .map((item) => ChildRecord.fromJson(item as Map<String, dynamic>))
                .toList();
          }
        }

        widget.onLoginSuccess(
          token: token,
          user: parentUser,
          children: childrenList,
          serverUrl: serverUrl,
        );
      } else {
        setState(() {
          _errorMessage = data['message'] ?? "Login yoki parol noto'g'ri";
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = "Serverga ulanib bo'lmadi. Internet yoki server manzilini tekshiring.";
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Top Toolbar: Lang & Theme
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      IconButton(
                        icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode, size: 20),
                        onPressed: widget.onToggleTheme,
                      ),
                      PopupMenuButton<String>(
                        icon: const Icon(Icons.language, size: 20),
                        onSelected: widget.onChangeLang,
                        itemBuilder: (ctx) => [
                          const PopupMenuItem(value: 'uz', child: Text("🇺🇿 O'zbekcha")),
                          const PopupMenuItem(value: 'ru', child: Text("🇷🇺 Русский")),
                          const PopupMenuItem(value: 'en', child: Text("🇬🇧 English")),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Brand Shield Logo
                  Center(
                    child: Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF2563EB).withOpacity(0.35),
                            blurRadius: 18,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.shield_rounded,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // App Title
                  const Text(
                    "SMART CHILD",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Ota-ona Xavfsizlik va Monitoring Ilovasi",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Error Banner
                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.red.shade900.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.red.shade600, width: 1),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Colors.redAccent, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Login Input Field
                  TextField(
                    controller: _loginController,
                    decoration: InputDecoration(
                      labelText: "Ota-ona Logini yoki Telefon",
                      hintText: "Masalan: otashbek.com yoki +998901234567",
                      prefixIcon: const Icon(Icons.person_outline),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      filled: true,
                    ),
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 16),

                  // Password Input Field
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: "Parol",
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off : Icons.visibility,
                          size: 20,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      filled: true,
                    ),
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _performLogin(),
                  ),
                  const SizedBox(height: 22),

                  // Submit Button
                  ElevatedButton(
                    onPressed: _isLoading ? null : _performLogin,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 3,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                          )
                        : const Text(
                            "Tizimga Kirish",
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                  const SizedBox(height: 18),

                  // Info Notice Box
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF131C31) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.info_outline, size: 18, color: Color(0xFF3B82F6)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            "Ota-ona login va paroli maktab ma'muriyati yoki SMART CHILD veb-sayti orqali beriladi. Faqat biriktirilgan farzandingiz ma'lumotlari ko'rinadi.",
                            style: TextStyle(
                              fontSize: 11.5,
                              color: isDark ? Colors.grey.shade400 : Colors.grey.shade700,
                              height: 1.35,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Server Settings Toggle
                  TextButton.icon(
                    onPressed: () => setState(() => _showServerSettings = !_showServerSettings),
                    icon: Icon(
                      _showServerSettings ? Icons.expand_less : Icons.settings_outlined,
                      size: 16,
                    ),
                    label: Text(
                      _showServerSettings ? "Server sozlamalarini yashirish" : "Server manzilini sozlash",
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),

                  if (_showServerSettings) ...[
                    const SizedBox(height: 6),
                    TextField(
                      controller: _serverController,
                      decoration: InputDecoration(
                        labelText: "Backend Server URL",
                        hintText: "https://maktab-nazorati.onrender.com",
                        prefixIcon: const Icon(Icons.dns_outlined, size: 18),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      style: const TextStyle(fontSize: 13),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        TextButton(
                          onPressed: () => _serverController.text = "https://maktab-nazorati.onrender.com",
                          child: const Text("Render (Live)", style: TextStyle(fontSize: 11)),
                        ),
                        TextButton(
                          onPressed: () => _serverController.text = "http://10.0.2.2:3000",
                          child: const Text("Emulator (10.0.2.2)", style: TextStyle(fontSize: 11)),
                        ),
                        TextButton(
                          onPressed: () => _serverController.text = "http://localhost:3000",
                          child: const Text("Localhost", style: TextStyle(fontSize: 11)),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ====================================================================
// SCREEN 2: PARENT MAIN SCREEN (Dashboard with Multi-Child Support)
// ====================================================================

class ParentMainScreen extends StatefulWidget {
  final String authToken;
  final ParentUser currentUser;
  final List<ChildRecord> initialChildren;
  final String serverBaseUrl;
  final VoidCallback onLogout;
  final Function(List<ChildRecord>) onChildrenUpdated;
  final VoidCallback onToggleTheme;
  final Function(String) onChangeLang;
  final String currentLang;
  final bool isDark;

  const ParentMainScreen({
    super.key,
    required this.authToken,
    required this.currentUser,
    required this.initialChildren,
    required this.serverBaseUrl,
    required this.onLogout,
    required this.onChildrenUpdated,
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
  List<ChildRecord> _children = [];
  ChildRecord? _selectedChild;

  // Real-time Telemetry & GPS State of Selected Child
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

  // Dynamic School Geofence boundary
  List<LatLng> schoolPolygon = [
    const LatLng(41.312400, 69.238800),
    const LatLng(41.312400, 69.242300),
    const LatLng(41.309700, 69.242300),
    const LatLng(41.309700, 69.238800),
  ];

  // Route playback history
  List<LatLng> routePoints = [];

  // Attendance history
  List<Map<String, dynamic>> attendanceHistory = [];

  // Safe zones list
  List<Map<String, dynamic>> safeZones = [];

  Timer? _pollingTimer;
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _children = List.from(widget.initialChildren);
    if (_children.isNotEmpty) {
      _selectedChild = _children.first;
      _applyChildData(_selectedChild!);
    }
    _refreshChildrenFromBackend();
    _startLivePolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  void _startLivePolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (_) => _syncChildTelemetry());
  }

  void _applyChildData(ChildRecord child) {
    final t = child.telemetry;
    final lat = (t['latitude'] ?? t['lat'] ?? 41.311120).toDouble();
    final lng = (t['longitude'] ?? t['lng'] ?? 69.240610).toDouble();

    setState(() {
      childPosition = LatLng(lat, lng);
      childHeading = (t['heading'] ?? 45.0).toDouble();
      childSpeed = (t['speed'] ?? 0.0).toDouble();
      geofenceStatus = t['geofenceStatus'] ?? "INSIDE";
      statusDisplay = t['statusDisplay'] ?? (geofenceStatus == "INSIDE" ? "PRESENT – INSIDE SCHOOL" : "LEFT SCHOOL – OUTSIDE SCHOOL");
      statusColor = (t['statusColor'] == "GREEN" || geofenceStatus == "INSIDE") ? Colors.green : Colors.red;
      isSos = t['isSos'] ?? false;
      batteryLevel = t['batteryLevel'] ?? 85;
      heartRate = t['heartRate'] ?? 78;
      bodyTemperature = (t['bodyTemperature'] ?? 36.6).toDouble();
      stepCount = t['stepCount'] ?? 1200;
      isOnline = t['deviceStatus'] == "ONLINE" || t['deviceStatus'] == null;
      lastSyncTime = "${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}";

      // Parse school polygon if provided
      if (child.schoolGeofence != null && child.schoolGeofence!['polygon'] is List) {
        final rawPoly = child.schoolGeofence!['polygon'] as List;
        schoolPolygon = rawPoly
            .map((p) => LatLng((p['lat'] ?? p[0]).toDouble(), (p['lng'] ?? p[1]).toDouble()))
            .toList();
      }

      // Safe zones
      safeZones = [
        {"name": child.schoolName, "type": "SCHOOL", "radius": 250, "lat": lat, "lng": lng},
        {"name": "Uy", "type": "SAFE", "radius": 150, "lat": lat - 0.003, "lng": lng - 0.003},
      ];
    });

    _fetchRouteHistory(child.id);
  }

  // Refresh authorized children from backend
  Future<void> _refreshChildrenFromBackend() async {
    try {
      final uri = Uri.parse("${widget.serverBaseUrl}/api/v1/parent/children");
      final res = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer ${widget.authToken}',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data['success'] == true && data['children'] is List) {
          final newChildren = (data['children'] as List)
              .map((c) => ChildRecord.fromJson(c as Map<String, dynamic>))
              .toList();

          setState(() {
            _children = newChildren;
            if (_selectedChild == null && _children.isNotEmpty) {
              _selectedChild = _children.first;
              _applyChildData(_selectedChild!);
            } else if (_selectedChild != null) {
              // Keep matching child updated
              final match = _children.firstWhere(
                (c) => c.id == _selectedChild!.id,
                orElse: () => _children.isNotEmpty ? _children.first : _selectedChild!,
              );
              _selectedChild = match;
            }
          });
          widget.onChildrenUpdated(newChildren);
        }
      } else if (res.statusCode == 401) {
        // Expired session
        _pollingTimer?.cancel();
        widget.onLogout();
      }
    } catch (_) {}
  }

  // Poll telemetry with strict parent authorization
  Future<void> _syncChildTelemetry() async {
    if (_selectedChild == null) return;
    try {
      final childId = _selectedChild!.id;
      final uri = Uri.parse("${widget.serverBaseUrl}/api/v1/parent/child/$childId/telemetry");
      final res = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer ${widget.authToken}',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data['success'] == true && data['telemetry'] != null) {
          final t = data['telemetry'];
          setState(() {
            final lat = (t['latitude'] ?? t['lat'] ?? childPosition.latitude).toDouble();
            final lng = (t['longitude'] ?? t['lng'] ?? childPosition.longitude).toDouble();
            childPosition = LatLng(lat, lng);
            childHeading = (t['heading'] ?? childHeading).toDouble();
            childSpeed = (t['speed'] ?? childSpeed).toDouble();
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
      } else if (res.statusCode == 401) {
        _pollingTimer?.cancel();
        widget.onLogout();
      }
    } catch (_) {
      setState(() => isOnline = false);
    }
  }

  // Fetch authorized movement route history
  Future<void> _fetchRouteHistory(String childId) async {
    try {
      final uri = Uri.parse("${widget.serverBaseUrl}/api/v1/students/$childId/route-history");
      final res = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer ${widget.authToken}',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data['success'] == true && data['points'] is List) {
          final pts = (data['points'] as List)
              .map((p) => LatLng((p['lat']).toDouble(), (p['lng']).toDouble()))
              .toList();
          setState(() {
            routePoints = pts;
          });
        }
      }
    } catch (_) {}
  }

  void _onSwitchChild(ChildRecord child) {
    setState(() {
      _selectedChild = child;
    });
    _applyChildData(child);
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
        "logout": "Chiqish",
        "switch_child": "Farzandni almashtirish",
        "no_children": "Biriktirilgan farzand topilmadi",
        "no_children_desc": "Sizning hisobingizga hali birorta o'quvchi biriktirilmagan. Maktab ma'muriyatiga murojaat qiling.",
        "refresh": "Yangilash"
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
        "logout": "Выйти",
        "switch_child": "Переключить ребенка",
        "no_children": "Нет привязанных детей",
        "no_children_desc": "К вашей учетной записи еще не привязан ученик. Обратитесь к администрации школы.",
        "refresh": "Обновить"
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
        "logout": "Logout",
        "switch_child": "Switch child",
        "no_children": "No children assigned",
        "no_children_desc": "No students are currently linked to your parent account. Please contact school administration.",
        "refresh": "Refresh"
      }
    };
    return dict[widget.currentLang]?[key] ?? key;
  }

  @override
  Widget build(BuildContext context) {
    if (_children.isEmpty) {
      return _buildNoChildrenScreen();
    }

    final child = _selectedChild!;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: _children.length > 1
            // Multi-child switcher dropdown in header
            ? DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: child.id,
                  icon: const Icon(Icons.arrow_drop_down, color: Colors.blueAccent),
                  dropdownColor: widget.isDark ? const Color(0xFF131C31) : Colors.white,
                  items: _children.map((c) {
                    return DropdownMenuItem<String>(
                      value: c.id,
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 13,
                            backgroundColor: Colors.blueAccent.withOpacity(0.2),
                            child: const Icon(Icons.person, size: 16, color: Colors.blueAccent),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            c.name,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            "(${c.className})",
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (newId) {
                    if (newId != null) {
                      final target = _children.firstWhere((c) => c.id == newId);
                      _onSwitchChild(target);
                    }
                  },
                ),
              )
            // Single child title
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    child.name,
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
                        "${child.className} • ${child.schoolName} • ID: ${child.uniqueId}",
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
            icon: const Icon(Icons.more_vert),
            onSelected: (val) {
              if (val == 'logout') {
                _confirmLogout();
              } else if (val == 'refresh') {
                _refreshChildrenFromBackend();
                _syncChildTelemetry();
              }
            },
            itemBuilder: (ctx) => [
              PopupMenuItem(
                value: 'refresh',
                child: Row(
                  children: [
                    const Icon(Icons.refresh, size: 18),
                    const SizedBox(width: 8),
                    Text(_t('refresh')),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    const Icon(Icons.logout, size: 18, color: Colors.redAccent),
                    const SizedBox(width: 8),
                    Text(_t('logout'), style: const TextStyle(color: Colors.redAccent)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildMapTab(child),
          _buildHealthTab(child),
          _buildAttendanceTab(child),
          _buildSafeZonesTab(child),
          _buildProfileTab(child),
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
  // EMPTY STATE: NO CHILDREN LINKED
  // ==========================================
  Widget _buildNoChildrenScreen() {
    return Scaffold(
      appBar: AppBar(
        title: const Text("SMART CHILD — Ota-ona"),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _confirmLogout,
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.family_restroom, size: 80, color: Colors.grey.shade600),
              const SizedBox(height: 18),
              Text(
                _t('no_children'),
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Text(
                _t('no_children_desc'),
                style: TextStyle(fontSize: 14, color: Colors.grey.shade400, height: 1.4),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _refreshChildrenFromBackend,
                icon: const Icon(Icons.refresh),
                label: Text(_t('refresh')),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                ),
              ),
              const SizedBox(height: 12),
              TextButton.icon(
                onPressed: _confirmLogout,
                icon: const Icon(Icons.logout, color: Colors.redAccent),
                label: Text(_t('logout'), style: const TextStyle(color: Colors.redAccent)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================
  // TAB 1: LIVE GPS MAP
  // ==========================================
  Widget _buildMapTab(ChildRecord child) {
    final bool isInside = geofenceStatus == "INSIDE";
    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: childPosition,
            initialZoom: 16.0,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'uz.maktab.smartchild',
            ),
            // School geofence boundary polygon
            if (schoolPolygon.isNotEmpty)
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
            if (routePoints.isNotEmpty)
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
                boxShadow: const [BoxShadow(color: Colors.redAccent, blurRadius: 10)],
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning, color: Colors.white, size: 28),
                  const SizedBox(width: 10),
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

        // Floating Status Card
        Positioned(
          bottom: 16,
          left: 14,
          right: 14,
          child: Card(
            elevation: 8,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(14.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            isInside ? Icons.check_circle : Icons.warning_amber_rounded,
                            color: statusColor,
                            size: 20,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isInside ? _t('inside_school') : _t('outside_school'),
                            style: TextStyle(
                              color: statusColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        "Yangilandi: $lastSyncTime",
                        style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                      ),
                    ],
                  ),
                  const Divider(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildQuickStat(Icons.battery_charging_full, "$batteryLevel%", _t('battery'), Colors.green),
                      _buildQuickStat(Icons.favorite, "$heartRate bpm", _t('bpm'), Colors.pinkAccent),
                      _buildQuickStat(Icons.thermostat, "$bodyTemperature°C", _t('temp'), Colors.amber),
                      _buildQuickStat(Icons.directions_walk, "$stepCount", _t('steps'), Colors.cyanAccent),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickStat(IconData icon, String val, String lbl, Color col) {
    return Column(
      children: [
        Icon(icon, color: col, size: 20),
        const SizedBox(height: 3),
        Text(val, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        Text(lbl, style: TextStyle(color: Colors.grey.shade400, fontSize: 10)),
      ],
    );
  }

  // ==========================================
  // TAB 2: HEALTH METRICS
  // ==========================================
  Widget _buildHealthTab(ChildRecord child) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          "${child.name} — Salomatlik Ko'rsatkichlari",
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 14),

        // Heart Rate Card
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.favorite, color: Colors.pinkAccent, size: 24),
                        SizedBox(width: 8),
                        Text("Yurak Urishi (Pulse)", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: Colors.green.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                      child: const Text("ME'YORDA", style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text("$heartRate bpm", style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.pinkAccent)),
                const SizedBox(height: 4),
                Text("Oxirgi o'lchov: $lastSyncTime • WearOS PPG Optik Sensori", style: TextStyle(color: Colors.grey.shade400, fontSize: 11)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Body Temperature Card
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const CircleAvatar(
                  radius: 24,
                  backgroundColor: Colors.amber,
                  child: Icon(Icons.thermostat, color: Colors.black, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("Tana Harorati", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      Text("$bodyTemperature °C", style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.amber)),
                      Text("Holat: Tabiiy harorat • Isitma aniqlanmadi", style: TextStyle(color: Colors.grey.shade400, fontSize: 11)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Step Count Card
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.directions_walk, color: Colors.cyanAccent, size: 24),
                    SizedBox(width: 8),
                    Text("Kunlik Qadamlar", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                ),
                const SizedBox(height: 10),
                Text("$stepCount / 6,000 qadam", style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: (stepCount / 6000).clamp(0.0, 1.0),
                  backgroundColor: Colors.grey.shade800,
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.cyanAccent),
                  minHeight: 8,
                  borderRadius: BorderRadius.circular(4),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ==========================================
  // TAB 3: ATTENDANCE
  // ==========================================
  Widget _buildAttendanceTab(ChildRecord child) {
    final bool isInside = geofenceStatus == "INSIDE";
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          color: isInside ? Colors.green.shade900.withOpacity(0.3) : Colors.red.shade900.withOpacity(0.3),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(isInside ? Icons.verified : Icons.cancel, color: isInside ? Colors.green : Colors.red, size: 36),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isInside ? "Bugun: MAKTABDA HOZIR" : "Maktab hududidan tashqarida",
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: isInside ? Colors.green : Colors.red),
                      ),
                      Text("${child.schoolName} (${child.className})", style: const TextStyle(fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text("Davomat Tarixi", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        ...[
          {"date": "Bugun", "status": isInside ? "PRESENT" : "OUTSIDE", "arrival": "08:18", "departure": null},
          {"date": "Kecha", "status": "PRESENT", "arrival": "08:24", "departure": "13:35"},
          {"date": "O'tgan kun", "status": "PRESENT", "arrival": "08:15", "departure": "13:30"},
        ].map((item) {
          final isP = item['status'] == 'PRESENT';
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: Icon(isP ? Icons.check_circle : Icons.schedule, color: isP ? Colors.green : Colors.orange),
              title: Text("${item['date']} • Kelish: ${item['arrival']}"),
              subtitle: Text(item['departure'] != null ? "Ketish: ${item['departure']}" : "Hozirda maktabda"),
              trailing: Text(
                isP ? "KELDILIK" : "TASHQARIDA",
                style: TextStyle(color: isP ? Colors.green : Colors.orange, fontWeight: FontWeight.bold, fontSize: 11),
              ),
            ),
          );
        }),
      ],
    );
  }

  // ==========================================
  // TAB 4: SAFE ZONES
  // ==========================================
  Widget _buildSafeZonesTab(ChildRecord child) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text("Xavfsiz Hududlar", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _refreshChildrenFromBackend,
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
              trailing: const Icon(Icons.verified, color: Colors.green),
            ),
          );
        }),
      ],
    );
  }

  // ==========================================
  // TAB 5: PROFILE & ACCOUNT MANAGEMENT
  // ==========================================
  Widget _buildProfileTab(ChildRecord child) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Parent User Card
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.blueAccent.withOpacity(0.2),
                  child: const Icon(Icons.person, size: 36, color: Colors.blueAccent),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.currentUser.name,
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "Login: ${widget.currentUser.username}",
                        style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                      ),
                      if (widget.currentUser.phone != null)
                        Text(
                          "Tel: ${widget.currentUser.phone}",
                          style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                        ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          "ROL: OTA-ONA",
                          style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Authorized Children Section
        const Text("Biriktirilgan Farzandlar", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        ..._children.map((c) {
          final isCurrent = c.id == child.id;
          return Card(
            color: isCurrent ? Colors.blue.withOpacity(0.12) : null,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: isCurrent ? const BorderSide(color: Colors.blueAccent, width: 1.5) : BorderSide.none,
            ),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: isCurrent ? Colors.blueAccent : Colors.grey.shade700,
                child: const Icon(Icons.face, color: Colors.white, size: 20),
              ),
              title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text("${c.schoolName} • ${c.className} • ID: ${c.uniqueId}"),
              trailing: isCurrent
                  ? const Chip(
                      label: Text("Faol", style: TextStyle(fontSize: 11, color: Colors.blueAccent)),
                      backgroundColor: Colors.transparent,
                    )
                  : ElevatedButton(
                      onPressed: () => _onSwitchChild(c),
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4)),
                      child: const Text("Tanlash", style: TextStyle(fontSize: 11)),
                    ),
            ),
          );
        }),
        const SizedBox(height: 16),

        // Device Info Card
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.watch),
                title: const Text("Uланган Smartwatch"),
                subtitle: Text(child.deviceId ?? "Samsung Galaxy Watch5 Pro"),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.dns_outlined),
                title: const Text("Backend Server"),
                subtitle: Text(widget.serverBaseUrl, style: const TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Logout Button
        ElevatedButton.icon(
          onPressed: _confirmLogout,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red.shade900.withOpacity(0.3),
            foregroundColor: Colors.redAccent,
            side: const BorderSide(color: Colors.redAccent, width: 1),
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          icon: const Icon(Icons.logout),
          label: Text(_t('logout'), style: const TextStyle(fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Chiqish"),
        content: const Text("Haqiqatan ham SMART CHILD ilovasidan chiqmoqchimisiz?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Bekor qilish"),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _pollingTimer?.cancel();
              widget.onLogout();
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text("Chiqish", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
