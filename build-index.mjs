#!/usr/bin/env node
// Generates index.json — the carousel-ready list the arcade pulls to show
// contributed games. Each entry has absolute GitHub Pages URLs. Run on every
// merge to main by .github/workflows/index.yml. Excludes example* games.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = import.meta.dirname;
const GAMES = path.join(ROOT, 'games');
const PAGES = 'https://oyster-to.github.io/arcade-games/games';

const dirs = fs.readdirSync(GAMES, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !/^example/i.test(e.name))
  .map((e) => e.name)
  .sort();

const entries = [];
for (const id of dirs) {
  const mPath = path.join(GAMES, id, 'game.json');
  if (!fs.existsSync(mPath)) { console.error('skip (no game.json):', id); continue; }
  let m;
  try { m = JSON.parse(fs.readFileSync(mPath, 'utf8')); }
  catch (e) { console.error('skip (bad json):', id, e.message); continue; }
  if (m.id !== id) { console.error('skip (id != folder):', id); continue; }

  const cover = (typeof m.cover === 'string' && m.cover.trim()) || 'cover.svg';
  const entry = {
    id,
    name: m.name,
    author: m.author,
    url: `${PAGES}/${id}/`,
    cover: `${PAGES}/${id}/${cover}`,
  };
  if (m.tagline) entry.tagline = m.tagline;
  if (Array.isArray(m.controls)) entry.controls = m.controls;
  if (m.orientation) entry.orientation = m.orientation;
  entries.push(entry);
}

fs.writeFileSync(path.join(ROOT, 'index.json'), JSON.stringify(entries, null, 2) + '\n');
console.log(`wrote index.json with ${entries.length} game(s): ${entries.map((e) => e.id).join(', ') || '(none)'}`);
