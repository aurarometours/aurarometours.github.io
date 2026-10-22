'use strict';

/* ————————————————————————————————————————————————
   A.M Studio — pannello di gestione del sito
   Nucleo: stato, utilità, componenti condivisi
———————————————————————————————————————————————— */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ico = (n, c = '') => `<svg class="i ${c}"><use href="#i-${n}"/></svg>`;
const nf = new Intl.NumberFormat('it-IT');
const fmt = n => nf.format(Math.round(n));
const eur = n => '€ ' + nf.format(Math.round(n));
const DAY = 864e5;
const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const parseDay = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
const iso = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const pad = n => String(n).padStart(2, '0');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const H = 36e5;

function ago(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 50) return 'adesso';
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min fa';
  if (s < 86400) return Math.round(s / 3600) + ' h fa';
  const d = Math.floor((today - new Date(ts).setHours(0, 0, 0, 0)) / DAY);
  if (d <= 1) return 'ieri';
  if (d < 7) return d + ' giorni fa';
  return new Date(ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}
const longDate = ts => new Date(ts).toLocaleString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const shortDate = ts => new Date(ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

/* ——— Tipografia e palette del sito ——— */
const FONTS = [
  { name: 'Atyp', stack: 'Atyp, Inter, sans-serif', note: 'Grotesk · attuale' },
  { name: 'Inter', stack: 'Inter, sans-serif', note: 'Neo-grotesk' },
  { name: 'Helvetica', stack: '"Helvetica Neue", Helvetica, Arial, sans-serif', note: 'Svizzero' },
  { name: 'Futura', stack: 'Futura, "Century Gothic", "Avenir Next", sans-serif', note: 'Geometrico' },
  { name: 'Avenir', stack: '"Avenir Next", Avenir, "Segoe UI", sans-serif', note: 'Umanista' },
  { name: 'Didot', stack: 'Didot, "Bodoni 72", "Bodoni MT", "Didot LT STD", Georgia, serif', note: 'Moda · alto contrasto' },
  { name: 'Garamond', stack: '"EB Garamond", Garamond, "Adobe Garamond Pro", "Times New Roman", serif', note: 'Classico da libro' },
  { name: 'Georgia', stack: 'Georgia, "Times New Roman", serif', note: 'Serif editoriale' },
  { name: 'Times', stack: '"Times New Roman", Times, serif', note: 'Quotidiano' },
  { name: 'Courier', stack: '"Courier New", Courier, ui-monospace, monospace', note: 'Macchina da scrivere' }
];
const PALETTES = [
  { id: 'carta', name: 'Carta', bg: '#f3f2ec', ink: '#252820', accent: '#c7754c' },
  { id: 'oscura', name: 'Camera oscura', bg: '#121212', ink: '#ece8e1', accent: '#d98a62' },
  { id: 'pellicola', name: 'Pellicola', bg: '#efe6d8', ink: '#2b2420', accent: '#b5442c' },
  { id: 'gesso', name: 'Gesso', bg: '#ffffff', ink: '#111111', accent: '#111111' },
  { id: 'salvia', name: 'Salvia', bg: '#e5e8df', ink: '#1f2a22', accent: '#5f7a55' },
  { id: 'notte', name: 'Notte', bg: '#151a23', ink: '#e7e9ee', accent: '#c9a46a' }
];
const ROLES = { title: 'Titoli', body: 'Testi', nav: 'Menu', caption: 'Didascalie', logo: 'Logo' };
const SECTION_NAMES = { works: 'Lavori selezionati', areas: 'Ambiti creativi', bio: 'Biografia', cv: 'Competenze', contact: 'Contatti' };
const STAGES = ['Nuova', 'In valutazione', 'Proposta inviata', 'Confermata', 'Archiviata'];
const STAGE_COLOR = { 'Nuova': 'accent', 'In valutazione': 'blue', 'Proposta inviata': 'amber', 'Confermata': 'green', 'Archiviata': '' };
const CAMERAS = ['Pentax KM', 'Canon A-1', 'Canon F-1', 'Yashica D', 'Sony Alpha 7 IV', 'Fuji X-T1', 'Nessuna'];
const CATEGORIES = ['Fotografia', 'Grafica', 'AI'];
const EVENT_TYPES = { publish: 'Pubblicazione', shoot: 'Shooting', social: 'Social', task: 'Attività' };

function fontStack(name) {
  const f = FONTS.find(f => f.name === name);
  if (f) return f.stack;
  return `"${String(name).replace(/["\\]/g, '')}", Inter, sans-serif`;
}

/* ——— Stato ——— */
const KEY = 'am-studio-v2';
let state;

function seed() {
  const now = Date.now();
  const projects = SEED.projects.map((p, i) => ({
    ...p,
    status: 'Online',
    layout: p.id === 'serie-18' ? 'editorial' : p.id === 'serie-10' ? 'strip' : 'grid',
    fit: 'cover',
    year: p.id === 'serie-21' ? 2025 : p.id === 'serie-10' ? 2024 : 2025,
    updated: now - [3, 12, 18, 9, 6, 6, 15, 2][i] * DAY - i * H
  }));
  const leads = [
    { id: 1, company: 'Edizioni Lanterna', name: 'Chiara Valli', email: 'chiara.valli@edizionilanterna.it', subject: 'Copertine e identità per una nuova collana', service: 'Grafica', status: 'Nuova', budget: 3500, source: 'Modulo del sito', at: now - 2 * H - 14 * 6e4, unread: true, note: '',
      message: 'Buongiorno Alessandro,\nstiamo lanciando una collana di narrativa breve (sei titoli il primo anno) e cerchiamo qualcuno che ne disegni l’identità: copertine, griglia interna, marchio di collana. Il tuo lavoro sui tarocchi ci ha colpito molto. Hai disponibilità per una chiamata la prossima settimana?' },
    { id: 2, company: 'Maison Ardesia', name: 'Tommaso Rinaldi', email: 'tommaso@maisonardesia.com', subject: 'Campagna SS27 su pellicola', service: 'Fotografia', status: 'Nuova', budget: 6000, source: 'Instagram', at: now - 26 * H, unread: true, note: '',
      message: 'Ciao Alessandro, ti scrivo da Maison Ardesia. Per la prossima stagione vorremmo una campagna interamente analogica, medio formato, con un’estetica vicina al tuo editoriale per Gianmarco Funari. Due giorni di shooting a Milano, tra marzo e aprile.' },
    { id: 3, company: 'Galleria Spazio Nove', name: 'Elena Morandi', email: 'e.morandi@spazionove.art', subject: 'Proiezione generativa per la mostra di primavera', service: 'AI', status: 'In valutazione', budget: 2800, source: 'Email', at: now - 4 * DAY, unread: false, note: 'Chiedere planimetria della sala e risoluzione del proiettore.',
      message: 'Gentile Alessandro, per la collettiva di aprile avremmo uno spazio dedicato a un’opera video. Ci piacerebbe un loop di immagini generate, tra fotografia e pittura. Durata indicativa 4–6 minuti.' },
    { id: 4, company: 'Festival Luce Fredda', name: 'Marco Pellegrini', email: 'marco@lucefredda.org', subject: 'Poster e affissioni edizione 2027', service: 'Grafica', status: 'Proposta inviata', budget: 4200, source: 'Passaparola', at: now - 6 * DAY, unread: false, note: 'Proposta inviata il 16. Risposta attesa entro fine mese.',
      message: 'Ciao! Cerchiamo un’identità visiva per la prossima edizione: poster principale, declinazioni per affissioni e social. Ci è piaciuto molto Poster Doppel.' },
    { id: 5, company: 'Rivista Ombra', name: 'Davide Serra', email: 'redazione@rivistaombra.it', subject: 'Servizio editoriale in bianco e nero', service: 'Fotografia', status: 'Proposta inviata', budget: 1900, source: 'Modulo del sito', at: now - 9 * DAY, unread: false, note: '',
      message: 'Buongiorno, per il numero di gennaio stiamo preparando un servizio di 8 pagine sul tema della notte in città. Lavoreresti in pellicola bianco e nero?' },
    { id: 6, company: 'Studio Ferro & Lino', name: 'Sara Conti', email: 'sara@ferroelino.it', subject: 'Ritratti del team e still life', service: 'Fotografia', status: 'Confermata', budget: 2400, source: 'Instagram', at: now - 16 * DAY, unread: false, note: 'Shooting fissato. Portare fondale grigio e luce continua.',
      message: 'Ciao Alessandro, ci servirebbero i ritratti del team (6 persone) e una serie di still life dei nostri prodotti per il nuovo sito.' },
    { id: 7, company: 'Atelier Brina', name: 'Giulia Ferri', email: 'giulia@atelierbrina.com', subject: 'Lookbook capsule invernale', service: 'Fotografia', status: 'Archiviata', budget: 1500, source: 'Email', at: now - 34 * DAY, unread: false, note: 'Date non compatibili. Ricontattare per la primavera.',
      message: 'Ciao, stiamo cercando un fotografo per il lookbook della capsule invernale, una giornata in studio.' }
  ];
  const agenda = [
    { id: 1, title: 'Sviluppo rullini Portra 800', date: iso(addDays(today, -3)), type: 'task', project: 'serie-18', done: true },
    { id: 2, title: 'Pubblicazione FW 25/26', date: iso(addDays(today, -2)), type: 'publish', project: 'serie-21', done: true },
    { id: 3, title: 'Selezione scatti Metallo & Carne', date: iso(addDays(today, 1)), type: 'task', project: 'serie-20', done: false },
    { id: 4, title: 'Post Instagram — Chroma Delay', date: iso(addDays(today, 2)), type: 'social', project: 'serie-10', done: false },
    { id: 5, title: 'Sopralluogo Maison Ardesia', date: iso(addDays(today, 4)), type: 'shoot', project: '', done: false },
    { id: 6, title: 'Ritratti Studio Ferro & Lino', date: iso(addDays(today, 6)), type: 'shoot', project: '', done: false },
    { id: 7, title: 'Pubblicare nuova serie analogica', date: iso(addDays(today, 8)), type: 'publish', project: '', done: false },
    { id: 8, title: 'Post Instagram — Tarocchi', date: iso(addDays(today, 10)), type: 'social', project: 'serie-14', done: false },
    { id: 9, title: 'Consegna bozze Festival Luce Fredda', date: iso(addDays(today, 13)), type: 'task', project: '', done: false },
    { id: 10, title: 'Post Instagram — Pellicola', date: iso(addDays(today, 17)), type: 'social', project: 'serie-18', done: false }
  ];
  const s = {
    projects,
    bio: SEED.bio,
    headline: 'Tre modi di guardare.',
    intro: 'Fotografia, grafica e intelligenza artificiale. Tre linguaggi per la stessa ricerca.',
    email: 'studio@alessandromoruzzi.com',
    instagram: '@alessandromoruzzi',
    phone: '+39 333 000 0000',
    city: 'Roma',
    style: { palette: 'carta', bg: '#f3f2ec', ink: '#252820', accent: '#c7754c', size: 56, body: 15, weight: 400 },
    typography: { title: 'Atyp', body: 'Atyp', nav: 'Atyp', caption: 'Atyp', logo: 'Atyp' },
    customFonts: [],
    home: { featured: 'serie-10', sections: ['works', 'areas', 'bio', 'cv', 'contact'].map(id => ({ id, on: true })) },
    mediaInfo: {},
    seo: {
      'serie-10': { title: 'Chroma Delay — Fotografia analogica · Alessandro Moruzzi', description: 'Chroma Delay, serie di fotografia analogica scattata con una Pentax KM del 1975 su pellicola scaduta: il colore che arriva in ritardo.' },
      'serie-18': { title: 'Gianmarco Funari su pellicola 6×6 — Alessandro Moruzzi', description: 'Editoriale di moda per Gianmarco Funari, fotografia analogica medio formato 6×6 su Kodak Portra 800. Colore, luce naturale e doppie esposizioni.' }
    },
    leads, agenda,
    activity: [
      { at: now - 2 * H - 14 * 6e4, icon: 'inbox', text: 'Nuova richiesta da <b>Edizioni Lanterna</b>', sub: 'Copertine e identità per una nuova collana', go: 'leads' },
      { at: now - 26 * H, icon: 'inbox', text: 'Nuova richiesta da <b>Maison Ardesia</b>', sub: 'Campagna SS27 su pellicola', go: 'leads' },
      { at: now - 2 * DAY - 3 * H, icon: 'upload', text: 'Sito pubblicato', sub: 'Versione «Nuova selezione FW 25/26»', go: 'versions' },
      { at: now - 2 * DAY - 4 * H, icon: 'image', text: '8 immagini aggiunte a <b>FW 25/26</b>', sub: 'Sony Alpha 7 IV', go: 'projects' },
      { at: now - 5 * DAY, icon: 'pen', text: 'Biografia aggiornata', sub: 'Testi e profilo', go: 'texts' }
    ],
    theme: 'light',
    projectView: 'grid',
    lastPublish: now - 2 * DAY - 3 * H
  };
  const snap = snapshotOf(s);
  const older = structuredClone(snap);
  older.projects = older.projects.filter(p => p.id !== 'serie-21');
  const oldest = structuredClone(older);
  oldest.projects = oldest.projects.filter(p => p.id !== 'serie-20');
  oldest.headline = 'Fotografia, grafica, AI.';
  s.published = snap;
  s.versions = [
    { id: 3, title: 'Nuova selezione FW 25/26', at: now - 2 * DAY - 3 * H, data: snap },
    { id: 2, title: 'Aggiornamento biografia', at: now - 5 * DAY - 2 * H, data: older },
    { id: 1, title: 'Lancio del nuovo portfolio', at: now - 23 * DAY, data: oldest }
  ];
  return s;
}

function snapshotOf(s) {
  return structuredClone({
    projects: s.projects.map(({ updated, ...p }) => p),
    bio: s.bio, headline: s.headline, intro: s.intro, email: s.email, instagram: s.instagram, phone: s.phone,
    style: s.style, typography: s.typography, home: s.home, seo: s.seo, mediaInfo: s.mediaInfo
  });
}
const snapshot = () => snapshotOf(state);

function load() {
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch { state = null; }
  if (!state || !state.projects) state = seed();
}

let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { toast('Spazio del browser esaurito: alcune immagini non sono state conservate.', null, 'alert'); }
  }, 120);
  refreshChrome();
}

