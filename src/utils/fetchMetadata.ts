/**
 * fetchMetadata.ts: Implements a resilient client-side scraper for Printables.com.
 * Uses a fallback chain of CORS proxies and DOMParser to bypass Cloudflare protection.
 */

export interface ScrapedMetadata {
    title: string;
    imageSrc: string;
}

const PROXIES = [
    { name: 'AllOrigins', url: 'https://api.allorigins.win/raw?url=' },
    { name: 'ThingProxy', url: 'https://thingproxy.freeboard.io/fetch/' },
    { name: 'CorsProxyIO', url: 'https://corsproxy.io/?' },
];

const TIMEOUT_MS = 8000;

export async function fetchPrintablesMetadata(targetUrl: string): Promise<ScrapedMetadata> {
    const errors: string[] = [];

    for (const proxy of PROXIES) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const proxyRequestUrl = `${proxy.url}${encodeURIComponent(targetUrl)}`;

        console.log(`[Scraper] Attempting proxy: ${proxy.name} for URL: ${targetUrl}`);

        try {
            const response = await fetch(proxyRequestUrl, {
                signal: controller.signal,
                headers: {
                    // Attempting to look like a real browser
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const textSnippet = (await response.text()).substring(0, 200);
                throw new Error(`Status ${response.status}: ${textSnippet}`);
            }

            const html = await response.text();
            if (!html || html.length < 500) {
                throw new Error("Response looks too small or empty (possibly blocked/challenged)");
            }

            return parsePrintablesHTML(html, targetUrl);

        } catch (err: any) {
            clearTimeout(timeoutId);
            const msg = err.name === 'AbortError' ? 'Timeout (8s)' : err.message;
            console.warn(`[Scraper] ${proxy.name} failed: ${msg.substring(0, 200)}`);
            errors.push(`${proxy.name}: ${msg.substring(0, 50)}`);

            // If we've hit the limit or have a specific block, continue to next proxy
            continue;
        }
    }

    throw new Error(`All proxies failed: ${errors.join(' | ')}`);
}

function parsePrintablesHTML(html: string, originalUrl: string): ScrapedMetadata {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Title Extraction
    let title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
        || doc.title
        || "";

    // Clean Printables suffix
    title = title.replace(" | Download free STL model | Printables.com", "").trim();

    // 2. Image Extraction
    let imageSrc = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || "";

    // Fallback selectors if OG tag is missing or blocked
    if (!imageSrc) {
        const imgSelectors = [
            'img[class*="model"]',
            'img[alt*="model"]',
            'img[alt*="preview"]',
            'img[alt*="hero"]',
            'main img'
        ];
        for (const selector of imgSelectors) {
            const img = doc.querySelector(selector) as HTMLImageElement;
            if (img?.src) {
                imageSrc = img.src;
                break;
            }
        }
    }

    // Ensure absolute URL if relative
    if (imageSrc && !imageSrc.startsWith('http')) {
        try {
            const urlObj = new URL(originalUrl);
            imageSrc = new URL(imageSrc, urlObj.origin).href;
        } catch (e) {
            console.warn("[Scraper] Failed to resolve relative image URL", e);
        }
    }

    return { title, imageSrc };
}
