'use strict';

/* ————————————————————————————————————————————————
   A.M Studio — navigazione e pagine
———————————————————————————————————————————————— */

const main = $('#main');
const NAV = [
  { items: [['dashboard', 'home', 'Panoramica']] },
  { label: 'Contenuti', items: [['projects', 'grid', 'Progetti'], ['library', 'image', 'Libreria immagini'], ['texts', 'pen', 'Testi e profilo']] },
  { label: 'Sito', items: [['home', 'layout', 'Homepage'], ['style', 'type', 'Identità visiva'], ['seo', 'globe', 'Ricerca Google']] },
  { label: 'Attività', items: [['leads', 'inbox', 'Richieste'], ['calendar', 'calendar', 'Calendario'], ['stats', 'chart', 'Statistiche']] },
  { label: 'Pubblicazione', items: [['publish', 'upload', 'Pubblica'], ['versions', 'history', 'Versioni']] }
];
const TITLES = Object.fromEntries(NAV.flatMap(g => g.items.map(([id, , t]) => [id, t])).concat([['settings', 'Impostazioni']]));
let route = 'dashboard', param = null;

function renderNav() {
  $('#nav').innerHTML = NAV.map(g => `<div class="nav-group">${g.label ? `<div class="nav-label">${g.label}</div>` : ''}${g.items.map(([id, icon, t]) => `<button class="nav-item" data-go="${id}">${ico(icon)}<span>${t}</span><span class="tag" data-tag="${id}" hidden></span></button>`).join('')}</div>`).join('');
}
function refreshChrome() {
  const diff = differences().length, unread = state.leads.filter(l => l.unread).length;
  const set = (id, v, soft) => { const t = $(`[data-tag="${id}"]`); if (!t) return; t.hidden = !v; t.textContent = v; t.classList.toggle('soft', !!soft); };
  set('leads', unread);
  set('publish', diff);
  set('projects', state.projects.length, true);
  const c = $('#changeCount'); c.textContent = diff; c.classList.toggle('zero', !diff);
  $('#bellDot').hidden = !unread;
  $('#lastPublish').textContent = 'Pubblicato ' + ago(state.lastPublish);
}
function setActive() {
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.go === route));
  const crumbs = [`<span>Studio</span>${ico('chevron')}`];
  if (route === 'projects' && param) {
    const p = state.projects.find(p => p.id === param);
    crumbs.push(`<button data-go="projects">Progetti</button>${ico('chevron')}<b>${esc(p?.title || 'Nuovo progetto')}</b>`);
  } else crumbs.push(`<b>${TITLES[route] || ''}</b>`);
  $('#crumbs').innerHTML = crumbs.join('');
}

const PAGES = {};
function go(path, { replace = false } = {}) {
  if (location.hash.slice(1) === path) return render();
  replace ? history.replaceState(null, '', '#' + path) : (location.hash = path);
}
function render() {
  const [r, p] = (location.hash.slice(1) || 'dashboard').split('/');
  route = PAGES[r] ? r : 'dashboard';
  param = p ? decodeURIComponent(p) : null;
  closeSidebar(); closePopover();
  main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter');
  PAGES[route](param);
  setActive();
  refreshChrome();
  window.scrollTo({ top: 0 });
}
window.addEventListener('hashchange', render);
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g && !g.closest('#dialog') && !g.closest('#drawer')) { e.preventDefault(); go(g.dataset.go); }
});

