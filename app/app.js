// GTA VI trophy guide + tracker: offline, vanilla JS. Data comes only from
// data/trophies.json (same directory, fetched once on load); progress and the
// spoiler setting live in localStorage; nothing is ever sent over the network.
const EARNED_KEY = 'gta6-trophy-checklist-v1';
const SPOILER_KEY = 'gta6-trophy-spoiler-v1';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

let earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]'));
let spoiler = localStorage.getItem(SPOILER_KEY) !== 'false';
const revealed = new Set(); // hidden trophies unmasked one by one, this session only
let selectedId = 23; // Positive Mental Attitude: the disputed one, shown first

const $ = (id) => document.getElementById(id);
const els = {
  progress: $('progress'), audit: $('audit'), search: $('search'), grade: $('grade'),
  stage: $('stage'), flag: $('flag'), spoiler: $('spoiler'), spoiler2: $('spoiler2'),
  rows: $('rows'), shown: $('shown-count'), stages: $('stages'), nextup: $('nextup'),
  flags: $('flag-groups'), detail: $('detail'), matrix: $('matrix'),
};

const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const STAGE_LABEL = {
  S1: 'S1 — First steps', S2: 'S2 — Vice City', S3: 'S3 — Mid-game', S4: 'S4 — Heists',
  S5: 'S5 — Side content', S6: 'S6 — Cleanup', S7: 'S7 — Platinum', anytime: 'Anytime',
};
const stageOf = (t) => t.stage ?? 'anytime';
const isMasked = (t) => spoiler && t.hidden && !revealed.has(t.id);
const displayName = (t) => (isMasked(t) ? 'Hidden trophy' : t.name);
const displayDesc = (t) => (isMasked(t) ? 'Hidden — reveal to see the official description.' : t.description);

function save() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned]));
  localStorage.setItem(SPOILER_KEY, String(spoiler));
}

function badge(text, cls) {
  const s = document.createElement('span');
  s.className = `badge ${cls}`;
  s.textContent = text;
  return s;
}

function flagBadges(t) {
  const wrap = document.createElement('span');
  wrap.className = 'flags';
  for (const f of t.flags) wrap.append(badge(f, `flag-${f.replace(/ /g, '-')}`));
  return wrap;
}

function renderAudit() {
  const a = doc.audit;
  els.audit.replaceChildren();
  const items = [
    `${a.trophies} trophies`, `${a.platinum} Platinum`, `${a.gold} Gold`, `${a.silver} Silver`,
    `${a.bronze} Bronze`, `${a.hidden} hidden`, `${a.guides_with_source}/${a.trophies} guides cited`,
  ];
  for (const text of items) {
    const s = document.createElement('span');
    s.className = 'audit-item';
    s.textContent = text;
    els.audit.append(s);
  }
}

function renderProgress() {
  els.progress.textContent = `${earned.size} of ${trophies.length} earned`;
}

function renderRoadmap() {
  els.stages.replaceChildren();
  const order = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'anytime'];
  for (const st of order) {
    const list = trophies.filter((t) => stageOf(t) === st);
    if (list.length === 0) continue;
    const card = document.createElement('div');
    card.className = 'stage-card';
    const h = document.createElement('h3');
    h.textContent = `${STAGE_LABEL[st]} — ${list.length} ${list.length === 1 ? 'trophy' : 'trophies'}`;
    card.append(h);
    const ul = document.createElement('ul');
    for (const t of list) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'linklike';
      b.textContent = `${earned.has(t.id) ? '✓ ' : ''}${displayName(t)}`;
      b.addEventListener('click', () => select(t.id));
      li.append(b);
      ul.append(li);
    }
    card.append(ul);
    els.stages.append(card);
  }
  // NEXT UP: first unearned trophy in roadmap order.
  const orderIdx = (t) => order.indexOf(stageOf(t));
  const next = [...trophies].filter((t) => !earned.has(t.id)).sort((a, b) => orderIdx(a) - orderIdx(b) || a.id - b.id)[0];
  els.nextup.replaceChildren();
  if (next) {
    const strong = document.createElement('strong');
    strong.textContent = `NEXT UP: ${displayName(next)} (${STAGE_LABEL[stageOf(next)]}) — `;
    els.nextup.append(strong, document.createTextNode(next.guide[0] ?? ''));
  } else {
    els.nextup.textContent = 'All 55 earned — Vice Got a Price! is yours.';
  }
}

