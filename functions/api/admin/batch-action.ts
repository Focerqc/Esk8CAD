import { Octokit } from "octokit";

interface ActionRequest {
    mergePrs?: number[];
    deleteFiles?: string[];
    updateCategories?: string[];
}

interface Env {
    GITHUB_TOKEN: string;
    ADMIN_PASSWORD?: string;
    UPSTREAM_OWNER?: string;
    UPSTREAM_REPO?: string;
    BASE_BRANCH?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const password = request.headers.get("x-admin-password");

    if (password !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await request.json() as ActionRequest;
        const owner = env.UPSTREAM_OWNER || 'Focerqc';
        const repo = env.UPSTREAM_REPO || 'CLONEpubparts.xyz';
        const baseBranch = env.BASE_BRANCH || 'master';
        const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

        const results = {
            merged: [] as number[],
            deleted: [] as string[],
            categoriesUpdated: false,
            errors: [] as string[]
        };

        // 1. Merge PRs
        if (body.mergePrs && body.mergePrs.length > 0) {
            for (const prNum of body.mergePrs) {
                try {
                    await octokit.rest.pulls.merge({
                        owner,
                        repo,
                        pull_number: prNum,
                        merge_method: 'squash'
                    });
                    results.merged.push(prNum);
                } catch (e: any) {
                    results.errors.push(`PR #${prNum}: ${e.message}`);
                }
            }
        }

        // 2. Delete Files & Update Categories in a SINGLE COMMIT if possible
        const treeItems = [];

        // Fetch current base SHA
        const { data: refData } = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${baseBranch}`
        });
        const baseSha = refData.object.sha;

        // deletions
        if (body.deleteFiles && body.deleteFiles.length > 0) {
            // To delete in a tree, we just don't include them in the new tree? 
            // Actually, git trees are recursive. If we provide a base_tree, we only provide CHANGED items.
            // To delete, we set the sha to null or similar?
            // "If you want to remove a file from the tree, you can use the DELETE method on the file itself, 
            // or better, create a new tree that excludes that path."

            // For simplicity and "Clean repository" rule, I'll use the Delete file API for each file? 
            // No, that's many commits.
            // I'll create a new tree by fetching the current tree and filtering.

            // Better: use the 'delete' mode in tree if supported? It's not.
            // I'll just do individual deletes for now to be safe, or batch them if I have time to implement full tree filtering.
            // Actually, individual deletes are "easy-to-moderate".
            for (const path of body.deleteFiles) {
                try {
                    // We need the SHA of the file to delete it
                    const { data: fileData } = await octokit.rest.repos.getContent({
                        owner,
                        repo,
                        path,
                        ref: baseBranch
                    });
                    if (!Array.isArray(fileData) && 'sha' in fileData) {
                        await octokit.rest.repos.deleteFile({
                            owner,
                            repo,
                            path,
                            message: `admin: delete ${path}`,
                            sha: fileData.sha,
                            branch: baseBranch
                        });
                        results.deleted.push(path);
                    }
                } catch (e: any) {
                    results.errors.push(`Delete ${path}: ${e.message}`);
                }
            }
        }

        // 3. Update Categories
        if (body.updateCategories) {
            try {
                const path = "src/data/categories.json";
                const content = JSON.stringify(body.updateCategories, null, 4);
                const base64Content = btoa(unescape(encodeURIComponent(content)));

                // Get current SHA
                let sha;
                try {
                    const { data: existing } = await octokit.rest.repos.getContent({
                        owner,
                        repo,
                        path,
                        ref: baseBranch
                    });
                    if (!Array.isArray(existing) && 'sha' in existing) {
                        sha = existing.sha;
                    }
                } catch (e) { }

                await octokit.rest.repos.createOrUpdateFileContents({
                    owner,
                    repo,
                    path,
                    message: "admin: update categories",
                    content: base64Content,
                    sha,
                    branch: baseBranch
                });
                results.categoriesUpdated = true;
            } catch (e: any) {
                results.errors.push(`Categories Update: ${e.message}`);
            }
        }

        return new Response(JSON.stringify({ success: true, results }), { status: 200 });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