function log(icon, text, sub = '', go = '') {
  state.activity.unshift({ at: Date.now(), icon, text, sub, go });
  state.activity = state.activity.slice(0, 30);
}

function differences() {
  const a = state.published, b = snapshot(), out = [];
  const J = JSON.stringify;
  for (const p of b.projects) {
    const o = a.projects.find(x => x.id === p.id);
    if (!o) { out.push({ icon: 'plus', title: 'Nuovo progetto', sub: p.title, go: 'projects/' + p.id }); continue; }
    if (o.title !== p.title || o.description !== p.description || o.category !== p.category || o.camera !== p.camera || o.year !== p.year)
      out.push({ icon: 'pen', title: 'Contenuti modificati', sub: p.title, go: 'projects/' + p.id });
    if (J(o.images) !== J(p.images)) out.push({ icon: 'image', title: 'Sequenza immagini', sub: p.title, go: 'projects/' + p.id });
    if (o.layout !== p.layout || o.fit !== p.fit) out.push({ icon: 'columns', title: 'Impaginazione galleria', sub: p.title, go: 'projects/' + p.id });
    if (o.status !== p.status) out.push({ icon: 'eye', title: p.status === 'Online' ? 'Progetto reso visibile' : 'Progetto nascosto', sub: p.title, go: 'projects/' + p.id });
  }
  for (const o of a.projects) if (!b.projects.find(p => p.id === o.id)) out.push({ icon: 'trash', title: 'Progetto rimosso', sub: o.title, go: 'projects' });
  if (J(a.projects.map(p => p.id)) !== J(b.projects.map(p => p.id)) && a.projects.length === b.projects.length) out.push({ icon: 'list', title: 'Ordine del portfolio', sub: 'Sequenza dei lavori', go: 'home' });
  if (a.headline !== b.headline || a.intro !== b.intro) out.push({ icon: 'type', title: 'Titolo di apertura', sub: b.headline, go: 'texts' });
  if (a.bio !== b.bio) out.push({ icon: 'pen', title: 'Biografia', sub: 'Testi e profilo', go: 'texts' });
  if (a.email !== b.email || a.instagram !== b.instagram || a.phone !== b.phone) out.push({ icon: 'mail', title: 'Contatti', sub: 'Email, Instagram, telefono', go: 'texts' });
  if (J(a.style) !== J(b.style)) out.push({ icon: 'sparkle', title: 'Colori e dimensioni', sub: 'Identità visiva', go: 'style' });
  if (J(a.typography) !== J(b.typography)) out.push({ icon: 'type', title: 'Tipografia', sub: Object.values(b.typography).filter((v, i, x) => x.indexOf(v) === i).join(' · '), go: 'style' });
  if (J(a.home) !== J(b.home)) out.push({ icon: 'layout', title: 'Composizione homepage', sub: 'Apertura e sezioni', go: 'home' });
  if (J(a.seo) !== J(b.seo)) out.push({ icon: 'globe', title: 'Schede di ricerca', sub: 'Titoli e descrizioni', go: 'seo' });
  if (J(a.mediaInfo) !== J(b.mediaInfo)) out.push({ icon: 'image', title: 'Descrizioni immagini', sub: 'Libreria', go: 'library' });
  return out;
}

