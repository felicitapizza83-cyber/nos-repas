/* Apparence : couleur de l'app et mode (automatique, clair, sombre).
   Réglage propre à chaque téléphone (chacun choisit son style), gardé à part des données du foyer. */
App.apparence = {
  KEY: 'nos-repas-apparence',
  COULEURS: [
    { id: 'orange', nom: 'Orange', hex: '#ef7d16' },
    { id: 'sauge', nom: 'Sauge', hex: '#4f7a5a' },
    { id: 'framboise', nom: 'Framboise', hex: '#d2386a' },
    { id: 'ocean', nom: 'Océan', hex: '#1b7f93' },
    { id: 'lavande', nom: 'Lavande', hex: '#7657c6' },
    { id: 'moutarde', nom: 'Moutarde', hex: '#c99a06' }
  ],
  MODES: [
    { id: 'auto', nom: 'Auto', icone: '🌗' },
    { id: 'light', nom: 'Clair', icone: '☀️' },
    { id: 'dark', nom: 'Sombre', icone: '🌙' }
  ],

  lire() {
    try { return JSON.parse(localStorage.getItem(App.apparence.KEY)) || {}; } catch (e) { return {}; }
  },
  ecrire(p) {
    try { localStorage.setItem(App.apparence.KEY, JSON.stringify(p)); } catch (e) { /* stockage indisponible */ }
  },

  appliquer(p) {
    const h = document.documentElement;
    h.dataset.couleur = p.couleur || 'orange';
    if (p.mode === 'light' || p.mode === 'dark') h.dataset.theme = p.mode;
    else delete h.dataset.theme;
    // Couleur de la barre d'état (iPhone) assortie au fond
    requestAnimationFrame(() => {
      const meta = document.getElementById('meta-theme');
      if (meta) meta.content = getComputedStyle(document.body).backgroundColor;
    });
  },

  init() {
    const p = App.apparence.lire();
    App.apparence.appliquer(p);
    // Suivre le mode du téléphone en direct quand on est en « Auto »
    try {
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => App.apparence.appliquer(App.apparence.lire()));
    } catch (e) { /* ancien navigateur */ }
    document.getElementById('btn-apparence').onclick = () => App.apparence.ouvrir(false);
    if (!p.vu) setTimeout(() => App.apparence.ouvrir(true), 350);
  },

  ouvrir(bienvenue) {
    const p = { couleur: 'orange', mode: 'auto', ...App.apparence.lire(), vu: true };
    App.apparence.ecrire(p);
    const { esc } = App.u;
    const contenu = () => `
      <div class="apparence">
        ${bienvenue ? `
          <img class="apparence-logo" src="icons/icon-192.png" alt=""/>
          <h2>Bienvenue dans Nos repas</h2>
          <p class="intro">Menus de la semaine, courses, garde-manger et budget — en douceur.<br>Choisissez d’abord le style de votre app.</p>`
        : '<h2>Apparence</h2><p class="intro">Propre à ce téléphone : chacun peut choisir son style.</p>'}

        <h3>Couleur</h3>
        <div class="swatches">
          ${App.apparence.COULEURS.map(c => `
            <button class="swatch ${p.couleur === c.id ? 'on' : ''}" data-action="couleur" data-v="${c.id}">
              <i style="background:${c.hex}"></i>${esc(c.nom)}
            </button>`).join('')}
        </div>

        <h3>Affichage</h3>
        <div class="modes">
          ${App.apparence.MODES.map(m => `
            <button class="mode ${p.mode === m.id ? 'on' : ''}" data-action="mode" data-v="${m.id}"><span>${m.icone}</span>${m.nom}</button>`).join('')}
        </div>
        <small class="muted">Auto suit le réglage clair / sombre de votre iPhone.</small>

        <div class="apercu" aria-hidden="true">
          <div class="card hero" style="padding:14px 16px"><div class="question" style="font-size:1.15rem;margin:0">Qu’est-ce qui vous ferait plaisir ?</div></div>
          <div class="row" style="margin-bottom:10px">
            <span class="btn btn-primary" style="flex:1">Compléter le menu</span>
            <span class="chip chip-btn on">★ Favoris</span>
          </div>
          <div class="apercu-barre"><b class="on"></b><b></b><b></b><b></b><b></b></div>
        </div>

        <button class="btn btn-primary block" data-action="ok">${bienvenue ? 'C’est parti' : 'Terminé'}</button>
      </div>`;
    const ov = App.ui.sheet(contenu(), (action, target) => {
      if (action === 'couleur') p.couleur = target.dataset.v;
      else if (action === 'mode') p.mode = target.dataset.v;
      else if (action === 'ok') return App.ui.closeSheet();
      else return;
      App.apparence.ecrire(p);
      App.apparence.appliquer(p);
      const scroll = ov.querySelector('.sheet').scrollTop;
      ov.querySelector('.sheet').innerHTML = '<div class="sheet-grip"></div>' + contenu();
      ov.querySelector('.sheet').scrollTop = scroll;
    });
  }
};