function head(title, sub, actions = '', eyebrow = '') {
  return `<div class="page-head"><div>${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;
}

/* ═════════════ PANORAMICA ═════════════ */
let featureIdx = 0, featureTimer;
PAGES.dashboard = () => {
  const t = Stats.totals(30), last14 = Stats.range(14);
  const unread = state.leads.filter(l => l.unread), diff = differences();
  const open = state.leads.filter(l => ['Nuova', 'In valutazione', 'Proposta inviata'].includes(l.status));
  const pipeline = open.reduce((a, l) => a + (+l.budget || 0), 0);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera';
  const dateStr = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const upcoming = state.agenda.filter(a => !a.done && a.date >= iso(today)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const feats = [state.projects.find(p => p.id === state.home.featured) || state.projects[0], ...state.projects.filter(p => p.id !== state.home.featured)].filter(p => p.images.length).slice(0, 5);
  featureIdx = 0;
  main.innerHTML = `
  <div class="hello"><div><div class="date">${dateStr}</div><h1>${greet}, Alessandro.<br><span>${unread.length ? `${unread.length === 1 ? 'Una nuova richiesta' : unread.length + ' nuove richieste'} ti aspetta${unread.length === 1 ? '' : 'no'}.` : 'Tutto in ordine nello studio.'}</span></h1></div>
    <div class="actions row"><button class="btn" data-go="leads">${ico('inbox', 'sm')}Richieste</button><button class="btn primary" id="newProj">${ico('plus', 'sm')}Nuovo progetto</button></div></div>

  <div class="grid g-4" style="margin-bottom:16px">
    <div class="card kpi clickable" data-go="stats"><div class="kpi-label">${ico('eye')}Visitatori · 30 giorni</div><div class="kpi-value">${fmt(t.cur.visitors)} ${delta(t.cur.visitors, t.prev.visitors)}</div><div class="kpi-foot">${fmt(t.cur.views)} pagine viste</div>${spark(last14.map(d => d.visitors))}</div>
    <div class="card kpi clickable" data-go="leads"><div class="kpi-label">${ico('inbox')}Richieste aperte</div><div class="kpi-value">${open.length} <small>${eur(pipeline)}</small></div><div class="kpi-foot">${unread.length} da leggere · valore in trattativa</div></div>
    <div class="card kpi clickable" data-go="stats"><div class="kpi-label">${ico('mail')}Clic sui contatti</div><div class="kpi-value">${fmt(t.cur.contacts)} ${delta(t.cur.contacts, t.prev.contacts)}</div><div class="kpi-foot">${(t.cur.contacts / t.cur.visitors * 100).toFixed(1).replace('.', ',')}% dei visitatori</div>${spark(last14.map(d => d.contacts), 'var(--green)')}</div>
    <div class="card kpi clickable" data-go="publish"><div class="kpi-label">${ico('upload')}Da pubblicare</div><div class="kpi-value">${diff.length} <small>${diff.length === 1 ? 'modifica' : 'modifiche'}</small></div><div class="kpi-foot">Ultima pubblicazione ${ago(state.lastPublish)}</div></div>
  </div>

  <div class="split wide" style="margin-bottom:16px">
    <section class="feature" id="feature">
      ${feats.map((p, i) => `<img src="${esc(p.images[0])}" alt="${esc(p.title)}" style="opacity:${i ? 0 : 1}" data-f="${i}">`).join('')}
      <div class="feature-top"><span class="badge glass plain">${ico('sparkle', 'xs')}In evidenza sul sito</span><div class="feature-dots">${feats.map((_, i) => `<button data-fd="${i}" class="${i ? '' : 'on'}" aria-label="Progetto ${i + 1}"></button>`).join('')}</div></div>
      <div class="feature-bottom"><div><h2 id="fTitle">${esc(feats[0].title)}</h2><p id="fMeta"></p></div><button class="round-btn" id="fOpen" aria-label="Apri progetto">${ico('arrow-up-right')}</button></div>
    </section>
    <section class="card">
      <div class="card-head"><h2>Attività recente</h2><button class="link" data-go="versions">Cronologia ${ico('arrow-right', 'xs')}</button></div>
      <div class="card-body"><ul class="activity">${state.activity.slice(0, 6).map(a => `<li><span class="ico">${ico(a.icon)}</span><div>${a.text}<small>${esc(a.sub)}</small></div><time>${ago(a.at)}</time></li>`).join('')}</ul></div>
    </section>
  </div>

  <div class="grid g-3" style="margin-bottom:16px">
    <section class="card" style="grid-column:span 2">
      <div class="card-head"><div><h2>Visitatori del sito</h2><p>Ultimi 30 giorni, confrontati con il mese precedente</p></div><div class="legend"><span><i></i>Questo periodo</span><span><i class="prev"></i>Precedente</span></div></div>
      <div class="card-body"><div class="chart" id="dashChart"></div></div>
    </section>
    <section class="card" style="overflow:hidden">
      <div class="card-head"><h2>Ultime richieste</h2><button class="link" data-go="leads">Tutte ${ico('arrow-right', 'xs')}</button></div>
      <div style="margin-top:12px">${state.leads.slice().sort((a, b) => b.at - a.at).slice(0, 4).map(l => `<button class="mini-lead" data-lead="${l.id}"><span class="avatar av-${l.id % 6 + 1}">${initials(l.name)}</span><span style="min-width:0"><b>${esc(l.company)}</b><small>${esc(l.subject)}</small></span><span style="text-align:right">${l.unread ? '<span class="badge accent">Nuova</span>' : `<small class="faint">${ago(l.at)}</small>`}</span></button>`).join('')}</div>
    </section>
  </div>

  <div class="grid g-3">
    <section class="card"><div class="card-head"><h2>In programma</h2><button class="link" data-go="calendar">Calendario ${ico('arrow-right', 'xs')}</button></div>
      <div class="card-body">${upcoming.map(a => { const d = parseDay(a.date); return `<div class="agenda-mini"><div class="date-chip"><small>${d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '')}</small><b>${d.getDate()}</b></div><div style="min-width:0"><b style="font-weight:500;display:block">${esc(a.title)}</b><small class="muted">${EVENT_TYPES[a.type]} · ${relDay(a.date)}</small></div></div>`; }).join('') || '<p class="muted">Nessuna attività in programma.</p>'}</div></section>
    <section class="card"><div class="card-head"><h2>Progetti più visti</h2><button class="link" data-go="stats">Dettagli ${ico('arrow-right', 'xs')}</button></div>
      <div class="card-body">${Stats.projects(30, state.projects).slice(0, 4).map((r, i) => `<button class="hbar" data-go="projects/${r.p.id}"><span class="name"><img class="thumb sm" src="${esc(r.p.images[0] || '')}" alt="">${esc(r.p.title)}</span><span class="val">${fmt(r.views)}</span><span class="track"><i style="width:${r.views / Stats.projects(30, state.projects)[0].views * 100}%;animation-delay:${i * .08}s"></i></span></button>`).join('')}</div></section>
    <section class="stack">
      <button class="quick" data-go="home"><span class="ico">${ico('layout')}</span><span><b>Cambia l’apertura del sito</b><small>Progetto in evidenza e ordine delle sezioni</small></span></button>
      <button class="quick" data-go="style"><span class="ico">${ico('type')}</span><span><b>Prova un nuovo stile</b><small>Caratteri, colori e proporzioni, con anteprima</small></span></button>
    </section>
  </div>`;
  $('#newProj').onclick = newProject;
  $$('[data-lead]').forEach(b => b.onclick = () => openLead(+b.dataset.lead));
  areaChart($('#dashChart'), Stats.range(30), Stats.prev(30), { height: 230 });
  const show = i => {
    featureIdx = i;
    $$('#feature [data-f]').forEach(img => img.style.opacity = +img.dataset.f === i ? 1 : 0);
    $$('#feature [data-fd]').forEach(b => b.classList.toggle('on', +b.dataset.fd === i));
    $('#fTitle').textContent = feats[i].title;
    $('#fMeta').textContent = `${feats[i].category} · ${feats[i].images.length} immagini${feats[i].camera && feats[i].camera !== 'Nessuna' ? ' · ' + feats[i].camera : ''}`;
  };
  show(0);
  $$('#feature [data-fd]').forEach(b => b.onclick = () => { show(+b.dataset.fd); restart(); });
  $('#fOpen').onclick = () => go('projects/' + feats[featureIdx].id);
  const restart = () => { clearInterval(featureTimer); featureTimer = setInterval(() => { if (!$('#feature')) return clearInterval(featureTimer); show((featureIdx + 1) % feats.length); }, 5200); };
  restart();
};
const initials = n => n.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase();
function relDay(d) {
  const n = Math.round((parseDay(d) - today) / DAY);
  return n === 0 ? 'oggi' : n === 1 ? 'domani' : n === -1 ? 'ieri' : n > 0 ? `tra ${n} giorni` : `${-n} giorni fa`;
}

/* ═════════════ PROGETTI ═════════════ */
let projFilter = 'Tutti', projQuery = '';
PAGES.projects = id => id ? projectEditor(id) : projectList();

function projectList() {
  const counts = c => c === 'Tutti' ? state.projects.length : state.projects.filter(p => p.category === c).length;
  main.innerHTML = head('Progetti', 'Le serie pubblicate sul sito. Trascina per cambiare l’ordine in cui compaiono.', `<button class="btn primary" id="newProj">${ico('plus', 'sm')}Nuovo progetto</button>`) + `
    <div class="toolbar"><div class="seg" id="pf">${['Tutti', ...CATEGORIES].map(c => `<button data-f="${c}" class="${c === projFilter ? 'on' : ''}">${c}<span class="n">${counts(c)}</span></button>`).join('')}</div>
      <div class="grow"></div>
      <label class="search">${ico('search', 'sm')}<input class="input" id="pq" placeholder="Cerca un progetto" value="${esc(projQuery)}"></label>
      <div class="seg" id="pv"><button data-v="grid" class="${state.projectView === 'grid' ? 'on' : ''}" aria-label="Griglia">${ico('grid', 'sm')}</button><button data-v="list" class="${state.projectView === 'list' ? 'on' : ''}" aria-label="Elenco">${ico('list', 'sm')}</button></div></div>
    <div id="plist"></div>`;
  $('#newProj').onclick = newProject;
  $$('#pf button').forEach(b => b.onclick = () => { projFilter = b.dataset.f; $$('#pf button').forEach(x => x.classList.toggle('on', x === b)); drawProjects(); });
  $$('#pv button').forEach(b => b.onclick = () => { state.projectView = b.dataset.v; $$('#pv button').forEach(x => x.classList.toggle('on', x === b)); save(); drawProjects(); });
  $('#pq').oninput = e => { projQuery = e.target.value; drawProjects(); };
  drawProjects();
}
function drawProjects() {
  const q = projQuery.toLowerCase();
  const rows = state.projects.filter(p => (projFilter === 'Tutti' || p.category === projFilter) && (p.title + ' ' + p.category + ' ' + (p.camera || '')).toLowerCase().includes(q));
  const box = $('#plist');
  if (!rows.length) { box.innerHTML = `<div class="card empty"><span class="ico">${ico('search')}</span><h3>Nessun progetto trovato</h3><p>Prova un’altra ricerca o crea un nuovo progetto.</p></div>`; return; }
  const status = p => `<span class="badge ${p.status === 'Online' ? 'green' : 'amber'}">${p.status === 'Online' ? 'Online' : 'Bozza'}</span>`;
  if (state.projectView === 'list') {
    box.innerHTML = `<div class="card plist">${rows.map(p => `<button class="plist-row" data-id="${p.id}"><img src="${esc(p.images[0] || '')}" alt=""><span><b>${esc(p.title)}</b><br><small class="muted">${p.images.length} immagini</small></span><span class="muted">${p.category}</span><span class="muted">Aggiornato ${ago(p.updated)}</span>${status(p)}${ico('chevron')}</button>`).join('')}</div>`;
  } else {
    box.innerHTML = `<div class="projects">${rows.map(p => `<button class="project" data-id="${p.id}"><div class="cover">${p.images[0] ? `<img src="${esc(p.images[0])}" alt="${esc(p.title)}" loading="lazy">` : ''}${p.images[1] ? `<img class="alt" src="${esc(p.images[1])}" alt="" loading="lazy">` : ''}<span class="badge ${p.status === 'Online' ? 'glass' : 'amber'}">${p.status === 'Online' ? 'Online' : 'Bozza'}</span><span class="count">${ico('image')}${p.images.length}</span></div><div><h3>${esc(p.title)}</h3><div class="meta"><span>${p.category}${p.camera && p.camera !== 'Nessuna' ? ' · ' + esc(p.camera) : ''}</span><span>${ago(p.updated)}</span></div></div></button>`).join('')}<button class="project new" id="newTile"><div class="cover"><div>${ico('plus')}Nuovo progetto</div></div></button></div>`;
    $('#newTile').onclick = newProject;
  }
  $$('[data-id]', box).forEach(b => b.onclick = () => go('projects/' + b.dataset.id));
  if (projFilter === 'Tutti' && !q) sortable(box, '[data-id]', (a, b) => {
    moveItem(state.projects, a, b); save(); drawProjects(); toast('Ordine del portfolio aggiornato');
  });
}
function newProject() {
  const p = { id: 'p-' + Date.now().toString(36), title: 'Nuovo progetto', category: 'Fotografia', description: '', images: [], camera: 'Canon A-1', status: 'Bozza', layout: 'grid', fit: 'cover', year: new Date().getFullYear(), updated: Date.now() };
  state.projects.unshift(p); save();
  log('plus', `Creato il progetto <b>${esc(p.title)}</b>`, 'Bozza', 'projects/' + p.id);
  go('projects/' + p.id);
  setTimeout(() => { const t = $('#pTitle'); t?.focus(); t?.select(); }, 80);
}

let previewMobile = false;
function projectEditor(id) {
  const p = state.projects.find(p => p.id === id);
  if (!p) return go('projects', { replace: true });
  main.innerHTML = `
  <div class="page-head"><div><button class="link" data-go="projects" style="margin-bottom:12px">${ico('arrow-left', 'xs')}Tutti i progetti</button><h1 id="hTitle">${esc(p.title)}</h1><p>${p.status === 'Online' ? 'Visibile sul sito' : 'Bozza · non visibile sul sito'} · modificato ${ago(p.updated)}</p></div>
    <div class="actions"><button class="btn ghost danger" id="del">${ico('trash', 'sm')}Elimina</button><button class="btn" id="pv">${ico('eye', 'sm')}Anteprima</button><button class="btn primary" id="saveP">${ico('check', 'sm')}Salva</button></div></div>
  <div class="editor">
    <div class="stack">
      <section class="card card-pad">
        <label class="field"><span>Titolo</span><input id="pTitle" value="${esc(p.title)}"></label>
        <div class="two"><label class="field"><span>Disciplina</span><select id="pCat">${CATEGORIES.map(c => `<option ${c === p.category ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
          <label class="field"><span>Anno</span><input id="pYear" type="number" min="1990" max="2100" value="${p.year || ''}"></label></div>
        <div class="two"><label class="field"><span>Fotocamera</span><select id="pCam">${CAMERAS.map(c => `<option ${c === p.camera ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
          <label class="field"><span>Pellicola o supporto <em>facoltativo</em></span><input id="pFilm" value="${esc(p.film || '')}" placeholder="Es. Kodak Portra 400"></label></div>
        <label class="field" style="margin:0"><span>Il racconto del progetto <em id="dCount"></em></span><textarea id="pDesc" rows="5" placeholder="Di cosa parla questa serie? Dove, quando, con quale intenzione.">${esc(p.description)}</textarea></label>
      </section>
      <section class="card">
        <div class="card-head"><div><h2>Sequenza delle immagini</h2><p>Trascina per riordinare. La prima è la copertina.</p></div><span class="muted" id="seqCount"></span></div>
        <div class="card-body"><div class="seq" id="seq"></div></div>
      </section>
      <section class="card card-pad">
        <div class="row between" style="margin-bottom:14px"><h2 class="card-title">Impaginazione della galleria</h2></div>
        <div class="option-cards" id="layouts">${[['grid', 'Griglia', 'grid2', 4], ['editorial', 'Editoriale', 'edit', 2], ['strip', 'Pellicola', 'strip', 4]].map(([v, l, c, n]) => `<button class="option-card ${p.layout === v ? 'on' : ''}" data-l="${v}"><div class="pv ${c}">${'<i></i>'.repeat(n)}</div>${l}</button>`).join('')}</div>
        <div class="divider"></div>
        <div class="row between"><div><b style="font-weight:500">Mostra le foto intere</b><p class="hint">Senza ritagli, rispettando le proporzioni originali.</p></div><label class="switch"><input type="checkbox" id="pFit" ${p.fit === 'contain' ? 'checked' : ''}><span></span></label></div>
        <div class="divider"></div>
        <div class="row between"><div><b style="font-weight:500">Visibile sul sito</b><p class="hint">Le bozze restano qui finché non le rendi visibili.</p></div><label class="switch"><input type="checkbox" id="pOn" ${p.status === 'Online' ? 'checked' : ''}><span></span></label></div>
      </section>
    </div>
    <aside class="sticky stack">
      <div class="preview-bar"><span class="label">Anteprima della pagina</span>${deviceSeg('pDev', previewMobile)}</div>
      <div id="pPrev"></div>
    </aside>
  </div>`;
  const draft = structuredClone(p);
  const sync = () => {
    draft.title = $('#pTitle').value; draft.category = $('#pCat').value; draft.camera = $('#pCam').value;
    draft.description = $('#pDesc').value; draft.year = +$('#pYear').value || ''; draft.film = $('#pFilm').value;
    draft.fit = $('#pFit').checked ? 'contain' : 'cover'; draft.status = $('#pOn').checked ? 'Online' : 'Bozza';
    $('#hTitle').textContent = draft.title || 'Senza titolo';
    $('#dCount').textContent = draft.description.length + ' caratteri';
    drawPrev();
  };
  const drawPrev = () => { $('#pPrev').innerHTML = browser(sitePreview({ project: draft }), { mobile: previewMobile, tall: true, path: '/lavori/' + p.id }); };
  const drawSeq = () => {
    $('#seqCount').textContent = draft.images.length + ' / 24';
    $('#seq').innerHTML = draft.images.map((src, i) => `<div class="seq-item" tabindex="0" aria-label="Immagine ${i + 1}. Alt più frecce per spostare."><img src="${esc(src)}" alt=""><span class="n ${i ? '' : 'cover'}">${i ? pad(i + 1) : 'Copertina'}</span><div class="tools">${i ? `<button data-cover="${i}" title="Usa come copertina">${ico('sparkle')}</button>` : ''}<button data-rm="${i}" title="Rimuovi">${ico('x')}</button></div></div>`).join('') +
      `<label class="dropzone seq-add" id="drop">${ico('upload')}<b>Aggiungi foto</b><span>o trascinale qui</span><input type="file" id="up" accept="image/*" multiple></label>`;
    sortable($('#seq'), '.seq-item', (a, b) => { moveItem(draft.images, a, b); drawSeq(); drawPrev(); });
    $$('[data-rm]').forEach(b => b.onclick = e => { e.stopPropagation(); const i = +b.dataset.rm, removed = draft.images.splice(i, 1)[0]; drawSeq(); drawPrev(); toast('Immagine rimossa', () => { draft.images.splice(i, 0, removed); drawSeq(); drawPrev(); }); });
    $$('[data-cover]').forEach(b => b.onclick = e => { e.stopPropagation(); moveItem(draft.images, +b.dataset.cover, 0); drawSeq(); drawPrev(); toast('Nuova copertina impostata'); });
    const drop = $('#drop');
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { if (e.dataTransfer?.types.includes('Files')) { e.preventDefault(); drop.classList.add('over'); } }));
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); addFiles(e.dataTransfer.files); });
    $('#up').onchange = e => addFiles(e.target.files);
  };
  const addFiles = async files => {
    let n = 0;
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      if (draft.images.length >= 24) { toast('Massimo 24 immagini per progetto', null, 'alert'); break; }
      try { draft.images.push(await readImage(f)); n++; } catch { toast('Impossibile leggere ' + esc(f.name), null, 'alert'); }
    }
    if (n) { drawSeq(); drawPrev(); toast(n === 1 ? 'Immagine aggiunta' : n + ' immagini aggiunte'); }
  };
  ['pTitle', 'pCat', 'pCam', 'pDesc', 'pYear', 'pFilm', 'pFit', 'pOn'].forEach(id => $('#' + id).addEventListener('input', sync));
  $$('#layouts [data-l]').forEach(b => b.onclick = () => { draft.layout = b.dataset.l; $$('#layouts button').forEach(x => x.classList.toggle('on', x === b)); drawPrev(); });
  bindDevice('pDev', m => { previewMobile = m; drawPrev(); });
  $('#saveP').onclick = () => {
    sync();
    if (!draft.title.trim()) { $('#pTitle').focus(); return toast('Il progetto ha bisogno di un titolo', null, 'alert'); }
    const i = state.projects.findIndex(x => x.id === p.id);
    const added = draft.images.length - p.images.length;
    state.projects[i] = { ...draft, updated: Date.now() };
    log(added > 0 ? 'image' : 'pen', added > 0 ? `${added} immagini aggiunte a <b>${esc(draft.title)}</b>` : `Modificato <b>${esc(draft.title)}</b>`, draft.category, 'projects/' + p.id);
    save(); toast('Progetto salvato · pronto per la pubblicazione');
    Object.assign(p, state.projects[i]);
  };
  $('#pv').onclick = () => { sync(); fullPreview(sitePreview({ project: draft }), '/lavori/' + p.id); };
  $('#del').onclick = async () => {
    if (!await confirmDialog({ title: 'Eliminare il progetto?', text: `«${esc(p.title)}» verrà rimosso dal portfolio. Potrai recuperarlo dalle versioni precedenti finché non pubblichi.`, ok: 'Elimina', danger: true })) return;
    const i = state.projects.findIndex(x => x.id === p.id), removed = state.projects.splice(i, 1)[0];
    save(); go('projects');
    toast('Progetto eliminato', () => { state.projects.splice(i, 0, removed); save(); render(); });
  };
  sync(); drawSeq();
}

/* ═════════════ LIBRERIA ═════════════ */
let libFilter = 'Tutte', libQuery = '';
PAGES.library = () => {
  const media = allMedia(), missing = media.filter(m => !state.mediaInfo[m.src]?.alt).length;
  main.innerHTML = head('Libreria immagini', `${media.length} immagini in ${state.projects.length} progetti. Aggiungi le descrizioni: aiutano chi usa lettori di schermo e migliorano la ricerca su Google.`, missing ? `<span class="badge amber">${missing} senza descrizione</span>` : '<span class="badge green">Tutte descritte</span>') + `
    <div class="toolbar"><div class="seg" id="lf">${['Tutte', ...CATEGORIES, 'Da descrivere'].map(c => `<button data-f="${c}" class="${c === libFilter ? 'on' : ''}">${c}</button>`).join('')}</div><div class="grow"></div><label class="search">${ico('search', 'sm')}<input class="input" id="lq" placeholder="Cerca per progetto o descrizione" value="${esc(libQuery)}"></label></div>
    <div class="masonry" id="mgrid"></div>`;
  $$('#lf button').forEach(b => b.onclick = () => { libFilter = b.dataset.f; $$('#lf button').forEach(x => x.classList.toggle('on', x === b)); drawMedia(); });
  $('#lq').oninput = e => { libQuery = e.target.value; drawMedia(); };
  drawMedia();
};
function drawMedia() {
  const q = libQuery.toLowerCase();
  const rows = allMedia().filter(m => {
    if (libFilter === 'Da descrivere' && state.mediaInfo[m.src]?.alt) return false;
    if (CATEGORIES.includes(libFilter) && !m.projects.some(p => p.category === libFilter)) return false;
    return (m.projects.map(p => p.title).join(' ') + ' ' + (state.mediaInfo[m.src]?.alt || '')).toLowerCase().includes(q);
  });
  $('#mgrid').innerHTML = rows.map(m => `<button class="tile" data-src="${esc(m.src)}"><img src="${esc(m.src)}" alt="${esc(state.mediaInfo[m.src]?.alt || '')}" loading="lazy">${state.mediaInfo[m.src]?.alt ? '' : `<span class="flag" title="Senza descrizione">${ico('pen')}</span>`}<span class="ov"><b>${esc(m.projects[0].title)}</b><small>${esc(state.mediaInfo[m.src]?.alt || 'Aggiungi una descrizione')}</small></span></button>`).join('') || `<div class="card empty" style="column-span:all"><span class="ico">${ico('image')}</span><h3>Nessuna immagine</h3><p>Nessun risultato per questa ricerca.</p></div>`;
  $$('#mgrid [data-src]').forEach(b => b.onclick = () => mediaDetail(b.dataset.src, rows.map(r => r.src)));
}
function mediaDetail(src, list) {
  const m = allMedia().find(x => x.src === src);
  const i = list.indexOf(src);
  const d = openDialog(`<div class="dialog-head"><div><h2>${esc(m.projects[0].title)}</h2><p>Usata in ${m.projects.map(p => esc(p.title)).join(', ')}</p></div><div class="row"><button class="icon-btn" id="mPrev" ${i <= 0 ? 'disabled' : ''} aria-label="Precedente">${ico('arrow-left')}</button><button class="icon-btn" id="mNext" ${i >= list.length - 1 ? 'disabled' : ''} aria-label="Successiva">${ico('arrow-right')}</button><button class="icon-btn" data-close aria-label="Chiudi">${ico('x')}</button></div></div>
    <div class="dialog-body"><div class="split" style="grid-template-columns:1.3fr 1fr"><div style="border-radius:14px;overflow:hidden;background:var(--bg-2);display:grid;place-items:center;max-height:62vh"><img src="${esc(src)}" alt="" style="max-height:62vh;width:auto;object-fit:contain"></div>
    <div><label class="field"><span>Descrizione dell’immagine <em id="altN"></em></span><textarea id="alt" rows="5" placeholder="Descrivi cosa si vede, in modo semplice. Es. «Due cavalli al pascolo al tramonto, cielo rosato, pellicola scaduta.»">${esc(state.mediaInfo[src]?.alt || '')}</textarea></label>
    <p class="hint" style="margin:-6px 0 18px">Letta da chi usa lettori di schermo e usata da Google per capire le immagini.</p>
    <label class="field"><span>Aggiungi a un altro progetto</span><select id="reuse">${state.projects.filter(p => !p.images.includes(src)).map(p => `<option value="${p.id}">${esc(p.title)}</option>`).join('')}</select></label>
    <div class="row"><button class="btn primary" id="saveAlt">Salva descrizione</button><button class="btn" id="doReuse">${ico('plus', 'sm')}Aggiungi</button></div></div></div></div>`, 'wide');
  const cnt = () => $('#altN').textContent = $('#alt').value.length + ' caratteri';
  $('#alt').oninput = cnt; cnt();
  $('#saveAlt').onclick = () => { state.mediaInfo[src] = { alt: $('#alt').value.trim() }; save(); drawMedia(); toast('Descrizione salvata'); if (i < list.length - 1) mediaDetail(list[i + 1], list); else closeDialog(); };
  $('#doReuse').onclick = () => { const p = state.projects.find(p => p.id === $('#reuse').value); if (!p) return; p.images.push(src); p.updated = Date.now(); save(); toast('Aggiunta a ' + esc(p.title)); closeDialog(); };
  $('#mPrev').onclick = () => mediaDetail(list[i - 1], list);
  $('#mNext').onclick = () => mediaDetail(list[i + 1], list);
}

/* ═════════════ TESTI E PROFILO ═════════════ */
PAGES.texts = () => {
  main.innerHTML = head('Testi e profilo', 'Il titolo di apertura, la biografia e i recapiti che compaiono sul sito.', `<button class="btn primary" id="saveT">${ico('check', 'sm')}Salva testi</button>`) + `
  <div class="split">
    <div class="stack">
      <section class="card card-pad">
        <label class="field"><span>Titolo di apertura <em id="hN"></em></span><input id="tHead" value="${esc(state.headline)}"></label>
        <label class="field" style="margin:0"><span>Sottotitolo</span><input id="tIntro" value="${esc(state.intro)}"></label>
      </section>
      <section class="card card-pad">
        <label class="field" style="margin:0"><span>Biografia <em id="bN"></em></span><textarea id="tBio" rows="16">${esc(state.bio)}</textarea></label>
        <p class="hint" style="margin-top:8px">Lascia una riga vuota per separare i paragrafi.</p>
      </section>
      <section class="card card-pad">
        <h2 class="card-title" style="margin-bottom:16px">Recapiti</h2>
        <label class="field"><span>Email</span><input id="tMail" type="email" value="${esc(state.email)}"></label>
        <div class="two"><label class="field"><span>Instagram</span><input id="tIg" value="${esc(state.instagram)}"></label><label class="field"><span>Telefono / WhatsApp</span><input id="tTel" value="${esc(state.phone)}"></label></div>
        <label class="field" style="margin:0"><span>Città</span><input id="tCity" value="${esc(state.city || '')}"></label>
      </section>
    </div>
    <aside class="sticky"><div class="preview-bar"><span class="label">Anteprima della homepage</span>${deviceSeg('tDev', previewMobile)}</div><div id="tPrev"></div></aside>
  </div>`;
  const draft = () => ({ ...state, headline: $('#tHead').value, intro: $('#tIntro').value, bio: $('#tBio').value, email: $('#tMail').value, instagram: $('#tIg').value, phone: $('#tTel').value, city: $('#tCity').value });
  const upd = () => {
    $('#hN').textContent = $('#tHead').value.length + ' caratteri';
    $('#bN').textContent = $('#tBio').value.trim().split(/\s+/).filter(Boolean).length + ' parole';
    $('#tPrev').innerHTML = browser(sitePreview({ data: draft() }), { mobile: previewMobile, tall: true });
  };
  $$('input,textarea', main).forEach(el => el.addEventListener('input', upd));
  bindDevice('tDev', m => { previewMobile = m; upd(); });
  $('#saveT').onclick = () => {
    const d = draft();
    if (!/^\S+@\S+\.\S+$/.test(d.email)) { $('#tMail').focus(); return toast('Controlla l’indirizzo email', null, 'alert'); }
    const bioChanged = d.bio !== state.bio;
    Object.assign(state, { headline: d.headline, intro: d.intro, bio: d.bio, email: d.email, instagram: d.instagram, phone: d.phone, city: d.city });
    log('pen', bioChanged ? 'Biografia aggiornata' : 'Testi aggiornati', 'Testi e profilo', 'texts');
    save(); toast('Testi salvati · pronti per la pubblicazione');
  };
  upd();
};

/* ═════════════ HOMEPAGE ═════════════ */
PAGES.home = () => {
  main.innerHTML = head('Homepage', 'Scegli il lavoro che accoglie i visitatori e l’ordine in cui scoprono il resto.', `<button class="btn" id="hView">${ico('eye', 'sm')}A tutto schermo</button>`) + `
  <div class="split" style="grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)">
    <div class="stack">
      <section class="card card-pad"><div class="row between" style="margin-bottom:14px"><h2 class="card-title">Progetto in evidenza</h2><span class="muted" id="featName"></span></div><div class="featured-pick" id="fp"></div></section>
      <section class="card card-pad"><h2 class="card-title">Sezioni della pagina</h2><p class="hint" style="margin:4px 0 14px">Trascina per riordinare, usa l’interruttore per mostrare o nascondere.</p><div class="sortable" id="secs"></div></section>
      <section class="card card-pad"><h2 class="card-title">Ordine dei lavori</h2><p class="hint" style="margin:4px 0 14px">Lo stesso ordine della pagina Progetti.</p><div class="sortable" id="ord"></div></section>
    </div>
    <aside class="sticky"><div class="preview-bar"><span class="label">Anteprima</span>${deviceSeg('hDev', previewMobile)}</div><div id="hPrev"></div></aside>
  </div>`;
  const prev = () => { $('#hPrev').innerHTML = browser(sitePreview(), { mobile: previewMobile, tall: true }); };
  const drawFeat = () => {
    $('#fp').innerHTML = state.projects.filter(p => p.images.length).map(p => `<button data-fid="${p.id}" class="${p.id === state.home.featured ? 'on' : ''}" title="${esc(p.title)}"><img src="${esc(p.images[0])}" alt="${esc(p.title)}"></button>`).join('');
    $('#featName').textContent = state.projects.find(p => p.id === state.home.featured)?.title || '';
    $$('#fp [data-fid]').forEach(b => b.onclick = () => { state.home.featured = b.dataset.fid; save(); drawFeat(); prev(); });
  };
  const drawSecs = () => {
    $('#secs').innerHTML = state.home.sections.map((s, i) => `<div class="sort-row ${s.on ? '' : 'off'}" tabindex="0"><span class="handle">${ico('drag', 'sm')}</span><span class="num">${pad(i + 1)}</span><span class="grow">${SECTION_NAMES[s.id]}</span><label class="switch"><input type="checkbox" data-sw="${i}" ${s.on ? 'checked' : ''}><span></span></label></div>`).join('');
    sortable($('#secs'), '.sort-row', (a, b) => { moveItem(state.home.sections, a, b); save(); drawSecs(); prev(); });
    $$('#secs [data-sw]').forEach(c => c.onchange = () => { state.home.sections[+c.dataset.sw].on = c.checked; save(); drawSecs(); prev(); });
  };
  const drawOrd = () => {
    $('#ord').innerHTML = state.projects.map((p, i) => `<div class="sort-row" tabindex="0"><span class="handle">${ico('drag', 'sm')}</span><img class="thumb sm" src="${esc(p.images[0] || '')}" alt=""><span class="grow">${esc(p.title)}</span>${p.status === 'Bozza' ? '<span class="badge amber">Bozza</span>' : `<span class="faint" style="font-size:12px">${p.category}</span>`}</div>`).join('');
    sortable($('#ord'), '.sort-row', (a, b) => { moveItem(state.projects, a, b); save(); drawOrd(); prev(); });
  };
  bindDevice('hDev', m => { previewMobile = m; prev(); });
  $('#hView').onclick = () => fullPreview(sitePreview());
  drawFeat(); drawSecs(); drawOrd(); prev();
};

function fullPreview(html, path = '') {
  let mobile = false;
  const d = openDialog(`<div class="dialog-head" style="padding-bottom:16px"><div><h2>Anteprima del sito</h2><p>Come apparirà dopo la pubblicazione.</p></div><div class="row">${deviceSeg('fDev', false)}<button class="icon-btn" data-close aria-label="Chiudi">${ico('x')}</button></div></div><div class="dialog-body" style="padding-top:0" id="fBody"></div>`, 'wide');
  const draw = () => $('#fBody').innerHTML = browser(html, { mobile, tall: true, path });
  bindDevice('fDev', m => { mobile = m; draw(); });
  draw();
}

/* ═════════════ IDENTITÀ VISIVA ═════════════ */
let fontRole = 'title', styleTab = 'type';
PAGES.style = () => {
  main.innerHTML = head('Identità visiva', 'Caratteri, colori e proporzioni del sito. Ogni scelta si vede subito nell’anteprima.', `<button class="btn ghost" id="sReset">${ico('refresh', 'sm')}Ripristina originale</button><button class="btn primary" id="sSave">${ico('check', 'sm')}Salva stile</button>`) + `
  <div class="split" style="grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)">
    <section class="card card-pad">
      <div class="tabs" id="sTabs"><button data-t="type">Tipografia</button><button data-t="color">Colori</button><button data-t="size">Proporzioni</button></div>
      <div id="sPanel"></div>
    </section>
    <aside class="sticky"><div class="preview-bar"><span class="label">Anteprima</span>${deviceSeg('sDev', previewMobile)}</div><div id="sPrev"></div></aside>
  </div>`;
  const prev = () => { $('#sPrev').innerHTML = browser(sitePreview(), { mobile: previewMobile, tall: true }); };
  const panel = () => {
    $$('#sTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === styleTab));
    const P = $('#sPanel');
    if (styleTab === 'type') {
      const all = [...FONTS, ...state.customFonts.map(f => ({ name: f.name, stack: fontStack(f.name), note: 'Caricato da te' }))];
      P.innerHTML = `<label class="label" style="margin-bottom:8px">Dove applicarlo</label><div class="seg" id="roles" style="margin-bottom:18px;flex-wrap:wrap">${Object.entries(ROLES).map(([k, v]) => `<button data-r="${k}" class="${k === fontRole ? 'on' : ''}">${v}</button>`).join('')}</div>
        <div class="font-list">${all.map(f => `<button class="font-opt ${state.typography[fontRole] === f.name ? 'on' : ''}" data-font="${esc(f.name)}"><b style="font-family:${esc(f.stack)}">${esc(f.name)}</b><small>${esc(f.note)}</small></button>`).join('')}</div>
        <div class="row" style="margin:16px 0;flex-wrap:wrap"><button class="btn sm" id="allRoles">Usa per tutto il sito</button><span class="hint">Attuale: ${Object.entries(ROLES).map(([k, v]) => `${v} <b style="color:var(--ink);font-weight:500">${esc(state.typography[k])}</b>`).join(' · ')}</span></div>
        <label class="dropzone">${ico('upload')}<b>Carica un tuo carattere</b><span>.woff2, .woff, .ttf o .otf · fino a 2 MB</span><input type="file" id="fUp" accept=".woff2,.woff,.ttf,.otf"></label>`;
      $$('#roles button').forEach(b => b.onclick = () => { fontRole = b.dataset.r; panel(); });
      $$('[data-font]').forEach(b => b.onclick = () => { state.typography[fontRole] = b.dataset.font; panel(); prev(); refreshChrome(); });
      $('#allRoles').onclick = () => { const f = state.typography[fontRole]; Object.keys(ROLES).forEach(k => state.typography[k] = f); panel(); prev(); toast(esc(f) + ' applicato a tutto il sito'); };
      $('#fUp').onchange = async e => {
        const f = e.target.files[0]; if (!f) return;
        if (!/\.(woff2?|ttf|otf)$/i.test(f.name) || f.size > 2097152) return toast('Scegli un file di carattere sotto i 2 MB', null, 'alert');
        try {
          const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
          const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 40);
          const face = new FontFace(name, `url(${data})`); await face.load(); document.fonts.add(face);
          state.customFonts = state.customFonts.filter(x => x.name !== name).concat({ name, data });
          state.typography[fontRole] = name; save(); panel(); prev(); toast(`«${esc(name)}» caricato e applicato`);
        } catch { toast('Il file non sembra un carattere valido', null, 'alert'); }
      };
    } else if (styleTab === 'color') {
      P.innerHTML = `<label class="label" style="margin-bottom:10px">Palette</label><div class="palettes">${PALETTES.map(p => `<button class="palette ${state.style.palette === p.id ? 'on' : ''}" data-pal="${p.id}"><div class="sw" style="background:${p.bg};color:${p.ink};box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)"><span>Aa</span><i style="background:${p.accent}"></i></div>${p.name}</button>`).join('')}</div>
        <div class="divider"></div><label class="label" style="margin-bottom:10px">Personalizza</label>
        <div class="colors">${[['bg', 'Sfondo'], ['ink', 'Testo'], ['accent', 'Accento']].map(([k, l]) => `<label class="color-in"><input type="color" data-c="${k}" value="${state.style[k]}"><span>${l}<small id="cv-${k}">${state.style[k]}</small></span></label>`).join('')}</div>
        <p class="hint" style="margin-top:14px" id="contrast"></p>`;
      $$('[data-pal]').forEach(b => b.onclick = () => { const p = PALETTES.find(x => x.id === b.dataset.pal); Object.assign(state.style, { palette: p.id, bg: p.bg, ink: p.ink, accent: p.accent }); panel(); prev(); });
      $$('[data-c]').forEach(inp => inp.oninput = () => { state.style[inp.dataset.c] = inp.value; state.style.palette = 'custom'; $('#cv-' + inp.dataset.c).textContent = inp.value; $$('.palette').forEach(x => x.classList.remove('on')); contrast(); prev(); });
      const contrast = () => { const r = contrastRatio(state.style.bg, state.style.ink); $('#contrast').innerHTML = `Contrasto testo/sfondo <b style="color:var(--ink)">${r.toFixed(1).replace('.', ',')}:1</b> — ${r >= 7 ? 'ottimo' : r >= 4.5 ? 'buono, leggibile da tutti' : '<span style="color:var(--red)">basso, il testo potrebbe essere difficile da leggere</span>'}`; };
      contrast();
    } else {
      const sl = (id, label, min, max, val, unit = 'px') => `<div class="field"><span>${label}<em id="o-${id}">${val}${unit}</em></span><input type="range" id="${id}" min="${min}" max="${max}" value="${val}" style="--p:${(val - min) / (max - min) * 100}%"></div>`;
      P.innerHTML = sl('rSize', 'Dimensione dei titoli', 32, 96, state.style.size) + sl('rBody', 'Dimensione dei testi', 13, 20, state.style.body) +
        `<label class="label" style="margin-bottom:8px">Peso dei titoli</label><div class="seg" id="wSeg">${[[300, 'Leggero'], [400, 'Regolare'], [500, 'Medio']].map(([w, l]) => `<button data-w="${w}" class="${+state.style.weight === w ? 'on' : ''}">${l}</button>`).join('')}</div>`;
      [['rSize', 'size'], ['rBody', 'body']].forEach(([id, k]) => $('#' + id).oninput = e => { const el = e.target; state.style[k] = +el.value; el.style.setProperty('--p', (el.value - el.min) / (el.max - el.min) * 100 + '%'); $('#o-' + id).textContent = el.value + 'px'; prev(); });
      $$('#wSeg button').forEach(b => b.onclick = () => { state.style.weight = +b.dataset.w; $$('#wSeg button').forEach(x => x.classList.toggle('on', x === b)); prev(); });
    }
  };
  $$('#sTabs button').forEach(b => b.onclick = () => { styleTab = b.dataset.t; panel(); });
  bindDevice('sDev', m => { previewMobile = m; prev(); });
  $('#sSave').onclick = () => { log('sparkle', 'Identità visiva aggiornata', Object.values(state.typography)[0] + ' · ' + (PALETTES.find(p => p.id === state.style.palette)?.name || 'Palette personalizzata'), 'style'); save(); toast('Stile salvato · pronto per la pubblicazione'); };
  $('#sReset').onclick = () => {
    const before = structuredClone({ style: state.style, typography: state.typography });
    Object.assign(state.style, PALETTES[0], { palette: 'carta', size: 56, body: 15, weight: 400 }); delete state.style.id; delete state.style.name;
    Object.keys(ROLES).forEach(k => state.typography[k] = 'Atyp');
    save(); panel(); prev();
    toast('Stile originale ripristinato', () => { Object.assign(state, structuredClone(before)); save(); panel(); prev(); });
  };
  panel(); prev();
};
function contrastRatio(a, b) {
  const L = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const [x, y] = [L(a), L(b)].sort((m, n) => n - m);
  return (x + .05) / (y + .05);
}

/* ═════════════ RICERCA GOOGLE ═════════════ */
let seoSel = null, serpMobile = false;
PAGES.seo = () => {
  seoSel = state.projects.find(p => p.id === seoSel) ? seoSel : state.projects[0]?.id;
  const avg = Math.round(state.projects.reduce((a, p) => a + seoScore(p), 0) / Math.max(1, state.projects.length));
  main.innerHTML = head('Ricerca Google', 'Come compaiono i tuoi progetti nei risultati di ricerca. Titoli chiari e descrizioni concrete portano più visite.', `<span class="badge ${avg >= 80 ? 'green' : avg >= 60 ? 'amber' : 'red'} plain" style="height:30px;padding:0 12px;font-size:13px">Punteggio medio ${avg}/100</span>`) + `
  <div class="split" style="grid-template-columns:320px minmax(0,1fr)">
    <section class="card" style="padding:8px"><div id="seoList"></div></section>
    <div class="stack" id="seoEdit"></div>
  </div>`;
  drawSeoList(); drawSeoEdit();
};
const scoreCls = s => s >= 80 ? 'green' : s >= 60 ? 'amber' : 'red';
function drawSeoList() {
  $('#seoList').innerHTML = state.projects.map(p => { const s = seoScore(p); return `<button class="seo-row ${p.id === seoSel ? 'on' : ''}" data-s="${p.id}"><img src="${esc(p.images[0] || '')}" alt=""><span style="min-width:0"><b>${esc(p.title)}</b><small>${p.category}</small></span><span class="pill-score badge ${scoreCls(s)} plain">${s}</span></button>`; }).join('');
  $$('[data-s]').forEach(b => b.onclick = () => { seoSel = b.dataset.s; drawSeoList(); drawSeoEdit(); });
}
function drawSeoEdit() {
  const p = state.projects.find(x => x.id === seoSel); if (!p) return;
  const m = seoMeta(p);
  $('#seoEdit').innerHTML = `
    <section class="card card-pad">
      <div class="row between" style="margin-bottom:16px"><h2 class="card-title">Anteprima del risultato</h2><div class="seg" id="serpDev"><button data-dev="d" class="${serpMobile ? '' : 'on'}">${ico('desktop', 'sm')}</button><button data-dev="m" class="${serpMobile ? 'on' : ''}">${ico('phone', 'sm')}</button></div></div>
      <div id="serp"></div>
    </section>
    <section class="card card-pad">
      <label class="field"><span>Titolo della pagina <em id="stN"></em></span><input id="sT" value="${esc(m.title)}"><div class="meter"><i id="stM"></i></div></label>
      <label class="field"><span>Descrizione <em id="sdN"></em></span><textarea id="sD" rows="4" placeholder="Due frasi concrete: cosa mostra il progetto, con quale tecnica, per chi.">${esc(m.description)}</textarea><div class="meter"><i id="sdM"></i></div></label>
      <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="sAuto">${ico('sparkle', 'sm')}Suggerisci dal progetto</button><button class="btn primary" id="sSave">Salva scheda</button></div>
    </section>
    <section class="card card-pad"><div class="row" style="gap:18px;align-items:center"><div class="score" id="sScore"></div><ul class="checks" id="sChecks" style="flex:1"></ul></div></section>`;
  const upd = () => {
    const t = $('#sT').value, d = $('#sD').value;
    const trunc = (s, n) => s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
    $('#serp').innerHTML = `<div class="serp ${serpMobile ? 'mob' : ''}"><div class="site-row"><span class="fav">AM</span><div>Alessandro Moruzzi<small>alessandromoruzzi.com › lavori › ${esc(p.id)}</small></div></div><h3>${esc(trunc(t || p.title, 60))}</h3><p>${esc(trunc(d || 'Google mostrerà un estratto casuale della pagina. Scrivi una descrizione per sceglierlo tu.', serpMobile ? 120 : 158))}</p></div>`;
    const meter = (el, n, lo, hi) => { el.style.width = Math.min(100, n / hi * 100) + '%'; el.className = n === 0 || n > hi ? 'bad' : n < lo ? 'warn' : ''; };
    $('#stN').textContent = `${t.length} / 60`; meter($('#stM'), t.length, 30, 60);
    $('#sdN').textContent = `${d.length} / 160`; meter($('#sdM'), d.length, 70, 160);
    const tmp = { title: t, description: d }, checks = seoChecks(p, tmp), s = Math.round(checks.filter(c => c.ok).length / checks.length * 100);
    const C = 2 * Math.PI * 26, col = `var(--${scoreCls(s)})`;
    $('#sScore').innerHTML = `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" stroke="var(--line)"/><circle cx="32" cy="32" r="26" stroke="${col}" stroke-linecap="round" stroke-dasharray="${C * s / 100} ${C}" style="transition:stroke-dasharray .5s var(--ease)"/></svg><b>${s}</b>`;
    $('#sChecks').innerHTML = checks.map(c => `<li><span class="${c.ok ? 'ok' : 'ko'}">${ico(c.ok ? 'check' : 'x')}</span>${c.text}</li>`).join('');
  };
  $('#sT').oninput = upd; $('#sD').oninput = upd;
  $$('#serpDev button').forEach(b => b.onclick = () => { serpMobile = b.dataset.dev === 'm'; $$('#serpDev button').forEach(x => x.classList.toggle('on', x === b)); upd(); });
  $('#sAuto').onclick = () => {
    const cat = { Fotografia: 'Serie fotografica', Grafica: 'Progetto di grafica', AI: 'Ricerca visiva con intelligenza artificiale' }[p.category];
    $('#sT').value = `${p.title} — ${p.category} · Alessandro Moruzzi`.slice(0, 60);
    const base = p.description?.trim() || `${cat} di Alessandro Moruzzi${p.camera && p.camera !== 'Nessuna' ? `, scattata con ${p.camera}` : ''}. ${p.images.length} immagini tra ${p.category === 'Grafica' ? 'progetto, stampa e identità visiva' : 'luce, colore e racconto'}.`;
    $('#sD').value = base.length > 160 ? base.slice(0, 157).replace(/\s\S*$/, '') + '…' : base;
    upd();
  };
  $('#sSave').onclick = () => { state.seo[p.id] = { title: $('#sT').value.trim(), description: $('#sD').value.trim() }; save(); drawSeoList(); toast('Scheda di ricerca salvata'); };
  upd();
}

/* ═════════════ RICHIESTE ═════════════ */
PAGES.leads = () => {
  const open = state.leads.filter(l => !['Confermata', 'Archiviata'].includes(l.status));
  const won = state.leads.filter(l => l.status === 'Confermata');
  main.innerHTML = head('Richieste', 'Dal primo messaggio alla conferma. Trascina una scheda per cambiarne lo stato.', `<button class="btn primary" id="addLead">${ico('plus', 'sm')}Aggiungi richiesta</button>`) + `
  <div class="grid g-3" style="margin-bottom:20px">
    <div class="card kpi"><div class="kpi-label">${ico('inbox')}In trattativa</div><div class="kpi-value">${eur(open.reduce((a, l) => a + (+l.budget || 0), 0))}</div><div class="kpi-foot">${open.length} richieste aperte</div></div>
    <div class="card kpi"><div class="kpi-label">${ico('check')}Confermato</div><div class="kpi-value">${eur(won.reduce((a, l) => a + (+l.budget || 0), 0))}</div><div class="kpi-foot">${won.length} ${won.length === 1 ? 'lavoro' : 'lavori'} questo trimestre</div></div>
    <div class="card kpi"><div class="kpi-label">${ico('clock')}Tempo medio di risposta</div><div class="kpi-value">5 <small>ore</small></div><div class="kpi-foot">Rispondere entro un giorno raddoppia le conferme</div></div>
  </div>
  <div class="board" id="board"></div>`;
  drawBoard();
  $('#addLead').onclick = addLead;
};
function drawBoard() {
  $('#board').innerHTML = STAGES.map(s => {
    const rows = state.leads.filter(l => l.status === s).sort((a, b) => b.at - a.at);
    const tot = rows.reduce((a, l) => a + (+l.budget || 0), 0);
    return `<section class="col" data-stage="${s}"><div class="col-head"><span class="badge ${STAGE_COLOR[s]}"></span>${s}<span class="n">${rows.length}</span><span class="sum">${tot ? eur(tot) : ''}</span></div>
    ${rows.map(l => `<button class="lead" draggable="true" data-lead="${l.id}"><div class="top"><span>${l.service} · ${esc(l.source)}</span>${l.unread ? '<span class="unread" title="Da leggere"></span>' : `<span>${ago(l.at)}</span>`}</div><h3>${esc(l.subject)}</h3><div class="who"><span class="avatar av-${l.id % 6 + 1}">${initials(l.name)}</span>${esc(l.company)}</div><div class="foot"><span>${l.note ? ico('pen', 'xs') + ' Note' : 'Budget'}</span><b>${l.budget ? eur(l.budget) : 'Da definire'}</b></div></button>`).join('') || '<div class="col-empty">Trascina qui</div>'}</section>`;
  }).join('');
  let dragId = null;
  $$('#board [data-lead]').forEach(b => {
    b.onclick = () => openLead(+b.dataset.lead);
    b.ondragstart = e => { dragId = +b.dataset.lead; b.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', b.dataset.lead); } catch {} };
    b.ondragend = () => b.classList.remove('dragging');
  });
  $$('#board .col').forEach(c => {
    c.ondragover = e => { e.preventDefault(); c.classList.add('over'); };
    c.ondragleave = e => { if (!c.contains(e.relatedTarget)) c.classList.remove('over'); };
    c.ondrop = e => {
      e.preventDefault(); c.classList.remove('over');
      const l = state.leads.find(x => x.id === dragId); if (!l || l.status === c.dataset.stage) return;
      const was = l.status; l.status = c.dataset.stage; l.unread = false;
      (l.history ||= []).push({ at: Date.now(), text: `Spostata in «${l.status}»` });
      log('inbox', `<b>${esc(l.company)}</b> → ${l.status}`, l.subject, 'leads');
      save(); drawBoard();
      toast(l.status === 'Confermata' ? `Confermato! ${l.budget ? eur(l.budget) : ''} con ${esc(l.company)}` : `Spostata in ${l.status}`, () => { l.status = was; save(); drawBoard(); });
    };
  });
}
function openLead(id) {
  const l = state.leads.find(x => x.id === id); if (!l) return;
  if (l.unread) { l.unread = false; save(); if (route === 'leads') drawBoard(); }
  const hist = [{ at: l.at, text: `Ricevuta tramite ${l.source}` }, ...(l.history || [])].sort((a, b) => b.at - a.at);
  openDrawer(`<div class="drawer-head"><span class="badge ${STAGE_COLOR[l.status]}">${l.status}</span><button class="icon-btn" data-close aria-label="Chiudi">${ico('x')}</button></div>
  <div class="drawer-body">
    <h2 style="font:400 26px/1.15 var(--display);letter-spacing:-.025em;margin-bottom:20px">${esc(l.subject)}</h2>
    <div class="msg-meta"><span class="avatar lg av-${l.id % 6 + 1}">${initials(l.name)}</span><div><b>${esc(l.name)}</b><small>${esc(l.company)} · ${esc(l.email)}</small></div></div>
    <div class="msg">${esc(l.message).replace(/\n/g, '<br>')}</div>
    <dl class="props"><dt>Ricevuta</dt><dd>${longDate(l.at)}</dd><dt>Canale</dt><dd>${esc(l.source)}</dd><dt>Disciplina</dt><dd>${l.service}</dd></dl>
    <div class="two"><label class="field"><span>Stato</span><select id="lS">${STAGES.map(s => `<option ${s === l.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label class="field"><span>Budget (€)</span><input id="lB" type="number" min="0" step="100" value="${l.budget || ''}" placeholder="Da definire"></label></div>
    <label class="field"><span>Note private</span><textarea id="lN" rows="3" placeholder="Prossimo passo, dettagli, idee…">${esc(l.note)}</textarea></label>
    <div id="reply"></div>
    <div class="divider"></div>
    <h3 style="font-size:13px;font-weight:600;margin-bottom:12px">Cronologia</h3>
    <ul class="timeline">${hist.map((h, i) => `<li class="${i ? '' : 'now'}">${esc(h.text)}<small>${longDate(h.at)}</small></li>`).join('')}</ul>
  </div>
  <div class="drawer-foot"><button class="btn ghost danger" id="lDel">${ico('trash', 'sm')}</button><div style="flex:1"></div><button class="btn" id="lReply">${ico('mail', 'sm')}Rispondi</button><button class="btn primary" id="lSave">Salva</button></div>`);
  $('#lReply').onclick = () => {
    const first = l.name.split(' ')[0];
    $('#reply').innerHTML = `<label class="field"><span>Risposta a ${esc(l.email)}</span><textarea id="lR" rows="7">Ciao ${esc(first)},\n\ngrazie per avermi scritto: il progetto mi interessa molto. Per prepararti una proposta mi servirebbero tempi, formato finale e materiali già disponibili.\n\nSe ti va, possiamo sentirci questa settimana.\n\nA presto,\nAlessandro</textarea></label><div class="row" style="justify-content:flex-end;margin:-6px 0 6px"><button class="btn accent" id="lSend">${ico('arrow-right', 'sm')}Apri nella posta</button></div>`;
    $('#lR').focus();
    $('#lSend').onclick = () => {
      const body = encodeURIComponent($('#lR').value), subj = encodeURIComponent('Re: ' + l.subject);
      window.open(`mailto:${l.email}?subject=${subj}&body=${body}`, '_blank');
      (l.history ||= []).push({ at: Date.now(), text: 'Risposta preparata' });
      if (l.status === 'Nuova') { l.status = 'In valutazione'; $('#lS').value = l.status; }
      save(); if (route === 'leads') drawBoard();
    };
  };
  $('#lSave').onclick = () => {
    const ns = $('#lS').value;
    if (ns !== l.status) (l.history ||= []).push({ at: Date.now(), text: `Spostata in «${ns}»` });
    l.status = ns; l.budget = +$('#lB').value || 0; l.note = $('#lN').value;
    save(); closeDrawer(); if (route === 'leads') drawBoard(); toast('Richiesta aggiornata');
  };
  $('#lDel').onclick = async () => {
    if (!await confirmDialog({ title: 'Eliminare la richiesta?', text: `La richiesta di ${esc(l.company)} verrà rimossa.`, ok: 'Elimina', danger: true })) return;
    const i = state.leads.indexOf(l); state.leads.splice(i, 1); save(); closeDrawer(); if (route === 'leads') drawBoard();
    toast('Richiesta eliminata', () => { state.leads.splice(i, 0, l); save(); if (route === 'leads') drawBoard(); });
  };
}
function addLead() {
  openDialog(`<div class="dialog-head"><div><h2>Nuova richiesta</h2><p>Per i contatti arrivati fuori dal sito: telefono, eventi, passaparola.</p></div><button class="icon-btn" data-close>${ico('x')}</button></div>
  <div class="dialog-body"><div class="two"><label class="field"><span>Nome e cognome</span><input id="nN" autofocus></label><label class="field"><span>Azienda</span><input id="nC"></label></div>
  <label class="field"><span>Oggetto</span><input id="nS" placeholder="Es. Ritratti per il nuovo catalogo"></label>
  <div class="two"><label class="field"><span>Disciplina</span><select id="nT">${CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select></label><label class="field"><span>Budget (€)</span><input id="nB" type="number" min="0" step="100"></label></div>
  <label class="field" style="margin:0"><span>Email</span><input id="nE" type="email"></label></div>
  <div class="dialog-foot"><button class="btn" data-close>Annulla</button><button class="btn primary" id="nOk">Aggiungi</button></div>`);
  $('#nOk').onclick = () => {
    const name = $('#nN').value.trim(), subject = $('#nS').value.trim();
    if (!name || !subject) return toast('Inserisci almeno nome e oggetto', null, 'alert');
    const l = { id: Date.now(), name, company: $('#nC').value.trim() || name, email: $('#nE').value.trim(), subject, service: $('#nT').value, status: 'Nuova', budget: +$('#nB').value || 0, source: 'Inserita a mano', at: Date.now(), unread: false, note: '', message: 'Richiesta inserita manualmente.' };
    state.leads.unshift(l); log('inbox', `Nuova richiesta da <b>${esc(l.company)}</b>`, l.subject, 'leads'); save(); closeDialog(); if (route === 'leads') drawBoard(); toast('Richiesta aggiunta');
  };
}

/* ═════════════ CALENDARIO ═════════════ */
let calMonth = new Date(today.getFullYear(), today.getMonth(), 1);
PAGES.calendar = () => {
  const label = calMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  main.innerHTML = head(`<span style="text-transform:capitalize">${label}</span>`, 'Shooting, uscite sui social e pubblicazioni. Clicca un giorno per aggiungere, trascina per spostare.', `<div class="row"><button class="icon-btn" id="cPrev" aria-label="Mese precedente">${ico('arrow-left')}</button><button class="btn sm" id="cToday">Oggi</button><button class="icon-btn" id="cNext" aria-label="Mese successivo">${ico('arrow-right')}</button></div><button class="btn primary" id="cAdd">${ico('plus', 'sm')}Nuova attività</button>`) + `
    <div class="cal-legend" style="margin-bottom:14px">${Object.entries(EVENT_TYPES).map(([k, v]) => `<span><i style="background:var(--${{ publish: 'accent', shoot: 'green', social: 'amber', task: 'blue' }[k]})"></i>${v}</span>`).join('')}</div>
    <section class="card" style="overflow:hidden"><div class="cal" id="cal"></div></section>`;
  drawCal();
  $('#cPrev').onclick = () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); PAGES.calendar(); };
  $('#cNext').onclick = () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); PAGES.calendar(); };
  $('#cToday').onclick = () => { calMonth = new Date(today.getFullYear(), today.getMonth(), 1); PAGES.calendar(); };
  $('#cAdd').onclick = () => eventDialog({ date: iso(today) });
};
function drawCal() {
  const start = new Date(calMonth); const off = (start.getDay() + 6) % 7; start.setDate(1 - off);
  const cells = []; for (let i = 0; i < 42; i++) cells.push(addDays(start, i));
  const trimmed = cells[35].getMonth() !== calMonth.getMonth() ? cells.slice(0, 35) : cells;
  $('#cal').innerHTML = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => `<div class="cal-dow">${d}</div>`).join('') + trimmed.map(d => {
    const k = iso(d), evs = state.agenda.filter(a => a.date === k);
    return `<div class="cal-day ${d.getMonth() !== calMonth.getMonth() ? 'out' : ''} ${k === iso(today) ? 'today' : ''}" data-day="${k}"><span class="d">${d.getDate()}</span>${evs.slice(0, 3).map(e => `<button class="ev ${e.type} ${e.done ? 'done' : ''}" draggable="true" data-ev="${e.id}" title="${esc(e.title)}">${ico({ publish: 'upload', shoot: 'image', social: 'instagram', task: 'check' }[e.type])}<span>${esc(e.title)}</span></button>`).join('')}${evs.length > 3 ? `<span class="more">+${evs.length - 3} altre</span>` : ''}</div>`;
  }).join('');
  let dragId = null;
  $$('#cal [data-ev]').forEach(b => {
    b.onclick = e => { e.stopPropagation(); eventDialog(state.agenda.find(a => a.id === +b.dataset.ev)); };
    b.ondragstart = e => { e.stopPropagation(); dragId = +b.dataset.ev; try { e.dataTransfer.setData('text/plain', b.dataset.ev); } catch {} };
  });
  $$('#cal [data-day]').forEach(c => {
    c.onclick = () => eventDialog({ date: c.dataset.day });
    c.ondragover = e => { e.preventDefault(); c.classList.add('over'); };
    c.ondragleave = () => c.classList.remove('over');
    c.ondrop = e => { e.preventDefault(); c.classList.remove('over'); const ev = state.agenda.find(a => a.id === dragId); if (ev && ev.date !== c.dataset.day) { ev.date = c.dataset.day; save(); drawCal(); toast('Spostata a ' + parseDay(ev.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })); } };
  });
}
function eventDialog(ev) {
  const isNew = !ev.id;
  ev = { title: '', type: 'task', project: '', done: false, ...ev };
  openDialog(`<div class="dialog-head"><div><h2>${isNew ? 'Nuova attività' : 'Attività'}</h2></div><button class="icon-btn" data-close>${ico('x')}</button></div>
  <div class="dialog-body"><label class="field"><span>Titolo</span><input id="eT" value="${esc(ev.title)}" placeholder="Es. Post Instagram — nuova serie" autofocus></label>
  <div class="two"><label class="field"><span>Data</span><input id="eD" type="date" value="${ev.date}"></label><label class="field"><span>Tipo</span><select id="eY">${Object.entries(EVENT_TYPES).map(([k, v]) => `<option value="${k}" ${k === ev.type ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
  <label class="field"><span>Progetto collegato</span><select id="eP"><option value="">Nessuno</option>${state.projects.map(p => `<option value="${p.id}" ${p.id === ev.project ? 'selected' : ''}>${esc(p.title)}</option>`).join('')}</select></label>
  ${isNew ? '' : `<div class="row between"><b style="font-weight:500">Completata</b><label class="switch"><input type="checkbox" id="eX" ${ev.done ? 'checked' : ''}><span></span></label></div>`}</div>
  <div class="dialog-foot">${isNew ? '' : `<button class="btn ghost danger" id="eDel" style="margin-right:auto">${ico('trash', 'sm')}Elimina</button>`}<button class="btn" data-close>Annulla</button><button class="btn primary" id="eOk">${isNew ? 'Aggiungi' : 'Salva'}</button></div>`);
  $('#eOk').onclick = () => {
    const title = $('#eT').value.trim(), date = $('#eD').value;
    if (!title || !date) return toast('Inserisci titolo e data', null, 'alert');
    const data = { title, date, type: $('#eY').value, project: $('#eP').value, done: $('#eX')?.checked || false };
    if (isNew) state.agenda.push({ id: Date.now(), ...data }); else Object.assign(state.agenda.find(a => a.id === ev.id), data);
    save(); closeDialog(); if (route === 'calendar') { calMonth = new Date(parseDay(date).getFullYear(), parseDay(date).getMonth(), 1); PAGES.calendar(); } toast(isNew ? 'Attività aggiunta' : 'Attività aggiornata');
  };
  if (!isNew) $('#eDel').onclick = () => { const i = state.agenda.findIndex(a => a.id === ev.id), r = state.agenda.splice(i, 1)[0]; save(); closeDialog(); if (route === 'calendar') drawCal(); toast('Attività eliminata', () => { state.agenda.splice(i, 0, r); save(); if (route === 'calendar') drawCal(); }); };
}

/* ═════════════ STATISTICHE ═════════════ */
let statRange = 30, liveTimer;
PAGES.stats = () => {
  const n = statRange, t = Stats.totals(n), rows = Stats.range(n);
  const dur = s => `${Math.floor(s / 60)}m ${pad(Math.round(s % 60))}s`;
  const proj = Stats.projects(n, state.projects);
  const src = Stats.sources(n), dev = Stats.devices(n), cities = Stats.cities(n);
  const srcIcon = { Instagram: 'instagram', Google: 'search', 'Accesso diretto': 'link', Behance: 'grid', LinkedIn: 'globe' };
  const projViews = t.cur.visitors, opened = Math.round(t.cur.visitors * .71), contactPage = Math.round(t.cur.visitors * .14);
  main.innerHTML = head('Statistiche', 'Chi visita il sito, da dove arriva e cosa guarda. Dati anonimi, senza cookie di profilazione.', `<span class="live" id="live"><span class="pulse"></span><span id="liveN">4</span>&nbsp;persone sul sito ora</span><div class="seg" id="rng">${[[7, '7 giorni'], [30, '30 giorni'], [90, '90 giorni']].map(([v, l]) => `<button data-r="${v}" class="${v === n ? 'on' : ''}">${l}</button>`).join('')}</div><button class="btn" id="csv">${ico('download', 'sm')}Esporta</button>`) + `
  <div class="grid g-4" style="margin-bottom:16px">
    <div class="card kpi"><div class="kpi-label">Visitatori</div><div class="kpi-value">${fmt(t.cur.visitors)} ${delta(t.cur.visitors, t.prev.visitors)}</div><div class="kpi-foot">rispetto ai ${n} giorni precedenti</div></div>
    <div class="card kpi"><div class="kpi-label">Pagine viste</div><div class="kpi-value">${fmt(t.cur.views)} ${delta(t.cur.views, t.prev.views)}</div><div class="kpi-foot">${(t.cur.views / t.cur.visitors).toFixed(1).replace('.', ',')} pagine per visita</div></div>
    <div class="card kpi"><div class="kpi-label">Tempo medio</div><div class="kpi-value">${dur(t.cur.dur)} ${delta(t.cur.dur, t.prev.dur)}</div><div class="kpi-foot">per visita</div></div>
    <div class="card kpi"><div class="kpi-label">Contatti</div><div class="kpi-value">${fmt(t.cur.contacts)} ${delta(t.cur.contacts, t.prev.contacts)}</div><div class="kpi-foot">clic su email, WhatsApp e modulo</div></div>
  </div>
  <section class="card" style="margin-bottom:16px"><div class="card-head"><div><h2>Andamento</h2><p>Passa sul grafico per i dettagli di ogni giorno. I picchi coincidono con le pubblicazioni.</p></div><div class="legend"><span><i></i>Visitatori</span><span><i class="prev"></i>Periodo precedente</span></div></div><div class="card-body"><div class="chart" id="sChart"></div></div></section>
  <div class="grid g-3" style="margin-bottom:16px">
    <section class="card"><div class="card-head"><h2>Da dove arrivano</h2></div><div class="card-body">${src.map(([k, v], i) => `<div class="hbar"><span class="name">${ico(srcIcon[k] || 'globe')}${k}</span><span class="val">${fmt(t.cur.visitors * v)}<small>${Math.round(v * 100)}%</small></span><span class="track"><i style="width:${v / src[0][1] * 100}%;animation-delay:${i * .07}s"></i></span></div>`).join('')}</div></section>
    <section class="card"><div class="card-head"><h2>Dispositivi</h2></div><div class="card-body">${donut(dev, Math.round(dev[0][1] * 100) + '%', 'da telefono')}<p class="hint" style="margin-top:16px">Quasi due visitatori su tre guardano il portfolio dal telefono: le gallerie verticali funzionano meglio.</p></div></section>
    <section class="card"><div class="card-head"><h2>Città</h2></div><div class="card-body">${cities.map(([k, v], i) => `<div class="hbar"><span class="name">${k}</span><span class="val">${fmt(t.cur.visitors * v)}<small>${Math.round(v * 100)}%</small></span><span class="track"><i style="width:${v / cities[0][1] * 100}%;background:var(--accent);animation-delay:${i * .07}s"></i></span></div>`).join('')}</div></section>
  </div>
  <div class="split wide" style="margin-bottom:16px">
    <section class="card" style="overflow:hidden"><div class="card-head"><h2>Progetti</h2><span class="muted" style="font-size:12.5px">Ultimi ${n} giorni</span></div>
      <table class="table" style="margin-top:12px"><thead><tr><th>Progetto</th><th class="num">Visualizzazioni</th><th class="num hide-m">Tempo medio</th><th class="num">Contatti</th></tr></thead><tbody>${proj.map(r => `<tr data-go="projects/${r.p.id}" style="cursor:pointer"><td><div class="row"><img class="thumb" src="${esc(r.p.images[0] || '')}" alt=""><div><b style="font-weight:500">${esc(r.p.title)}</b><br><small class="muted">${r.p.category}</small></div></div></td><td class="num">${fmt(r.views)}</td><td class="num hide-m">${r.time}s</td><td class="num">${r.contacts}</td></tr>`).join('')}</tbody></table></section>
    <section class="card"><div class="card-head"><div><h2>Dalla visita al contatto</h2><p>Quanti visitatori arrivano fino a scriverti</p></div></div><div class="card-body"><div class="funnel">${[['Visitano il sito', projViews], ['Aprono un progetto', opened], ['Visitano i contatti', contactPage], ['Ti contattano', t.cur.contacts]].map(([l, v], i) => `<div class="funnel-step"><span>${l}</span><div class="bar"><i style="width:${Math.max(3, v / projViews * 100)}%;animation-delay:${i * .1}s"></i></div><b class="fv">${fmt(v)}</b><span class="pct">${i ? (v / projViews * 100).toFixed(1).replace('.', ',') + '%' : '100%'}</span></div>`).join('')}</div></div></section>
  </div>
  <section class="card" style="overflow:hidden"><div class="card-head"><div><h2>Visite recenti</h2><p>Il percorso delle ultime persone passate dal sito</p></div></div>
    <table class="table" style="margin-top:12px"><thead><tr><th>Quando</th><th class="hide-m">Da</th><th>Percorso</th></tr></thead><tbody>${Stats.sessions().map(s => `<tr><td style="white-space:nowrap"><b style="font-weight:500">${ago(s.at)}</b><br><small class="muted">${s.city} · ${s.device === 'phone' ? 'telefono' : 'computer'}</small></td><td class="hide-m"><span class="row" style="gap:6px">${ico(srcIcon[s.source] || 'globe', 'sm')}${s.source}</span></td><td><div class="route">${s.route.map((r, i) => `${i ? ico('chevron') : ''}<span>${esc(r)}</span>`).join('')}${s.action ? `${ico('chevron')}<span class="end">${s.action}</span>` : ''}</div></td></tr>`).join('')}</tbody></table></section>`;
  areaChart($('#sChart'), rows, Stats.prev(n), { height: 280 });
  $$('#rng button').forEach(b => b.onclick = () => { statRange = +b.dataset.r; PAGES.stats(); });
  $('#csv').onclick = () => {
    const lines = ['Data;Visitatori;Pagine viste;Contatti;Durata media (s)', ...rows.map(r => [iso(r.date), r.visitors, r.views, r.contacts, Math.round(r.dur)].join(';'))];
    download(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }), `statistiche-${iso(today)}-${n}g.csv`);
    toast('Report esportato');
  };
  clearInterval(liveTimer);
  let live = 4;
  liveTimer = setInterval(() => { const el = $('#liveN'); if (!el) return clearInterval(liveTimer); live = clamp(live + Math.round(Math.random() * 2 - 1), 2, 9); el.textContent = live; }, 3500);
};
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }

/* ═════════════ PUBBLICA ═════════════ */
PAGES.publish = () => {
  const diff = differences(), q = qualityItems();
  const levelIco = { high: 'alert', mid: 'pen', low: 'sparkle' };
  main.innerHTML = head('Pubblica', diff.length ? 'Rivedi le modifiche e mettile online. Puoi sempre tornare a una versione precedente.' : 'Il sito online è allineato con il pannello.', `<button class="btn" id="cmp" ${diff.length ? '' : 'disabled'}>${ico('columns', 'sm')}Prima e dopo</button><button class="btn accent" id="go" ${diff.length ? '' : 'disabled'}>${ico('upload', 'sm')}Pubblica ${diff.length ? diff.length + (diff.length === 1 ? ' modifica' : ' modifiche') : ''}</button>`) + `
  <div class="split wide">
    <div class="stack">
      <section class="card"><div class="card-head"><h2>Modifiche da pubblicare</h2><span class="muted" style="font-size:12.5px">rispetto alla versione online</span></div><div class="card-body">${diff.length ? `<ul class="diff">${diff.map(d => `<li><span class="ico">${ico(d.icon)}</span><div><b style="font-weight:500">${d.title}</b><small>${esc(d.sub)}</small></div><button class="link" data-go="${d.go}">Apri ${ico('arrow-right', 'xs')}</button></li>`).join('')}</ul>` : `<div class="empty"><span class="ico">${ico('check')}</span><h3>Nessuna modifica in sospeso</h3><p>Quando modifichi progetti, testi o stile, le trovi qui prima di pubblicarle.</p></div>`}</div></section>
      <section class="card card-pad"><label class="field" style="margin:0"><span>Nome di questa versione <em>facoltativo</em></span><input id="vName" placeholder="Es. Nuova serie analogica, autunno"></label><p class="hint" style="margin-top:8px">Ti aiuta a ritrovarla nella cronologia delle versioni.</p></section>
    </div>
    <div class="stack">
      <section class="card"><div class="card-head"><div><h2>Controlli</h2><p>${q.length ? 'Suggerimenti per presentare al meglio il lavoro' : 'Tutto in ordine'}</p></div><span class="badge ${q.some(x => x.level === 'high') ? 'red' : q.length ? 'amber' : 'green'}">${q.length || 'OK'}</span></div><div class="card-body"><ul class="diff">${q.map(x => `<li><span class="ico" style="background:var(--${x.level === 'high' ? 'red' : x.level === 'mid' ? 'amber' : 'blue'}-soft);color:var(--${x.level === 'high' ? 'red' : x.level === 'mid' ? 'amber' : 'blue'})">${ico(levelIco[x.level])}</span><div><b style="font-weight:500">${x.title}</b><small>${esc(x.sub)}</small></div><button class="link" data-go="${x.go}">${ico('arrow-right', 'xs')}</button></li>`).join('') || `<li><span class="ico" style="background:var(--green-soft);color:var(--green)">${ico('check')}</span><div>Nessun problema rilevato</div><span></span></li>`}</ul></div></section>
      <section class="card card-pad"><div class="row" style="gap:14px"><span class="pulse" style="margin:0 4px"></span><div><b style="font-weight:500">Online dal ${longDate(state.lastPublish)}</b><p class="hint">${esc(state.versions[0]?.title || '')}</p></div></div></section>
    </div>
  </div>`;
  if (diff.length) { $('#go').onclick = () => publishFlow($('#vName').value.trim()); $('#cmp').onclick = compareDialog; }
};
function compareDialog() {
  let mobile = false;
  openDialog(`<div class="dialog-head" style="padding-bottom:16px"><div><h2>Prima e dopo</h2><p>A sinistra il sito online, a destra come sarà dopo la pubblicazione.</p></div><div class="row">${deviceSeg('cDev', false)}<button class="icon-btn" data-close>${ico('x')}</button></div></div><div class="dialog-body" style="padding-top:0"><div class="compare" id="cBody"></div></div>`, 'wide');
  const draw = () => $('#cBody').innerHTML = `<div><div class="lbl"><span class="badge">Online ora</span></div>${browser(sitePreview({ data: state.published }), { mobile, tall: true })}</div><div><div class="lbl"><span class="badge accent">Dopo la pubblicazione</span></div>${browser(sitePreview(), { mobile, tall: true })}</div>`;
  bindDevice('cDev', m => { mobile = m; draw(); }); draw();
  const bodies = $$('#cBody .browser-body');
  bodies.forEach((b, i) => b.addEventListener('scroll', () => { const o = bodies[1 - i]; if (Math.abs(o.scrollTop - b.scrollTop) > 2) o.scrollTop = b.scrollTop; }));
}
function publishFlow(name) {
  const diff = differences();
  const steps = ['Ottimizzazione delle immagini', 'Generazione delle pagine', 'Aggiornamento della mappa per Google', 'Messa online'];
  openDialog(`<div class="dialog-body" style="padding:28px"><h2 style="font:400 24px/1.15 var(--display);letter-spacing:-.025em">Pubblicazione in corso</h2><p class="muted" style="margin:6px 0 20px">${diff.length} ${diff.length === 1 ? 'modifica' : 'modifiche'} verso alessandromoruzzi.com</p><div class="progress"><i id="pb"></i></div><ul class="publish-steps">${steps.map(s => `<li><span class="st"></span>${s}</li>`).join('')}</ul></div>`, '');
  const lis = $$('.publish-steps li');
  let i = 0;
  const tick = () => {
    if (i > 0) { lis[i - 1].className = 'done'; lis[i - 1].querySelector('.st').innerHTML = ico('check'); }
    $('#pb').style.width = (i / steps.length * 100) + '%';
    if (i === steps.length) return setTimeout(done, 450);
    lis[i].className = 'run'; i++;
    setTimeout(tick, 650 + Math.random() * 500);
  };
  const done = () => {
    const title = name || diff[0]?.title + (diff.length > 1 ? ` e altre ${diff.length - 1}` : '');
    state.published = snapshot();
    state.lastPublish = Date.now();
    state.versions.unshift({ id: Date.now(), title, at: Date.now(), data: structuredClone(state.published) });
    state.versions = state.versions.slice(0, 12);
    log('upload', 'Sito pubblicato', `Versione «${title}»`, 'versions');
    save();
    $('#dialog').innerHTML = `<div class="success"><span class="seal">${ico('check')}</span><h2>Il sito è aggiornato.</h2><p class="muted">Le modifiche sono online su alessandromoruzzi.com.<br>La versione precedente resta disponibile nella cronologia.</p><div class="row" style="margin-top:12px"><button class="btn" id="sv">${ico('eye', 'sm')}Vedi il sito</button><button class="btn primary" id="sd">Fatto</button></div></div>`;
    $('#sd').onclick = () => { closeDialog(); render(); };
    $('#sv').onclick = () => { closeDialog(); setTimeout(() => { fullPreview(sitePreview()); }, 220); render(); };
  };
  setTimeout(tick, 300);
}

/* ═════════════ VERSIONI ═════════════ */
PAGES.versions = () => {
  main.innerHTML = head('Versioni', 'Ogni pubblicazione viene conservata. Puoi riaprire una versione precedente e ripubblicarla.') + `
    <section class="card"><ul class="versions">${state.versions.map((v, i) => `<li class="version ${i ? '' : 'current'}"><span class="vdot">${i ? 'v' + (state.versions.length - i) : ico('check', 'sm')}</span><div><b>${esc(v.title)}</b>${i ? '' : ' <span class="badge green" style="margin-left:6px">Online</span>'}<small>${longDate(v.at)} · ${v.data.projects.length} progetti · ${esc(v.data.typography?.title || 'Atyp')}</small></div><div class="row"><button class="btn sm ghost" data-vp="${i}">${ico('eye', 'sm')}Guarda</button>${i ? `<button class="btn sm" data-vr="${i}">${ico('history', 'sm')}Ripristina</button>` : ''}</div></li>`).join('')}</ul></section>`;
  $$('[data-vp]').forEach(b => b.onclick = () => fullPreview(sitePreview({ data: state.versions[+b.dataset.vp].data })));
  $$('[data-vr]').forEach(b => b.onclick = async () => {
    const v = state.versions[+b.dataset.vr];
    if (!await confirmDialog({ title: `Ripristinare «${esc(v.title)}»?`, text: 'Contenuti, stile e homepage torneranno come in quella versione. Il sito online non cambia finché non pubblichi.', ok: 'Ripristina' })) return;
    const backup = structuredClone(snapshot());
    const d = structuredClone(v.data);
    state.projects = d.projects.map(p => ({ ...p, updated: Date.now() }));
    ['bio', 'headline', 'intro', 'email', 'instagram', 'phone', 'style', 'typography', 'home', 'seo', 'mediaInfo'].forEach(k => { if (d[k] !== undefined) state[k] = d[k]; });
    log('history', `Ripristinata la versione <b>${esc(v.title)}</b>`, 'Da pubblicare', 'publish');
    save(); go('publish');
    toast('Versione ripristinata nel pannello', () => { state.projects = backup.projects.map(p => ({ ...p, updated: Date.now() })); Object.assign(state, { ...backup, projects: state.projects }); save(); render(); });
  });
};

/* ═════════════ IMPOSTAZIONI ═════════════ */
PAGES.settings = () => {
  main.innerHTML = head('Impostazioni', 'Account, aspetto del pannello e copie di sicurezza.') + `
  <div class="grid g-2">
    <section class="card card-pad"><div class="row" style="gap:14px;margin-bottom:20px"><span class="avatar lg">AM</span><div><b style="font-weight:600;font-size:15px">Alessandro Moruzzi</b><p class="muted">${esc(state.email)}</p></div></div>
      <dl class="props" style="margin:0"><dt>Sito</dt><dd>alessandromoruzzi.com</dd><dt>Ruolo</dt><dd>Proprietario</dd><dt>Accesso</dt><dd>Protetto da password</dd></dl></section>
    <section class="card card-pad"><h2 class="card-title" style="margin-bottom:14px">Aspetto del pannello</h2><div class="seg" id="thSeg"><button data-th="light" class="${state.theme === 'light' ? 'on' : ''}">${ico('sun', 'sm')}Chiaro</button><button data-th="dark" class="${state.theme === 'dark' ? 'on' : ''}">${ico('moon', 'sm')}Scuro</button></div><p class="hint" style="margin-top:12px">Riguarda solo il pannello, non il sito pubblico. Scorciatoia: Ctrl K per cercare ovunque.</p></section>
    <section class="card card-pad"><h2 class="card-title" style="margin-bottom:6px">Copia di sicurezza</h2><p class="hint" style="margin-bottom:16px">Scarica tutti i contenuti del pannello in un unico file, o ricaricane uno.</p><div class="row" style="flex-wrap:wrap"><button class="btn" id="bk">${ico('download', 'sm')}Scarica copia</button><label class="btn" style="position:relative">${ico('upload', 'sm')}Carica copia<input type="file" id="rs" accept=".json,application/json" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label></div></section>
    <section class="card card-pad"><h2 class="card-title" style="margin-bottom:6px">Ripristino iniziale</h2><p class="hint" style="margin-bottom:16px">Riporta il pannello allo stato di partenza. Utile per ricominciare la prova da zero.</p><div class="row"><button class="btn danger" id="rst">${ico('refresh', 'sm')}Ripristina</button><button class="btn ghost" id="lo">${ico('logout', 'sm')}Esci</button></div></section>
  </div>`;
  $$('#thSeg button').forEach(b => b.onclick = () => { setTheme(b.dataset.th); $$('#thSeg button').forEach(x => x.classList.toggle('on', x === b)); });
  $('#bk').onclick = () => { download(new Blob([JSON.stringify({ format: 'am-studio', version: 2, at: Date.now(), state }, null, 1)], { type: 'application/json' }), `am-studio-copia-${iso(today)}.json`); toast('Copia scaricata'); };
  $('#rs').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const d = JSON.parse(await f.text()); if (d.format !== 'am-studio' || !d.state?.projects) throw 0; if (!await confirmDialog({ title: 'Caricare questa copia?', text: `Copia del ${longDate(d.at)}. Sostituirà i contenuti attuali del pannello.`, ok: 'Carica' })) return; state = d.state; save(); setTheme(state.theme); go('dashboard'); toast('Copia caricata'); }
    catch { toast('File non riconosciuto', null, 'alert'); }
  };
  $('#rst').onclick = async () => { if (!await confirmDialog({ title: 'Ripristinare il pannello?', text: 'Tutte le modifiche fatte in questo browser verranno cancellate.', ok: 'Ripristina', danger: true })) return; try { localStorage.removeItem(KEY); } catch {} state = seed(); save(); setTheme(state.theme); go('dashboard'); toast('Pannello ripristinato'); };
  $('#lo').onclick = () => { try { sessionStorage.removeItem('am-auth'); } catch {} location.reload(); };
};

/* ═════════════ RICERCA RAPIDA ═════════════ */
function openCommand() {
  if (!$('#overlay').hidden) return;
  openDialog(`<div class="cmd-input">${ico('search')}<input id="cq" placeholder="Cerca pagine, progetti, richieste…" autocomplete="off" autofocus><kbd>Esc</kbd></div><div class="cmd-list" id="cl"></div><div class="cmd-foot"><span><kbd>↑</kbd><kbd>↓</kbd> per scegliere</span><span><kbd>Invio</kbd> per aprire</span></div>`, 'cmd');
  const actions = [
    { g: 'Azioni', t: 'Nuovo progetto', i: 'plus', run: newProject },
    { g: 'Azioni', t: 'Pubblica le modifiche', i: 'upload', run: () => go('publish') },
    { g: 'Azioni', t: 'Vedi il sito', i: 'eye', run: () => setTimeout(() => fullPreview(sitePreview()), 220) },
    { g: 'Azioni', t: state.theme === 'dark' ? 'Tema chiaro' : 'Tema scuro', i: state.theme === 'dark' ? 'sun' : 'moon', run: () => setTheme(state.theme === 'dark' ? 'light' : 'dark') },
    ...NAV.flatMap(g => g.items.map(([id, i, t]) => ({ g: 'Pagine', t, i, run: () => go(id) }))),
    ...state.projects.map(p => ({ g: 'Progetti', t: p.title, img: p.images[0], sub: p.category, run: () => go('projects/' + p.id) })),
    ...state.leads.map(l => ({ g: 'Richieste', t: l.company + ' — ' + l.subject, i: 'inbox', sub: l.status, run: () => setTimeout(() => openLead(l.id), 220) }))
  ];
  let sel = 0, rows = [];
  const draw = () => {
    const q = $('#cq').value.toLowerCase().trim();
    rows = actions.filter(a => (a.t + ' ' + (a.sub || '')).toLowerCase().includes(q)).slice(0, 40);
    sel = clamp(sel, 0, rows.length - 1);
    let lastG = '';
    $('#cl').innerHTML = rows.map((a, i) => { const g = a.g !== lastG ? `<div class="cmd-group">${a.g}</div>` : ''; lastG = a.g; return g + `<button class="cmd-item ${i === sel ? 'on' : ''}" data-i="${i}"><span class="ico">${a.img ? `<img src="${esc(a.img)}" alt="">` : ico(a.i)}</span>${esc(a.t)}<small>${esc(a.sub || '')}</small></button>`; }).join('') || '<div class="empty" style="padding:30px"><p>Nessun risultato</p></div>';
    $$('#cl [data-i]').forEach(b => { b.onclick = () => run(+b.dataset.i); b.onmousemove = () => { if (sel !== +b.dataset.i) { sel = +b.dataset.i; $$('#cl .cmd-item').forEach(x => x.classList.toggle('on', +x.dataset.i === sel)); } }; });
  };
  const run = i => { const a = rows[i]; if (!a) return; closeDialog(); a.run(); };
  $('#cq').oninput = () => { sel = 0; draw(); };
  $('#cq').onkeydown = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(rows.length - 1, sel + 1); draw(); $('#cl .on')?.scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); $('#cl .on')?.scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Enter') { e.preventDefault(); run(sel); }
  };
  draw();
}

