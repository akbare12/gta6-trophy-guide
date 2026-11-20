[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01?ref=v7znzvhb)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/akbare12/gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01?ref=v7znzvhb)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/akbare12/gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01?ref=v7znzvhb)

# Grand Theft Auto VI — Trophy Guide & Tracker (PS5)

An offline, static web app: a guide and tracker for the official 55 PlayStation 5 trophies of Grand Theft Auto VI. Open `app/index.html` (or run `node serve.ts` and open http://localhost:8080). No network requests, no accounts — progress lives in your browser only.

Play it on make.fun: [GTA VI Trophy Guide & Tracker on make.fun](https://make.fun/c/gta6-trophy-guide-01?ref=v7znzvhb)

## What is inside

- **Checklist of all 55 official trophies** — names, descriptions and grades exactly as published 2026-11-18, with an interactive checklist, progress bar, grade counters, search and filters (grade, roadmap stage, story / missable / collectibles / activities / crime / side).
- **A cited guide for every trophy** — 210 steps, 210/210 cited inline, 326 inline citations. Every step is written in our own words; citations point at the source for each fact.
- **Roadmap to the Platinum** — 7 stages (S1 First steps → S7 Platinum) plus a NEXT UP line that always points at the earliest unearned trophy.
- **Missables & Watch** — the one possibly-missable trophy, two to watch, three unconfirmed, three disputed between sources, three single-source. Nothing is invented: where no source knows the method, the guide says so.
- **Spoiler setting** — hidden trophies stay concealed until earned or revealed. Export / import progress as JSON.

## Audit (verified 20 Nov 2026)

55 trophies · 1 Platinum, 2 Gold, 6 Silver, 46 Bronze · 28 hidden · 55/55 guides cite a source · 210 steps, 210/210 cited · 326 inline citations · 7 sources read 20 Nov 2026 · 1 possibly missable · 2 watch · 3 unconfirmed · 3 disagree · 3 single-source.

## Sources

Guide steps cite these sources inline as [1]–[7]:

| # | Source | Guide steps citing it |
|---|--------|----------------------:|
| [1] | PowerPyx — Trophy Guide & Roadmap + All Meditation Spot Locations | 202 |
| [2] | OutputLag — GTA 6 Trophy List | 53 |
| [3] | KeenGamer — Trophy Guide & Platinum Roadmap | 52 |
| [4] | eGamers — Trophy List + 100% guide | 2 |
| [5] | GTA-Zone / GTABase — Trophy List | 8 |
| [6] | WikiGTAVI — Trophies & Achievements tracker | 5 |
| [7] | Beebom / Push Square / Insider Gaming (supporting) | 4 |

Two trackers could not be read directly (Exophase has no GTA VI game page that surfaced in search; PSNProfiles had no GTA VI page as of 21 Oct 2026). The 55-name list is cross-checked across the six sources above, which agree 55/55, and the 28 hidden flags rest on two independent tables that agree exactly (OutputLag and eGamers, confirmed by GTA-Zone and WikiGTAVI).

## The Positive Mental Attitude dispute

The guide shows both versions, side by side, instead of picking one: whether the trophy needs 18 meditations or 15, and whether the Chapter 1 balcony meditation is required. The consensus advice from all sources is the same — do the balcony meditation in Chapter 1 and keep a Chapter 1 save until the trophy pops.

## Screenshots

Four 1280×720 captures of the running app, each under 256 KiB:

1. `1-cover.jpg` — cover: checklist + Positive Mental Attitude detail + sources + audit strip
2. `2-pma.jpg` — Positive Mental Attitude detail (dispute box, 10 named spots, meditation counter)
3. `3-sources.jpg` — sources panel + audit
4. `4-roadmap.jpg` — roadmap S1–S7 + NEXT UP + audit strip

## Build

`node main.ts` copies `app/` and `screenshots/` to `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `/output/dossier.json` with the vendored make.fun library (`vendor/makefun-frontend.ts`, unchanged from the kit). The dossier is byte-identical across runs (verified: two runs, same SHA-256).
