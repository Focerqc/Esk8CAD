import { Octokit } from "octokit";
import { getNextId, validateCategories } from "./_utils";

interface Env {
    GITHUB_TOKEN: string;
    SUBMIT_RATE_LIMIT: KVNamespace;
    TURNSTILE_SECRET_KEY?: string;
    UPSTREAM_OWNER?: string;
    UPSTREAM_REPO?: string;
    BASE_BRANCH?: string;
}

interface PartSubmission {
    title: string;
    imageSrc: string;
    platform: string[];
    fabricationMethod: string[];
    typeOfPart: string[];
    dropboxUrl?: string;
    dropboxZipLastUpdated?: string;
    externalUrl?: string;
    isOem?: boolean;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const clientIP = request.headers.get("cf-connecting-ip") || "anonymous";
        const now = Date.now();

        // 1. Rate Limit
        const lastSub = await env.SUBMIT_RATE_LIMIT.get(clientIP);
        if (lastSub && now - parseInt(lastSub) < 60000) {
            return new Response(JSON.stringify({
                error: "Rate limit exceeded. Please wait 60 seconds."
            }), { status: 429, headers: { "Content-Type": "application/json" } });
        }

        // 2. Parse Body
        const body = await request.json() as { parts: PartSubmission[], hp_field?: string, turnstile_token?: string };
        const { parts, hp_field, turnstile_token } = body;

        // 2.5 Turnstile Verification (Pre-PR logic)
        const DEBUG_BYPASS = true;

        if (!DEBUG_BYPASS) {
            if (!turnstile_token) {
                return new Response(JSON.stringify({ error: "Missing verification token." }), { status: 400 });
            }

            const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${encodeURIComponent(env.TURNSTILE_SECRET_KEY || '')}&response=${encodeURIComponent(turnstile_token)}&remoteip=${encodeURIComponent(clientIP)}`
            });

            const verifyData = (await verifyRes.json()) as { success: boolean, 'error-codes'?: string[] };
            if (!verifyData.success) {
                return new Response(JSON.stringify({
                    error: "Bot verification failed.",
                    details: verifyData['error-codes']
                }), { status: 403 });
            }
        }

        // Honeypot check
        if (hp_field) {
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }

        if (!parts || !Array.isArray(parts) || parts.length === 0) {
            return new Response(JSON.stringify({ error: "No parts provided." }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const owner = env.UPSTREAM_OWNER || 'Focerqc';
        const repo = env.UPSTREAM_REPO || 'CLONEpubparts.xyz';
        const baseBranch = env.BASE_BRANCH || 'master';

        const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

        // 3. Get Existing Parts for ID calculation
        let files: string[] = [];
        try {
            const { data } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: 'src/data/parts',
                ref: baseBranch
            });

            if (Array.isArray(data)) {
                files = data.filter(f => f.name.endsWith('.json')).map(f => f.name);
            }
        } catch (e: any) {
            if (e.status === 404) {
                files = [];
            } else if (e.status === 403 || e.status === 504) {
                return new Response(JSON.stringify({ error: "System Busy" }), { status: 503, headers: { "Content-Type": "application/json" } });
            } else {
                throw e;
            }
        }

        // 4. Scan titles for duplicate detection (Smart Suffixing)
        const existingTitles: string[] = [];
        const normalize = (s: string) => s.toLowerCase().replace(/[\s-]/g, '');

        if (files.length > 0) {
            const scanFiles = files.slice(0, 40); // GitHub API subrequest limit considerations
            const titlePromises = scanFiles.map(async (fileName) => {
                try {
                    const { data } = await octokit.rest.repos.getContent({
                        owner,
                        repo,
                        path: `src/data/parts/${fileName}`,
                        ref: baseBranch
                    });
                    if (data && 'content' in data && typeof data.content === 'string') {
                        const decodedNode = atob(data.content.replace(/\n/g, ''));
                        const json = JSON.parse(decodedNode);
                        return json.title as string;
                    }
                } catch (err) {
                    console.error(`Error scanning ${fileName}:`, err);
                }
                return null;
            });
            const fetchedTitles = await Promise.all(titlePromises);
            existingTitles.push(...fetchedTitles.filter((t): t is string => t !== null));
        }

        // 5. Calculate IDs and Setup Branch
        let nextIdString = getNextId(files);
        let currentIdInt = parseInt(nextIdString, 10);
        const newBranchName = `submission-${nextIdString}`;

        const { data: refData } = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${baseBranch}`
        });
        const baseSha = refData.object.sha;

        await octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${newBranchName}`,
            sha: baseSha
        });

        const prBodyLines = [];
        const treeItems = [];

        for (const part of parts) {
            // Validation
            const validation = validateCategories(part.typeOfPart);
            if (!validation.valid) {
                return new Response(JSON.stringify({ error: `Validation Error: ${validation.error}` }), { status: 400 });
            }

            // Smart Suffixing
            const originalTitle = part.title;
            let candidateTitle = originalTitle;
            let currentSuffix = 2;

            const isDuplicate = (t: string) => {
                const norm = normalize(t);
                return existingTitles.some(et => normalize(et) === norm);
            };

            while (isDuplicate(candidateTitle)) {
                candidateTitle = `${originalTitle} (${currentSuffix})`;
                currentSuffix++;
            }

            part.title = candidateTitle;
            existingTitles.push(candidateTitle);

            // Create Content
            const idString = currentIdInt.toString().padStart(4, '0');
            const fileName = `part-${idString}.json`;
            const filePath = `src/data/parts/${fileName}`;
            const fileContent = JSON.stringify(part, null, 2);
            const base64Content = btoa(unescape(encodeURIComponent(fileContent)));

            const { data: blob } = await octokit.rest.git.createBlob({
                owner,
                repo,
                content: base64Content,
                encoding: 'base64'
            });

            treeItems.push({
                path: filePath,
                mode: '100644' as const,
                type: 'blob' as const,
                sha: blob.sha
            });

            prBodyLines.push(`- **${part.title}** (${fileName})`);
            currentIdInt++;
        }

        // 6. Finalize Commit and PR
        const { data: tree } = await octokit.rest.git.createTree({
            owner,
            repo,
            base_tree: baseSha,
            tree: treeItems
        });

        const { data: commit } = await octokit.rest.git.createCommit({
            owner,
            repo,
            message: `feat: add ${parts.length} new parts via submission`,
            tree: tree.sha,
            parents: [baseSha]
        });

        await octokit.rest.git.updateRef({
            owner,
            repo,
            ref: `heads/${newBranchName}`,
            sha: commit.sha
        });

        const { data: pr } = await octokit.rest.pulls.create({
            owner,
            repo,
            title: `Submission: ${parts.length} New Parts`,
            head: newBranchName,
            base: baseBranch,
            body: `Automated submission via ESK8CAD Dashboard.\n\n${prBodyLines.join('\n')}`
        });

        // 7. Success
        await env.SUBMIT_RATE_LIMIT.put(clientIP, now.toString());

        return new Response(JSON.stringify({
            success: true,
            prUrl: pr.html_url
        }), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500 });
    }
};