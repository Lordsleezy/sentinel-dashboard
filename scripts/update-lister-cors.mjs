import { NodeSSH } from "node-ssh";

const password = process.env.LEGION_SSH_PASSWORD;
const cors =
  "http://localhost:3000,http://127.0.0.1:3000,https://dashboard.sentinelprime.org,https://scout.sentinelprime.org,https://lister.sentinelprime.org";

const ssh = new NodeSSH();
await ssh.connect({
  host: process.env.LEGION_SSH_HOST || "192.168.0.117",
  username: process.env.LEGION_SSH_USER || "sentinel",
  password,
});

const envPath = "/opt/sentinel/lister/.env";
const read = await ssh.execCommand(`cat ${envPath}`);
const lines = read.stdout.split("\n").filter((l) => !l.startsWith("CORS_ORIGINS="));
lines.push(`CORS_ORIGINS=${cors}`);
const tmp = "/tmp/lister-env-update";
await ssh.execCommand(`cat > ${tmp} << 'ENVEOF'\n${lines.join("\n")}\nENVEOF`);
await ssh.execCommand(`cp ${tmp} ${envPath}`);
console.log("CORS updated:", cors);

for (const cmd of [
  "systemctl --user restart sentinel-lister",
  "systemctl restart sentinel-lister",
]) {
  const r = await ssh.execCommand(cmd);
  if (r.stdout.includes("active") || r.code === 0) console.log(cmd, "ok");
}

ssh.dispose();
