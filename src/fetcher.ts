import Parser from 'rss-parser';
import { FeedConfig, FeedItem } from './types.js';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'feedbag/0.1.0 (personal news aggregator)',
  },
});

export async function fetchRssFeed(config: FeedConfig): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(config.url);
    
    return (feed.items || []).map((item) => ({
      id: item.guid || item.link || item.title || '',
      title: item.title || 'Untitled',
      link: item.link || '',
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      source: config.name,
      category: config.category,
      snippet: item.contentSnippet?.slice(0, 200) || item.content?.slice(0, 200),
    }));
  } catch (error) {
    console.error(`Failed to fetch ${config.name}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function scrapeSyntaxSnackPack(): Promise<FeedItem[]> {
  // Syntax Snack Pack doesn't have RSS, so we scrape the archive page
  // For now, return empty - implement scraping later
  // The archive is at https://syntax.fm/snackpack
  
  try {
    const response = await fetch('https://syntax.fm/snackpack');
    const html = await response.text();
    
    // Simple regex extraction for the newsletter links
    // Format: <a href="/snackpack/XXXXXX">...<date>...</a>
    const items: FeedItem[] = [];
    
    // Match the list items in the Past Issues section
    const linkRegex = /href="(\/snackpack\/\d+)"[^>]*>[\s\S]*?(\w+ \d+, \d{4})[\s\S]*?Snack Pack[:\s]*(.*?)<\/a>/gi;
    
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const [, path, dateStr, title] = match;
      items.push({
        id: path,
        title: `Syntax Snack Pack: ${title.trim()}`,
        link: `https://syntax.fm${path}`,
        pubDate: new Date(dateStr),
        source: 'Syntax Snack Pack',
        category: 'essential',
        snippet: undefined,
      });
    }
    
    // Fallback: simpler extraction if regex didn't work
    if (items.length === 0) {
      const simpleRegex = /href="(\/snackpack\/(\d+))"[^>]*>/gi;
      while ((match = simpleRegex.exec(html)) !== null) {
        const [, path] = match;
        items.push({
          id: path,
          title: 'Syntax Snack Pack',
          link: `https://syntax.fm${path}`,
          pubDate: new Date(),
          source: 'Syntax Snack Pack',
          category: 'essential',
        });
      }
    }
    
    return items.slice(0, 10); // Only recent issues
  } catch (error) {
    console.error('Failed to scrape Syntax Snack Pack:', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function fetchFeed(config: FeedConfig): Promise<FeedItem[]> {
  if (config.type === 'rss') {
    return fetchRssFeed(config);
  }
  
  // Handle scrape types
  if (config.name === 'Syntax Snack Pack') {
    return scrapeSyntaxSnackPack();
  }
  
  console.warn(`Unknown scrape target: ${config.name}`);
  return [];
}

export async function fetchAllFeeds(configs: FeedConfig[]): Promise<FeedItem[]> {
  const results = await Promise.allSettled(
    configs.map((config) => fetchFeed(config))
  );
  
  const items: FeedItem[] = [];
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    }
  }
  
  // Sort by date, newest first
  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  
  return items;
}