/* ═════════════ Avvio ═════════════ */
function setTheme(t) {
  state.theme = t;
  document.documentElement.dataset.theme = t;
  $('meta[name=theme-color]').content = t === 'dark' ? '#0e0e0f' : '#f4f2ee';
  $('#themeBtn').innerHTML = ico(t === 'dark' ? 'sun' : 'moon');
  save();
}
function closeSidebar() { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('on'); }

function notifications() {
  const unread = state.leads.filter(l => l.unread);
  const todayEv = state.agenda.filter(a => !a.done && (a.date === iso(today) || a.date === iso(addDays(today, 1))));
  const diff = differences().length;
  const items = [
    ...unread.map(l => `<button class="notif" data-nl="${l.id}"><span class="avatar av-${l.id % 6 + 1}" style="width:32px;height:32px">${initials(l.name)}</span><span><b style="font-weight:500">${esc(l.company)}</b> ti ha scritto<small>${esc(l.subject)} · ${ago(l.at)}</small></span></button>`),
    ...todayEv.map(a => `<button class="notif" data-ng="calendar"><span class="ico" style="width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:var(--bg-2)">${ico('calendar', 'sm')}</span><span>${esc(a.title)}<small>${relDay(a.date)}</small></span></button>`),
    diff ? `<button class="notif" data-ng="publish"><span class="ico" style="width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent-ink)">${ico('upload', 'sm')}</span><span>${diff} ${diff === 1 ? 'modifica' : 'modifiche'} da pubblicare<small>Rivedi e metti online</small></span></button>` : ''
  ].join('');
  const p = openPopover($('#bellBtn'), `<div class="pop-head">Notifiche${unread.length ? `<button class="link" id="readAll">Segna come lette</button>` : ''}</div><div style="max-height:380px;overflow:auto">${items || '<div class="empty" style="padding:30px"><p>Nessuna novità</p></div>'}</div>`);
  $$('[data-nl]', p).forEach(b => b.onclick = () => { closePopover(); openLead(+b.dataset.nl); });
  $$('[data-ng]', p).forEach(b => b.onclick = () => { closePopover(); go(b.dataset.ng); });
  $('#readAll', p) && ($('#readAll', p).onclick = () => { state.leads.forEach(l => l.unread = false); save(); closePopover(); if (route === 'leads' || route === 'dashboard') render(); });
}

