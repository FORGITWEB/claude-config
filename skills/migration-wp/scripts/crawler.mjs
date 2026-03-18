#!/usr/bin/env node
/**
 * WordPress Site Crawler for Migration
 * Crawls a WordPress site, extracts all content, downloads assets.
 *
 * Usage: node crawler.mjs <site-url> [output-dir]
 *
 * Output structure:
 *   _migration/
 *   ├── crawl-report.json       # Full report
 *   ├── pages/                  # Per-page content JSON
 *   ├── assets/images/          # Downloaded images
 *   ├── assets/docs/            # Downloaded PDFs/docs
 *   └── design-tokens.json      # Extracted colors & fonts
 */

import * as cheerio from "cheerio";
import { parseStringPromise } from "xml2js";
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  createWriteStream,
  readFileSync,
} from "fs";
import { join, basename, extname } from "path";
import { URL } from "url";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

// ── Config ──────────────────────────────────────────────────────────────────
const SITE_URL = process.argv[2];
const OUTPUT_DIR = process.argv[3] || "./_migration";
const MAX_CONCURRENT = 5;
const REQUEST_DELAY_MS = 300;
const MAX_PAGES = 2000;
const FETCH_TIMEOUT = 20000;
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif", ".ico"];
const DOC_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".rar"];

if (!SITE_URL) {
  console.error("Usage: node crawler.mjs <site-url> [output-dir]");
  process.exit(1);
}

// ── State ───────────────────────────────────────────────────────────────────
const baseUrl = new URL(SITE_URL);
const origin = baseUrl.origin;
const discoveredUrls = new Set();
const crawledUrls = new Set();
const failedUrls = new Map();
const pages = [];
const imageUrls = new Set();
const docUrls = new Set();
const cssUrls = new Set();
const colors = new Set();
const fontFamilies = new Set();
const fontFileUrls = new Set();
const languages = new Map(); // lang -> [urls]
let totalDownloaded = 0;

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function slugFromUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    let path = u.pathname.replace(/\/$/, "") || "/index";
    path = path.replace(/^\//, "").replace(/\//g, "__");
    return path || "index";
  } catch {
    return "unknown";
  }
}

async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WPMigrationBot/1.0; +migration)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isInternalUrl(urlStr) {
  try {
    const u = new URL(urlStr, origin);
    return u.origin === origin;
  } catch {
    return false;
  }
}