function allMedia() {
  const map = new Map();
  for (const p of state.projects) for (const src of p.images) {
    if (!map.has(src)) map.set(src, { src, projects: [] });
    map.get(src).projects.push(p);
  }
  return [...map.values()];
}

function seoMeta(p) {
  return state.seo[p.id] || { title: `${p.title} — Alessandro Moruzzi`, description: p.description || '' };
}
function seoScore(p) {
  const m = seoMeta(p), checks = seoChecks(p, m);
  return Math.round(checks.filter(c => c.ok).length / checks.length * 100);
}
function seoChecks(p, m) {
  const alts = p.images.filter(src => state.mediaInfo[src]?.alt).length;
  return [
    { ok: m.title.length >= 30 && m.title.length <= 60, text: 'Titolo tra 30 e 60 caratteri' },
    { ok: m.description.length >= 70 && m.description.length <= 160, text: 'Descrizione tra 70 e 160 caratteri' },
    { ok: /moruzzi/i.test(m.title), text: 'Il nome compare nel titolo' },
    { ok: m.description.toLowerCase().includes(p.category.toLowerCase()) || m.description.toLowerCase().includes(p.title.toLowerCase().split(' ')[0]), text: 'La descrizione cita il progetto o la disciplina' },
    { ok: p.images.length > 0 && alts / p.images.length >= .5, text: 'Almeno metà delle immagini ha una descrizione' }
  ];
}

