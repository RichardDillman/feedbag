# 🍕 feedbag

Personal news aggregator with deduplication. Curates RSS feeds into a daily briefing, filters out noise, and remembers what you've already seen.

## Installation

```bash
npm install
npm run build
npm link  # makes `feedbag` available globally
```

## Usage

```bash
# Generate your daily briefing
feedbag briefing

# Output as JSON (for piping to other tools)
feedbag briefing --format json

# Save to file
feedbag briefing -o ~/Desktop/today.md

# Don't mark items as seen (preview mode)
feedbag briefing --no-mark

# Save to ~/.feedbag/briefings/YYYY-MM-DD.md
feedbag save

# Debug: fetch without dedup
feedbag fetch
feedbag fetch --feed "javascript"

# List configured feeds
feedbag list-feeds

# Show stats
feedbag stats

# Clear seen items (start fresh)
feedbag clear --confirm
```

## Configuration

Edit `src/config.ts` to:

- Add/remove feeds
- Adjust priority topics (boost certain keywords)
- Adjust skip topics (filter out anxiety-inducing content)
- Change data directory via `FEEDBAG_DATA` env var

## Data Storage

Seen items stored in `~/.feedbag/seen.json`. Items older than 30 days are automatically pruned.

## Briefing Structure

```
═══════════════════════════════════════════════════════
📅 Monday, December 15, 2025 BRIEFING
═══════════════════════════════════════════════════════

## TODAY'S ESSENTIALS (max 5)
High-signal items from essential feeds matching priority topics

## PROFESSIONAL PULSE (max 3)  
Tooling and workflow updates

## ONE GOOD THING
A positive development to start the day

## SKIPPING TODAY
Stories filtered out (politics, not actionable, etc.)

═══════════════════════════════════════════════════════
```

## Adding Feeds

In `src/config.ts`:

```typescript
{
  name: 'My Feed',
  url: 'https://example.com/rss',
  type: 'rss',
  category: 'essential',  // or 'professional' | 'personal'
  topics: ['nextjs', 'react'],
}
```

## Future Ideas

- [ ] MCP server wrapper for Claude Code integration
- [ ] Email delivery via Resend/SendGrid
- [ ] Podcast feed support
- [ ] Web scraping for non-RSS sources
- [ ] Embedding-based dedup (semantic similarity)

## License

MIT
