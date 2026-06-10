#!/usr/bin/env bash
# Run on Legion as sentinel@192.168.0.117
# Usage: bash setup-legion-wetty.sh
set -e

echo "=== [1/4] Install wetty ==="
npm install -g wetty
wetty --version

echo ""
echo "=== [2/4] Create systemd service for wetty ==="
sudo tee /etc/systemd/system/sentinel-wetty.service > /dev/null <<'UNIT'
[Unit]
Description=Sentinel Wetty SSH Terminal
After=network.target

[Service]
Type=simple
User=sentinel
ExecStart=/usr/bin/env wetty --port 3002 --base /wetty --ssh-host localhost --ssh-user sentinel --allow-iframe
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now sentinel-wetty
echo "sentinel-wetty service status:"
sudo systemctl status sentinel-wetty --no-pager

echo ""
echo "=== [3/4] Update Cloudflare tunnel config ==="
TUNNEL_CONFIG="$HOME/.cloudflared/config.yml"

if [ ! -f "$TUNNEL_CONFIG" ]; then
  echo "WARNING: $TUNNEL_CONFIG not found — creating skeleton."
  mkdir -p ~/.cloudflared
  cat > "$TUNNEL_CONFIG" <<'CF'
tunnel: bc6619f8-db74-488e-9a4f-6f063f71d78e
credentials-file: /home/sentinel/.cloudflared/bc6619f8-db74-488e-9a4f-6f063f71d78e.json

ingress:
  - hostname: ssh.sentinelprime.org
    service: http://localhost:3002
  - service: http_status:404
CF
  echo "Created new config.yml — verify tunnel ID and credentials path are correct."
else
  echo "Existing config found. Checking for ssh.sentinelprime.org entry..."
  if grep -q "ssh.sentinelprime.org" "$TUNNEL_CONFIG"; then
    echo "Entry already exists — no change needed."
  else
    echo "Inserting ssh.sentinelprime.org ingress rule before catch-all..."
    # Insert before the catch-all http_status:404 line
    python3 - <<'PYEOF'
import re, sys

path = "/home/sentinel/.cloudflared/config.yml"
with open(path) as f:
    content = f.read()

new_rule = "  - hostname: ssh.sentinelprime.org\n    service: http://localhost:3002\n"

# Insert before the catch-all (http_status line or last ingress entry)
if "http_status:404" in content:
    content = content.replace(
        "  - service: http_status:404",
        new_rule + "  - service: http_status:404"
    )
else:
    content = content.rstrip() + "\n" + new_rule + "  - service: http_status:404\n"

with open(path, "w") as f:
    f.write(content)
print("config.yml updated.")
PYEOF
  fi
fi

echo ""
echo "Current config.yml:"
cat "$TUNNEL_CONFIG"

echo ""
echo "=== [4/4] Restart Cloudflare tunnel to apply config ==="
if sudo systemctl is-active --quiet cloudflared 2>/dev/null; then
  sudo systemctl restart cloudflared
  echo "cloudflared restarted."
elif systemctl --user is-active --quiet cloudflared 2>/dev/null; then
  systemctl --user restart cloudflared
  echo "cloudflared (user) restarted."
else
  echo "WARNING: cloudflared service not found running — start it manually."
fi

echo ""
echo "=== DONE ==="
echo ""
echo "MANUAL STEP REQUIRED — Cloudflare DNS:"
echo "  Add a CNAME record in Cloudflare dashboard:"
echo "    Name:    ssh"
echo "    Target:  bc6619f8-db74-488e-9a4f-6f063f71d78e.cfargotunnel.com"
echo "    Proxied: YES"
echo ""
echo "Wetty will be accessible at: https://ssh.sentinelprime.org/wetty"
