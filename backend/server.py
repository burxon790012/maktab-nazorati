import http.server, json, math, os, time
PORT = 3000
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')
SCHOOL_LAT, SCHOOL_LNG, SCHOOL_RADIUS = 41.311081, 69.240562, 250.0
devices_state, event_logs = {}, []

def calc_dist(lat1, lon1, lat2, lon2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)
    def do_GET(self):
        if self.path == '/api/v1/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"school": {"name": "21-maktab", "lat": SCHOOL_LAT, "lng": SCHOOL_LNG, "radius": SCHOOL_RADIUS}, "devices": list(devices_state.values()), "events": event_logs[:50]}).encode('utf-8'))
            return
        super().do_GET()
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length).decode('utf-8')) if length else {}
        is_sos = (self.path == '/api/v1/sos')
        lat = body.get('latitude', SCHOOL_LAT)
        lng = body.get('longitude', SCHOOL_LNG)
        status = "INSIDE" if calc_dist(lat, lng, SCHOOL_LAT, SCHOOL_LNG) <= SCHOOL_RADIUS else "OUTSIDE"
        dev_id = body.get('device_id', 'SM-R920')
        body['geofenceStatus'], body['is_sos'], body['lastSeen'] = status, is_sos, int(time.time()*1000)
        devices_state[dev_id] = body
        if is_sos:
            event_logs.insert(0, {"time": time.strftime("%H:%M:%S"), "type": "SOS", "deviceId": dev_id, "message": "🚨 SOS SIGNAL!"})
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"success": True, "geofence_status": status}).encode('utf-8'))

if __name__ == '__main__':
    server = http.server.ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    print(f"\n✅ Server ishga tushdi! Brauzerda oching: http://localhost:{PORT}\n")
    server.serve_forever()
