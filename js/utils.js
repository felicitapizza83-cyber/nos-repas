/* Outils communs : échappement HTML, dates, format, feuilles modales, toasts. */
window.App = window.App || {};
App.views = {};

App.JOURS = [
  { id: 'lun', nom: 'Lundi' }, { id: 'mar', nom: 'Mardi' }, { id: 'mer', nom: 'Mercredi' },
  { id: 'jeu', nom: 'Jeudi' }, { id: 'ven', nom: 'Vendredi' }, { id: 'sam', nom: 'Samedi' },
  { id: 'dim', nom: 'Dimanche' }
];
App.MOMENTS = [{ id: 'midi', nom: 'Midi' }, { id: 'soir', nom: 'Soir' }];
App.MOMENTS_BEBE = [
  { id: 'bebe-midi', nom: 'Midi', type: 'legumes' },
  { id: 'bebe-gouter', nom: 'Goûter', type: 'fruit' },
  { id: 'bebe-soir', nom: 'Soir', type: 'legumes' }
];

App.u = {
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
  norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); },
  euro(n) {
    return (Number(n) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  },
  num(v) {
    if (v === '' || v == null) return null;
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
  },

  // ----- Dates (une semaine = clé « AAAA-MM-JJ » du lundi) -----
  key(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  },
  parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); },
  mondayOf(date = new Date()) {
    const x = new Date(date); x.setHours(12, 0, 0, 0);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return App.u.key(x);
  },
  addWeeks(k, n) { const d = App.u.parseKey(k); d.setDate(d.getDate() + 7 * n); return App.u.key(d); },
  weekLabel(k) {
    const a = App.u.parseKey(k), b = App.u.parseKey(k); b.setDate(b.getDate() + 6);
    const f = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `du ${f(a)} au ${f(b)}`;
  },
  dayDate(k, i) {
    const d = App.u.parseKey(k); d.setDate(d.getDate() + i);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  },
  /** Mois d'une semaine (celui de son jeudi, comme le calendrier ISO) : « AAAA-MM ». */
  moisDeSemaine(k) { const d = App.u.parseKey(k); d.setDate(d.getDate() + 3); return App.u.key(d).slice(0, 7); },
  moisCourant() { return App.u.moisDeSemaine(App.u.mondayOf()); },
  semainesDuMois(m) {
    const [y, mo] = m.split('-').map(Number);
    let k = App.u.mondayOf(new Date(y, mo - 1, 1, 12));
    const res = [];
    for (let i = 0; i < 6; i++, k = App.u.addWeeks(k, 1)) if (App.u.moisDeSemaine(k) === m) res.push(k);
    return res;
  },
  moisLabel(m) {
    const [y, mo] = m.split('-').map(Number);
    return new Date(y, mo - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  },
  addMois(m, n) {
    const [y, mo] = m.split('-').map(Number);
    const d = new Date(y, mo - 1 + n, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },
  todayIndex() { return (new Date().getDay() + 6) % 7; },
  isCurrentWeek(k) { return k === App.u.mondayOf(); },

  // ----- Quantités -----
  qte(q, unite) {
    if (q == null) return '';
    if (unite === 'g') return q >= 1000 ? `${+(q / 1000).toFixed(2)} kg` : `${Math.round(q / 5) * 5 || Math.round(q)} g`;
    if (unite === 'ml') return q >= 1000 ? `${+(q / 1000).toFixed(2)} L` : `${Math.round(q / 5) * 5 || Math.round(q)} ml`;
    const n = Math.ceil(q - 1e-9);
    if (unite === 'pc') return `× ${n}`;
    if (unite === 'boîte') return `${n} boîte${n > 1 ? 's' : ''}`;
    if (unite === 'gousse') return `${n} gousse${n > 1 ? 's' : ''}`;
    if (unite === 'botte') return `${n} botte${n > 1 ? 's' : ''}`;
    if (unite === 'pot') return '';
    return `${n} ${unite}`;
  }
};

/* ----- Feuilles modales (style iOS), toasts, retour tactile ----- */
App.ui = {
  /** Petit retour tactile : vibration (Android) ou « tic » d'interrupteur iOS (Safari 18+). */
  haptique() {
    try {
      if (navigator.vibrate) { navigator.vibrate(12); return; }
      let l = document.getElementById('haptique');
      if (!l) {
        l = document.createElement('label');
        l.id = 'haptique';
        l.style.cssText = 'position:fixed;left:-99px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
        l.innerHTML = '<input type="checkbox" switch tabindex="-1" aria-hidden="true">';
        document.body.appendChild(l);
      }
      l.click();
    } catch (e) { /* pas de retour tactile */ }
  },

  /** État vide illustré : grande icône dans un cercle doux, titre, texte et bouton. */
  vide(icone, titre, texte, bouton = '') {
    return `<section class="vide-illus">
      <div class="vide-cercle"><span>${icone}</span></div>
      <h3>${titre}</h3>${texte ? `<p class="muted">${texte}</p>` : ''}${bouton}
    </section>`;
  },

  sheet(html, handler) {
    App.ui.closeSheet(true);
    const ov = document.createElement('div');
    ov.className = 'sheet-overlay';
    ov.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-grip"></div>${html}</div>`;
    document.body.appendChild(ov);
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => ov.classList.add('open'));
    ov.addEventListener('click', e => {
      if (e.target === ov) return App.ui.closeSheet();
      const a = e.target.closest('[data-action]');
      if (a && handler) handler(a.dataset.action, a, ov, e);
    });
    ov.addEventListener('submit', e => {
      e.preventDefault();
      if (handler) handler(e.target.dataset.action || 'submit', e.target, ov, e);
    });
    ov.addEventListener('input', e => {
      if (handler && e.target.dataset.live) handler(e.target.dataset.live, e.target, ov, e);
    });
    return ov;
  },
  closeSheet(immediate) {
    document.querySelectorAll('.sheet-overlay').forEach(ov => {
      if (immediate) return ov.remove();
      ov.classList.remove('open');
      setTimeout(() => ov.remove(), 220);
    });
    document.body.classList.remove('no-scroll');
  },
  toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
  },
  confirmSheet(message, labelOk, onOk) {
    App.ui.sheet(`
      <p class="sheet-text">${App.u.esc(message)}</p>
      <div class="sheet-actions">
        <button class="btn" data-action="cancel">Annuler</button>
        <button class="btn btn-danger" data-action="ok">${App.u.esc(labelOk)}</button>
      </div>`, (action) => {
      if (action === 'ok') onOk();
      App.ui.closeSheet();
    });
  }
};
