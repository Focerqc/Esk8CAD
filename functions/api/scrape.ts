
// Force deployment trigger: Updated scrape logic with Firecrawl and GraphQL fallback
interface Env {
    FIRECRAWL_API_KEY?: string;
}

interface ScrapeResult {
    title?: string;
    description?: string;
    image?: string;
    tags?: string[];
    error?: string;
}

// Helper: Fetch with 8s timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
};

export const onRequestGet = async (context: any) => {
    // Enable CORS
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (context.request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const { request, env } = context;
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    const headers = {
        ...corsHeaders,
        "Content-Type": "application/json"
    };

    if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'Missing url parameter', success: false }), { status: 400, headers });
    }

    // Initialize result object
    let data: ScrapeResult = {};
    let success = false;
    let source = '';

    try {
        // 1. Try Firecrawl (Free Tier / API) with Timeout
        if (env.FIRECRAWL_API_KEY) {
            try {
                // Firecrawl /scrape endpoint with extract capabilities
                const firecrawlUrl = `https://api.firecrawl.dev/v1/scrape`;

                const response = await fetchWithTimeout(firecrawlUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.FIRECRAWL_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: targetUrl,
                        formats: ["extract"],
                        extract: {
                            schema: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    image: { type: "string" },
                                    tags: {
                                        type: "array",
                                        items: { type: "string" }
                                    }
                                },
                                required: ["title", "image"]
                            }
                        }
                    })
                });

                if (response.ok) {
                    const json = await response.json() as any;

                    if (json.success && json.data && json.data.extract) {
                        const extracted = json.data.extract;

                        data.title = extracted.title;
                        data.description = extracted.description;
                        data.image = extracted.image;
                        data.tags = extracted.tags;
                        success = true;
                        source = 'firecrawl';
                    }
                } else {
                    console.log(`Firecrawl failed: ${response.status} ${response.statusText}`);
                }

            } catch (e) {
                console.error("Firecrawl error:", e);
            }
        }

        // 2. Fallback: Printables GraphQL (Always Free, No Key Required for Public Data)
        // Check if it's a Printables URL and we have an ID
        const printablesMatch = targetUrl.match(/printables\.com\/.*model\/(\d+)/i);
        if (!success && printablesMatch && printablesMatch[1]) {
            const modelId = printablesMatch[1];
            try {
                const query = `
                    query PrintResults($id: ID!) {
                        print(id: $id) {
                            name
                            description
                            images {
                                filePath
                            }
                            tags {
                                name
                            }
                        }
                    }
                `;

                const gqlRes = await fetchWithTimeout('https://api.printables.com/graphql/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query,
                        variables: { id: modelId }
                    })
                });

                if (gqlRes.ok) {
                    const json = await gqlRes.json() as any;
                    const print = json?.data?.print;

                    if (print) {
                        data.title = print.name;
                        data.description = print.description; // HTML content, frontend can strip if needed

                        if (print.images && print.images.length > 0) {
                            const imgPath = print.images[0].filePath;
                            if (imgPath.startsWith('http')) {
                                data.image = imgPath;
                            } else {
                                data.image = `https://media.printables.com/${imgPath}`;
                            }
                        }

                        if (print.tags && Array.isArray(print.tags)) {
                            data.tags = print.tags.map((t: any) => t.name);
                        }
                        success = true;
                        source = 'graphql';
                    }
                }
            } catch (e) {
                console.error("GraphQL error:", e);
            }
        }

        if (success) {
            return new Response(JSON.stringify({ ...data, success: true, source }), { headers });
        } else {
            // Failure Response (Requirements: Use standard failure message)
            return new Response(JSON.stringify({
                success: false,
                message: "Could not fetch metadata. Please fill details manually."
            }), { status: 422, headers });
        }

    } catch (err: any) {
        console.error("Scrape wrapper error:", err);
        return new Response(JSON.stringify({
            success: false,
            message: "Could not fetch metadata. Please fill details manually."
        }), {
            status: 500,
            headers
        });
    }
};