function normalizeUrl(urlStr) {
  try {
    const u = new URL(urlStr, origin);
    // Remove fragment, keep path + query
    u.hash = "";
    // Remove trailing slash for consistency (except root)
    let normalized = u.href;
    if (u.pathname !== "/" && normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return null;
  }
}

function isAssetUrl(urlStr) {
  const ext = extname(new URL(urlStr, origin).pathname).toLowerCase();
  return (
    IMAGE_EXTENSIONS.includes(ext) ||
    DOC_EXTENSIONS.includes(ext) ||
    [".css", ".js", ".woff", ".woff2", ".ttf", ".eot", ".otf"].includes(ext)
  );
}

function isSkippableUrl(urlStr) {
  const u = new URL(urlStr, origin);
  const path = u.pathname.toLowerCase();
  // Skip WordPress admin, login, feed, API, etc.
  const skipPatterns = [
    "/wp-admin",
    "/wp-login",
    "/wp-json",
    "/feed",
    "/xmlrpc",
    "/wp-content/plugins",
    "/wp-content/themes",
    "/wp-includes",
    "?replytocom=",
    "?share=",
    "#respond",
    "/cart",
    "/checkout",
    "/my-account",
    "/wp-cron",
  ];
  return skipPatterns.some((p) => path.includes(p) || u.href.includes(p));
}

// ── Phase 1: URL Discovery ──────────────────────────────────────────────────

async function discoverFromSitemap() {
  const sitemapPaths = [
    "/sitemap.xml",
    "/sitemap_index.xml",
    "/wp-sitemap.xml",
    "/sitemap.xml.gz",
    "/post-sitemap.xml",
    "/page-sitemap.xml",
  ];

  for (const path of sitemapPaths) {
    try {
      const url = `${origin}${path}`;
      log(`Trying sitemap: ${url}`);
      const res = await fetchWithTimeout(url);
      if (!res.ok) continue;

      const text = await res.text();
      if (!text.includes("<")) continue;

      await parseSitemap(text, url);
      log(`Found sitemap at ${path} — ${discoveredUrls.size} URLs so far`);
    } catch {
      // Skip this sitemap path
    }
  }
}

async function parseSitemap(xml, sourceUrl) {
  try {
    const result = await parseStringPromise(xml, { explicitArray: false });

    // Sitemap index (contains other sitemaps)
    if (result.sitemapindex?.sitemap) {
      const sitemaps = Array.isArray(result.sitemapindex.sitemap)
        ? result.sitemapindex.sitemap
        : [result.sitemapindex.sitemap];

      for (const sm of sitemaps) {
        const loc = sm.loc?._ || sm.loc;
        if (!loc) continue;
        try {
          log(`  Fetching nested sitemap: ${loc}`);
          const res = await fetchWithTimeout(loc);
          if (res.ok) {
            const text = await res.text();
            await parseSitemap(text, loc);
          }
        } catch {
          // Skip nested sitemap
        }
        await delay(100);
      }
    }

    // URL set (contains page URLs)
    if (result.urlset?.url) {
      const urls = Array.isArray(result.urlset.url)
        ? result.urlset.url
        : [result.urlset.url];

      for (const entry of urls) {
        const loc = entry.loc?._ || entry.loc;
        if (!loc) continue;
        const normalized = normalizeUrl(loc);
        if (normalized && isInternalUrl(normalized) && !isSkippableUrl(normalized)) {
          discoveredUrls.add(normalized);
        }

        // Check for hreflang in sitemap
        if (entry["xhtml:link"]) {
          const links = Array.isArray(entry["xhtml:link"])
            ? entry["xhtml:link"]
            : [entry["xhtml:link"]];
          for (const link of links) {
            const href = link?.$?.href;
            const lang = link?.$?.hreflang;
            if (href && lang) {
              const normalizedHref = normalizeUrl(href);
              if (normalizedHref) {
                discoveredUrls.add(normalizedHref);
                if (!languages.has(lang)) languages.set(lang, []);
                languages.get(lang).push(normalizedHref);
              }
            }
          }
        }
      }
    }
  } catch (e) {
    log(`  Warning: Failed to parse sitemap ${sourceUrl}: ${e.message}`);
  }
}

async function crawlForLinks(pageUrl) {
  if (crawledUrls.has(pageUrl) || crawledUrls.size >= MAX_PAGES) return;
  crawledUrls.add(pageUrl);

  try {
    const res = await fetchWithTimeout(pageUrl);
    if (!res.ok) {
      failedUrls.set(pageUrl, `HTTP ${res.status}`);
      return;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract all internal links
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const normalized = normalizeUrl(href);
      if (
        normalized &&
        isInternalUrl(normalized) &&
        !isSkippableUrl(normalized) &&
        !isAssetUrl(normalized) &&
        !crawledUrls.has(normalized)
      ) {
        discoveredUrls.add(normalized);
      }
    });

    // Extract hreflang from HTML
    $('link[rel="alternate"][hreflang]').each((_, el) => {
      const href = $(el).attr("href");
      const lang = $(el).attr("hreflang");
      if (href && lang && lang !== "x-default") {
        const normalizedHref = normalizeUrl(href);
        if (normalizedHref) {
          discoveredUrls.add(normalizedHref);
          if (!languages.has(lang)) languages.set(lang, []);
          languages.get(lang).push(normalizedHref);
        }
      }
    });
  } catch (e) {
    failedUrls.set(pageUrl, e.message);
  }
}

