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

## Score & high score (strongly encouraged)

A real arcade game has a **score**, and the cabinet builds on it — it shows each
game's high score on its card and runs a shared leaderboard. A game with no score
feels dead next to the others, so give yours one:

- Keep a running score and show it on screen.
- When a round ends, report the final score to the cabinet (optionally with a
  3-letter initials tag):

```js
parent.postMessage(
  { protocol: 'oyster-arcade', v: 1, type: 'arcade-score', payload: { value: score, initials: 'AAA' } },
  '*',
);
```

**Showing the high score:** the cabinet *owns* the leaderboard — don't keep your
own high score in `localStorage` (it's per-browser and never matches the shared
board or your card). Announce you're ready and the cabinet sends you the current
shared best:

```js
parent.postMessage({ protocol: 'oyster-arcade', v: 1, type: 'arcade-ready' }, '*');
addEventListener('message', (e) => {
  if (e.data && e.data.type === 'arcade-init') {
    const hi = e.data.payload && e.data.payload.highScore;   // { score, initials } | null
    // ...display hi as the best...
  }
});
```

- Return to the cabinet on ESC:

```js
parent.postMessage({ protocol: 'oyster-arcade', v: 1, type: 'arcade-close' }, '*');
```

See `games/example-tap/index.html` for the full pattern (score + initials + high score).

## Make it look great (strongly encouraged)

Arcade games live or die on *feel*. Don't ship programmer-art placeholders — push
the visuals until your game looks like it belongs on a real arcade machine:

- **Cabinet idiom** — crisp pixel art or clean vector, **neon-on-dark**, a
  tasteful per-game palette, readable on a phone.
- **Juice** — punchy motion, screen shake, particles, hit-flashes, sound on the
  moments that matter. Small touches make it feel alive.
- **A sharp cover** — the card art is the first thing players see.
- **Iterate** — the first playable is a starting point, not the finish line.
  Polish the graphics and game-feel before you call it done.

(Adopting the shared cabinet chrome — pixel font, splash, touch controls — is
coming as a drop-in bundle; for now, match the idiom yourself. A plain but
*polished* self-contained game is always welcome.)

## Validate, then PR

```sh
node validate.mjs <game-id>     # or: node validate.mjs --all
```

`validate` is a friendliness check (manifest, cover, self-containment, size) — not
a security gate. Fix what it flags, commit, and open a PR.
