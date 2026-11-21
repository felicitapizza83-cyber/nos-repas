/* Navigation : 5 onglets (accueil, menu, recettes, courses, budget) + écrans ouverts depuis le menu ☰. */
App.router = {
  routes: ['accueil', 'objectif', 'repas', 'menu', 'courses', 'budget', 'suivi', 'fourche', 'ingredients', 'stock', 'reglages', 'aide'],
  /** Écrans secondaires : onglet à surligner et retour. */
  parents: { objectif: 'menu', suivi: 'accueil', fourche: 'courses', ingredients: 'budget', stock: 'courses', reglages: 'accueil', aide: 'accueil' },
  current() {
    const r = location.hash.replace(/^#\/?/, '').split('?')[0];
    return App.router.routes.includes(r) ? r : 'accueil';
  },
  go(route) { location.hash = '#/' + route; },

  render(keepScroll, entree = false) {
    const route = App.router.current();
    const view = App.views[route];
    const el = document.getElementById('view');
    const y = window.scrollY;
    document.getElementById('title').textContent = view.title;
    const parent = App.router.parents[route];
    const back = document.getElementById('back');
    back.hidden = !parent;
    if (parent) back.href = '#/' + parent;
    try {
      el.innerHTML = view.render(App.store.state);
      el.onclick = el.onchange = el.onsubmit = el.oninput = null;
      if (view.mount) view.mount(el, App.store.state);
    } catch (err) {
      App.router.erreur(el, err);
    }
    // Bouton d'action de l'écran, en haut à droite (partager, ajouter…)
    const act = document.getElementById('topbar-action');
    act.innerHTML = view.tete ? view.tete(App.store.state) : '';
    act.onclick = e => {
      const a = e.target.closest('[data-action]');
      if (a && view.teteClic) view.teteClic(a.dataset.action, a);
    };
    el.classList.toggle('entree', entree);
    document.querySelectorAll('.tabbar a').forEach(a =>
      a.classList.toggle('active', a.dataset.route === (parent || route)));
    window.scrollTo(0, keepScroll ? y : 0);
  },

  /** Au lieu d'une page blanche : un message et un bouton pour recharger. */
  erreur(el, err) {
    console.error(err);
    el.innerHTML = App.ui.vide('🫣', 'Oups, cet écran n’a pas pu s’afficher',
      'Vos données sont intactes. Rechargez l’app ; si cela recommence, notez-le dans Aide & support.',
      `<button class="btn btn-primary" style="margin-top:12px" onclick="location.reload()">Recharger</button>
       <small class="muted erreur-detail">${App.u.esc(err && err.message || err)}</small>`);
  },

  init() {
    window.addEventListener('hashchange', () => {
      App.ui.closeSheet(true);
      if (App.drawer) App.drawer.fermer();
      const go = () => App.router.render(false, true);
      if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(go);
      else go();
    });
    App.store.subscribe(() => App.router.render(true));
    App.router.render(false, true);
  }
};
