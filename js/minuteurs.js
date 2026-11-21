/* Minuteurs : accessibles partout (menu ☰ › Minuteurs, ou depuis le mode cuisine).
   Ils continuent de tourner quand on change d'écran ; le plus proche s'affiche dans l'en-tête.
   Gardés sur ce téléphone seulement (pas dans les données du foyer). */
App.minuteurs = {
  KEY: 'nos-repas-minuteurs',
  PRESETS: [1, 3, 5, 8, 10, 15, 20, 30, 45, 60],
  liste: [],
  tick: null,
  ctx: null,

  charger() {
    try { App.minuteurs.liste = JSON.parse(localStorage.getItem(App.minuteurs.KEY)) || []; }
    catch (e) { App.minuteurs.liste = []; }
  },
  sauver() {
    try { localStorage.setItem(App.minuteurs.KEY, JSON.stringify(App.minuteurs.liste)); } catch (e) { /* */ }
  },

  init() {
    App.minuteurs.charger();
    document.getElementById('btn-minuteur').onclick = () => App.minuteurs.ouvrir();
    App.minuteurs.demarrer();
  },

  demarrer() {
    if (!App.minuteurs.tick) App.minuteurs.tick = setInterval(App.minuteurs.maj, 1000);
    App.minuteurs.maj();
  },

  /** Débloque le son sur iPhone : il faut créer le contexte audio pendant un geste de l'utilisateur. */
  debloquerSon() {
    try {
      if (!App.minuteurs.ctx) App.minuteurs.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (App.minuteurs.ctx.state === 'suspended') App.minuteurs.ctx.resume();
    } catch (e) { /* son indisponible */ }
  },

  lancer(label, sec) {
    App.minuteurs.debloquerSon();
    App.minuteurs.liste.push({ id: App.u.uid(), label: label || 'Minuteur', fin: Date.now() + sec * 1000, duree: sec, fini: false });
    App.minuteurs.sauver();
    App.ui.haptique();
    App.minuteurs.demarrer();
  },
  arreter(id) {
    App.minuteurs.liste = App.minuteurs.liste.filter(t => t.id !== id);
    App.minuteurs.sauver();
    App.minuteurs.maj();
  },
  ajouter(id, sec) {
    const t = App.minuteurs.liste.find(x => x.id === id);
    if (!t) return;
    t.fin = Math.max(Date.now(), t.fin) + sec * 1000; t.fini = false;
    App.minuteurs.sauver(); App.minuteurs.maj();
  },

  restant(t) { return Math.max(0, Math.round((t.fin - Date.now()) / 1000)); },
  format(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`;
  },

  maj() {
    const L = App.minuteurs.liste;
    let change = false;
    L.forEach(t => { if (!t.fini && Date.now() >= t.fin) { t.fini = true; change = true; App.minuteurs.sonner(t); } });
    if (change) App.minuteurs.sauver();
    // Pastille de l'en-tête
    const pill = document.getElementById('btn-minuteur');
    if (pill) {
      const fini = L.find(t => t.fini);
      const proche = L.filter(t => !t.fini).sort((a, b) => a.fin - b.fin)[0];
      pill.hidden = !L.length;
      pill.classList.toggle('fini', !!fini);
      pill.textContent = fini ? `⏰ ${fini.label}` : proche ? `⏱ ${App.minuteurs.format(App.minuteurs.restant(proche))}` : '';
    }
    // Feuille ouverte et mode cuisine
    document.querySelectorAll('[data-minuteurs]').forEach(z => { z.innerHTML = App.minuteurs.lignes(z.dataset.minuteurs !== 'cuisine'); });
    if (!L.length && App.minuteurs.tick) { clearInterval(App.minuteurs.tick); App.minuteurs.tick = null; }
  },

  sonner(t) {
    try {
      App.minuteurs.debloquerSon();
      const ctx = App.minuteurs.ctx;
      [0, 0.35, 0.7, 1.4, 1.75, 2.1].forEach(d => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.25, ctx.currentTime + d);
        o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.25);
      });
    } catch (e) { /* son indisponible */ }
    try { navigator.vibrate && navigator.vibrate([300, 150, 300, 150, 300]); } catch (e) { /* */ }
    App.ui.toast(`⏰ ${t.label} : c’est prêt !`);
  },

  lignes(messageVide = true) {
    const { esc } = App.u;
    if (!App.minuteurs.liste.length) return messageVide ? '<p class="muted small center">Aucun minuteur en cours.</p>' : '';
    return App.minuteurs.liste.map(t => {
      const s = App.minuteurs.restant(t);
      const pct = t.duree ? Math.min(100, (1 - s / t.duree) * 100) : 0;
      return `<div class="timer ${t.fini ? 'fini' : ''}" style="--pct:${pct.toFixed(1)}%">
        <span class="grow">⏱ ${esc(t.label)}</span>
        <strong>${t.fini ? 'Terminé !' : App.minuteurs.format(s)}</strong>
        ${t.fini ? '' : `<button class="icon-btn small" data-action="m" data-c="m" data-m="plus1" data-id="${t.id}" aria-label="Une minute de plus">+1</button>`}
        <button class="icon-btn small" data-action="m" data-c="m" data-m="stop" data-id="${t.id}" aria-label="Arrêter">✕</button>
      </div>`;
    }).join('');
  },

  /** Gère les boutons des lignes de minuteurs (feuille et mode cuisine). */
  clic(a) {
    if (a.dataset.m === 'stop') App.minuteurs.arreter(a.dataset.id);
    if (a.dataset.m === 'plus1') App.minuteurs.ajouter(a.dataset.id, 60);
  },

  ouvrir() {
    App.ui.sheet(`
      <h2>⏱ Minuteurs</h2>
      <div class="timers" data-minuteurs>${App.minuteurs.lignes()}</div>
      <h3>Lancer un minuteur</h3>
      <div class="presets">${App.minuteurs.PRESETS.map(m =>
        `<button class="preset" data-action="preset" data-min="${m}">${m < 60 ? `${m}<small>min</small>` : '1<small>h</small>'}</button>`).join('')}</div>
      <form class="row" data-action="perso" style="margin-top:12px">
        <label class="grow">Nom<input name="label" placeholder="Pâtes, four, gâteau…" autocomplete="off"/></label>
        <label style="width:5.5rem">Minutes<input name="min" inputmode="decimal" placeholder="12"/></label>
        <button class="btn btn-primary" type="submit">Lancer</button>
      </form>
      <small class="muted">Les minuteurs continuent quand vous changez d’écran. Sur iPhone, gardez l’app ouverte pour entendre la sonnerie.</small>`,
    (action, target) => {
      if (target.dataset.m) return App.minuteurs.clic(target);
      if (action === 'preset') App.minuteurs.lancer(`${target.dataset.min} min`, +target.dataset.min * 60);
      if (action === 'perso') {
        const min = App.u.num(target.min.value);
        if (!min) return App.ui.toast('Indiquez un nombre de minutes');
        App.minuteurs.lancer(target.label.value.trim() || `${min} min`, Math.round(min * 60));
        target.reset();
      }
    });
  }
};
