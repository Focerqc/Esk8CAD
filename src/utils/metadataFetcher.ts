/**
 * metadataFetcher.ts
 * Clean, resilient client-side scraper for Printables and Thingiverse models.
 * Uses a two-stage proxy fallback and DOM parsing.
 */

export interface ModelMetadata {
    title: string;
    imageHref: string;
}

const PROXIES = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
];

const TIMEOUT_MS = 7000;

/**
 * Strips common platform suffixes from page titles.
 */
function cleanTitle(title: string): string {
    return title
        .replace(/ \| Download free STL model \| Printables\.com/i, "")
        .replace(/ - Thingiverse/i, "")
        .trim();
}

/**
 * Resolves relative image URLs to absolute ones.
 */
function resolveUrl(href: string, base: string): string {
    if (!href || href.startsWith("http")) return href;
    try {
        return new URL(href, base).href;
    } catch {
        return href;
    }
}

/**
 * Fetches and parses metadata from a given model URL.
 */
export async function fetchModelMetadata(url: string): Promise<ModelMetadata> {
    const sanitizedUrl = url.trim();
    let lastError = "Fetch failed";

    for (const proxy of PROXIES) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const proxyUrl = `${proxy}${encodeURIComponent(sanitizedUrl)}`;

        console.log(`[Metadata] Trying proxy: ${proxy} for URL: https://www.printables.com/model/123-cube`);

        try {
            const resp = await fetch(proxyUrl, {
                signal: controller.signal,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html"
                }
            });

            clearTimeout(id);

            if (!resp.ok) {
                const snippet = (await resp.text()).substring(0, 200);
                console.warn(`[Metadata] Proxy ${proxy} returned status ${resp.status}: ${snippet}`);
                lastError = `Status ${resp.status}`;
                continue;
            }

            const html = await resp.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            // Title extraction
            const rawTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content")
                || doc.title
                || "";
            const title = cleanTitle(rawTitle);

            // Image extraction
            const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute("content");
            let imageHref = ogImage || "";

            if (!imageHref) {
                // Fallback to searching for preview/hero images
                const img = doc.querySelector('img[src*="preview"], img[src*="model"], img[src*="hero"], img[src*="thing-img"]') as HTMLImageElement;
                imageHref = img?.src || "";
            }

            imageHref = resolveUrl(imageHref, sanitizedUrl);

            return { title, imageHref };
        } catch (err: any) {
            clearTimeout(id);
            lastError = err.name === "AbortError" ? "Timeout" : err.message;
            console.error(`[Metadata] Error with proxy ${proxy}:`, lastError);
        }
    }

    throw new Error(`Auto-fetch failed (site protection likely). ${lastError}.`);
}