async function discoverAllUrls() {
  log("=== Phase 1: URL Discovery ===");

  // Step 1: Sitemaps
  await discoverFromSitemap();
  log(`After sitemaps: ${discoveredUrls.size} URLs`);

  // Step 2: If no sitemap found, start from homepage
  if (discoveredUrls.size === 0) {
    log("No sitemap found, starting from homepage...");
    discoveredUrls.add(normalizeUrl(origin));
  }

  // Step 3: Recursive crawl to find more URLs
  log("Starting recursive crawl...");
  const urlsToCrawl = [...discoveredUrls];
  let crawled = 0;

  while (urlsToCrawl.length > 0 && crawledUrls.size < MAX_PAGES) {
    const batch = urlsToCrawl.splice(0, MAX_CONCURRENT);
    await Promise.all(batch.map((url) => crawlForLinks(url)));
    crawled += batch.length;

    // Add newly discovered URLs to the crawl queue
    for (const url of discoveredUrls) {
      if (!crawledUrls.has(url) && !urlsToCrawl.includes(url)) {
        urlsToCrawl.push(url);
      }
    }

    if (crawled % 20 === 0) {
      log(`  Crawled ${crawled} pages, discovered ${discoveredUrls.size} URLs`);
    }
    await delay(REQUEST_DELAY_MS);
  }

  log(`Discovery complete: ${discoveredUrls.size} unique URLs found`);
}

// ── Phase 2: Content Extraction ─────────────────────────────────────────────