function filtered() {
  const q = els.search.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (els.grade.value !== 'all' && t.grade !== els.grade.value) return false;
    if (els.stage.value !== 'all' && stageOf(t) !== els.stage.value) return false;
    if (els.flag.value !== 'all' && !t.flags.includes(els.flag.value)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderChecklist() {
  const list = filtered();
  els.shown.textContent = `${list.length} shown`;
  els.rows.replaceChildren();
  for (const t of list) {
    const row = document.createElement('article');
    row.className = `trophy grade-${t.grade}${t.id === selectedId ? ' selected' : ''}`;
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Earned: ${displayName(t)}`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      save();
      renderProgress();
      renderRoadmap();
      renderChecklist();
    });
    const body = document.createElement('div');
    body.className = 't-body';
    const head = document.createElement('div');
    head.className = 't-head';
    const name = document.createElement('button');
    name.type = 'button';
    name.className = 't-name linklike';
    name.textContent = displayName(t);
    name.addEventListener('click', () => select(t.id));
    head.append(name, badge(GRADE_LABEL[t.grade], `grade-${t.grade}`), badge(stageOf(t), 'stage'));
    if (t.count > 1) head.append(badge(`×${t.count}`, 'count'));
    if (t.hidden) head.append(badge('Hidden', 'hidden'));
    head.append(flagBadges(t));
    const desc = document.createElement('p');
    desc.className = 't-desc';
    desc.textContent = displayDesc(t);
    body.append(head, desc);
    if (isMasked(t)) {
      const rev = document.createElement('button');
      rev.type = 'button';
      rev.textContent = 'Reveal this trophy';
      rev.addEventListener('click', () => {
        revealed.add(t.id);
        renderChecklist();
        renderRoadmap();
        select(t.id);
      });
      body.append(rev);
    } else {
      const det = document.createElement('button');
      det.type = 'button';
      det.className = 't-detail-btn';
      det.textContent = t.id === selectedId ? 'Hide guide' : 'Show guide';
      det.addEventListener('click', () => select(t.id === selectedId ? null : t.id));
      body.append(det);
    }
    row.append(box, body);
    els.rows.append(row);
  }
}

function renderMissables() {
  const groups = [
    ['possibly-missable', 'Possibly missable', 'Do it in Chapter 1 or lose it for this playthrough.'],
    ['watch', 'Watch', 'Conditions that can be missed or need a specific moment.'],
    ['unconfirmed', 'Unconfirmed', 'No reliable guide steps exist yet — do not invent them.'],
    ['disagree', 'Sources disagree', 'Two versions are in circulation; both are shown.'],
    ['single source', 'Single source', 'Only one source reports this; treat it as provisional.'],
  ];
  els.flags.replaceChildren();
  for (const [flag, title, note] of groups) {
    const list = trophies.filter((t) => t.flags.includes(flag));
    if (list.length === 0) continue;
    const g = document.createElement('div');
    g.className = 'flag-group';
    const h = document.createElement('h3');
    h.textContent = `${title} — ${list.length}`;
    const p = document.createElement('p');
    p.className = 'note';
    p.textContent = note;
    g.append(h, p);
    for (const t of list) {
      const item = document.createElement('p');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'linklike';
      b.textContent = displayName(t);
      b.addEventListener('click', () => select(t.id));
      item.append(b, document.createTextNode(` — ${t.dispute ? 'see the dispute box in its detail.' : (t.guide[0] ?? '')}`));
      g.append(item);
    }
    els.flags.append(g);
  }
}

function renderDetail() {
  els.detail.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = 'Trophy detail';
  els.detail.append(h);
  const t = selectedId === null ? null : byId.get(selectedId);
  if (!t) {
    const p = document.createElement('p');
    p.className = 'note';
    p.textContent = 'Pick a trophy from the checklist, roadmap or watch list to see its full guide.';
    els.detail.append(p);
    return;
  }
  const name = document.createElement('h3');
  name.textContent = displayName(t);
  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.textContent = `${GRADE_LABEL[t.grade]} · ${STAGE_LABEL[stageOf(t)]}${t.count > 1 ? ` · ×${t.count}` : ''}${t.hidden ? ' · Hidden' : ''} · ${earned.has(t.id) ? 'Earned ✓' : 'Not earned yet'}`;
  els.detail.append(name, meta);
  if (t.flags.length) els.detail.append(flagBadges(t));
  const desc = document.createElement('p');
  desc.textContent = displayDesc(t);
  els.detail.append(desc);
  if (t.dispute) {
    const box = document.createElement('div');
    box.className = 'dispute';
    const dh = document.createElement('strong');
    dh.textContent = 'Sources disagree — both versions shown: ';
    const dt = document.createElement('span');
    dt.textContent = t.dispute;
    box.append(dh, dt);
    els.detail.append(box);
  }
  if (isMasked(t)) {
    const rev = document.createElement('button');
    rev.type = 'button';
    rev.textContent = 'Reveal this trophy';
    rev.addEventListener('click', () => {
      revealed.add(t.id);
      renderAll();
    });
    els.detail.append(rev);
    return;
  }
  const ol = document.createElement('ol');
  ol.className = 'guide';
  for (const step of t.guide) {
    const li = document.createElement('li');
    li.textContent = step;
    ol.append(li);
  }
  els.detail.append(ol);
  const mark = document.createElement('button');
  mark.type = 'button';
  mark.textContent = earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned';
  mark.addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id);
    else earned.add(t.id);
    save();
    renderProgress();
    renderRoadmap();
    renderChecklist();
    renderDetail();
  });
  els.detail.append(mark);
}

function renderSources() {
  // Source matrix: each source, its link, and how many guide steps cite it.
  const counts = new Map(doc.sources.map((s) => [s.n, 0]));
  for (const t of trophies) {
    for (const step of t.guide) {
      for (const m of step.matchAll(/\[(\d+)\]/g)) {
        const n = Number(m[1]);
        if (counts.has(n)) counts.set(n, counts.get(n) + 1);
      }
    }
  }
  els.matrix.replaceChildren();
  const head = document.createElement('tr');
  for (const label of ['#', 'Source', 'Guide steps citing it']) {
    const th = document.createElement('th');
    th.textContent = label;
    head.append(th);
  }
  els.matrix.append(head);
  for (const s of doc.sources) {
    const tr = document.createElement('tr');
    const n = document.createElement('td');
    n.textContent = `[${s.n}]`;
    const name = document.createElement('td');
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      name.append(a);
    } else {
      name.textContent = s.name;
    }
    const c = document.createElement('td');
    c.textContent = String(counts.get(s.n) ?? 0);
    tr.append(n, name, c);
    els.matrix.append(tr);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const foot = document.createElement('p');
  foot.className = 'note';
  foot.textContent = `${total} inline citations across 55 guides (55/55 guides cited). Citations are references, not copies — every step is written in our own words.`;
  els.matrix.after(foot);
}

function select(id) {
  selectedId = id;
  renderChecklist();
  renderDetail();
}

function renderAll() {
  renderAudit();
  renderProgress();
  renderRoadmap();
  renderChecklist();
  renderMissables();
  renderDetail();
  renderSources();
}

function applySpoiler() {
  els.spoiler.checked = spoiler;
  els.spoiler2.checked = spoiler;
  save();
  renderRoadmap();
  renderChecklist();
  renderMissables();
  renderDetail();
}

els.search.addEventListener('input', renderChecklist);
els.grade.addEventListener('change', renderChecklist);
els.stage.addEventListener('change', renderChecklist);
els.flag.addEventListener('change', renderChecklist);
els.spoiler.addEventListener('change', () => { spoiler = els.spoiler.checked; applySpoiler(); });
els.spoiler2.addEventListener('change', () => { spoiler = els.spoiler2.checked; applySpoiler(); });

$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ game: doc.game, earned: [...earned].sort((x, y) => x - y), exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('no earned list');
    const next = new Set(ids.filter((id) => byId.has(id)));
    earned = next;
    save();
    renderAll();
  } catch {
    alert('That file is not a progress export from this guide.');
  }
  e.target.value = '';
});
const resetAll = () => {
  if (!confirm('Clear all earned ticks?')) return;
  earned = new Set();
  save();
  renderAll();
};
$('reset').addEventListener('click', resetAll);
$('reset2').addEventListener('click', resetAll);

renderAll();

// Screenshot views (?shot=1..4): deterministic states for the four captures.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) document.body.dataset.shot = shot;
if (shot === '1') {
  // Cover: the detail panel goes full-width above the grid, so checklist +
  // detail + sources + audit strip all fit one 1280x800 frame.
  const layout = document.querySelector('.layout');
  els.detail.classList.add('cover-detail');
  document.body.insertBefore(els.detail, layout);
}
requestAnimationFrame(() => {
  if (shot === '1') select(23); // Positive Mental Attitude in the detail panel
  if (shot === '2') document.getElementById('roadmap').scrollIntoView();
  if (shot === '3') {
    select(23);
    document.getElementById('missables').scrollIntoView();
  }
  if (shot === '4') document.getElementById('sources').scrollIntoView();
});
