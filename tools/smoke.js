#!/usr/bin/env node
/**
 * tools/smoke.js
 * Automated smoke test for SMART CHILD (maktab-nazorati)
 * Checks:
 * 1. Server starts and responds
 * 2. GET /health returns 200 with { status: 'healthy' }
 * 3. GET / returns 200 (serves frontend HTML)
 * 4. POST /api/v1/auth/login route is responsive
 * 5. GET /api/v1/students returns 200 with JSON student array
 * 6. POST /api/v1/telemetry/simulate-walk route responds
 */

const { spawn } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 49152;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function httpRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { ...headers };
    let postData = null;

    if (body) {
      postData = typeof body === 'string' ? body : JSON.stringify(body);
      reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
        timeout: 5000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (_) {}
          resolve({ status: res.statusCode, headers: res.headers, raw: data, json });
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout requesting ${path}`));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log(`🚀 SMART CHILD Smoke Test Suite starting on port ${PORT}...`);

  const serverProc = spawn('node', ['backend/server.js'], {
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverOutput = '';
  serverProc.stdout.on('data', (d) => (serverOutput += d.toString()));
  serverProc.stderr.on('data', (d) => (serverOutput += d.toString()));

  const cleanup = () => {
    if (!serverProc.killed) {
      serverProc.kill('SIGTERM');
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // 1. Wait for server to come up
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await httpRequest('GET', '/health');
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch (_) {}
    await sleep(200);
  }

  if (!ready) {
    console.error('❌ Server failed to start within 6 seconds. Output:');
    console.error(serverOutput);
    cleanup();
    process.exit(1);
  }
  console.log('✅ 1. Server started and listening');

  const results = [];

  // 2. GET /health
  try {
    const res = await httpRequest('GET', '/health');
    const ok = res.status === 200 && res.json && (res.json.status === 'ok' || res.json.status === 'healthy');
    results.push({ name: 'GET /health returns 200', pass: ok, detail: `Status: ${res.json?.status}, DB: ${res.json?.database?.status}` });
  } catch (err) {
    results.push({ name: 'GET /health returns 200', pass: false, error: err.message });
  }

  // 3. GET / (Main page HTML)
  try {
    const res = await httpRequest('GET', '/');
    const ok = res.status === 200 && res.raw.includes('<html');
    results.push({ name: 'GET / serves frontend HTML', pass: ok, detail: `Status: ${res.status}` });
  } catch (err) {
    results.push({ name: 'GET / serves frontend HTML', pass: false, error: err.message });
  }

  // 4. POST /api/v1/auth/login (Responsive test)
  try {
    const res = await httpRequest('POST', '/api/v1/auth/login', {
      username: 'admin',
      password: 'wrong_password_test',
    });
    // Should return 401 with error message, proving endpoint and auth route is responsive
    const ok = res.status === 401 && res.json && res.json.success === false;
    results.push({ name: 'POST /api/v1/auth/login responds to credentials', pass: ok, detail: `Status: ${res.status}` });
  } catch (err) {
    results.push({ name: 'POST /api/v1/auth/login responds', pass: false, error: err.message });
  }

  // 5. GET /api/v1/students
  try {
    const res = await httpRequest('GET', '/api/v1/students');
    const studentsArr = Array.isArray(res.json) ? res.json : res.json?.students;
    const ok = res.status === 200 && Array.isArray(studentsArr);
    results.push({ name: 'GET /api/v1/students returns student array', pass: ok, detail: `Count: ${studentsArr?.length || 0}` });
  } catch (err) {
    results.push({ name: 'GET /api/v1/students returns student array', pass: false, error: err.message });
  }

  // 6. POST /api/v1/telemetry/simulate-walk
  try {
    const res = await httpRequest('POST', '/api/v1/telemetry/simulate-walk', {
      studentId: 'STU001',
      steps: 1,
    });
    const ok = res.status === 200 && res.json && res.json.success === true;
    results.push({ name: 'POST /api/v1/telemetry/simulate-walk route responds', pass: ok, detail: `Status: ${res.status}` });
  } catch (err) {
    results.push({ name: 'POST /api/v1/telemetry/simulate-walk responds', pass: false, error: err.message });
  }

  // Summary
  console.log('\n--- SMOKE TEST SUMMARY ---');
  let allPass = true;
  for (const r of results) {
    const icon = r.pass ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.pass ? 'PASS' : 'FAIL'} (${r.detail || r.error || ''})`);
    if (!r.pass) allPass = false;
  }

  cleanup();

  if (allPass) {
    console.log('\n🎉 ALL SMOKE CHECKS PASSED!\n');
    process.exit(0);
  } else {
    console.error('\n⚠️ SOME SMOKE CHECKS FAILED!\n');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal smoke test error:', err);
  process.exit(1);
});
