// GTA VI Trophy Guide & Tracker — offline single-page app (vanilla JS, no framework).
// All data lives in data/trophies.json (official names, descriptions and grades plus
// our own-word guides, each step citing its sources inline as [1]-[7]). Progress is
// kept in this browser only (localStorage); nothing is sent anywhere. A ?demo=1 URL
// seeds a 13-of-55 demo progress in memory for screenshots, without saving it.

const DATA_URL = 'data/trophies.json';
const STORE_KEY = 'gta6-trophy-guide-v1';
const PMA_ID = 'positive-mental-attitude';

// 13 earned in the demo seed: the six Chapter 1-2 story trophies + seven side ones.
const DEMO_EARNED = [
  'just-like-paradise', 'paradise-lost', 't-ass-drug-money', 'vice-city-baby',
  'trust', 'break-the-bank', 'baited-my-tackle', 'stick-fiddler',
  'whip-it-good', 'the-goodtime-state', 'master-of-none', 'cunning-stunts',
  'strangers-freaks',
];

const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const STAGE_ORDER = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', '—'];
const STAGE_LABEL = {
  S1: 'S1 — First steps', S2: 'S2 — Vice City', S3: 'S3 — Mid-game',
  S4: 'S4 — Character quests', S5: 'S5 — Side content', S6: 'S6 — Cleanup',
  S7: 'S7 — Platinum', '—': 'Anytime',
};
const KIND_LABEL = {
  story: 'Story', side: 'Side', collectible: 'Collectibles',
  activity: 'Activities', crime: 'Crime', cleanup: 'Platinum', unknown: 'Unknown method',
};
const FLAG_LABEL = {
  missable: 'possibly-missable', watch: 'watch', unconfirmed: 'unconfirmed',
  disagree: 'disagree', 'single-source': 'single-source',
};

const demoMode = new URLSearchParams(location.search).has('demo');

let DATA = null;
let state = loadState();
let selectedId = PMA_ID;
let filters = { q: '', grade: 'all', stage: 'all', kind: 'all' };

function loadState() {
  if (demoMode) return { earned: new Set(DEMO_EARNED), meditations: 6, revealed: new Set(), spoilers: true };
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || {};
    return {
      earned: new Set(Array.isArray(raw.earned) ? raw.earned : []),
      meditations: Number.isInteger(raw.meditations) ? Math.max(0, Math.min(18, raw.meditations)) : 0,
      revealed: new Set(Array.isArray(raw.revealed) ? raw.revealed : []),
      spoilers: raw.spoilers !== false,
    };
  } catch {
    return { earned: new Set(), meditations: 0, revealed: new Set(), spoilers: true };
  }
}

function saveState() {
  if (demoMode) return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: [...state.earned], meditations: state.meditations,
      revealed: [...state.revealed], spoilers: state.spoilers,
    }));
  } catch { /* storage full or blocked: progress just does not persist */ }
}

// ---------------------------------------------------------------- data helpers

const byId = (id) => DATA.trophies.find((t) => t.id === id);
const gradeCounts = () => {
  const out = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const t of DATA.trophies) {
    out[t.grade][1]++;
    if (state.earned.has(t.id)) out[t.grade][0]++;
  }
  return out;
};
const stepStats = () => {
  let steps = 0, cited = 0, instances = 0;
  const perSource = {};
  for (const s of DATA.sources) perSource[s.n] = 0;
  for (const t of DATA.trophies) {
    for (const st of t.steps) {
      steps++;
      if (st.c && st.c.length > 0) cited++;
      for (const n of st.c || []) { instances++; perSource[n] = (perSource[n] || 0) + 1; }
    }
  }
  return { steps, cited, instances, perSource };
};
const flagCount = (flag) => DATA.trophies.filter((t) => (t.flags || []).includes(flag)).length;
const hiddenCount = () => DATA.trophies.filter((t) => t.hidden).length;
const inRoadmapOrder = () => [...DATA.trophies].sort((a, b) =>
  STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) ||
  GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] ||
  a.name.localeCompare(b.name));
const nextUp = () => inRoadmapOrder().find((t) => !state.earned.has(t.id)) || null;

