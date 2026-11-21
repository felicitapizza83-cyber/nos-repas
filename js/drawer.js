/* Menu ☰ (en haut à gauche) : outils, suivi, réglages, aide — tout ce qui n'a pas besoin d'un onglet. */
App.drawer = {

  init() {
    document.getElementById('btn-menu').onclick = () => App.drawer.ouvrir();
    document.querySelectorAll('[data-drawer]').forEach(b => { b.onclick = () => App.drawer.ouvrir(); });
    const el = document.getElementById('drawer');
    el.addEventListener('click', e => {
      if (e.target === el) return App.drawer.fermer();
      const a = e.target.closest('[data-d]');
      if (a) App.drawer.action(a.dataset.d, a);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') App.drawer.fermer(); });
  },

  contenu() {
    const st = App.store.state;
    const sem = App.store.semaine(App.u.mondayOf());
    const obj = App.suggest.objectif(sem);
    const suivi = st.settings.noms.some((_, i) => App.suivi.resume(st, i).aFaire);
    const vite = App.stock.aUtiliserVite(st).length;
    const F = App.shopping.fourcheMois(App.u.moisCourant(), st);
    const nbMin = App.minuteurs.liste.length;
    const item = (d, ic, nom, info = '', badge = '') => `
      <button class="d-item" data-d="${d}">
        <span class="d-ic">${ic}</span>
        <span class="grow"><strong>${nom}</strong>${info ? `<small>${info}</small>` : ''}</span>
        ${badge ? `<span class="d-badge">${badge}</span>` : ''}
      </button>`;
    return `
      <div class="drawer-panneau" role="dialog" aria-label="Menu">
        <div class="d-tete">
          <img src="icons/icon-192.png" alt=""/>
          <div class="grow"><strong>Nos repas</strong><small>${App.u.esc(st.settings.noms.join(' & '))} · 👶</small></div>
          <button class="rond" data-d="fermer" aria-label="Fermer">✕</button>
        </div>

        <div class="d-section">Outils</div>
        ${item('minuteurs', '⏱', 'Minuteurs', 'Plusieurs à la fois, même en changeant d’écran', nbMin ? nbMin : '')}
        ${item('convertir', '⚖️', 'Convertisseur', 'Cuillères, verres, grammes, four')}
        ${item('importer', '⤓', 'Importer une recette', 'Coller, photo, lien')}
        ${item('stock', '🥫', 'Garde-manger', 'Ce qu’on a déjà à la maison', vite ? '⏰' : '')}
        ${item('avec', '🍳', 'Avec ce que j’ai', 'Recettes faisables tout de suite')}

        <div class="d-section">Notre semaine</div>
        ${item('objectif', obj ? obj.emoji : '🌱', 'Objectif', obj ? App.u.esc(obj.nom) : 'À choisir')}
        ${item('suivi', '📏', 'Pesée & mensurations', 'Une fois par mois', suivi ? '!' : '')}
        ${item('fourche', '🌾', 'La Fourche', F.passee ? 'Commande du mois passée ✓' : 'Commande bio du mois')}
        ${item('ingredients', '🏷️', 'Ingrédients & prix', 'Prix, lieux d’achat')}

        <div class="d-section">L’app</div>
        ${item('sync', '🔄', 'Synchronisation', App.u.esc(App.sync.statut().txt), App.sync.user ? '' : (App.sync.etat === 'refuse' || App.sync.etat === 'erreur' ? '!' : ''))}
        ${item('reglages', '⚙️', 'Réglages', 'Famille, bébé, budget, sauvegarde')}
        ${item('apparence', '🎨', 'Apparence', 'Couleur, clair ou sombre')}
        ${item('aide', '💬', 'Aide & support', 'Questions fréquentes, nous écrire')}
        ${item('nouveautes', '✨', 'Quoi de neuf ?', 'Les dernières nouveautés')}
      </div>`;
  },

  ouvrir() {
    const el = document.getElementById('drawer');
    App.ui.closeSheet(true);
    el.innerHTML = App.drawer.contenu();
    el.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => el.classList.add('open'));
    App.ui.haptique();
  },

  fermer() {
    const el = document.getElementById('drawer');
    if (el.hidden) return;
    el.classList.remove('open');
    document.body.classList.remove('no-scroll');
    setTimeout(() => { el.hidden = true; }, 220);
  },

  action(d) {
    if (d === 'fermer') return App.drawer.fermer();
    App.drawer.fermer();
    const routes = { stock: 'stock', objectif: 'objectif', suivi: 'suivi', fourche: 'fourche', ingredients: 'ingredients', reglages: 'reglages', aide: 'aide' };
    if (routes[d]) return App.router.go(routes[d]);
    setTimeout(() => {
      if (d === 'minuteurs') App.minuteurs.ouvrir();
      else if (d === 'sync') App.sync.ouvrir();
      else if (d === 'convertir') App.drawer.convertisseur();
      else if (d === 'importer') App.importUI.ouvrir('coller');
      else if (d === 'apparence') App.apparence.ouvrir(false);
      else if (d === 'nouveautes') App.drawer.nouveautes();
      else if (d === 'avec') { App.views.repas.filtre.stock = true; App.router.go('repas'); }
    }, 180);
  },

  // ---------- Convertisseur ----------
  /** Grammes pour une cuillère à soupe (15 ml) de chaque produit. */
  PRODUITS: [
    { id: 'eau', nom: 'Eau, lait, bouillon', g: 15 },
    { id: 'farine', nom: 'Farine', g: 9 },
    { id: 'sucre', nom: 'Sucre', g: 13 },
    { id: 'beurre', nom: 'Beurre fondu', g: 14 },
    { id: 'huile', nom: 'Huile', g: 13.5 },
    { id: 'riz', nom: 'Riz cru', g: 13 },
    { id: 'avoine', nom: 'Flocons d’avoine', g: 6 },
    { id: 'cacao', nom: 'Cacao, poudre d’amande', g: 7 },
    { id: 'miel', nom: 'Miel, sirop d’érable', g: 21 },
    { id: 'creme', nom: 'Crème, yaourt', g: 15 }
  ],
  MESURES: [
    { id: 'cac', nom: 'cuillère à café', ml: 5 },
    { id: 'cas', nom: 'cuillère à soupe', ml: 15 },
    { id: 'verre', nom: 'verre (20 cl)', ml: 200 },
    { id: 'tasse', nom: 'tasse (25 cl)', ml: 250 }
  ],
  conv: { produit: 'farine', nb: 3, mesure: 'cas' },

  convertisseur() {
    const C = App.drawer.conv, { esc } = App.u;
    const resultat = () => {
      const p = App.drawer.PRODUITS.find(x => x.id === C.produit);
      const m = App.drawer.MESURES.find(x => x.id === C.mesure);
      const g = (App.u.num(C.nb) || 0) * m.ml / 15 * p.g;
      return `<div class="conv-res"><strong>≈ ${Math.round(g)} g</strong><small>${C.produit === 'eau' ? `soit ${Math.round((App.u.num(C.nb) || 0) * m.ml)} ml` : 'valeur moyenne'}</small></div>`;
    };
    const ov = App.ui.sheet(`
      <h2>⚖️ Convertisseur</h2>
      <h3>Mesures → grammes</h3>
      <div class="conv">
        <input name="nb" inputmode="decimal" value="${C.nb}" data-live="conv" aria-label="Quantité"/>
        <select name="mesure" data-live="conv">${App.drawer.MESURES.map(m => `<option value="${m.id}" ${m.id === C.mesure ? 'selected' : ''}>${m.nom}</option>`).join('')}</select>
      </div>
      <label>de<select name="produit" data-live="conv">${App.drawer.PRODUITS.map(p => `<option value="${p.id}" ${p.id === C.produit ? 'selected' : ''}>${esc(p.nom)}</option>`).join('')}</select></label>
      <div id="conv-res">${resultat()}</div>

      <h3>Four : thermostat ↔ °C</h3>
      <div class="four">${[[3, 90], [4, 120], [5, 150], [6, 180], [7, 210], [8, 240], [9, 270]].map(([t, c]) =>
        `<div><small>Th.</small><strong>${t}</strong><span>${c} °C</span></div>`).join('')}</div>
      <small class="muted">Four à chaleur tournante : baisser d’environ 20 °C.</small>

      <h3>Repères rapides</h3>
      <ul class="plain reperes-rapides">
        <li><span>1 œuf moyen</span><strong>≈ 50 g</strong></li>
        <li><span>1 gousse d’ail</span><strong>≈ 5 g</strong></li>
        <li><span>1 oignon moyen</span><strong>≈ 100 g</strong></li>
        <li><span>1 pincée de sel</span><strong>≈ 0,5 g</strong></li>
        <li><span>Pâtes ou riz cru, par adulte</span><strong>70 à 80 g</strong></li>
      </ul>`, (action, target, o) => {
      if (action !== 'conv') return;
      C[target.name] = target.value;
      o.querySelector('#conv-res').innerHTML = resultat();
    });
    return ov;
  },

  // ---------- Quoi de neuf ----------
  nouveautes() {
    App.ui.sheet(`
      <h2>✨ Quoi de neuf ?</h2>
      <ul class="nouveautes">
        <li><b>🏠 Accueil</b> Le repas du jour en grand, avec « Cuisiner » et ses points nutritionnels.</li>
        <li><b>☰ Menu</b> Minuteurs, convertisseur, garde-manger, aide et réglages, à portée de pouce.</li>
        <li><b>📊 Nutrition</b> Protéines, glucides, lipides et fibres pour chaque recette et chaque journée.</li>
        <li><b>💶 Budget</b> Un seul total partout ; « Compléter le menu » reste dans les 150 € ; bouton « Alléger » si besoin.</li>
        <li><b>🛒 Courses</b> Glisser une ligne pour la cocher, articles pris en bas, mode magasin (écran allumé).</li>
        <li><b>📅 Menu</b> Bandeau des jours, moins de boutons ; les réglages bébé passent dans Réglages.</li>
        <li><b>📖 Recettes</b> Grandes photos, recherche plus large, un seul bouton « + ».</li>
        <li><b>⚙️ Réglages</b> Tout au même endroit : famille, bébé, budget, sauvegarde.</li>
        <li><b>🔄 Synchronisation</b> Vos deux iPhone partagent menus, courses, envies, recettes et budget, en direct.</li>
      </ul>
      <button class="btn btn-primary block" data-action="ok">Super</button>`, a => { if (a === 'ok') App.ui.closeSheet(); });
  }
};
