import { Octokit } from "octokit";

interface Env {
    GITHUB_TOKEN: string;
    ADMIN_PASSWORD?: string;
    UPSTREAM_OWNER?: string;
    UPSTREAM_REPO?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    // 1. Security Check
    const adminPassword = request.headers.get("x-admin-password");
    if (!adminPassword || adminPassword !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const { pull_number }: { pull_number: number } = await request.json();

    if (!pull_number) {
        return new Response(JSON.stringify({ error: "Missing PR number" }), { status: 400 });
    }

    const owner = env.UPSTREAM_OWNER || 'Focerqc';
    const repo = env.UPSTREAM_REPO || 'CLONEpubparts.xyz';
    const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

    try {
        // 2. Perform Merge
        const { data } = await octokit.rest.pulls.merge({
            owner,
            repo,
            pull_number,
            merge_method: 'squash',
            commit_title: `Merge PR #${pull_number} (Admin Approved)`,
            commit_message: `Merged via ESK8CAD Admin Dashboard.`
        });

        if (!data.merged) {
            throw new Error(data.message || "Merge failed (GitHub returned unmerged status).");
        }

        return new Response(JSON.stringify({ success: true, message: data.message }), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error: any) {
        console.error("Merge PR Error:", error);
        // Handle specific merge conflicts (405) vs generic errors
        const status = error.status || 500;
        return new Response(JSON.stringify({
            error: error.message || "Failed to merge PR",
            details: error.response?.data?.message
        }), { status, headers: { "Content-Type": "application/json" } });
    }
};