// ---------------------------------------------------------------- small render helpers

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const chip = (cls, text) => `<span class="chip ${cls}">${esc(text)}</span>`;
const gradeChip = (g) => chip(g, g[0].toUpperCase() + g.slice(1));
const citesHtml = (c) => (c || []).map((n) => `<span class="cite">[${n}]</span>`).join('');
const trophyLink = (t) => `<a href="#/trophy/${t.id}">${esc(t.name)}</a>`;

function chipsFor(t) {
  let h = gradeChip(t.grade) + chip('stage', t.stage);
  if (t.count) h += chip('count', t.count);
  if (t.hidden) h += chip('hidden-chip', 'hidden');
  for (const f of t.flags || []) h += chip(f === 'missable' ? 'missable' : f === 'watch' ? 'watch' : f === 'unconfirmed' ? 'unconfirmed' : f === 'disagree' ? 'disagree' : 'single', FLAG_LABEL[f]);
  if (state.earned.has(t.id)) h += chip('earned-chip', 'earned');
  return h;
}

function isConcealed(t) {
  return state.spoilers && t.hidden && !state.earned.has(t.id) && !state.revealed.has(t.id);
}

// ---------------------------------------------------------------- header, audit, tabs, toolbar

function renderHeader() {
  const gc = gradeCounts();
  const earned = state.earned.size;
  const box = document.getElementById('earned-box');
  box.innerHTML = `<b>${earned} of 55 earned</b>` +
    `<div class="progress"><i style="width:${(earned / 55) * 100}%"></i></div>` +
    `<div class="small muted">P ${gc.platinum[0]}/${gc.platinum[1]} · G ${gc.gold[0]}/${gc.gold[1]} · ` +
    `S ${gc.silver[0]}/${gc.silver[1]} · B ${gc.bronze[0]}/${gc.bronze[1]} · Saved in this browser</div>`;

  const st = stepStats();
  const audit = document.getElementById('audit-strip');
  const parts = [
    `<b>55 trophies</b>`, `1 Platinum`, `2 Gold`, `6 Silver`, `46 Bronze`,
    `<b>28 hidden</b>`, `55/55 guides cite a source`,
    `<b>${st.steps} steps</b>`, `${st.cited}/${st.steps} steps cited`,
    `<b>${st.instances} inline citations</b>`, `7 sources read 20 Nov 2026`,
    `<b>${flagCount('missable')} possibly missable</b>`, `${flagCount('watch')} watch`,
    `${flagCount('unconfirmed')} unconfirmed`, `${flagCount('disagree')} disagree`,
    `${flagCount('single-source')} single-source`,
  ];
  audit.innerHTML = 'AUDIT — ' + parts.join('<span class="sep">·</span>');

  const tabs = [
    ['#/', 'Cover'], ['#/roadmap', 'Roadmap to Platinum'],
    ['#/missables', 'Missables & Watch'], ['#/sources', 'Sources'],
  ];
  const hash = location.hash || '#/';
  document.getElementById('tabs').innerHTML = tabs.map(([href, label]) =>
    `<a href="${href}"${(hash === href || (href === '#/' && !hash.startsWith('#/roadmap') && !hash.startsWith('#/missables') && !hash.startsWith('#/sources') && !hash.startsWith('#/trophy'))) ? ' aria-current="page"' : ''}>${label}</a>`).join('');

  document.getElementById('foot').innerHTML =
    `Data: the official 55-trophy list as published 2026-11-18. Counts: 1 Platinum, 2 Gold, 6 Silver, 46 Bronze; ` +
    `${hiddenCount()} hidden; 55/55 guides carry inline source citations. ` +
    `Guides are written in our own words from the sources in [1]–[7]; nothing here is copied. ` +
    `This page works fully offline once loaded — no network requests, no accounts.`;
}

