#!/usr/bin/env node
/**
 * SMART CHILD — Real-time Smartwatch (Samsung Galaxy Watch5 Pro) Fleet Simulator
 * Simulates N smartwatches walking realistic Tashkent school routes,
 * entering/leaving geofences, draining battery, toggling isWorn, triggering SOS,
 * and testing online/delayed/offline status transitions.
 *
 * Usage:
 *   node tools/fake-watch.js                  # Default: 1 watch running continuous route
 *   node tools/fake-watch.js --count 3        # 3 watches walking simultaneously
 *   node tools/fake-watch.js --sos            # Trigger emergency SOS
 *   node tools/fake-watch.js --low-battery    # Simulate low battery (<10%)
 *   node tools/fake-watch.js --unworn         # Simulate watch removed from wrist
 *   node tools/fake-watch.js --once           # Send single packet and exit
 */

const SERVER_URL = process.env.SERVER_URL || 'http://127.0.0.1:3000';

// Realistic Waypoints near 1-Sonli Namunaviy Maktab (Center: [41.311081, 69.240562])
const FLEET_ROUTES = [
  // Student 10001 (Ali Karimov)
  [
    { lat: 41.309200, lng: 69.238400, desc: "Amir Temur ko'chasi (280 m)" },
    { lat: 41.309850, lng: 69.239300, desc: "Chorraha (180 m)" },
    { lat: 41.310400, lng: 69.239900, desc: "Maktab darvozasi (60 m)" },
    { lat: 41.310900, lng: 69.240400, desc: "Maktab hovlisi (HUDUDGA KIRDI)" },
    { lat: 41.311200, lng: 69.240700, desc: "Bosh koridor" },
    { lat: 41.311350, lng: 69.240950, desc: "5-B sinfxonasi (Darsda)" },
    { lat: 41.311340, lng: 69.240940, desc: "5-B sinfxonasi (Tinch)" },
    { lat: 41.310850, lng: 69.240350, desc: "Maktab darvozasidan chiqish (CHIQDI)" },
    { lat: 41.310100, lng: 69.239500, desc: "Uyga qaytish yo'li (Tashqarida)" }
  ],
  // Student 10002 (Fotima Zokirova)
  [
    { lat: 41.310200, lng: 69.243500, desc: "Yunusobod 4-mavze (350 m)" },
    { lat: 41.310600, lng: 69.242200, desc: "Sharqiy kirish darvozasi (100 m)" },
    { lat: 41.311000, lng: 69.241500, desc: "Maktab sport maydoni (KIRDI)" },
    { lat: 41.311250, lng: 69.241000, desc: "Sport zali binosi" },
    { lat: 41.311400, lng: 69.241100, desc: "Sinfxona 2-qavat" },
    { lat: 41.310700, lng: 69.242500, desc: "Tashqariga chiqish (CHIQDI)" }
  ],
  // Student 10003 (Sardor Umarov)
  [
    { lat: 41.312900, lng: 69.240100, desc: "Shimoliy chorraha (220 m)" },
    { lat: 41.312100, lng: 69.240400, desc: "Maktab shimoliy bog'i (KIRDI)" },
    { lat: 41.311500, lng: 69.240600, desc: "Kutubxona xonasi" },
    { lat: 41.311300, lng: 69.240800, desc: "Asosiy bino" }
  ]
];

