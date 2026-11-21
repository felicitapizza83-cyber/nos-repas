/* Démarrage de l'application. */
document.addEventListener('DOMContentLoaded', () => {
  App.apparence.init();
  App.store.init();
  App.router.init();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) App.store.rafraichir(); });

  // Le mode hors-ligne (service worker) ne fonctionne qu'une fois l'app hébergée en https.
  // Version 1 conservée : pas de service worker propre (celui de la V2 couvre aussi ce dossier).
});