function extractPageContent(html, url) {
  const $ = cheerio.load(html);

  // Remove scripts, styles, nav, footer for clean content extraction
  const $content = cheerio.load(html);
  $content("script, style, noscript, iframe[src*='facebook'], iframe[src*='twitter']").remove();

  // ─ Meta tags ─
  const meta = {
    title: $("title").text().trim(),
    description: $('meta[name="description"]').attr("content")?.trim() || "",
    ogTitle: $('meta[property="og:title"]').attr("content")?.trim() || "",
    ogDescription: $('meta[property="og:description"]').attr("content")?.trim() || "",
    ogImage: $('meta[property="og:image"]').attr("content")?.trim() || "",
    canonical: $('link[rel="canonical"]').attr("href")?.trim() || "",
    robots: $('meta[name="robots"]').attr("content")?.trim() || "",
  };

  // ─ Hreflang ─
  const hreflang = {};
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    const lang = $(el).attr("hreflang");
    const href = $(el).attr("href");
    if (lang && href) hreflang[lang] = href;
  });

  // ─ Structured content ─
  const sections = [];

  // Try to find main content area
  const mainSelectors = [
    "main",
    "article",
    ".entry-content",
    ".post-content",
    ".page-content",
    "#content",
    ".content",
    ".site-content",
    "#main",
    ".main-content",
    '[role="main"]',
  ];

  let $main = null;
  for (const sel of mainSelectors) {
    if ($(sel).length) {
      $main = $(sel).first();
      break;
    }
  }
  if (!$main) $main = $("body");

  // Extract structured content from main area
  const extractSection = ($el) => {
    const section = { elements: [] };

    $el.children().each((_, child) => {
      const $child = $(child);
      const tag = child.tagName?.toLowerCase();

      if (!tag) return;

      if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
        section.elements.push({
          type: "heading",
          level: parseInt(tag[1]),
          text: $child.text().trim(),
        });
      } else if (tag === "p") {
        const text = $child.text().trim();
        if (text) {
          section.elements.push({ type: "paragraph", text });
        }
        // Check for images inside paragraphs
        $child.find("img").each((_, img) => {
          const src = $(img).attr("src") || $(img).attr("data-src") || "";
          const alt = $(img).attr("alt")?.trim() || "";
          if (src) {
            section.elements.push({ type: "image", src, alt });
          }
        });
      } else if (tag === "ul" || tag === "ol") {
        const items = [];
        $child.find("li").each((_, li) => {
          items.push($(li).text().trim());
        });
        if (items.length) {
          section.elements.push({ type: "list", ordered: tag === "ol", items });
        }
      } else if (tag === "img") {
        const src = $child.attr("src") || $child.attr("data-src") || "";
        const alt = $child.attr("alt")?.trim() || "";
        if (src) {
          section.elements.push({ type: "image", src, alt });
        }
      } else if (tag === "figure") {
        const $img = $child.find("img");
        const $caption = $child.find("figcaption");
        if ($img.length) {
          section.elements.push({
            type: "figure",
            src: $img.attr("src") || $img.attr("data-src") || "",
            alt: $img.attr("alt")?.trim() || "",
            caption: $caption.text().trim(),
          });
        }
      } else if (tag === "blockquote") {
        section.elements.push({
          type: "blockquote",
          text: $child.text().trim(),
        });
      } else if (tag === "table") {
        const rows = [];
        $child.find("tr").each((_, tr) => {
          const cells = [];
          $(tr)
            .find("td, th")
            .each((_, cell) => {
              cells.push($(cell).text().trim());
            });
          rows.push(cells);
        });
        section.elements.push({ type: "table", rows });
      } else if (
        ["section", "div", "article", "aside", "main"].includes(tag)
      ) {
        // Recurse into container elements
        const nested = extractSection($child);
        if (nested.elements.length) {
          section.elements.push(...nested.elements);
        }
      } else {
        // Generic block with text
        const text = $child.text().trim();
        if (text && text.length > 10) {
          section.elements.push({ type: "text", tag, text });
        }
      }
    });

    return section;
  };

  const mainContent = extractSection($main);

  // ─ Full text (for word-for-word verification) ─
  // Remove navigation and footer for cleaner text
  const $bodyClean = cheerio.load(html);
  $bodyClean("script, style, noscript, nav, header, footer, .menu, .navigation, .sidebar, .widget").remove();
  const fullText = $bodyClean("body").text().replace(/\s+/g, " ").trim();

  // ─ Images ─
  const pageImages = [];
  $("img").each((_, img) => {
    const src = $(img).attr("src") || $(img).attr("data-src") || $(img).attr("data-lazy-src") || "";
    const srcset = $(img).attr("srcset") || $(img).attr("data-srcset") || "";
    const alt = $(img).attr("alt")?.trim() || "";
    if (src && !src.startsWith("data:")) {
      const absoluteSrc = new URL(src, url).href;
      pageImages.push({ src: absoluteSrc, alt, srcset });
      if (isInternalUrl(absoluteSrc)) {
        imageUrls.add(absoluteSrc);
      }
    }
  });

  // Also check background images in style attributes
  $("[style*='background']").each((_, el) => {
    const style = $(el).attr("style") || "";
    const match = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (match) {
      try {
        const bgUrl = new URL(match[1], url).href;
        if (isInternalUrl(bgUrl)) imageUrls.add(bgUrl);
        pageImages.push({ src: bgUrl, alt: "", type: "background" });
      } catch {}
    }
  });

  // ─ Documents (PDFs, etc.) ─
  const pageDocuments = [];
  $('a[href]').each((_, a) => {
    const href = $(a).attr("href") || "";
    const ext = extname(href).toLowerCase();
    if (DOC_EXTENSIONS.includes(ext)) {
      try {
        const absoluteHref = new URL(href, url).href;
        const linkText = $(a).text().trim();
        pageDocuments.push({ url: absoluteHref, text: linkText, type: ext });
        docUrls.add(absoluteHref);
      } catch {}
    }
  });

  // ─ Video embeds ─
  const videoEmbeds = [];
  $("iframe").each((_, iframe) => {
    const src = $(iframe).attr("src") || $(iframe).attr("data-src") || "";
    if (
      src.includes("youtube") ||
      src.includes("vimeo") ||
      src.includes("dailymotion") ||
      src.includes("youtu.be")
    ) {
      videoEmbeds.push({
        src,
        width: $(iframe).attr("width") || "",
        height: $(iframe).attr("height") || "",
      });
    }
  });

  // ─ Internal links ─
  const internalLinks = [];
  const externalLinks = [];
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    const text = $(a).text().trim();
    try {
      const absoluteHref = new URL(href, url).href;
      if (isInternalUrl(absoluteHref)) {
        internalLinks.push({ url: absoluteHref, text });
      } else {
        externalLinks.push({ url: absoluteHref, text });
      }
    } catch {}
  });

  // ─ CSS links ─
  $('link[rel="stylesheet"]').each((_, link) => {
    const href = $(link).attr("href");
    if (href) {
      try {
        cssUrls.add(new URL(href, url).href);
      } catch {}
    }
  });

  // ─ Forms ─
  const forms = [];
  $("form").each((_, form) => {
    const $form = $(form);
    const fields = [];
    $form.find("input, textarea, select").each((_, field) => {
      const $field = $(field);
      fields.push({
        tag: field.tagName.toLowerCase(),
        type: $field.attr("type") || "",
        name: $field.attr("name") || "",
        placeholder: $field.attr("placeholder") || "",
        required: $field.attr("required") !== undefined,
      });
    });
    forms.push({
      action: $form.attr("action") || "",
      method: $form.attr("method") || "get",
      fields,
    });
  });

  // ─ Navigation structure ─
  const navigation = [];
  $("nav a, .menu a, .nav a, #menu a, .navigation a").each((_, a) => {
    const href = $(a).attr("href");
    const text = $(a).text().trim();
    if (href && text) {
      navigation.push({ url: href, text });
    }
  });

  // ─ Schema.org ─
  const schemas = [];
  $('script[type="application/ld+json"]').each((_, script) => {
    try {
      schemas.push(JSON.parse($(script).html()));
    } catch {}
  });

  return {
    url,
    slug: new URL(url).pathname,
    meta,
    hreflang,
    content: mainContent,
    fullText,
    images: pageImages,
    documents: pageDocuments,
    videoEmbeds,
    internalLinks,
    externalLinks,
    forms,
    navigation: navigation.length ? navigation : undefined,
    schemas: schemas.length ? schemas : undefined,
  };
}