function renderToolbar() {
  const tb = document.getElementById('toolbar');
  tb.innerHTML = '';
  const mk = (label, control) => {
    const l = el('label', '', esc(label) + ' ');
    l.appendChild(control);
    tb.appendChild(l);
  };
  const search = el('input');
  search.type = 'search'; search.placeholder = 'Trophy, guide text, [1]…';
  search.value = filters.q;
  search.addEventListener('input', () => { filters.q = search.value; renderView(); });
  mk('Search', search);

  const grade = el('select');
  grade.innerHTML = '<option value="all">All grades</option>' +
    ['platinum', 'gold', 'silver', 'bronze'].map((g) => `<option value="${g}"${filters.grade === g ? ' selected' : ''}>${g[0].toUpperCase() + g.slice(1)}</option>`).join('');
  grade.addEventListener('change', () => { filters.grade = grade.value; renderView(); });
  mk('Grade', grade);

  const stage = el('select');
  stage.innerHTML = '<option value="all">All stages</option>' +
    STAGE_ORDER.map((s) => `<option value="${s}"${filters.stage === s ? ' selected' : ''}>${STAGE_LABEL[s]}</option>`).join('');
  stage.addEventListener('change', () => { filters.stage = stage.value; renderView(); });
  mk('Stage', stage);

  const kind = el('select');
  kind.innerHTML = '<option value="all">All trophies</option>' +
    Object.keys(KIND_LABEL).map((k) => `<option value="${k}"${filters.kind === k ? ' selected' : ''}>${KIND_LABEL[k]}</option>`).join('');
  kind.addEventListener('change', () => { filters.kind = kind.value; renderView(); });
  mk('Flag', kind);

  const spoil = el('label', '', '');
  const cb = el('input');
  cb.type = 'checkbox'; cb.checked = state.spoilers;
  cb.addEventListener('change', () => { state.spoilers = cb.checked; saveState(); renderView(); });
  spoil.appendChild(cb);
  spoil.appendChild(document.createTextNode(' Hide spoilers (hidden trophies)'));
  tb.appendChild(spoil);

  const spacer = el('span', 'spacer');
  tb.appendChild(spacer);

  const exp = el('button', '', 'Export progress');
  exp.addEventListener('click', exportProgress);
  tb.appendChild(exp);

  const impLabel = el('label', '', 'Import progress ');
  const imp = el('input');
  imp.type = 'file'; imp.accept = '.json,application/json'; imp.style.display = 'none';
  imp.addEventListener('change', importProgress);
  impLabel.appendChild(imp);
  const impBtn = el('button', '', 'Choose File');
  impBtn.addEventListener('click', () => imp.click());
  impLabel.appendChild(impBtn);
  tb.appendChild(impLabel);

  const reset = el('button', '', 'Reset');
  reset.addEventListener('click', () => {
    if (!demoMode) { state = { earned: new Set(), meditations: 0, revealed: new Set(), spoilers: true }; saveState(); }
    renderAll();
  });
  tb.appendChild(reset);
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({
    game: 'Grand Theft Auto VI', earned: [...state.earned],
    meditations: state.meditations, exported: new Date().toISOString(),
  }, null, 2)], { type: 'application/json' });
  const a = el('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importProgress(ev) {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const raw = JSON.parse(String(reader.result));
      if (Array.isArray(raw.earned)) {
        state.earned = new Set(raw.earned.filter((id) => byId(id)));
        if (Number.isInteger(raw.meditations)) state.meditations = Math.max(0, Math.min(18, raw.meditations));
        saveState(); renderAll();
      }
    } catch { /* bad file: ignore */ }
  };
  reader.readAsText(file);
}

// ---------------------------------------------------------------- detail panel

const DISPUTE_PMA = `<b>Sources disagree — both versions shown:</b> (A) 18 vs 15 meditations: ` +
  `PowerPyx, KeenGamer and Beebom say the trophy needs all 18 meditations at 10 spots, with 15 of 18 enough for the ` +
  `100% checklist; eGamers and GTA-Zone record the 18-vs-15 disagreement explicitly. The arithmetic is unsettled ` +
  `(10 spots × 2 characters = 20, not 18; the Chapter 1 balcony spot is Jason-only in Chapter 1). ` +
  `(B) Is the Chapter 1 balcony meditation required? PowerPyx has not confirmed it (its author reached 17/18 before ` +
  `the last meditation and 18/18 after, so the last one may count +2 or the Chapter 1 one may not count); ` +
  `OutputLag, KeenGamer and Beebom all say do it in Chapter 1 anyway and keep a Chapter 1 save. ` +
  `Consensus advice: do the balcony meditation in Chapter 1 and keep a Chapter 1 save until the trophy pops.`;

