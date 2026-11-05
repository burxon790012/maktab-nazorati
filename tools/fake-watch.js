#!/usr/bin/env node
/**
 * SMART CHILD — Real-time Smartwatch (Samsung Galaxy Watch5 Pro) Simulator
 * Sends live GPS & health telemetry over HTTP to the backend server.
 *
 * Usage:
 *   node tools/fake-watch.js
 *   node tools/fake-watch.js --sos
 *   node tools/fake-watch.js --low-battery
 *   node tools/fake-watch.js --unworn
 *   node tools/fake-watch.js --outside
 */

const SERVER_URL = process.env.SERVER_URL || 'http://127.0.0.1:3000';
const DEVICE_ID = process.env.DEVICE_ID || 'W5P-TEST-001';
const STUDENT_ID = process.env.STUDENT_ID || '10001';

// Tashkent School Coordinates (1-Sonli Namunaviy Maktab)
// Center: [41.311081, 69.240562]
const WAYPOINTS = [
  // 1. Street approaching school (OUTSIDE)
  { lat: 41.309200, lng: 69.238400, desc: "Amir Temur shoh ko'chasi (Maktabdan 280 m uzoqda)" },
  { lat: 41.309850, lng: 69.239300, desc: "Maktab yo'li chorrahasi (180 m)" },
  { lat: 41.310400, lng: 69.239900, desc: "Maktab asosiy darvozasi yaqinida (60 m)" },

  // 2. Gate & Entering school grounds (INSIDE)
  { lat: 41.310900, lng: 69.240400, desc: "Maktab hovlisi darvozasi (HUDUDGA KIRDI)" },
  { lat: 41.311200, lng: 69.240700, desc: "Maktab binosi A-blok koridori" },
  { lat: 41.311350, lng: 69.240950, desc: "5-B sinfxonasi ichida (Darsda)" },

  // 3. Staying inside classroom
  { lat: 41.311360, lng: 69.240960, desc: "5-B sinfxonasi (Tinch holatda)" },
  { lat: 41.311340, lng: 69.240940, desc: "5-B sinfxonasi (Dars davom etmoqda)" },

  // 4. Leaving school
  { lat: 41.310850, lng: 69.240350, desc: "Maktab darvozasidan chiqish (HUDUDDAN CHIQDI)" },
  { lat: 41.310100, lng: 69.239500, desc: "Uyga qaytish yo'li (Tashqarida)" }
];

async function main() {
  console.log('==================================================================');
  console.log('⌚ SMART CHILD: Samsung Galaxy Watch5 Pro Jonli Telemetriya Klienti');
  console.log(`📡 Server: ${SERVER_URL}`);
  console.log(`⌚ Qurilma ID: ${DEVICE_ID} (O'quvchi: ${STUDENT_ID})`);
  console.log('==================================================================\n');

  // Parse command line flags
  const args = process.argv.slice(2);
  const isSosTest = args.includes('--sos');
  const isLowBatteryTest = args.includes('--low-battery');
  const isUnwornTest = args.includes('--unworn');
  const isOutsideOnly = args.includes('--outside');
  const isOnce = args.includes('--once');

  // Step 1: Register or get device token
  let deviceToken = process.env.DEVICE_TOKEN;
  try {
    const regRes = await fetch(`${SERVER_URL}/api/devices/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: STUDENT_ID,
        deviceUid: DEVICE_ID,
        model: 'Samsung Galaxy Watch5 Pro (SM-R920)'
      })
    });
    const regData = await regRes.json();
    if (regData.success && regData.token) {
      deviceToken = regData.token;
      console.log(`✅ Soat ro'yxatdan o'tdi. Token olindi: ${deviceToken.substring(0, 16)}...`);
    } else {
      deviceToken = 'dev-token-secret-123';
    }
  } catch (err) {
    console.warn("⚠️ Ro'yxatdan o'tishda xatolik, standart tokendan foydalanilmoqda:", err.message);
    deviceToken = 'dev-token-secret-123';
  }

  let index = 0;
  let battery = isLowBatteryTest ? 8 : 88;
  let heartRate = isSosTest ? 134 : 76;
  let steps = 3120;

  console.log('\n🚀 Jonli telemetriya yuborish boshlandi (har 3 soniyada 1 ta paket)...\n');

  const sendTelemetryPacket = async () => {
    let wp = WAYPOINTS[index % WAYPOINTS.length];
    if (isOutsideOnly) {
      wp = WAYPOINTS[0];
    }

    const payload = {
      deviceId: DEVICE_ID,
      deviceToken: deviceToken,
      lat: wp.lat + (Math.random() - 0.5) * 0.00008,
      lng: wp.lng + (Math.random() - 0.5) * 0.00008,
      accuracy: 6.5,
      speed: index >= 4 && index <= 7 ? 0.0 : 1.3,
      heartRate: heartRate + Math.floor(Math.random() * 4) - 2,
      battery: Math.max(5, battery),
      temperature: 36.6,
      steps: steps += Math.floor(Math.random() * 10),
      isWorn: !isUnwornTest,
      isSos: isSosTest,
      timestamp: Date.now()
    };

    if (!isLowBatteryTest && Math.random() < 0.2) {
      battery = Math.max(10, battery - 1);
    }

    try {
      const res = await fetch(`${SERVER_URL}/api/device/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deviceToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const statusIcon = data.geofence_status === 'INSIDE' ? '🟢 MAKTABDA' : data.geofence_status === 'VERIFYING' ? '🟡 TEKSHIRUV' : '🔴 TASHQARIDA';

      console.log(
        `[${new Date().toLocaleTimeString()}] Paket #${index + 1}: ` +
        `${statusIcon} | ❤️ ${payload.heartRate} BPM | 🔋 ${payload.battery}% | ` +
        `📍 Manzil: ${data.address || wp.desc}`
      );

      if (data.alert) {
        console.log(`   🚨 OGOHLANTIRISH: ${data.alert.message}`);
      }
    } catch (err) {
      console.error(`❌ Yuborishda xatolik:`, err.message);
    }

    index++;
  };

  // Send first packet immediately
  await sendTelemetryPacket();

  if (isOnce) {
    console.log('\n✅ --once parametri bilan 1 ta telemetriya paketi yuborildi va dastur yakunlandi.');
    process.exit(0);
  }

  // Send subsequent packets every 3.5 seconds
  const interval = setInterval(sendTelemetryPacket, 3500);

  // Graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n\n🛑 fake-watch to\'xtatildi. Soat serverda 60 soniyadan so\'ng DELAYED, 5 daqiqadan so\'ng OFFLINE bo\'ladi.');
    process.exit(0);
  });
}

main().catch(console.error);
