import { Octokit } from "octokit";

interface Env {
    GITHUB_TOKEN: string;
    ADMIN_PASSWORD?: string;
    UPSTREAM_OWNER?: string;
    UPSTREAM_REPO?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    // 1. Security Check
    const adminPassword = request.headers.get("x-admin-password");
    if (!adminPassword || adminPassword !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const owner = env.UPSTREAM_OWNER || 'Focerqc';
    const repo = env.UPSTREAM_REPO || 'CLONEpubparts.xyz';
    const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

    try {
        // 2. Fetch Open PRs
        const key = "PR_LIST_CACHE"; // Simple mock cache key if we had KV, but we don't need it for admin dashboard yet.

        const { data } = await octokit.rest.pulls.list({
            owner,
            repo,
            state: 'open',
            sort: 'created',
            direction: 'desc',
            per_page: 50
        });

        // 3. Transform Data
        const prs = data.map((pr: any) => ({
            number: pr.number,
            title: pr.title,
            user: { login: pr.user?.login || "Unknown" },
            html_url: pr.html_url,
            created_at: pr.created_at,
            body: pr.body,
            head: { ref: pr.head.ref, sha: pr.head.sha }
        }));

        return new Response(JSON.stringify(prs), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error: any) {
        console.error("List PRs Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Failed to list PRs" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
};
