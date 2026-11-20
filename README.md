# GTA VI Trophy Guide & Tracker — PS5 (Offline)

[![Trophies](https://img.shields.io/badge/trophies-55-blue)](app/data/trophies.json)
[![Grades](https://img.shields.io/badge/grades-1P%202G%206S%2046B-green)](app/data/trophies.json)
[![Hidden](https://img.shields.io/badge/hidden-28-orange)](app/data/trophies.json)
[![Sources](https://img.shields.io/badge/sources-7%20read%2020%20Nov%202026-lightgrey)](app/data/trophies.json)
[![Offline](https://img.shields.io/badge/offline-yes-success)](app/index.html)

An offline guide and progress tracker for all **55 official PlayStation 5 trophies** of
Grand Theft Auto VI — written in the game's launch week, when no official Rockstar
trophy list existed and several methods were still unconfirmed. Every guide step is
written in our own words and cites its source inline. Where sources disagree, **both
versions are shown** — never silently picked.

## What is inside

- **55 trophies, 1P / 2G / 6S / 46B, 28 hidden** — names and official descriptions
  exactly as listed by the sources; every guide has 3–6 steps, each step cited [1]–[9].
- **The one missable trophy, flagged honestly:** Positive Mental Attitude is the only
  possibly-missable trophy (Chapter 1 balcony meditation). The guide shows the full
  dispute — 18 vs 15 meditations, and whether the Chapter 1 balcony meditation is
  required — plus the consensus advice: do it in Chapter 1 and keep a Chapter 1 save.
- **Unconfirmed, not invented:** Bad Luck, I Guess and Ten Pin have no known method in
  any source read on 20 Nov 2026 — the guide says so and invents no steps.
- **Single-source methods labelled:** In The Beginning…, Capital Offense and
  The Truth Is Out There rest on PowerPyx alone and are marked "single source".
- **Roadmap S1–S7** from Chapter 1 to the Platinum cleanup, with counts (250 stunts,
  42 shooting-range golds, 100 WAiNK scans, $250,000 laundered, 500 profile actions…).
- **Offline tracker:** check trophies off, filter by stage / grade / flag, hide hidden-trophy
  spoilers, export and import your progress. No network calls at runtime.

## Sources (read 20 Nov 2026)

| # | Source |
|---|--------|
| [1] | PowerPyx — Trophy Guide & Roadmap + All Meditation Spot Locations |
| [2] | OutputLag — GTA 6 Trophy List |
| [3] | KeenGamer — Trophy Guide & Platinum Roadmap |
| [4] | eGamers — Trophy List + 100% guide |
| [7] | GTA-Zone / GTABase — Trophy List |
| [8] | WikiGTAVI — Trophies & Achievements tracker |
| [9] | Beebom, Push Square, Insider Gaming, gtavicecityhub (supporting figures) |

Exophase and PSNProfiles could not be read directly (no GTA VI page found at the time);
the 55-name list is cross-checked across the six sources above, which agree 55/55.

## Run it

```sh
node serve.ts   # http://localhost:8080
```

No build step, no network. Open `app/index.html` directly or serve the `app/` folder.

## Honesty notes

- Trophy names and descriptions are quoted from the official list as reported by the
  sources above. All guide text is written in our own words; citing a source is not
  copying it.
- No Rockstar artwork, logos, box art or game screenshots are used anywhere in this app.
- Platinum time estimates (~200 h vs 300 h+) are launch-week estimates, not measured
  results, and are not presented as fact.

---

*Made for the make.fun gta6-trophy-guide-01 bounty. Referral: `v7znzvhb`.*