function qualityItems() {
  const out = [];
  for (const p of state.projects) {
    if (!p.images.length) out.push({ level: 'high', title: 'Manca la copertina', sub: p.title, go: 'projects/' + p.id });
    if (!p.description?.trim()) out.push({ level: 'mid', title: 'Racconto del progetto vuoto', sub: p.title, go: 'projects/' + p.id });
  }
  const missingAlt = allMedia().filter(m => !state.mediaInfo[m.src]?.alt).length;
  if (missingAlt) out.push({ level: 'low', title: `${missingAlt} immagini senza descrizione`, sub: 'Utile per accessibilità e ricerca', go: 'library' });
  const weakSeo = state.projects.filter(p => seoScore(p) < 60).length;
  if (weakSeo) out.push({ level: 'low', title: `${weakSeo} schede di ricerca da migliorare`, sub: 'Titoli e descrizioni per Google', go: 'seo' });
  if (!state.bio.trim()) out.push({ level: 'high', title: 'La biografia è vuota', sub: 'Testi e profilo', go: 'texts' });
  return out;
}

/* ——— Statistiche: serie storica deterministica ——— */
const Stats = (() => {
  let seedN = 51329;
  const rnd = () => { seedN |= 0; seedN = seedN + 0x6D2B79F5 | 0; let t = Math.imul(seedN ^ seedN >>> 15, 1 | seedN); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const N = 200, spikes = { 38: 2.2, 71: 1.9, 104: 2.4, 133: 1.8, 160: 2.1, 197: 2.6 };
  const days = [];
  let carry = 1;
  for (let i = 0; i < N; i++) {
    const d = addDays(today, i - N + 1), dow = d.getDay();
    const trend = 1 + i / N * .62;
    const week = dow === 0 ? 1.3 : dow === 6 ? 1.16 : dow === 1 ? .9 : dow === 3 ? 1.04 : 1;
    let v = 31 * trend * week * (.8 + rnd() * .38);
    const sp = spikes[i] || 1;
    v *= sp * carry;
    carry = sp > 1 ? 1 + (sp - 1) * .45 : 1 + (carry - 1) * .4;
    const visitors = Math.round(v);
    days.push({ date: d, visitors, views: Math.round(visitors * (2.7 + rnd() * .9)), contacts: Math.round(visitors * (.016 + rnd() * .018)), dur: 128 + rnd() * 70 });
  }
  const range = n => days.slice(-n);
  const prev = n => days.slice(-2 * n, -n);
  const sum = (rows, k) => rows.reduce((a, r) => a + r[k], 0);
  function totals(n) {
    const a = range(n), b = prev(n);
    const t = rows => ({ visitors: sum(rows, 'visitors'), views: sum(rows, 'views'), contacts: sum(rows, 'contacts'), dur: rows.reduce((x, r) => x + r.dur * r.visitors, 0) / Math.max(1, sum(rows, 'visitors')) });
    return { cur: t(a), prev: t(b) };
  }
  const jitter = (base, n, salt) => base.map(([k, v], i) => [k, v * (1 + Math.sin(n * 1.7 + i * 2.3 + salt) * .08)]);
  function share(base, n, salt) { const j = jitter(base, n, salt), s = j.reduce((a, [, v]) => a + v, 0); return j.map(([k, v]) => [k, v / s]); }
  const sources = n => share([['Instagram', 46], ['Google', 24], ['Accesso diretto', 16], ['Behance', 8], ['LinkedIn', 6]], n, 1);
  const devices = n => share([['Smartphone', 64], ['Computer', 31], ['Tablet', 5]], n, 2);
  const cities = n => share([['Roma', 31], ['Milano', 24], ['Bologna', 9], ['Torino', 7], ['Parigi', 6], ['Altre città', 23]], n, 3);
  const projectWeights = { 'serie-10': 24, 'serie-18': 19, 'serie-21': 15, 'fake-campaign': 12, 'serie-14': 10, 'serie-20': 8, 'serie-19': 7, 'serie-15': 5 };
  function projects(n, list) {
    const { cur } = totals(n);
    const w = list.map((p, i) => [p, (projectWeights[p.id] || 4) * (1 + Math.sin(n + i) * .07)]);
    const s = w.reduce((a, [, v]) => a + v, 0);
    return w.map(([p, v], i) => ({ p, views: Math.round(cur.views * .58 * v / s), time: 52 + ((i * 37 + n) % 70), contacts: Math.round(cur.contacts * v / s) })).sort((a, b) => b.views - a.views);
  }
  const SESS = [
    ['Milano', 'Instagram', 'phone', ['Home', 'Chroma Delay', 'Contatti'], 'WhatsApp', 4],
    ['Roma', 'Google', 'desktop', ['Fotografia', 'Gianmarco Funari — Pellicola', 'Biografia'], '', 11],
    ['Parigi', 'Behance', 'desktop', ['Home', 'AI Fake Campaign', 'Grafica', 'Poster Doppel'], '', 19],
    ['Bologna', 'Instagram', 'phone', ['FW 25/26', 'Home', 'Contatti'], 'Email', 27],
    ['Roma', 'Accesso diretto', 'desktop', ['Home', 'Tarocchi — Gianmarco Funari', 'Contatti'], 'Modulo', 42],
    ['Torino', 'Instagram', 'phone', ['Metallo & Carne', 'Home'], '', 58],
    ['Londra', 'LinkedIn', 'desktop', ['Biografia', 'Competenze', 'Contatti'], 'Email', 76],
    ['Firenze', 'Google', 'phone', ['Home', 'Chroma Delay', 'FW 25/26'], '', 95]
  ];
  const sessions = () => SESS.map(([city, source, device, route, action, min]) => ({ city, source, device, route, action, at: Date.now() - min * 6e4 }));
  return { days, range, prev, totals, sources, devices, cities, projects, sessions };
})();

/* ——— UI: toast, dialog, drawer, popover ——— */
function toast(msg, undo, icon = 'check') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = ico(icon) + `<span>${msg}</span>` + (undo ? '<button>Annulla</button>' : '');
  $('#toasts').append(t);
  if (undo) t.querySelector('button').onclick = () => { undo(); dismiss(); };
  let gone = false;
  const dismiss = () => { if (gone) return; gone = true; t.classList.add('out'); setTimeout(() => t.remove(), 300); };
  setTimeout(dismiss, undo ? 5200 : 3200);
}

