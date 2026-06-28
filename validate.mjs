#!/usr/bin/env node
// Compatibility lint + supply-chain hygiene for contributed games.
//
// This is NOT the security boundary — the cabinet's sandboxed iframe + CSP are
// that. This just catches mistakes early, so "passes locally" == "will be
// accepted". Run: `node validate.mjs <game-id>`  or  `node validate.mjs --all`.
import fs from 'node:fs';
import path from 'node:path';

const GAMES_DIR = path.join(import.meta.dirname, 'games');
const ID_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
const COVER_EXT = new Set(['.svg', '.png', '.webp', '.jpg', '.jpeg']);
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 300;
const LIMITS = { name: 40, author: 24, tagline: 80, description: 400 };

const hasControlChars = (s) => [...s].some((c) => {
  const n = c.charCodeAt(0);
  return n < 0x20 || n === 0x7f;
});

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) out.push({ p, symlink: true });
    else if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile()) out.push({ p, size: fs.statSync(p).size });
  }
  return out;
}

function validateGame(id) {
  const errs = [];
  const dir = path.join(GAMES_DIR, id);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return ['no such game folder: games/' + id];

  const mPath = path.join(dir, 'game.json');
  let m = {};
  if (!fs.existsSync(mPath)) errs.push('missing game.json');
  else {
    try { m = JSON.parse(fs.readFileSync(mPath, 'utf8')); }
    catch (e) { errs.push('game.json is not valid JSON: ' + e.message); }
  }
  const str = (k) => typeof m[k] === 'string' && m[k].trim();

  if (m.schemaVersion !== 1) errs.push('schemaVersion must be 1');
  if (!str('id')) errs.push('id is required');
  else if (m.id !== id) errs.push(`id "${m.id}" must equal folder name "${id}"`);
  else if (!ID_RE.test(m.id)) errs.push('id must match ' + ID_RE);
  for (const k of ['name', 'author', 'tagline']) if (!str(k)) errs.push(`${k} is required`);
  for (const [k, max] of Object.entries(LIMITS)) {
    if (m[k] != null) {
      if (typeof m[k] !== 'string') errs.push(`${k} must be a string`);
      else if (m[k].length > max) errs.push(`${k} too long (max ${max})`);
      else if (hasControlChars(m[k])) errs.push(`${k} contains control characters`);
    }
  }

  const entry = str('entry') || 'index.html';
  if (entry.includes('..') || path.isAbsolute(entry)) errs.push('entry must be a relative path inside the folder');
  else if (!fs.existsSync(path.join(dir, entry))) errs.push(`entry not found: ${entry}`);

  const cover = str('cover');
  if (!cover) errs.push('cover is required');
  else if (cover.includes('..') || path.isAbsolute(cover)) errs.push('cover must be a relative path inside the folder');
  else if (!COVER_EXT.has(path.extname(cover).toLowerCase())) errs.push('cover must be an image (svg/png/webp/jpg)');
  else if (!fs.existsSync(path.join(dir, cover))) errs.push(`cover not found: ${cover}`);

  const files = walk(dir);
  if (files.some((f) => f.symlink)) errs.push('symlinks are not allowed');
  if (files.length > MAX_FILES) errs.push(`too many files (${files.length} > ${MAX_FILES})`);
  const total = files.reduce((s, f) => s + (f.size || 0), 0);
  if (total > MAX_BYTES) errs.push(`folder too large (${(total / 1048576).toFixed(1)} MB > 25 MB)`);

  if (fs.existsSync(path.join(dir, entry))) {
    const html = fs.readFileSync(path.join(dir, entry), 'utf8');
    const refs = [...html.matchAll(/\b(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)/gi)].map((x) => x[1]);
    for (const u of refs) {
      if (!/^https:\/\/shared\.arcade\.oyster\.to\//.test(u))
        errs.push(`external reference not allowed: ${u} — bundle everything in your folder`);
    }
  }
  return errs;
}

const args = process.argv.slice(2);
let ids;
try {
  ids = args.includes('--all') || args.length === 0
    ? fs.readdirSync(GAMES_DIR, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
    : args;
} catch {
  console.error('no games/ directory found'); process.exit(1);
}

let failed = 0;
for (const id of ids) {
  const errs = validateGame(id);
  if (errs.length) { failed++; console.error(`x ${id}`); for (const e of errs) console.error('   - ' + e); }
  else console.log(`ok ${id}`);
}
console.log(`\n${ids.length - failed}/${ids.length} game(s) valid`);
process.exit(failed ? 1 : 0);
