#!/usr/bin/env bash
# Run on GCP server as pgg124@136.118.148.167
# Usage: bash setup-gcp-medusa.sh
set -e

echo "=== [1/7] Disk check ==="
df -h /
# NOTE: If / shows ~10GB and not ~50GB, filesystem expansion requires sudo.
# pgg124 has no sudo — you must ask an admin or use the GCP serial console:
#   sudo growpart /dev/sda 1 && sudo resize2fs /dev/sda1

echo ""
echo "=== [2/7] Check Medusa install ==="
cd ~/medusa-build
if [ ! -f package.json ]; then
  echo "ERROR: ~/medusa-build/package.json not found — Medusa may not be installed."
  exit 1
fi
echo "package.json found. Checking node_modules..."
ls -la node_modules/@medusajs/medusa 2>/dev/null && echo "Medusa modules present." || echo "WARNING: node_modules missing — run: cd ~/medusa-build && npm install"

echo ""
echo "=== [3/7] Load nvm and start Medusa in background for health check ==="
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20

# Kill any existing Medusa process on 9000
pkill -f "medusa" 2>/dev/null || true
sleep 1

cd ~/medusa-build
npm run dev &
MEDUSA_PID=$!
echo "Medusa PID: $MEDUSA_PID — waiting 30s for startup..."
sleep 30

echo ""
echo "=== [4/7] Health check ==="
curl -sf http://localhost:9000/health && echo "" && echo "Medusa is UP" || echo "ERROR: Medusa health check failed"

echo ""
echo "=== [5/7] Create admin user ==="
cd ~/medusa-build
npx medusa user -e admin@sentinelprime.org -p maddy123 2>&1 || echo "(User may already exist — continuing)"

echo ""
echo "=== [6/7] Save config to ~/sentinel.env ==="
# Generate API key via Medusa admin
echo "Fetching admin token..."
ADMIN_TOKEN=$(curl -sf -X POST http://localhost:9000/auth/user/emailpass \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sentinelprime.org","password":"maddy123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")

if [ -n "$ADMIN_TOKEN" ]; then
  echo "Admin token acquired. Creating API key..."
  API_KEY=$(curl -sf -X POST http://localhost:9000/admin/api-keys \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"sentinel-market","type":"publishable"}' \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['api_key']['token'])" 2>/dev/null || echo "")
else
  echo "WARNING: Could not get admin token — API key generation skipped."
  API_KEY=""
fi

cat > ~/sentinel.env <<EOF
MEDUSA_ADMIN_EMAIL=admin@sentinelprime.org
MEDUSA_ADMIN_PASSWORD=maddy123
MEDUSA_API_URL=http://136.118.148.167:9000
MEDUSA_PUBLISHABLE_KEY=${API_KEY:-REPLACE_WITH_KEY_FROM_MEDUSA_ADMIN}
EOF
echo "Saved to ~/sentinel.env"

kill $MEDUSA_PID 2>/dev/null || true

echo ""
echo "=== [7/7] Set up user systemd service ==="
mkdir -p ~/.config/systemd/user/

cat > ~/.config/systemd/user/sentinel-medusa.service <<'UNIT'
[Unit]
Description=Sentinel Medusa v2
After=network.target

[Service]
Type=simple
WorkingDirectory=%h/medusa-build
Environment=NODE_ENV=production
Environment=PORT=9000
ExecStartPre=/bin/bash -c 'export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20'
ExecStart=/bin/bash -c 'export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20; npm run dev'
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
UNIT

systemctl --user daemon-reload
systemctl --user enable --now sentinel-medusa
loginctl enable-linger pgg124

echo "Medusa systemd service enabled and started."
systemctl --user status sentinel-medusa --no-pager

echo ""
echo "=== DONE ==="
echo "Next manual step: Install cloudflared"
echo "  wget -O cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
echo "  dpkg -i --prefix=\$HOME cloudflared.deb  (no sudo needed for user install)"
echo "  OR: download binary directly:"
echo "  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o ~/bin/cloudflared && chmod +x ~/bin/cloudflared"
echo ""
echo "IMPORTANT: cloudflared tunnel login REQUIRES browser auth — do NOT run it in this script."
echo "  Run manually: ~/bin/cloudflared tunnel login"
