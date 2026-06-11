import { NodeSSH } from "node-ssh";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const password = process.env.LEGION_SSH_PASSWORD;
const ssh = new NodeSSH();
await ssh.connect({
  host: process.env.LEGION_SSH_HOST || "192.168.0.117",
  username: process.env.LEGION_SSH_USER || "pgg12",
  password,
});

const TUNNEL_ID = "bc6619f8-db74-488e-9a4f-6f063f71d78e";
const config = `tunnel: ${TUNNEL_ID}
credentials-file: /home/sentinel/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: legion.sentinelprime.org
    service: http://localhost:9000
  - hostname: scout.sentinelprime.org
    service: http://localhost:8001
  - hostname: lister.sentinelprime.org
    service: http://localhost:8002
  - service: http_status:404
`;

const local = join(tmpdir(), "cloudflared-config.yml");
writeFileSync(local, config);
await ssh.putFile(local, "/tmp/cloudflared-config.yml");
unlinkSync(local);

const pw = password.replace(/'/g, "'\\''");
for (const dest of ["/etc/cloudflared/config.yml", "/home/sentinel/.cloudflared/config.yml"]) {
  await ssh.execCommand(`echo '${pw}' | sudo -S cp /tmp/cloudflared-config.yml ${dest}`);
  await ssh.execCommand(`echo '${pw}' | sudo -S chown sentinel:sentinel ${dest} 2>/dev/null || true`);
}

const restart = await ssh.execCommand(`echo '${pw}' | sudo -S systemctl restart sentinel-cloudflared`);
console.log("restart stderr:", restart.stderr);
const status = await ssh.execCommand(`echo '${pw}' | sudo -S systemctl is-active sentinel-cloudflared`);
console.log("cloudflared:", status.stdout.trim());

const curlScout = await ssh.execCommand("curl -s -o /dev/null -w '%{http_code}' http://localhost:8001/health");
const curlLister = await ssh.execCommand("curl -s -o /dev/null -w '%{http_code}' http://localhost:8002/health");
console.log("scout local health:", curlScout.stdout);
console.log("lister local health:", curlLister.stdout);

ssh.dispose();