let dialogClose = null;
function openDialog(html, cls = '', onClose) {
  const ov = $('#overlay'), d = $('#dialog');
  d.className = 'dialog ' + cls;
  d.innerHTML = html;
  ov.hidden = false; ov.classList.remove('closing');
  dialogClose = onClose || null;
  $$('[data-close]', d).forEach(b => b.onclick = closeDialog);
  setTimeout(() => (d.querySelector('[autofocus]') || d.querySelector('input,button'))?.focus({ preventScroll: true }), 30);
  return d;
}
function closeDialog() {
  const ov = $('#overlay');
  if (ov.hidden) return;
  ov.classList.add('closing');
  setTimeout(() => { ov.hidden = true; ov.classList.remove('closing'); dialogClose?.(); dialogClose = null; }, 200);
}
const drawerOpen = () => !$('#drawerWrap').hidden;
function openDrawer(html) {
  const w = $('#drawerWrap'), d = $('#drawer');
  d.innerHTML = html;
  w.hidden = false; w.classList.remove('closing');
  $$('[data-close]', d).forEach(b => b.onclick = closeDrawer);
  return d;
}
function closeDrawer() {
  const w = $('#drawerWrap');
  if (w.hidden) return;
  w.classList.add('closing');
  setTimeout(() => { w.hidden = true; w.classList.remove('closing'); }, 230);
}
function confirmDialog({ title, text, ok = 'Conferma', danger = false }) {
  return new Promise(res => {
    let answered = false;
    openDialog(`<div class="dialog-head"><div><h2>${title}</h2><p>${text}</p></div></div><div class="dialog-foot" style="border:0;padding-top:22px"><button class="btn" data-close>Annulla</button><button class="btn ${danger ? 'accent' : 'primary'}" id="cOk">${ok}</button></div>`, '', () => { if (!answered) res(false); });
    $('#cOk').onclick = () => { answered = true; res(true); closeDialog(); };
  });
}
function closePopover() { $('#popover').hidden = true; }
function openPopover(anchor, html) {
  const p = $('#popover'); p.innerHTML = html; p.hidden = false;
  const r = anchor.getBoundingClientRect();
  p.style.top = (r.bottom + 8) + 'px';
  p.style.left = Math.max(12, Math.min(innerWidth - p.offsetWidth - 12, r.right - p.offsetWidth)) + 'px';
  return p;
}
document.addEventListener('pointerdown', e => { const p = $('#popover'); if (!p.hidden && !p.contains(e.target) && !e.target.closest('#bellBtn')) closePopover(); });

