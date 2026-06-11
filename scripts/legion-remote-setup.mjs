import { NodeSSH } from "node-ssh";

const host = process.env.LEGION_SSH_HOST || "192.168.0.117";
const username = process.env.LEGION_SSH_USER || "pgg12";
const password = process.env.LEGION_SSH_PASSWORD;

if (!password) {
  console.error("Set LEGION_SSH_PASSWORD");
  process.exit(1);
}

const TUNNEL_ID = "bc6619f8-db74-488e-9a4f-6f063f71d78e";

const ssh = new NodeSSH();
await ssh.connect({ host, username, password });

async function run(cmd, sudo = false) {
  const full = sudo ? `echo '${password.replace(/'/g, "'\\''")}' | sudo -S ${cmd}` : cmd;
  const r = await ssh.execCommand(full);
  if (r.stderr && !r.stderr.includes("[sudo]")) console.error("stderr:", r.stderr);
  return r;
}

const ifaceResult = await run("ip -o link show | awk -F': ' '$3 !~ /LOOPBACK/ && $2 !~ /^(lo|docker|veth|br-)/ {print $2; exit}'");
const iface = ifaceResult.stdout.trim() || "enp3s0";
console.log("Interface:", iface);

const macResult = await run(`cat /sys/class/net/${iface}/address`);
const mac = macResult.stdout.trim();
console.log("MAC:", mac);

await run(`ethtool -s ${iface} wol g`, true);

const udevRule = `ACTION=="add", SUBSYSTEM=="net", NAME=="${iface}", RUN+="/sbin/ethtool -s ${iface} wol g"`;
await run(`bash -c 'echo "${udevRule}" | sudo tee /etc/udev/rules.d/99-wol.rules'`, true);

const sentinelConfig = `tunnel: ${TUNNEL_ID}
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

await run(`bash -c 'echo "${sentinelConfig.replace(/"/g, '\\"')}" | sudo tee /etc/cloudflared/config.yml'`, true);
await run("mkdir -p /home/sentinel/.cloudflared", true);
await run(`bash -c 'echo "${sentinelConfig.replace(/"/g, '\\"')}" > /home/sentinel/.cloudflared/config.yml'`);
await run("systemctl restart sentinel-cloudflared", true);

const status = await run("systemctl is-active sentinel-cloudflared", true);
console.log("cloudflared:", status.stdout.trim());

ssh.dispose();
console.log("\nWOL_MAC_ADDRESS=" + mac);
console.log("Done.");
