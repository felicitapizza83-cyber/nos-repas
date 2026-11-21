/* Navigation par onglets : #/accueil, #/objectif, #/repas, #/menu, #/courses, #/budget */
App.router = {
  routes: ['accueil', 'objectif', 'repas', 'menu', 'courses', 'budget', 'suivi', 'fourche', 'ingredients', 'stock'],
  /** Écrans secondaires : onglet à surligner et retour. */
  parents: { suivi: 'accueil', fourche: 'courses', ingredients: 'budget', stock: 'courses' },
  current() {
    const r = location.hash.replace(/^#\/?/, '').split('?')[0];
    return App.router.routes.includes(r) ? r : 'accueil';
  },
  go(route) { location.hash = '#/' + route; },
  render(keepScroll) {
    const route = App.router.current();
    const view = App.views[route];
    const el = document.getElementById('view');
    const y = window.scrollY;
    document.getElementById('title').textContent = view.title;
    const parent = App.router.parents[route];
    const back = document.getElementById('back');
    back.hidden = !parent;
    if (parent) back.href = '#/' + parent;
    el.innerHTML = view.render(App.store.state);
    el.onclick = el.onchange = el.onsubmit = el.oninput = null;
    if (view.mount) view.mount(el, App.store.state);
    document.querySelectorAll('.tabbar a').forEach(a =>
      a.classList.toggle('active', a.dataset.route === (parent || route)));
    window.scrollTo(0, keepScroll ? y : 0);
  },
  init() {
    window.addEventListener('hashchange', () => { App.ui.closeSheet(true); App.router.render(false); });
    App.store.subscribe(() => App.router.render(true));
    App.router.render(false);
  }
};
