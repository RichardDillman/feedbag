import { FeedItem, Briefing } from './types.js';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatItem(item: FeedItem, index: number): string {
  const lines = [
    `${index}. **${item.title}**`,
    `   Source: ${item.source}`,
    `   ${item.link}`,
  ];

  if (item.snippet) {
    lines.push(`   > ${item.snippet.slice(0, 150)}...`);
  }

  return lines.join('\n');
}

export function formatBriefingMarkdown(
  items: FeedItem[],
  skipped: string[],
  options: { maxEssential?: number; maxProfessional?: number } = {}
): string {
  const { maxEssential = 5, maxProfessional = 3 } = options;

  const essential = items.filter((i) => i.category === 'essential').slice(0, maxEssential);
  const professional = items.filter((i) => i.category === 'professional').slice(0, maxProfessional);
  const personal = items.filter((i) => i.category === 'personal').slice(0, 2);

  // Pick one good thing - prefer personal, then professional
  const goodThing = personal[0] || professional.find((p) => !p.title.toLowerCase().includes('security'));

  const lines: string[] = [
    `📅 ${formatDate(new Date())} BRIEFING`,
  ];

  // Today's Essentials
  if (essential.length > 0) {
    lines.push('## TODAY\'S ESSENTIALS', '');
    essential.forEach((item, i) => {
      lines.push(formatItem(item, i + 1), '');
    });
    lines.push('---', '');
  } else {
    lines.push('## TODAY\'S ESSENTIALS', '', '_No new essential items today._', '', '---', '');
  }

  // Professional Pulse
  if (professional.length > 0) {
    lines.push('## PROFESSIONAL PULSE', '');
    professional.forEach((item, i) => {
      lines.push(formatItem(item, i + 1), '');
    });
    lines.push('---', '');
  }

  // One Good Thing
  if (goodThing) {
    lines.push('## ONE GOOD THING', '');
    lines.push(`**${goodThing.title}**`);
    lines.push(`${goodThing.link}`, '');
    lines.push('---', '');
  }

  // What I'm Skipping
  if (skipped.length > 0) {
    lines.push('## SKIPPING TODAY', '');
    skipped.slice(0, 5).forEach((s) => {
      lines.push(`- ${s}`);
    });
    if (skipped.length > 5) {
      lines.push(`- _...and ${skipped.length - 5} more_`);
    }
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════');

  return lines.join('\n');
}

export function formatBriefingJson(items: FeedItem[], skipped: string[]): string {
  return JSON.stringify(
    {
      date: new Date().toISOString(),
      items: items.map((i) => ({
        title: i.title,
        link: i.link,
        source: i.source,
        category: i.category,
        pubDate: i.pubDate.toISOString(),
      })),
      skipped,
    },
    null,
    2
  );
}

export function formatBriefingPlain(items: FeedItem[], skipped: string[]): string {
  const lines: string[] = [
    `=== FEEDBAG ${formatDate(new Date())} ===`,
    '',
  ];

  for (const item of items.slice(0, 10)) {
    lines.push(`[${item.source}] ${item.title}`);
    lines.push(`  ${item.link}`);
    lines.push('');
  }

  if (skipped.length > 0) {
    lines.push(`Skipped ${skipped.length} items (politics, etc.)`);
  }

  return lines.join('\n');
}
