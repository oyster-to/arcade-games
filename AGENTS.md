# Contributing a game to the Oyster Arcade — guide for agents

You're helping someone put their game on **[arcade.oyster.to](https://arcade.oyster.to)**.
This repo, `oyster-to/arcade-games`, is where contributed games live. Follow these
steps. (Humans: this guide works for you too.)

## TL;DR

1. Fork + clone `oyster-to/arcade-games`.
2. Create `games/<game-id>/` with `index.html`, a `cover` image, `game.json`, and
   any assets — copy `games/example-tap/` as a starting point.
3. Run `node validate.mjs <game-id>` and fix anything it reports.
4. Commit and open a pull request. A maintainer reviews and merges it. One game
   per PR.

## The game folder

```
games/<game-id>/
  game.json     # manifest (required)
  index.html    # entry point (required; override with manifest.entry)
  cover.svg     # card art (required; SVG or PNG, roughly square)
  ...           # any other files your game needs, by RELATIVE path
```

- **Self-contained.** Everything lives in this folder, referenced by relative
  paths. No external `<script>`/`fetch`/`<link>` — bundle what you need. (The one
  future exception is the optional shared cabinet bundle; see below.)
- **`<game-id>`** = folder name = manifest `id`. Lowercase letters, digits,
  hyphens (e.g. `nuclear-testing-facility`).
- Keep it under ~25 MB.

## `game.json`

| Field | Required | Notes |
|---|---|---|
| `schemaVersion` | yes | Always `1`. |
| `id` | yes | Must equal the folder name. `^[a-z0-9-]+$`. |
| `name` | yes | Shown on the cabinet, e.g. `NUCLEAR TESTING FACILITY`. ≤ 40 chars. |
| `author` | yes | Shown as "BY &lt;AUTHOR&gt;". Use a **first name or handle — never a full/real name or anything identifying**, especially for kids. ≤ 24 chars. |
| `tagline` | yes | One line describing the game. ≤ 80 chars. |
| `cover` | yes | Path to the card image in your folder (default `cover.svg`). |
| `controls` | no | e.g. `["arrows","tap"]`. |
| `orientation` | no | `any` (default), `portrait`, or `landscape`. |
| `description` | no | A longer blurb. |

```json
{
  "schemaVersion": 1,
  "id": "nuclear-testing-facility",
  "name": "NUCLEAR TESTING FACILITY",
  "author": "Henry",
  "tagline": "Contain the meltdown before the timer hits zero",
  "cover": "cover.svg",
  "controls": ["arrows", "tap"],
  "orientation": "landscape"
}
```

## Behaving inside the cabinet (optional but nice)

Your game runs in an iframe inside the arcade. Two tiny messages make it feel at
home (see `games/example-tap/index.html` for a working example):

```js
// report your score when a round ends — the cabinet owns the leaderboard
parent.postMessage({ protocol:'oyster-arcade', v:1, type:'arcade-score', payload:{ value: score } }, '*');

// return to the cabinet on ESC
parent.postMessage({ protocol:'oyster-arcade', v:1, type:'arcade-close' }, '*');
```

## Adopt the cabinet look (strongly suggested, never required)

The arcade has a shared CRT-cabinet style (pixel font, neon-on-dark, splash,
touch controls). Adopting it makes your game look native **and** lets it inherit
cabinet improvements automatically. It's **encouraged but optional** — a plain,
good, self-contained HTML game is welcome exactly as-is. (The shared bundle +
design guide are on the way; for now, just ship something fun and self-contained.)

## Validate, then PR

```sh
node validate.mjs <game-id>     # or: node validate.mjs --all
```

`validate` is a friendliness check (manifest, cover, self-containment, size) — not
a security gate. Fix what it flags, commit, and open a PR.
