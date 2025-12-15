#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { FEEDS, DATA_DIR } from './config.js';
import { fetchAllFeeds } from './fetcher.js';
import { processItems } from './dedup.js';
import { markAllSeen, clearSeen, getStats } from './store.js';
import {
  formatBriefingMarkdown,
  formatBriefingJson,
  formatBriefingPlain,
} from './formatter.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const program = new Command();

program
  .name('feedbag')
  .description('Personal news aggregator with deduplication')
  .version('0.1.0');

program
  .command('briefing')
  .description('Generate your daily briefing')
  .option('-f, --format <format>', 'Output format: markdown, json, plain', 'markdown')
  .option('-o, --output <file>', 'Write to file instead of stdout')
  .option('--no-mark', 'Don\'t mark items as seen')
  .option('--max-essential <n>', 'Max essential items', '5')
  .option('--max-professional <n>', 'Max professional items', '3')
  .action(async (options) => {
    console.error(chalk.dim('Fetching feeds...'));
    
    const items = await fetchAllFeeds(FEEDS);
    console.error(chalk.dim(`Fetched ${items.length} items from ${FEEDS.length} feeds`));
    
    const { items: processed, skipped } = processItems(items);
    console.error(chalk.dim(`After dedup: ${processed.length} items, ${skipped.length} skipped`));
    
    let output: string;
    switch (options.format) {
      case 'json':
        output = formatBriefingJson(processed, skipped);
        break;
      case 'plain':
        output = formatBriefingPlain(processed, skipped);
        break;
      case 'markdown':
      default:
        output = formatBriefingMarkdown(processed, skipped, {
          maxEssential: parseInt(options.maxEssential),
          maxProfessional: parseInt(options.maxProfessional),
        });
    }
    
    if (options.output) {
      writeFileSync(options.output, output);
      console.error(chalk.green(`Wrote briefing to ${options.output}`));
    } else {
      console.log(output);
    }
    
    // Mark items as seen (unless --no-mark)
    if (options.mark !== false) {
      markAllSeen(processed.map((i) => ({ link: i.link, title: i.title })));
      console.error(chalk.dim('Marked items as seen'));
    }
  });

program
  .command('fetch')
  .description('Fetch feeds without dedup (for debugging)')
  .option('--feed <name>', 'Fetch only this feed')
  .action(async (options) => {
    const feeds = options.feed
      ? FEEDS.filter((f) => f.name.toLowerCase().includes(options.feed.toLowerCase()))
      : FEEDS;
    
    if (feeds.length === 0) {
      console.error(chalk.red(`No feed matching "${options.feed}"`));
      process.exit(1);
    }
    
    const items = await fetchAllFeeds(feeds);
    
    for (const item of items.slice(0, 20)) {
      console.log(chalk.bold(item.title));
      console.log(chalk.dim(`  ${item.source} | ${item.link}`));
      console.log();
    }
    
    console.error(chalk.dim(`Total: ${items.length} items`));
  });

program
  .command('stats')
  .description('Show statistics about seen items')
  .action(() => {
    const stats = getStats();
    console.log(chalk.bold('Feedbag Stats'));
    console.log(`  Seen URLs: ${stats.urls}`);
    console.log(`  Seen title hashes: ${stats.titles}`);
    console.log(`  Data dir: ${DATA_DIR}`);
  });

program
  .command('clear')
  .description('Clear all seen items (start fresh)')
  .option('--confirm', 'Actually clear (required)')
  .action((options) => {
    if (!options.confirm) {
      console.log(chalk.yellow('This will clear all seen items.'));
      console.log('Run with --confirm to proceed.');
      return;
    }
    
    clearSeen();
    console.log(chalk.green('Cleared all seen items.'));
  });

program
  .command('list-feeds')
  .description('List configured feeds')
  .action(() => {
    console.log(chalk.bold('Configured Feeds:\n'));
    
    for (const category of ['essential', 'professional', 'personal'] as const) {
      const feeds = FEEDS.filter((f) => f.category === category);
      if (feeds.length > 0) {
        console.log(chalk.underline(category.toUpperCase()));
        for (const feed of feeds) {
          console.log(`  ${feed.name}`);
          console.log(chalk.dim(`    ${feed.url}`));
          console.log(chalk.dim(`    Topics: ${feed.topics.join(', ')}`));
        }
        console.log();
      }
    }
  });

program
  .command('save')
  .description('Generate and save briefing to ~/.feedbag/briefings/')
  .action(async () => {
    const dir = `${DATA_DIR}/briefings`;
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `${dir}/${date}.md`;
    
    console.error(chalk.dim('Fetching feeds...'));
    const items = await fetchAllFeeds(FEEDS);
    const { items: processed, skipped } = processItems(items);
    
    const output = formatBriefingMarkdown(processed, skipped);
    writeFileSync(filename, output);
    
    markAllSeen(processed.map((i) => ({ link: i.link, title: i.title })));
    
    console.log(chalk.green(`Saved to ${filename}`));
  });

program.parse();
