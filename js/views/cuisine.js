/* Mode cuisine : plein écran, une étape à la fois, écran toujours allumé, minuteurs.
   Les étapes viennent des notes de la recette (lignes « 1. … », « 2. … »). */
App.cuisine = {
  etat: null,

  etapes(r) {
    const lignes = String(r.notes || '').split('\n').map(l => l.trim()).filter(Boolean);
    const num = /^\d+[.)]\s*/;
    const intro = [], etapes = [], astuces = [];
    lignes.forEach(l => {
      if (num.test(l)) etapes.push(l.replace(num, ''));
      else if (!etapes.length) intro.push(l);
      else astuces.push(l);
    });
    if (!etapes.length && intro.length) return { intro: [], etapes: intro, astuces };
    if (!etapes.length) etapes.push('Préparez la recette comme d’habitude' + (r.cookidoo ? ' (ou suivez-la dans Cookidoo).' : '.'));
    return { intro, etapes, astuces };
  },

  /** « 40 à 45 min », « 1 h », « 35 min » → minuteurs proposés (on ignore les secondes du Thermomix). */
  minuteurs(texte) {
    const res = [];
    const re = /(\d+)\s*(?:à\s*(\d+)\s*)?(min|h)\b/g;
    let m;
    while ((m = re.exec(texte))) {
      const n = +m[1], u = m[3];
      const sec = u === 'h' ? n * 3600 : n * 60;
      if (sec >= 60) res.push({ sec, label: `${n}${m[2] ? `–${m[2]}` : ''} ${u}` });
    }
    return res;
  },

  ouvrir(repasId) {
    const r = App.store.repas(repasId);
    if (!r) return;
    App.ui.closeSheet(true);
    const douceur = r.categorie === 'Douceurs';
    const portions = douceur ? r.portions : App.store.state.settings.portions;
    const { intro, etapes, astuces } = App.cuisine.etapes(r);
    App.cuisine.etat = { r, portions, intro, etapes, astuces, i: 0, timers: [], coches: new Set(), tick: null, lock: null };

    const el = document.createElement('div');
    el.className = 'cuisine';
    document.body.appendChild(el);
    document.body.classList.add('no-scroll');
    App.cuisine.el = el;
    App.cuisine.verrouEcran();
    document.addEventListener('visibilitychange', App.cuisine.verrouEcran);

    el.addEventListener('click', App.cuisine.onClick);
    let x0 = null;
    el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', e => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 70) App.cuisine.aller(dx < 0 ? 1 : -1);
    });
    App.cuisine.etat.tick = setInterval(App.cuisine.majTimers, 1000);
    App.cuisine.dessiner();
  },

  async verrouEcran() {
    const E = App.cuisine.etat;
    if (!E || document.hidden) return;
    try { if ('wakeLock' in navigator) E.lock = await navigator.wakeLock.request('screen'); } catch (e) { /* non disponible */ }
  },

  fermer() {
    const E = App.cuisine.etat;
    if (!E) return;
    clearInterval(E.tick);
    try { E.lock && E.lock.release(); } catch (e) { /* déjà libéré */ }
    document.removeEventListener('visibilitychange', App.cuisine.verrouEcran);
    App.cuisine.el.remove();
    document.body.classList.remove('no-scroll');
    App.cuisine.etat = null;
  },

  total() { const E = App.cuisine.etat; return E.etapes.length + 2; }, // ingrédients + étapes + fin

  aller(d) {
    const E = App.cuisine.etat;
    E.i = Math.max(0, Math.min(App.cuisine.total() - 1, E.i + d));
    App.cuisine.dessiner();
  },

  dessiner() {
    const E = App.cuisine.etat, { esc, qte } = App.u;
    const n = App.cuisine.total();
    let corps;
    if (E.i === 0) {
      const f = E.portions / (E.r.portions || 2);
      corps = `
        <h2>Ingrédients</h2>
        <div class="portions">
          <button class="icon-btn" data-c="moins" aria-label="Moins">−</button>
          <strong>${E.portions} ${E.r.categorie === 'Douceurs' ? 'parts' : 'portions'}</strong>
          <button class="icon-btn" data-c="plus" aria-label="Plus">+</button>
        </div>
        ${E.intro.length ? `<p class="cuisine-intro">${E.intro.map(esc).join('<br>')}</p>` : ''}
        <ul class="cuisine-ings">${E.r.ingredients.map(([id, q]) => {
          const ing = App.store.ingredient(id) || { nom: id, unite: '' };
          return `<li class="${E.coches.has(id) ? 'done' : ''}" data-c="coche" data-id="${id}">
            <span class="box">${E.coches.has(id) ? '✓' : ''}</span>
            <span class="grow">${esc(ing.nom)}</span>
            <span class="muted">${q == null ? 'un peu' : qte(q * f, ing.unite)}</span></li>`;
        }).join('')}</ul>`;
    } else if (E.i <= E.etapes.length) {
      const t = E.etapes[E.i - 1];
      const mins = App.cuisine.minuteurs(t);
      corps = `
        <small class="muted">Étape ${E.i} sur ${E.etapes.length}</small>
        <p class="cuisine-etape">${esc(t)}</p>
        ${mins.map(m => `<button class="btn btn-timer" data-c="timer" data-sec="${m.sec}" data-label="${esc(m.label)}">⏱ Lancer ${esc(m.label)}</button>`).join('')}`;
    } else {
      corps = `
        <h2>Bon appétit ! 🍽️</h2>
        ${E.astuces.length ? `<p class="cuisine-intro">${E.astuces.map(esc).join('<br>')}</p>` : ''}
        <button class="btn btn-primary block" data-c="cuisine">✓ C’est cuisiné (mettre à jour le garde-manger)</button>
        <h3>Alors, c’était comment ?</h3>
        <div class="avis">
          ${[['adore', '😍 On adore'], ['refaire', '👍 À refaire'], ['bof', '😐 Bof']].map(([v, l]) =>
            `<button class="chip chip-btn ${E.r.avis === v ? 'on' : ''}" data-c="avis" data-v="${v}">${l}</button>`).join('')}
        </div>`;
    }
    App.cuisine.el.innerHTML = `
      <header class="cuisine-top">
        <button class="icon-btn" data-c="fermer" aria-label="Fermer">✕</button>
        <strong class="grow">${esc(E.r.nom)}</strong>
      </header>
      <div class="cuisine-dots">${Array.from({ length: n }, (_, j) => `<span class="${j === E.i ? 'on' : j < E.i ? 'vu' : ''}"></span>`).join('')}</div>
      <div class="cuisine-timers"></div>
      <main class="cuisine-corps">${corps}</main>
      <footer class="cuisine-nav">
        <button class="btn" data-c="prec" ${E.i === 0 ? 'disabled' : ''}>‹ Précédent</button>
        <button class="btn btn-primary" data-c="suiv" ${E.i === n - 1 ? 'disabled' : ''}>${E.i === 0 ? 'C’est parti ›' : 'Suivant ›'}</button>
      </footer>`;
    App.cuisine.majTimers();
  },

  majTimers() {
    const E = App.cuisine.etat;
    if (!E) return;
    const now = Date.now();
    E.timers.forEach(t => {
      if (!t.fini && now >= t.fin) { t.fini = true; App.cuisine.sonner(t); }
    });
    const zone = App.cuisine.el.querySelector('.cuisine-timers');
    zone.innerHTML = E.timers.map((t, j) => {
      const s = Math.max(0, Math.round((t.fin - now) / 1000));
      const txt = t.fini ? 'Terminé !' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      return `<div class="timer ${t.fini ? 'fini' : ''}"><span>⏱ ${App.u.esc(t.label)}</span><strong>${txt}</strong>
        <button class="icon-btn small" data-c="stop" data-j="${j}" aria-label="Arrêter">✕</button></div>`;
    }).join('');
  },

  sonner(t) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35, 0.7].forEach(d => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.25, ctx.currentTime + d);
        o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.25);
      });
    } catch (e) { /* son indisponible */ }
    try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) { /* */ }
    App.ui.toast(`⏱ ${t.label} : c’est prêt !`);
  },

  onClick(e) {
    const a = e.target.closest('[data-c]');
    if (!a) return;
    const E = App.cuisine.etat, c = a.dataset.c;
    if (c === 'fermer') return App.cuisine.fermer();
    if (c === 'prec') return App.cuisine.aller(-1);
    if (c === 'suiv') return App.cuisine.aller(1);
    if (c === 'plus' || c === 'moins') { E.portions = Math.max(1, E.portions + (c === 'plus' ? 1 : -1)); return App.cuisine.dessiner(); }
    if (c === 'coche') { const id = a.dataset.id; E.coches.has(id) ? E.coches.delete(id) : E.coches.add(id); return App.cuisine.dessiner(); }
    if (c === 'timer') {
      E.timers.push({ label: a.dataset.label, fin: Date.now() + (+a.dataset.sec) * 1000, fini: false });
      return App.cuisine.majTimers();
    }
    if (c === 'stop') { E.timers.splice(+a.dataset.j, 1); return App.cuisine.majTimers(); }
    if (c === 'avis') {
      const v = a.dataset.v;
      App.store.update(() => { const r = App.store.repas(E.r.id); r.avis = r.avis === v ? null : v; });
      E.r = App.store.repas(E.r.id);
      return App.cuisine.dessiner();
    }
    if (c === 'cuisine') {
      let auMenu = false;
      App.store.update(s => { auMenu = App.stock.marquerCuisine(s, E.r.id); });
      App.ui.toast(auMenu ? 'Garde-manger mis à jour ✓' : 'Ingrédients retirés du garde-manger ✓');
      a.disabled = true; a.textContent = '✓ Garde-manger mis à jour';
    }
  }
};
