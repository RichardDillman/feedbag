import { FeedConfig } from './types.js';

export const FEEDS: FeedConfig[] = [
  // === ESSENTIAL (high signal, directly relevant) ===
  {
    name: 'JavaScript Weekly',
    url: 'https://javascriptweekly.com/rss/',
    type: 'rss',
    category: 'essential',
    topics: ['nextjs', 'react', 'typescript', 'node', 'performance'],
  },
  {
    name: 'Smashing Magazine',
    url: 'https://www.smashingmagazine.com/feed/',
    type: 'rss',
    category: 'essential',
    topics: ['performance', 'seo', 'css', 'accessibility', 'ux'],
  },
  {
    name: 'Syntax Snack Pack',
    url: 'https://syntax.fm/snackpack', // scrape - no RSS
    type: 'scrape',
    category: 'essential',
    topics: ['nextjs', 'react', 'css', 'typescript', 'webdev'],
  },

  // === PROFESSIONAL (tooling, workflow) ===
  {
    name: 'Web Tools Weekly',
    url: 'https://webtoolsweekly.com/feed.xml',
    type: 'rss',
    category: 'professional',
    topics: ['react', 'css', 'build', 'testing', 'git'],
  },
  {
    name: 'VSCode.Email',
    url: 'https://vscode.email/feed.xml',
    type: 'rss',
    category: 'professional',
    topics: ['vscode', 'copilot', 'claude', 'agents', 'extensions'],
  },

  // === PERSONAL (interests, can skip if busy) ===
  // Job Board Doctor - need to find RSS or scrape
  // ESO news - can add later
];

// Topics that mark something as "essential" for Richard
export const PRIORITY_TOPICS = [
  'nextjs',
  'next.js',
  'react',
  'pagespeed',
  'core web vitals',
  'cwv',
  'seo',
  'jobposting',
  'schema',
  'structured data',
  'lighthouse',
  'performance',
];

// Topics Richard cares about personally
export const INTEREST_TOPICS = [
  'claude',
  'claude code',
  'anthropic',
  'agentic',
  'unit test',
  'caniuse',
  'css',
  'eso',
  'elder scrolls',
];

// Topics to skip (anxiety triggers, not actionable)
export const SKIP_TOPICS = [
  'politics',
  'election',
  'layoffs', // unless directly relevant
];

// Data directory for persistence
export const DATA_DIR = process.env.FEEDBAG_DATA || `${process.env.HOME}/.feedbag`;