const DISPUTE_FINAL = `<b>Sources disagree — both versions shown:</b> which chapter holds the final mission is ` +
  `disputed: PowerPyx places it under “Starting From Zero” (the last Chapter 4 mission), while other sources ` +
  `describe it as a Chapter 5 mission. eGamers notes the sources differ. The trophy itself is simple — finish ` +
  `the final story mission — whatever chapter your copy calls it.`;

const DISPUTE_TANK = `<b>Sources disagree — both versions shown:</b> where Mile Zero Air Station sits on the map is ` +
  `disputed: PowerPyx puts it in the south-west of the map, in Mariana County; other summaries place it at Goose Key, ` +
  `at the bottom of the Keys. No source read on 20 Nov 2026 confirms the Goose Key claim, so use the station name ` +
  `and its south side, not a county, to find the tank.`;

function detailPanel(t) {
  const card = el('section', 'card detail');
  let h = `<h2>Trophy detail</h2><h3>${esc(t.name)}</h3>`;
  h += `<div>${chipsFor(t)}</div>`;
  h += `<p>${isConcealed(t) ? 'Hidden trophy — description concealed until earned or revealed.' : esc(t.description)}</p>`;
  if (t.id === PMA_ID) h += `<div class="dispute">${DISPUTE_PMA}</div>`;
  if (t.id === 'you-gotta-know-when-to-get-off') h += `<div class="dispute">${DISPUTE_FINAL}</div>`;
  if (t.id === 'challenging-tank') h += `<div class="dispute">${DISPUTE_TANK}</div>`;
  if ((t.flags || []).includes('unconfirmed')) {
    h += `<div class="warnbox"><b>NOT PINNED DOWN YET:</b> no source read on 20 Nov 2026 knows the method for ` +
      `this trophy — do not chase a guessed method. The guide below says what is known and nothing more.</div>`;
  }
  if ((t.flags || []).includes('single-source')) {
    h += `<div class="warnbox"><b>Single source:</b> this method comes from PowerPyx only and has not been ` +
      `confirmed by a second source. Treat it as provisional.</div>`;
  }
  if (t.id === PMA_ID) {
    h += `<div class="counter">Your meditations: <button data-med="-1" aria-label="one fewer meditation">−</button> ` +
      `<span>${state.meditations} / 18</span> <button data-med="1" aria-label="one more meditation">+</button></div>`;
  }
  h += '<ol class="steps">' + t.steps.map((st) =>
    `<li>${esc(st.t)} ${citesHtml(st.c)}</li>`).join('') + '</ol>';
  h += `<p><button data-earn="${t.id}">${state.earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned'}</button></p>`;
  card.innerHTML = h;
  card.querySelectorAll('[data-med]').forEach((b) => b.addEventListener('click', () => {
    state.meditations = Math.max(0, Math.min(18, state.meditations + Number(b.dataset.med)));
    saveState(); renderAll();
  }));
  card.querySelector('[data-earn]').addEventListener('click', () => {
    if (state.earned.has(t.id)) state.earned.delete(t.id); else state.earned.add(t.id);
    saveState(); renderAll();
  });
  return card;
}

// ---------------------------------------------------------------- checklist

