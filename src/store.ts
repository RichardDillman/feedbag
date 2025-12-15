import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { DATA_DIR } from './config.js';

const SEEN_FILE = `${DATA_DIR}/seen.json`;
const MAX_AGE_DAYS = 30; // Forget items older than this

interface StoredData {
  urls: Record<string, number>; // url -> timestamp
  titleHashes: Record<string, number>; // hash -> timestamp
}

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load(): StoredData {
  ensureDataDir();
  if (!existsSync(SEEN_FILE)) {
    return { urls: {}, titleHashes: {} };
  }
  try {
    const data = readFileSync(SEEN_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { urls: {}, titleHashes: {} };
  }
}

function save(data: StoredData): void {
  ensureDataDir();
  writeFileSync(SEEN_FILE, JSON.stringify(data, null, 2));
}

function prune(data: StoredData): StoredData {
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  
  const urls: Record<string, number> = {};
  for (const [url, ts] of Object.entries(data.urls)) {
    if (ts > cutoff) urls[url] = ts;
  }
  
  const titleHashes: Record<string, number> = {};
  for (const [hash, ts] of Object.entries(data.titleHashes)) {
    if (ts > cutoff) titleHashes[hash] = ts;
  }
  
  return { urls, titleHashes };
}

// Simple hash for title dedup
export function hashTitle(title: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Simple hash - not cryptographic, just for dedup
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function isUrlSeen(url: string): boolean {
  const data = load();
  return url in data.urls;
}

export function isTitleSeen(title: string): boolean {
  const data = load();
  const hash = hashTitle(title);
  return hash in data.titleHashes;
}

export function markSeen(url: string, title: string): void {
  const data = load();
  const now = Date.now();
  
  data.urls[url] = now;
  data.titleHashes[hashTitle(title)] = now;
  
  save(prune(data));
}

export function markAllSeen(items: Array<{ link: string; title: string }>): void {
  const data = load();
  const now = Date.now();
  
  for (const item of items) {
    data.urls[item.link] = now;
    data.titleHashes[hashTitle(item.title)] = now;
  }
  
  save(prune(data));
}

export function clearSeen(): void {
  ensureDataDir();
  save({ urls: {}, titleHashes: {} });
}

export function getStats(): { urls: number; titles: number } {
  const data = load();
  return {
    urls: Object.keys(data.urls).length,
    titles: Object.keys(data.titleHashes).length,
  };
}