async function extractAllPages() {
  log("=== Phase 2: Content Extraction ===");
  const urls = [...discoveredUrls];
  let processed = 0;

  // Process in batches
  for (let i = 0; i < urls.length; i += MAX_CONCURRENT) {
    const batch = urls.slice(i, i + MAX_CONCURRENT);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        try {
          const res = await fetchWithTimeout(url);
          if (!res.ok) {
            failedUrls.set(url, `HTTP ${res.status}`);
            return null;
          }
          const contentType = res.headers.get("content-type") || "";
          if (!contentType.includes("text/html")) return null;

          const html = await res.text();
          return extractPageContent(html, url);
        } catch (e) {
          failedUrls.set(url, e.message);
          return null;
        }
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        pages.push(result.value);
      }
    }

    processed += batch.length;
    if (processed % 10 === 0 || processed === urls.length) {
      log(`  Extracted ${processed}/${urls.length} pages`);
    }
    await delay(REQUEST_DELAY_MS);
  }

  log(`Extraction complete: ${pages.length} pages extracted`);
}

// ── Phase 3: Asset Download ─────────────────────────────────────────────────

async function downloadFile(url, dir) {
  try {
    const res = await fetchWithTimeout(url, 30000);
    if (!res.ok) return null;

    const urlPath = new URL(url).pathname;
    let filename = basename(urlPath) || "unknown";
    // Sanitize filename
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    // Ensure unique filename
    let finalPath = join(dir, filename);
    let counter = 1;
    while (existsSync(finalPath)) {
      const ext = extname(filename);
      const name = filename.slice(0, -ext.length || undefined);
      finalPath = join(dir, `${name}_${counter}${ext}`);
      counter++;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(finalPath, buffer);
    totalDownloaded++;
    return finalPath;
  } catch {
    return null;
  }
}

async function downloadAllAssets() {
  log("=== Phase 3: Asset Download ===");

  const imgDir = join(OUTPUT_DIR, "assets", "images");
  const docDir = join(OUTPUT_DIR, "assets", "docs");
  mkdirSync(imgDir, { recursive: true });
  mkdirSync(docDir, { recursive: true });

  // Download images
  const imageList = [...imageUrls];
  log(`Downloading ${imageList.length} images...`);
  const imageMap = {};

  for (let i = 0; i < imageList.length; i += MAX_CONCURRENT) {
    const batch = imageList.slice(i, i + MAX_CONCURRENT);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        const localPath = await downloadFile(url, imgDir);
        if (localPath) {
          imageMap[url] = localPath.replace(OUTPUT_DIR, "");
        }
      })
    );
    if ((i + MAX_CONCURRENT) % 50 === 0) {
      log(`  Images: ${Math.min(i + MAX_CONCURRENT, imageList.length)}/${imageList.length}`);
    }
    await delay(100);
  }

  // Download documents
  const docList = [...docUrls];
  log(`Downloading ${docList.length} documents...`);
  const docMap = {};

  for (let i = 0; i < docList.length; i += MAX_CONCURRENT) {
    const batch = docList.slice(i, i + MAX_CONCURRENT);
    await Promise.allSettled(
      batch.map(async (url) => {
        const localPath = await downloadFile(url, docDir);
        if (localPath) {
          docMap[url] = localPath.replace(OUTPUT_DIR, "");
        }
      })
    );
    await delay(100);
  }

  log(`Downloaded ${totalDownloaded} assets total`);
  return { imageMap, docMap };
}

