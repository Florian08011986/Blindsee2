#!/data/data/com.termux/files/usr/bin/bash
# =============================================================================
# BLINDSEE2 PWA LOCAL WEB SERVER (PORT 8088)
# =============================================================================

PORT=${1:-8088}
DIST_DIR="/data/data/com.termux/files/home/Blindsee2/dist"

echo "=== Starte Blindsee2 PWA Server auf Port $PORT ==="
echo "Local: http://127.0.0.1:$PORT"
echo "Tailscale: http://100.121.180.63:$PORT"

exec /data/data/com.termux/files/usr/bin/python3 -c "
import http.server, socketserver, os

PORT = int('$PORT')
DIST_DIR = '$DIST_DIR'
os.chdir(DIST_DIR)

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), NoCacheHandler) as httpd:
    httpd.serve_forever()
"