/* ——— Ordinamento con trascinamento (mouse e tastiera) ——— */
function sortable(container, selector, onMove) {
  let from = null;
  $$(selector, container).forEach((el, i) => {
    el.draggable = true;
    el.dataset.idx = i;
    el.addEventListener('dragstart', e => { from = i; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch {} });
    el.addEventListener('dragend', () => { el.classList.remove('dragging'); $$(selector, container).forEach(x => x.classList.remove('over')); });
    el.addEventListener('dragover', e => { e.preventDefault(); if (from !== null && from !== i) el.classList.add('over'); });
    el.addEventListener('dragleave', () => el.classList.remove('over'));
    el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('over'); if (from !== null && from !== i) onMove(from, i); from = null; });
    el.addEventListener('keydown', e => {
      if (!e.altKey) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); if (i > 0) onMove(i, i - 1); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); if (i < $$(selector, container).length - 1) onMove(i, i + 1); }
    });
  });
}
const moveItem = (arr, a, b) => { arr.splice(b, 0, arr.splice(a, 1)[0]); return arr; };

function readImage(file, max = 1800) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      const img = new Image();
      img.onerror = rej;
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/webp', .82));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* ——— Anteprima del sito pubblico ——— */
function siteVars(style = state.style, typo = state.typography) {
  return `--s-bg:${style.bg};--s-ink:${style.ink};--s-accent:${style.accent};--s-size:${style.size}px;--s-body:${style.body}px;--s-weight:${style.weight};` +
    Object.keys(ROLES).map(k => `--f-${k}:${fontStack(typo[k]).replace(/"/g, "'")}`).join(';');
}
function sitePreview(opts = {}) {
  const s = opts.data || state;
  const projects = s.projects.filter(p => p.status !== 'Bozza');
  const feat = opts.project ? null : (s.projects.find(p => p.id === s.home.featured) || s.projects[0]);
  const nav = `<div class="site-nav"><b>A<i></i>M</b><span>Lavori · Fotografia · Grafica · AI · Bio · Contatti</span></div>`;
  if (opts.project) {
    const p = opts.project;
    return `<div class="site" style="${siteVars(s.style, s.typography)}">${nav}
      <div class="site-hero"><h1 style="max-width:16ch">${esc(p.title || 'Senza titolo')}</h1>${p.description ? `<p>${esc(p.description)}</p>` : ''}</div>
      <div class="site-cap" style="padding-bottom:14px"><span>${esc(p.category)}${p.year ? ' · ' + p.year : ''}</span><span>${p.camera && p.camera !== 'Nessuna' ? 'Shot on ' + esc(p.camera) : ''}</span></div>
      <div class="site-gallery ${p.layout || 'grid'}">${p.images.map(src => `<img src="${esc(src)}" alt="" style="object-fit:${p.fit === 'contain' ? 'contain' : 'cover'}">`).join('') || '<div class="site-cap">Aggiungi immagini per vedere la galleria.</div>'}</div>
      <div class="site-foot"><span>© ${new Date().getFullYear()} Alessandro Moruzzi</span><span>${esc(s.instagram || '')}</span></div></div>`;
  }
  const sections = s.home.sections.filter(x => x.on).map((x, i) => {
    const n = pad(i + 1);
    const h = `<h2><small>${n}</small>${SECTION_NAMES[x.id]}</h2>`;
    if (x.id === 'works') return `<div class="site-section">${h}<div class="site-works">${projects.filter(p => p.id !== feat?.id).slice(0, 6).map(p => `<figure><img src="${esc(p.images[0] || '')}" alt=""><figcaption><span>${esc(p.title)}</span><span>${esc(p.category)}</span></figcaption></figure>`).join('')}</div></div>`;
    if (x.id === 'areas') return `<div class="site-section">${h}<div class="site-areas">${CATEGORIES.map(c => `<div><small>${projects.filter(p => p.category === c).length} progetti</small>${c === 'AI' ? 'Intelligenza artificiale' : c}</div>`).join('')}</div></div>`;
    if (x.id === 'bio') return `<div class="site-section">${h}<div class="site-bio">${s.bio.split(/\n\n+/).slice(0, 3).map(t => `<p>${esc(t)}</p>`).join('')}</div></div>`;
    if (x.id === 'cv') return `<div class="site-section">${h}<div class="site-cv">${[['35 mm', 'Fotografia analogica, sviluppo e scansione', 'Pellicola'], ['Digitale', 'Ritratto, moda, reportage', 'Fotografia'], ['Editoria', 'Impaginazione e direzione artistica', 'Grafica'], ['Identità', 'Visual identity, poster, stampa', 'Grafica'], ['Ricerca', 'Generazione di immagini, concept, moodboard', 'AI']].map(r => `<div>${r.map(c => `<span>${c}</span>`).join('')}</div>`).join('')}</div></div>`;
    if (x.id === 'contact') return `<div class="site-section">${h}<a class="site-contact">${esc(s.email)}</a><p style="margin-top:14px;opacity:.7">${esc(s.instagram)} · ${esc(s.phone)}</p></div>`;
    return '';
  }).join('');
  return `<div class="site" style="${siteVars(s.style, s.typography)}">${nav}
    <div class="site-hero"><h1>${esc(s.headline)}</h1><p>${esc(s.intro || '')}</p></div>
    ${feat ? `<div class="site-feature"><img src="${esc(feat.images[0] || '')}" alt=""></div><div class="site-cap"><span>In evidenza — ${esc(feat.title)}</span><span>${feat.camera && feat.camera !== 'Nessuna' ? 'Shot on ' + esc(feat.camera) : esc(feat.category)}</span></div>` : ''}
    ${sections}
    <div class="site-foot"><span>© ${new Date().getFullYear()} Alessandro Moruzzi</span><span>${esc(s.city || 'Roma')}</span></div></div>`;
}
function browser(inner, { mobile = false, tall = false, path = '' } = {}) {
  return `<div class="browser ${mobile ? 'mobile' : ''} ${tall ? 'tall' : ''}"><div class="browser-bar"><div class="lights"><i></i><i></i><i></i></div><div class="url">${ico('globe', 'xs')}alessandromoruzzi.com${path}</div><div style="width:42px"></div></div><div class="browser-body">${inner}</div></div>`;
}
function deviceSeg(id, mobile) {
  return `<div class="seg" id="${id}"><button data-dev="d" class="${mobile ? '' : 'on'}">${ico('desktop', 'sm')}Computer</button><button data-dev="m" class="${mobile ? 'on' : ''}">${ico('phone', 'sm')}Telefono</button></div>`;
}
function bindDevice(id, onChange) {
  $$(`#${id} [data-dev]`).forEach(b => b.onclick = () => { $$(`#${id} button`).forEach(x => x.classList.toggle('on', x === b)); onChange(b.dataset.dev === 'm'); });
}