// ── Phase 4: Design Token Extraction ────────────────────────────────────────

async function extractDesignTokens() {
  log("=== Phase 4: Design Token Extraction ===");

  // Fetch and parse CSS files
  for (const cssUrl of cssUrls) {
    try {
      const res = await fetchWithTimeout(cssUrl);
      if (!res.ok) continue;
      const css = await res.text();

      // Extract colors (hex, rgb, rgba, hsl)
      const hexMatches = css.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
      hexMatches.forEach((c) => colors.add(c.toLowerCase()));

      const rgbMatches =
        css.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g) || [];
      rgbMatches.forEach((c) => colors.add(c));

      const hslMatches =
        css.match(/hsla?\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+\s*)?\)/g) || [];
      hslMatches.forEach((c) => colors.add(c));

      // Extract font families
      const fontMatches = css.match(/font-family\s*:\s*([^;]+)/g) || [];
      fontMatches.forEach((m) => {
        const value = m.replace("font-family:", "").trim();
        fontFamilies.add(value);
      });

      // Extract @font-face urls
      const fontFaceRegex = /@font-face\s*\{[^}]*url\(['"]?([^'")\s]+)['"]?\)[^}]*\}/g;
      let match;
      while ((match = fontFaceRegex.exec(css)) !== null) {
        try {
          fontFileUrls.add(new URL(match[1], cssUrl).href);
        } catch {}
      }
    } catch {}
    await delay(100);
  }

  // Also extract inline styles from homepage
  const homepage = pages.find((p) => new URL(p.url).pathname === "/");
  if (homepage) {
    try {
      const res = await fetchWithTimeout(homepage.url);
      const html = await res.text();
      const $ = cheerio.load(html);

      // Inline style blocks
      $("style").each((_, style) => {
        const css = $(style).html() || "";
        const hexMatches = css.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
        hexMatches.forEach((c) => colors.add(c.toLowerCase()));
      });

      // CSS custom properties
      const rootStyle = $("style")
        .toArray()
        .map((s) => $(s).html())
        .join(" ");
      const varMatches = rootStyle.match(/--[a-zA-Z-]+\s*:\s*[^;]+/g) || [];
      const cssVars = {};
      varMatches.forEach((m) => {
        const [name, value] = m.split(":").map((s) => s.trim());
        cssVars[name] = value;
      });
    } catch {}
  }

  // Filter out common/meaningless colors
  const meaninglessColors = new Set([
    "#000",
    "#000000",
    "#fff",
    "#ffffff",
    "#333",
    "#333333",
    "#666",
    "#666666",
    "#999",
    "#999999",
    "#ccc",
    "#cccccc",
    "#eee",
    "#eeeeee",
    "#f5f5f5",
    "#fafafa",
    "transparent",
    "inherit",
  ]);

  const significantColors = [...colors].filter(
    (c) => !meaninglessColors.has(c.toLowerCase())
  );

  const tokens = {
    colors: {
      all: [...colors],
      significant: significantColors.slice(0, 30), // Top 30 unique colors
    },
    fonts: {
      families: [...fontFamilies],
      files: [...fontFileUrls],
    },
  };

  log(`Found ${significantColors.length} significant colors, ${fontFamilies.size} font families`);
  return tokens;
}

