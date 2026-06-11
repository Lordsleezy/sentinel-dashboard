import { NodeSSH } from "node-ssh";

const ssh = new NodeSSH();
await ssh.connect({
  host: "192.168.0.117",
  username: "sentinel",
  password: process.env.LEGION_SSH_PASSWORD,
});

for (const path of [
  "/opt/sentinel/medusa/.env",
  "/opt/medusa/.env",
  "/opt/sentinel/lister/.env",
]) {
  const r = await ssh.execCommand(`test -f ${path} && grep MEDUSA ${path} || echo missing:${path}`);
  console.log(r.stdout.trim());
}

ssh.dispose();