async function runSimulator() {
  const args = process.argv.slice(2);
  const isSos = args.includes('--sos');
  const isLowBattery = args.includes('--low-battery');
  const isUnworn = args.includes('--unworn');
  const isOnce = args.includes('--once');

  let watchCount = 1;
  const countIdx = args.indexOf('--count');
  if (countIdx !== -1 && args[countIdx + 1]) {
    watchCount = Math.min(3, Math.max(1, parseInt(args[countIdx + 1], 10)));
  }

  console.log('==================================================================');
  console.log('⌚ SMART CHILD: Samsung Galaxy Watch5 Pro Flot Simulyatori');
  console.log(`📡 Server: ${SERVER_URL}`);
  console.log(`⌚ Faol soatlar soni: ${watchCount} ta`);
  if (isSos) console.log('🚨 REJIM: Favqulodda SOS testi yoqilgan');
  if (isLowBattery) console.log('🪫 REJIM: Kam batareya (<10%) testi yoqilgan');
  if (isUnworn) console.log('⚠️ REJIM: Soat qo\'ldan yechilgan testi yoqilgan');
  console.log('==================================================================\n');

  // Initialize N watches
  const watches = [];
  const defaultTokens = ['dev-token-secret-123', 'demo-token-w2', 'demo-token-w3'];

  for (let i = 0; i < watchCount; i++) {
    const devId = `W5P-TEST-00${i + 1}`;
    const studentId = `1000${i + 1}`;
    let token = defaultTokens[i] || 'dev-token-secret-123';

    try {
      const regRes = await fetch(`${SERVER_URL}/api/devices/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: devId,
          studentId: studentId,
          model: 'Samsung Galaxy Watch5 Pro (SM-R920)'
        })
      });
      const regData = await regRes.json();
      if (regData.success && regData.device?.token) {
        token = regData.device.token;
      }
    } catch (_) {}

    watches.push({
      deviceId: devId,
      studentId: studentId,
      token: token,
      route: FLEET_ROUTES[i % FLEET_ROUTES.length],
      routeIndex: 0,
      battery: isLowBattery ? 8 : 95 - i * 5,
      steps: 3200 + i * 500
    });
  }

  const sendPacketForWatch = async (w) => {
    const wp = w.route[w.routeIndex % w.route.length];
    w.routeIndex++;

    // Battery drain simulation
    if (!isLowBattery && w.battery > 5) {
      w.battery = Math.max(5, w.battery - 0.2);
    }
    w.steps += Math.floor(Math.random() * 8 + 4);

    const heartRate = isSos ? 135 : Math.floor(Math.random() * 15 + 75);

    const payload = {
      deviceId: w.deviceId,
      studentId: w.studentId,
      lat: wp.lat,
      lng: wp.lng,
      accuracy: 3.5,
      speed: 1.2,
      heartRate,
      battery: Math.round(w.battery),
      temperature: 36.6,
      steps: w.steps,
      isWorn: !isUnworn,
      signalSource: 'gps',
      isSos: isSos,
      timestamp: new Date().toISOString()
    };

    try {
      const res = await fetch(`${SERVER_URL}/api/device/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${w.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const statusIcon =
        data.geofence_status === 'INSIDE'
          ? '🟢 MAKTABDA'
          : data.geofence_status === 'VERIFYING'
          ? '🟡 CHEGARADA'
          : '🔴 TASHQARIDA';

      console.log(
        `[${new Date().toLocaleTimeString()}] ${w.deviceId} (${w.studentId}): ` +
        `${statusIcon} | ❤️ ${payload.heartRate} BPM | 🔋 ${payload.battery}% | ` +
        `📍 ${data.address || wp.desc}`
      );
    } catch (err) {
      console.error(`❌ ${w.deviceId} yuborishda xatolik:`, err.message);
    }
  };

  // Send first round
  for (const w of watches) {
    await sendPacketForWatch(w);
  }

  if (isOnce) {
    console.log('\n✅ --once parametri bilan paketlar yuborildi va dastur yakunlandi.');
    process.exit(0);
  }

  const interval = setInterval(async () => {
    for (const w of watches) {
      await sendPacketForWatch(w);
    }
  }, 3500);

  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n🛑 Simulyatsiya to\'xtatildi. Soatlar 60s dan keyin DELAYED, 5m dan keyin OFFLINE holatiga o\'tadi.');
    process.exit(0);
  });
}

runSimulator().catch(console.error);
