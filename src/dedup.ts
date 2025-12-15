import { FeedItem } from './types.js';
import { isUrlSeen, isTitleSeen, hashTitle } from './store.js';
import { PRIORITY_TOPICS, INTEREST_TOPICS, SKIP_TOPICS } from './config.js';

// Jaccard similarity for title comparison
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export function filterSeen(items: FeedItem[]): FeedItem[] {
  return items.filter((item) => {
    // Check URL first (fast)
    if (isUrlSeen(item.link)) return false;
    
    // Check title hash (catches same story, different URL)
    if (isTitleSeen(item.title)) return false;
    
    return true;
  });
}

export function deduplicateSimilar(items: FeedItem[], threshold = 0.6): FeedItem[] {
  const seen: Array<{ tokens: Set<string>; item: FeedItem }> = [];
  const result: FeedItem[] = [];
  
  for (const item of items) {
    const tokens = tokenize(item.title);
    
    // Check if similar to any already-seen item
    let isDuplicate = false;
    for (const { tokens: seenTokens } of seen) {
      if (jaccardSimilarity(tokens, seenTokens) > threshold) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.push({ tokens, item });
      result.push(item);
    }
  }
  
  return result;
}

function matchesTopic(text: string, topics: string[]): boolean {
  const lower = text.toLowerCase();
  return topics.some((topic) => lower.includes(topic.toLowerCase()));
}

export function scorePriority(item: FeedItem): number {
  let score = 0;
  const text = `${item.title} ${item.snippet || ''}`;
  
  // Priority topics boost
  if (matchesTopic(text, PRIORITY_TOPICS)) {
    score += 10;
  }
  
  // Interest topics minor boost
  if (matchesTopic(text, INTEREST_TOPICS)) {
    score += 5;
  }
  
  // Skip topics penalty
  if (matchesTopic(text, SKIP_TOPICS)) {
    score -= 20;
  }
  
  // Category weight
  if (item.category === 'essential') score += 3;
  if (item.category === 'professional') score += 1;
  
  // Recency bonus (items from last 24h)
  const ageHours = (Date.now() - item.pubDate.getTime()) / (1000 * 60 * 60);
  if (ageHours < 24) score += 2;
  if (ageHours < 6) score += 3;
  
  return score;
}

export function filterSkipTopics(items: FeedItem[]): { kept: FeedItem[]; skipped: FeedItem[] } {
  const kept: FeedItem[] = [];
  const skipped: FeedItem[] = [];
  
  for (const item of items) {
    const text = `${item.title} ${item.snippet || ''}`;
    if (matchesTopic(text, SKIP_TOPICS)) {
      skipped.push(item);
    } else {
      kept.push(item);
    }
  }
  
  return { kept, skipped };
}

export function sortByPriority(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => scorePriority(b) - scorePriority(a));
}

export function processItems(items: FeedItem[]): {
  items: FeedItem[];
  skipped: string[];
} {
  // Step 1: Remove already-seen items
  let processed = filterSeen(items);
  
  // Step 2: Remove similar titles (cross-source dedup)
  processed = deduplicateSimilar(processed);
  
  // Step 3: Filter skip topics
  const { kept, skipped } = filterSkipTopics(processed);
  
  // Step 4: Sort by priority
  const sorted = sortByPriority(kept);
  
  return {
    items: sorted,
    skipped: skipped.map((i) => `${i.source}: ${i.title}`),
  };
}
