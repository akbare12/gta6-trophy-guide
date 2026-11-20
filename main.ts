// GTA VI Trophy Guide & Tracker — entry hand-in (Node 22, standard library only).
// The app is plain static files under app/ (index.html + ES module + CSS + JSON data),
// fully offline: it fetches nothing over the network. This program copies app/ and
// screenshots/ next to this file into the output directory and writes dossier.json
// there with the vendored make.fun library. The scorer rebuilds the dossier with its
// own copy of that library and requires a byte-identical match, so vendor/ stays
// untouched. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's gate: at most 4 screenshots of 256 KiB each, at most
// 993 entries / 48 MiB under app/. Only text_max_bytes shapes the dossier bytes;
// the rest make this program fail exactly where the scorer would refuse the entry.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
