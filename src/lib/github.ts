import { Octokit } from "@octokit/rest";
import { GITHUB_PRICING_PATH } from "./config";

const REPO = process.env.GITHUB_REPO || "Lordsleezy/sentinelprime";

export function getOctokit(): Octokit | null {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  return new Octokit({ auth: token });
}

export async function readPricingFile(): Promise<Record<string, unknown>> {
  const octokit = getOctokit();
  if (!octokit) return {};
  const [owner, repo] = REPO.split("/");
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: GITHUB_PRICING_PATH });
    if (!("content" in data)) return {};
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function updatePricingFile(
  pricing: Record<string, unknown>,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const octokit = getOctokit();
  if (!octokit) return { ok: false, error: "GitHub token not configured" };
  const [owner, repo] = REPO.split("/");

  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: GITHUB_PRICING_PATH });
    if ("sha" in data) sha = data.sha;
  } catch {
    // new file
  }

  const content = Buffer.from(JSON.stringify(pricing, null, 2)).toString("base64");
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: GITHUB_PRICING_PATH,
    message,
    content,
    sha,
  });
  return { ok: true };
}

export async function triggerNetlifyDeploy(): Promise<{ ok: boolean; error?: string }> {
  const hook = process.env.NETLIFY_DEPLOY_HOOK;
  if (!hook) return { ok: false, error: "NETLIFY_DEPLOY_HOOK not configured" };
  const res = await fetch(hook, { method: "POST" });
  if (!res.ok) return { ok: false, error: `Deploy hook failed: ${res.status}` };
  return { ok: true };
}