// ── Phase 5: Report Generation ──────────────────────────────────────────────

function generateReport(assetMaps, designTokens) {
  log("=== Phase 5: Report Generation ===");

  // Build architecture tree
  const architecture = {};
  for (const page of pages) {
    const path = new URL(page.url).pathname;
    const parts = path.split("/").filter(Boolean);
    let current = architecture;
    for (const part of parts) {
      if (!current[part]) current[part] = {};
      current = current[part];
    }
  }

  // Detect languages
  const detectedLanguages = {};
  for (const [lang, urls] of languages) {
    detectedLanguages[lang] = {
      count: [...new Set(urls)].length,
      sampleUrls: [...new Set(urls)].slice(0, 5),
    };
  }

  const report = {
    site: {
      url: origin,
      crawledAt: new Date().toISOString(),
      totalPages: pages.length,
      totalImages: imageUrls.size,
      totalDocuments: docUrls.size,
      failedUrls: Object.fromEntries(failedUrls),
    },
    languages: detectedLanguages,
    isMultilingual: languages.size > 1,
    architecture,
    pages: pages.map((p) => ({
      url: p.url,
      slug: p.slug,
      title: p.meta.title,
      description: p.meta.description,
      imageCount: p.images.length,
      hasForm: p.forms.length > 0,
      videoEmbeds: p.videoEmbeds.length,
      documents: p.documents.length,
    })),
    designTokens,
    assetMaps,
  };

  // Save report
  writeFileSync(
    join(OUTPUT_DIR, "crawl-report.json"),
    JSON.stringify(report, null, 2)
  );

  // Save per-page content
  const pagesDir = join(OUTPUT_DIR, "pages");
  mkdirSync(pagesDir, { recursive: true });

  for (const page of pages) {
    const slug = slugFromUrl(page.url);
    writeFileSync(
      join(pagesDir, `${slug}.json`),
      JSON.stringify(page, null, 2)
    );
  }

  // Save design tokens separately
  writeFileSync(
    join(OUTPUT_DIR, "design-tokens.json"),
    JSON.stringify(designTokens, null, 2)
  );

  log(`Report saved to ${OUTPUT_DIR}/crawl-report.json`);
  return report;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n========================================`);
  console.log(`  WP Migration Crawler`);
  console.log(`  Site: ${origin}`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log(`========================================\n`);

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Phase 1
  await discoverAllUrls();

  // Phase 2
  await extractAllPages();

  // Phase 3
  const assetMaps = await downloadAllAssets();

  // Phase 4
  const tokens = await extractDesignTokens();

  // Phase 5
  const report = generateReport(assetMaps, tokens);

  // Summary
  console.log(`\n========================================`);
  console.log(`  CRAWL COMPLETE`);
  console.log(`========================================`);
  console.log(`  Pages found:     ${report.site.totalPages}`);
  console.log(`  Images:          ${report.site.totalImages}`);
  console.log(`  Documents:       ${report.site.totalDocuments}`);
  console.log(`  Failed URLs:     ${failedUrls.size}`);
  console.log(`  Languages:       ${languages.size > 1 ? [...languages.keys()].join(", ") : "single"}`);
  console.log(`  Colors found:    ${tokens.colors.significant.length}`);
  console.log(`  Font families:   ${tokens.fonts.families.length}`);
  console.log(`  Output dir:      ${OUTPUT_DIR}`);
  console.log(`========================================\n`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
