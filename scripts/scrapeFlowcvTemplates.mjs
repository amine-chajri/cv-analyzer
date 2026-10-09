#!/usr/bin/env node
/**
 * Scrapes FlowCV's public resume-template catalogue (flowcv.com/resume-templates)
 * into local data files used by the app.
 *
 * Outputs:
 *   client/src/data/flowcvTemplates.json     full manifest (slug, name, tags, design, image)
 *   server/config/flowcvTemplateSlugs.json   flat slug list for server-side validation
 *   client/public/templates/<slug>.webp      480px preview image per template
 *
 * Only publicly visible listing data is collected: template slug, display name,
 * category tags, the "design" phrase from each template page's <title>, and the
 * template preview images FlowCV serves from its own CDN.
 *
 * Usage:
 *   node scripts/scrapeFlowcvTemplates.mjs [--html <saved-listing.html>] [--skip-detail] [--skip-images]
 */

import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LISTING_URL = 'https://flowcv.com/resume-templates';
const ASSET_BASE = 'https://prod.flowcvassets.com/resume-templates';
const DETAIL_BASE = 'https://flowcv.com/resume-template';

// Plain browser UA: Cloudflare occasionally blocks requests without one.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const SKIP_DETAIL = args.includes('--skip-detail');
const SKIP_IMAGES = args.includes('--skip-images');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** Fetch with one retry, or null on final failure. */
async function fetchTextWithRetry(url) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetchText(url);
    } catch (err) {
      if (attempt === 1) return null;
      await sleep(600 * (attempt + 1));
    }
  }
  return null;
}

/** Run async workers over a list with bounded concurrency. */
async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

// --- 1. Listing page -------------------------------------------------------

async function getListingHtml() {
  const saved = flag('--html');
  if (saved) {
    const candidates = [saved, path.resolve(ROOT, saved)];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        console.log(`Using saved listing HTML: ${candidate}`);
        return readFile(candidate, 'utf8');
      }
    }
    console.warn(`--html "${saved}" not found, falling back to live fetch.`);
  }
  console.log(`Fetching ${LISTING_URL} …`);
  const html = await fetchText(LISTING_URL);
  if (!html.includes('resume-template')) throw new Error('Listing page did not contain template links');
  return html;
}

// --- 2. Parse template cards ------------------------------------------------

const CARD_RE =
  /<a href="(\/resume-template\/[a-z0-9-]+)" class="js-template[^"]*"[^>]*?data-tags="([^"]*)">([\s\S]*?)<\/a>/g;
const NAME_RE = /alt="FlowCV Resume Template: ([^"]+)"/;
const ASSET_RE = /resume-templates\/([A-Za-z0-9_-]+)\//;

function parseCards(html) {
  // The same design appears in several category sections; dedupe by slug and
  // union its tags while preserving first-seen (page) order.
  const bySlug = new Map();
  for (const [, href, tagsRaw, body] of html.matchAll(CARD_RE)) {
    const slug = href.replace('/resume-template/', '');
    const name = body.match(NAME_RE)?.[1]?.trim();
    const asset = body.match(ASSET_RE)?.[1];
    if (!name || !asset) {
      console.warn(`Skipping card without name/asset: ${slug}`);
      continue;
    }
    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
    if (!bySlug.has(slug)) {
      bySlug.set(slug, { slug, name, asset, tags: new Set(tags) });
    } else {
      for (const tag of tags) bySlug.get(slug).tags.add(tag);
    }
  }
  return [...bySlug.values()].map(({ tags, ...t }) => ({ ...t, tags: [...tags] }));
}

// --- 3. Detail pages → design phrase ----------------------------------------

// Titles on flowcv template pages are stale boilerplate (several templates share
// "One-Column Layout with Serif Font" regardless of their real design), so the
// per-template meta description is the only trustworthy scraped copy.
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&(?:apos|#39|#x27|rsquo);/g, '’')
    .replace(/&(?:quot|#34);/g, '"')
    .replace(/&lsquo;/g, '‘')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&nbsp;/g, ' ');
}

function designFromHtml(html) {
  const meta =
    html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] ??
    html.match(/<meta\s+content="([^"]*)"\s+name="description"/i)?.[1];
  if (!meta) return null;
  const clean = decodeEntities(meta)
    .replace(/(?:\s+(?:Build your resume\b|Download now\.?|Get hired faster!))+\s*$/g, '')
    .trim();
  if (!clean) return null;
  // Skip generic stubs shared across pages — keep only per-template copy.
  if (/^use this resume template/i.test(clean)) return null;
  if (/no longer available/i.test(clean)) return null;
  return clean;
}

async function fetchDesign(slug) {
  const html = await fetchTextWithRetry(`${DETAIL_BASE}/${slug}`);
  return html ? designFromHtml(html) : null;
}

// --- 4. Images ---------------------------------------------------------------

async function downloadImage(asset, dest) {
  const url = `${ASSET_BASE}/${asset}/480.webp`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error(`Suspiciously small file (${buf.length} B) for ${url}`);
  await writeFile(dest, buf);
}

// --- Main ---------------------------------------------------------------------

async function main() {
  const html = await getListingHtml();
  const templates = parseCards(html);

  if (templates.length === 0) {
    throw new Error('No template cards parsed — listing markup may have changed.');
  }
  console.log(`Parsed ${templates.length} unique templates.`);

  if (!SKIP_DETAIL) {
    console.log('Fetching design phrases from template detail pages …');
    let done = 0;
    const designs = await pool(templates, 6, async (t) => {
      const design = await fetchDesign(t.slug);
      await sleep(100); // stay polite with detail-page requests
      done += 1;
      if (done % 20 === 0) console.log(`  … ${done}/${templates.length}`);
      return design;
    });
    templates.forEach((t, i) => {
      t.design = designs[i];
    });
    const missing = templates.filter((t) => !t.design).length;
    console.log(missing ? `${missing} designs fell back to tag-derived copy.` : 'All design phrases fetched.');
  } else {
    templates.forEach((t) => {
      t.design = null;
    });
  }

  const manifest = templates.map((t) => ({
    slug: t.slug,
    name: t.name,
    tags: t.tags,
    design: t.design,
    image: `/templates/${t.slug}.webp`,
  }));

  const outDir = path.join(ROOT, 'client', 'src', 'data');
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, 'flowcvTemplates.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  const serverDir = path.join(ROOT, 'server', 'config');
  await mkdir(serverDir, { recursive: true });
  await writeFile(
    path.join(serverDir, 'flowcvTemplateSlugs.json'),
    `${JSON.stringify(manifest.map((t) => t.slug), null, 2)}\n`
  );

  if (!SKIP_IMAGES) {
    const imgDir = path.join(ROOT, 'client', 'public', 'templates');
    await mkdir(imgDir, { recursive: true });
    console.log('Downloading preview images (480px webp) …');
    let ok = 0;
    const results = await pool(templates, 8, async (t) => {
      try {
        await downloadImage(t.asset, path.join(imgDir, `${t.slug}.webp`));
        ok += 1;
        return true;
      } catch (err) {
        console.warn(`  image failed: ${t.slug}: ${err.message}`);
        return false;
      }
    });
    console.log(`Downloaded ${ok}/${templates.length} images.`);
    if (results.includes(false)) process.exitCode = 1;
  }

  console.log(`Wrote flowcvTemplates.json (${manifest.length} templates) and flowcvTemplateSlugs.json.`);
}

main().catch((err) => {
  console.error(`Scrape failed: ${err.message}`);
  process.exit(1);
});
