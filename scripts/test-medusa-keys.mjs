import { NodeSSH } from "node-ssh";

const keys = [
  "sk_136a828fe0db0862dac4c3fd99ceb27df465ca0c4cce559405a04e3e2c7b824e",
  "sk_6d89ec168cb376d78a109bde4a5ffa234744e14b31020cd13a55ac8300cac039",
  "sk_8d723f88ac7046dd80d7c46d5c59820a8dc0bb5a72597472d944b1fd5404b3fa",
];

const ssh = new NodeSSH();
await ssh.connect({
  host: "192.168.0.117",
  username: "sentinel",
  password: process.env.LEGION_SSH_PASSWORD,
});

for (const key of keys) {
  const r = await ssh.execCommand(
    `curl -s -w '\\nHTTP:%{http_code}' -H 'Authorization: Bearer ${key}' 'http://localhost:9000/admin/products?limit=1'`
  );
  const lines = r.stdout.trim().split("\n");
  console.log(key.slice(0, 16) + "...", lines.at(-1));
}

ssh.dispose();
