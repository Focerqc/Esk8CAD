import { Octokit } from "octokit";

interface Env {
    GITHUB_TOKEN: string;
    ADMIN_PASSWORD?: string;
    UPSTREAM_OWNER?: string;
    UPSTREAM_REPO?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const prNumber = parseInt(url.searchParams.get("number") || "");
    const password = request.headers.get("x-admin-password");

    if (password !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    if (!prNumber) {
        return new Response(JSON.stringify({ error: "Missing PR number" }), { status: 400 });
    }

    try {
        const owner = env.UPSTREAM_OWNER || 'Focerqc';
        const repo = env.UPSTREAM_REPO || 'CLONEpubparts.xyz';
        const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

        // Get PR files
        const { data: files } = await octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: prNumber
        });

        const jsonFiles = files.filter((f: any) => f.filename.endsWith('.json') && f.filename.startsWith('src/data/parts/'));
        const parts = [];

        for (const file of jsonFiles) {
            // Get raw content
            // Note: raw_url might be easiest but let's use the API to be safe with auth
            const { data: contentData } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: file.filename,
                ref: file.sha // Use file sha to get the version in the PR
            });

            if ('content' in contentData && typeof contentData.content === 'string') {
                const decoded = atob(contentData.content.replace(/\s/g, ''));
                const part = JSON.parse(decoded);
                parts.push({ ...part, _filename: file.filename });
            }
        }

        return new Response(JSON.stringify({ parts }), { status: 200 });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
