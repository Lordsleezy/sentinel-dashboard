import { NextRequest, NextResponse } from "next/server";
import { NodeSSH } from "node-ssh";
import { verifyDashboardAuth } from "@/lib/dashboard-auth";

export async function POST(request: NextRequest) {
  if (!verifyDashboardAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const host = process.env.LEGION_SSH_HOST;
  const username = process.env.LEGION_SSH_USER;
  const password = process.env.LEGION_SSH_PASSWORD;

  if (!host || !username || !password) {
    return NextResponse.json(
      { error: "LEGION_SSH_HOST, LEGION_SSH_USER, LEGION_SSH_PASSWORD required" },
      { status: 503 }
    );
  }

  const ssh = new NodeSSH();
  try {
    await ssh.connect({ host, username, password });
    await ssh.execCommand("sudo shutdown now");
    return NextResponse.json({ status: "shutdown initiated" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "SSH shutdown failed" },
      { status: 500 }
    );
  } finally {
    ssh.dispose();
  }
}