function boot() {
  load();
  document.documentElement.dataset.theme = state.theme;
  renderNav();
  setTheme(state.theme);
  if (/Mac|iPhone|iPad/.test(navigator.platform)) $('#kbd').textContent = '⌘ K';
  $('#searchBtn').onclick = openCommand;
  $('#themeBtn').onclick = () => setTheme(state.theme === 'dark' ? 'light' : 'dark');
  $('#bellBtn').onclick = () => $('#popover').hidden ? notifications() : closePopover();
  $('#viewSite').onclick = () => fullPreview(sitePreview());
  $('#publishBtn').onclick = () => go('publish');
  $('#menuBtn').onclick = () => { $('#sidebar').classList.add('open'); $('#scrim').classList.add('on'); };
  $('#scrim').onclick = closeSidebar;
  $('#overlay').addEventListener('mousedown', e => { if (e.target.id === 'overlay') closeDialog(); });
  $('#drawerWrap').addEventListener('mousedown', e => { if (e.target.id === 'drawerWrap') closeDrawer(); });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCommand(); }
    if (e.key === 'Escape') { if (!$('#overlay').hidden) closeDialog(); else if (drawerOpen()) closeDrawer(); else closePopover(); }
  });
  addEventListener('scroll', () => $('.topbar').classList.toggle('scrolled', scrollY > 4), { passive: true });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (route === 'stats' || route === 'dashboard') { const c = $('#sChart') || $('#dashChart'); if (c) areaChart(c, Stats.range(route === 'stats' ? statRange : 30), Stats.prev(route === 'stats' ? statRange : 30), { height: route === 'stats' ? 280 : 230 }); } }, 200); });
  (state.customFonts || []).forEach(f => { try { const ff = new FontFace(f.name, `url(${f.data})`); ff.load().then(x => document.fonts.add(x)).catch(() => {}); } catch {} });

  let authed = false; try { authed = sessionStorage.getItem('am-auth') === '1'; } catch {}
  if (!authed && !/[?&]nologin/.test(location.search)) {
    const L = $('#login'); L.hidden = false;
    $('#loginForm').onsubmit = e => {
      e.preventDefault();
      const b = $('#loginForm .btn'); b.innerHTML = '<span>Accesso…</span>'; b.disabled = true;
      setTimeout(() => { try { sessionStorage.setItem('am-auth', '1'); } catch {} L.classList.add('out'); render(); setTimeout(() => L.hidden = true, 600); }, 650);
    };
    setTimeout(() => $('#loginForm .btn').focus(), 100);
  } else render();
}
boot();