/* ——— Grafici ——— */
function spark(values, color = 'var(--accent)') {
  const w = 96, h = 34, max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => [i / (values.length - 1) * w, h - 3 - (v - min) / (max - min || 1) * (h - 6)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const gid = 'sg' + Math.random().toString(36).slice(2, 7);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${w} ${h} L0 ${h} Z" fill="url(#${gid})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function delta(cur, prev, invert = false) {
  if (!prev) return '<span class="delta flat">—</span>';
  const p = (cur - prev) / prev * 100;
  const cls = Math.abs(p) < .5 ? 'flat' : (p > 0) !== invert ? 'up' : 'down';
  return `<span class="delta ${cls}">${p > 0 ? '↑' : p < 0 ? '↓' : ''} ${Math.abs(p).toFixed(1).replace('.', ',')}%</span>`;
}
function areaChart(el, rows, prevRows, { key = 'visitors', label = 'Visitatori', height = 260 } = {}) {
  const W = Math.max(320, el.clientWidth || 800), Hh = height, padL = 34, padB = 26, padT = 10;
  const vals = rows.map(r => r[key]), pv = (prevRows || []).map(r => r[key]);
  const maxRaw = Math.max(...vals, ...pv, 1);
  const step = Math.pow(10, Math.floor(Math.log10(maxRaw))) / (maxRaw / Math.pow(10, Math.floor(Math.log10(maxRaw))) < 2.5 ? 2 : 1);
  const max = Math.ceil(maxRaw * 1.08 / step) * step;
  const x = i => padL + i / (rows.length - 1) * (W - padL - 6);
  const y = v => padT + (1 - v / max) * (Hh - padT - padB);
  const smooth = arr => arr.map((v, i) => {
    if (!i) return `M${x(0)} ${y(v)}`;
    const x0 = x(i - 1), x1 = x(i), cx = (x0 + x1) / 2;
    return `C${cx} ${y(arr[i - 1])} ${cx} ${y(v)} ${x1} ${y(v)}`;
  }).join(' ');
  const line = smooth(vals);
  const ticks = []; for (let v = 0; v <= max; v += step) ticks.push(v);
  const every = Math.ceil(rows.length / (W < 600 ? 4 : 7));
  const fmtD = d => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${Hh}" height="${Hh}">
    <defs><linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(v => `<line class="grid-line" x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="0" y="${y(v) + 4}">${fmt(v)}</text>`).join('')}
    ${rows.map((r, i) => i % every === (rows.length - 1) % every ? `<text class="axis" x="${x(i)}" y="${Hh - 6}" text-anchor="middle">${fmtD(r.date)}</text>` : '').join('')}
    ${pv.length === vals.length ? `<path class="stroke prev" d="${smooth(pv)}"/>` : ''}
    <path class="area" d="${line} L${x(vals.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z"/>
    <path class="stroke" d="${line}" style="stroke-dasharray:4000;stroke-dashoffset:4000;animation:draw 1.4s var(--ease) forwards"/>
    <line class="cursor" id="cur" y1="${padT}" y2="${Hh - padB}" opacity="0"/>
    <circle class="dot" id="cdot" r="4.5" opacity="0"/>
  </svg><div class="chart-tip" id="ctip"></div>`;
  if (!document.getElementById('drawKF')) { const st = document.createElement('style'); st.id = 'drawKF'; st.textContent = '@keyframes draw{to{stroke-dashoffset:0}}'; document.head.append(st); }
  const svg = el.querySelector('svg'), cur = el.querySelector('#cur'), dot = el.querySelector('#cdot'), tip = el.querySelector('#ctip');
  const move = e => {
    const r = svg.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W;
    const i = clamp(Math.round((px - padL) / (W - padL - 6) * (rows.length - 1)), 0, rows.length - 1);
    const cx = x(i), cy = y(vals[i]);
    cur.setAttribute('x1', cx); cur.setAttribute('x2', cx); cur.setAttribute('opacity', 1);
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.setAttribute('opacity', 1);
    const d = rows[i].date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    tip.innerHTML = `<b style="text-transform:capitalize">${d}</b><div><span>${label}</span><span>${fmt(vals[i])}</span></div>${pv[i] != null ? `<div><span>Periodo prec.</span><span>${fmt(pv[i])}</span></div>` : ''}<div><span>Pagine viste</span><span>${fmt(rows[i].views)}</span></div>`;
    tip.classList.add('on');
    const left = cx / W * r.width;
    tip.style.left = clamp(left + 14, 0, r.width - 170) + 'px';
    if (left + 184 > r.width) tip.style.left = (left - 174) + 'px';
    tip.style.top = Math.max(0, cy / Hh * r.height - 70) + 'px';
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerleave', () => { tip.classList.remove('on'); cur.setAttribute('opacity', 0); dot.setAttribute('opacity', 0); });
}
function donut(parts, center, sub) {
  const colors = ['var(--ink)', 'var(--accent)', 'var(--faint)', 'var(--blue)', 'var(--green)'];
  const R = 52, C = 2 * Math.PI * R; let off = 0;
  const segs = parts.map(([, v], i) => { const len = v * C; const s = `<circle r="${R}" cx="66" cy="66" stroke="${colors[i]}" stroke-dasharray="${Math.max(0, len - 2.5)} ${C}" stroke-dashoffset="${-off}"/>`; off += len; return s; }).join('');
  return `<div class="donut-wrap"><div class="donut"><svg viewBox="0 0 132 132"><circle r="${R}" cx="66" cy="66" stroke="var(--line)"/>${segs}</svg><div class="c"><div><b>${center}</b><small>${sub}</small></div></div></div><div class="keys">${parts.map(([k, v], i) => `<div><i style="background:${colors[i]}"></i>${k}<b>${Math.round(v * 100)}%</b></div>`).join('')}</div></div>`;
}
