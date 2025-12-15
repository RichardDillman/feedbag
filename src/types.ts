export interface FeedConfig {
  name: string;
  url: string;
  type: 'rss' | 'scrape';
  category: 'essential' | 'professional' | 'personal';
  topics: string[];
}

export interface FeedItem {
  id: string;
  title: string;
  link: string;
  pubDate: Date;
  source: string;
  category: FeedConfig['category'];
  snippet?: string;
}

export interface SeenStore {
  urls: Set<string>;
  titleHashes: Set<string>;
}

export interface BriefingSection {
  title: string;
  items: FeedItem[];
  maxItems: number;
}

export interface Briefing {
  date: Date;
  sections: BriefingSection[];
  skipped: string[];
}