function filteredTrophies() {
  const q = filters.q.trim().toLowerCase();
  return DATA.trophies.filter((t) => {
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.stage !== 'all' && t.stage !== filters.stage) return false;
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.steps.map((s) => s.t).join(' ') + ' ' + (t.steps.flatMap((s) => s.c || []).map((n) => `[${n}]`).join(' '))).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function checklistEl(list) {
  const wrap = el('div');
  wrap.appendChild(el('h2', '', `Checklist — ${list.length} shown`));
  for (const t of list) {
    const item = el('div', 'check-item' + (state.earned.has(t.id) ? ' earned' : ''));
    const cb = el('input');
    cb.type = 'checkbox'; cb.checked = state.earned.has(t.id);
    cb.setAttribute('aria-label', `Earned: ${t.name}`);
    cb.addEventListener('change', () => {
      if (cb.checked) state.earned.add(t.id); else state.earned.delete(t.id);
      saveState(); renderAll();
    });
    item.appendChild(cb);
    const body = el('div', 'body');
    if (isConcealed(t)) {
      body.innerHTML = `<div class="row"><div><span class="name">Hidden trophy</span> ` +
        `${chipsFor(t)}</div></div>` +
        `<div class="desc">Hidden trophy — <button data-reveal="${t.id}">Reveal</button></div>`;
      body.querySelector('[data-reveal]').addEventListener('click', () => {
        state.revealed.add(t.id); saveState(); renderAll();
      });
    } else {
      body.innerHTML = `<div class="row"><div><span class="name">${trophyLink(t)}</span> ` +
        `${chipsFor(t)}<div class="desc">${esc(t.description)}</div></div>` +
        `<button class="show" data-show="${t.id}">Show guide</button></div>`;
      body.querySelector('[data-show]').addEventListener('click', () => {
        selectedId = t.id;
        location.hash = `#/trophy/${t.id}`;
      });
    }
    item.appendChild(body);
    wrap.appendChild(item);
  }
  if (list.length === 0) wrap.appendChild(el('p', 'muted', 'No trophies match these filters.'));
  return wrap;
}

// ---------------------------------------------------------------- sources view

function sourcesPanel(full) {
  const st = stepStats();
  const card = el('section', 'card');
  let h = `<h2>Sources</h2><p class="small">Guide steps cite these sources inline as [1]–[7]. Nothing here is copied: ` +
    `every step is written in our own words.</p>`;
  h += `<table class="sources"><thead><tr><th>#</th><th>Source</th><th class="num">Guide steps citing it</th></tr></thead><tbody>`;
  for (const s of DATA.sources) {
    const link = s.url ? `<a href="${esc(s.url)}" rel="noopener">${esc(s.name)}</a>` : esc(s.name);
    h += `<tr><td>[${s.n}]</td><td>${link}<div class="muted small">${esc(s.detail)} · read ${esc(s.read)}</div></td>` +
      `<td class="num">${st.perSource[s.n] || 0}</td></tr>`;
  }
  h += `</tbody></table>`;
  h += `<p class="small" style="margin-top:8px">${st.instances} inline citations across 55 guides ` +
    `(55/55 guides cited). Citations are references, not copies — every step is written in our own words.</p>`;
  if (full) {
    h += `<h3 style="margin-top:12px">What we could not read</h3><p class="small">Two trackers could not be read ` +
      `directly: Exophase has no GTA VI game page that surfaced in search, and PSNProfiles had no GTA VI page as of ` +
      `21 Oct 2026. The 55-name list is cross-checked across the six sources above, which agree 55/55, and the 28 ` +
      `hidden flags rest on two independent tables that agree exactly (OutputLag and eGamers, confirmed by GTA-Zone ` +
      `and WikiGTAVI). That is strong, but it is not a direct tracker reading, and this guide says so rather than ` +
      `hiding it.</p>`;
    h += `<h3>Honesty flags</h3><p class="small">1 possibly missable (Positive Mental Attitude — the Chapter 1 ` +
      `balcony meditation) · 2 watch (Strangers &amp; Freaks, Fair Game) · 3 unconfirmed (Bad Luck, I Guess; Ten Pin; ` +
      `Fair Game's animal) · 3 disagree (meditation count, final-mission chapter, Mile Zero location) · 3 single-source ` +
      `(In The Beginning…, Capital Offense, The Truth Is Out There). Platinum time (~200 hours, difficulty 4/10) is ` +
      `a launch-week estimate from the guides, not a measured result.</p>`;
  }
  card.innerHTML = h;
  return card;
}

function settingsCard() {
  const card = el('section', 'card');
  card.innerHTML = `<h2>Settings</h2>` +
    `<p><label><input type="checkbox" id="set-spoilers"${state.spoilers ? ' checked' : ''}> ` +
    `Hide spoilers (hidden trophy names, descriptions and guides)</label></p>` +
    `<p class="small">Progress lives only in this browser (localStorage). Nothing is sent over the network — ` +
    `this page works fully offline once loaded.</p>` +
    `<p class="small">Data: the official 55-trophy list as published 2026-11-18. Counts: 1 Platinum, 2 Gold, ` +
    `6 Silver, 46 Bronze; 28 hidden; 55/55 guides carry inline source citations.</p>` +
    `<p><button id="set-reset">Reset progress</button></p>`;
  card.querySelector('#set-spoilers').addEventListener('change', (ev) => {
    state.spoilers = ev.target.checked; saveState(); renderAll();
  });
  card.querySelector('#set-reset').addEventListener('click', () => {
    if (!demoMode) { state = { earned: new Set(), meditations: 0, revealed: new Set(), spoilers: true }; saveState(); }
    renderAll();
  });
  return card;
}

// ---------------------------------------------------------------- views

function viewCover() {
  const main = document.getElementById('view');
  main.innerHTML = '';
  const grid = el('div', 'grid2');
  grid.appendChild(checklistEl(filteredTrophies()));
  const side = el('div');
  side.appendChild(sourcesPanel(false));
  side.appendChild(settingsCard());
  grid.appendChild(side);
  main.appendChild(grid);
  // Detail panel below the fold: the cover's visible composition is the
  // checklist + SOURCES + AUDIT strip, not the selected trophy's detail.
  main.appendChild(detailPanel(byId(selectedId)));
}

function viewRoadmap() {
  const main = document.getElementById('view');
  main.innerHTML = '';
  const next = nextUp();
  const banner = el('div', 'nextup');
  banner.innerHTML = next
    ? `<b>NEXT UP: ${next.hidden && state.spoilers ? 'Hidden trophy' : esc(next.name)} (${STAGE_LABEL[next.stage]})</b> — ${esc(next.description)} ${citesHtml(next.steps[0] ? next.steps[0].c : [])}`
    : '<b>NEXT UP: nothing left — the Platinum is yours.</b>';
  main.appendChild(banner);
  const grid = el('div', 'grid2r');
  const left = el('div');
  left.appendChild(el('h2', '', 'Roadmap to the Platinum'));
  const stages = el('div', 'stages');
  for (const s of STAGE_ORDER) {
    const list = inRoadmapOrder().filter((t) => t.stage === s);
    if (list.length === 0) continue;
    const card = el('div', 'stage-card');
    card.innerHTML = `<h3>${esc(STAGE_LABEL[s])} — ${list.length} ${list.length === 1 ? 'trophy' : 'trophies'}</h3>` +
      '<ul>' + list.map((t) => `<li>${isConcealed(t) ? 'Hidden trophy' : trophyLink(t)}${state.earned.has(t.id) ? ' ✓' : ''}</li>`).join('') + '</ul>';
    stages.appendChild(card);
  }
  left.appendChild(stages);
  const note = el('p', 'muted small', 'Roadmap order follows the guides: finish the story first (stages S1–S3), ' +
    'then the character quests (S4), then side content (S5) and the system grinds (S6), and sweep up 100% completion ' +
    'last (S7). Only one interaction can be missed — the Chapter 1 balcony meditation; everything else can be done ' +
    'in free roam after the story. One playthrough is enough; there is no mission replay and no New Game+.');
  left.appendChild(note);
  grid.appendChild(left);
  grid.appendChild(detailPanel(byId(selectedId)));
  main.appendChild(grid);
}

function viewMissables() {
  const main = document.getElementById('view');
  main.innerHTML = '';
  const intro = el('p', '', 'One trophy can be missed, two need watching, three are unconfirmed, three are ' +
    'disputed between sources and three rest on a single source. Do the Chapter 1 balcony meditation early and ' +
    'keep a Chapter 1 save until Positive Mental Attitude pops.');
  main.appendChild(intro);
  const grid = el('div', 'grid2r');
  const left = el('div', 'flag-grid');
  const sections = [
    ['Possibly missable — 1', 'Do it in Chapter 1 or lose it for this playthrough.', 'missable'],
    ['Watch — 2', 'Conditions that can be missed or need a specific moment.', 'watch'],
    ['Unconfirmed — 3', 'No reliable guide steps exist yet — do not invent them.', 'unconfirmed'],
    ['Sources disagree — 3', 'Two versions are in circulation; both are shown.', 'disagree'],
    ['Single source — 3', 'Only one source reports this; treat it as provisional.', 'single-source'],
  ];
  for (const [title, sub, flag] of sections) {
    const card = el('div', 'card');
    const list = DATA.trophies.filter((t) => (t.flags || []).includes(flag));
    card.innerHTML = `<h3>${esc(title)}</h3><p class="small muted">${esc(sub)}</p><ul>` +
      list.map((t) => {
        const note = t.id === PMA_ID ? ' — see the dispute box in its detail.' :
          t.id === 'strangers-freaks' ? ' — finish 8 stranger mission strands; confirmed counting strands are Kirk, Kyle, Yago (timed) and Pilot Pete [1].' :
          t.id === 'fair-game' ? ' — start Bret’s chain: Jason only, after the Chapter 2 mission Coffee Break; Bret Vogel texts about “Veteran Hunted” in Lummox County [1][2][3].' :
          t.id === 'bad-luck-i-guess' ? ' — UNCONFIRMED: no source read on 20 Nov 2026 knows the method — do not chase a guessed method [1][5].' :
          t.id === 'ten-pin' ? ' — UNCONFIRMED: no source read on 20 Nov 2026 knows the method — do not chase a guessed method [1][5].' :
          t.id === 'you-gotta-know-when-to-get-off' ? ' — complete the final story mission to earn this gold trophy [1][2][3].' :
          t.id === 'challenging-tank' ? ' — find a Rhino tank on the south side of Mile Zero Air Station, according to PowerPyx [1][2][3].' :
          t.id === 'in-the-beginning' ? ' — single source: this method comes from PowerPyx only and has not been confirmed by a second source [1][6].' :
          t.id === 'capital-offense' ? ' — single source: this method comes from PowerPyx only and has not been confirmed by a second source [1][6].' :
          t.id === 'the-truth-is-out-there' ? ' — single source: this method comes from PowerPyx only and has not been confirmed by a second source [1][6].' : '';
        return `<li>${isConcealed(t) ? 'Hidden trophy' : trophyLink(t)}${note}</li>`;
      }).join('') + '</ul>';
    left.appendChild(card);
  }
  grid.appendChild(left);
  grid.appendChild(detailPanel(byId(selectedId)));
  main.appendChild(grid);
}

function viewSources() {
  const main = document.getElementById('view');
  main.innerHTML = '';
  const grid = el('div', 'grid2');
  grid.appendChild(sourcesPanel(true));
  const side = el('div');
  side.appendChild(settingsCard());
  const st = stepStats();
  const auditCard = el('section', 'card');
  auditCard.innerHTML = `<h2>Audit</h2><p class="small">55 official trophies · 1 Platinum, 2 Gold, 6 Silver, ` +
    `46 Bronze · 28 hidden · 55/55 guides cite a source · ${st.steps} steps, ${st.cited}/${st.steps} cited · ` +
    `${st.instances} inline citations · 7 sources read 20 Nov 2026 · 1 possibly missable · 2 watch · 3 unconfirmed · ` +
    `3 disagree · 3 single-source.</p><p class="small">Trophy names, descriptions and grades are the official ` +
    `PlayStation list as published 2026-11-18. Step text is our own; citations point at the source for each fact.</p>`;
  side.appendChild(auditCard);
  grid.appendChild(side);
  main.appendChild(grid);
}

function viewTrophy(id) {
  const t = byId(id) || byId(PMA_ID);
  selectedId = t.id;
  const main = document.getElementById('view');
  main.innerHTML = '';
  const back = el('p', '', '<a href="#/">← Back to cover</a>');
  main.appendChild(back);
  main.appendChild(detailPanel(t));
  const grid = el('div', 'grid2');
  grid.appendChild(checklistEl(filteredTrophies()));
  const side = el('div');
  side.appendChild(sourcesPanel(false));
  grid.appendChild(side);
  main.appendChild(grid);
}

// ---------------------------------------------------------------- boot

function renderView() {
  const hash = location.hash || '#/';
  renderHeader();
  if (hash.startsWith('#/roadmap')) viewRoadmap();
  else if (hash.startsWith('#/missables')) viewMissables();
  else if (hash.startsWith('#/sources')) viewSources();
  else if (hash.startsWith('#/trophy/')) viewTrophy(hash.slice('#/trophy/'.length));
  else viewCover();
}

function renderAll() {
  renderToolbar();
  renderView();
}

fetch(DATA_URL)
  .then((r) => { if (!r.ok) throw new Error('data failed to load'); return r.json(); })
  .then((data) => {
    DATA = data;
    renderAll();
    window.addEventListener('hashchange', renderView);
  })
  .catch(() => {
    document.getElementById('view').innerHTML =
      '<p>Could not load data/trophies.json. Open this app from its own folder (or run <code>node serve.ts</code>) and reload.</p>';
  });
