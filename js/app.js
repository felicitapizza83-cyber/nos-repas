/* Démarrage de l'application. */
document.addEventListener('DOMContentLoaded', () => {
  App.store.init();
  App.router.init();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) App.store.rafraichir(); });

  // Le mode hors-ligne (service worker) ne fonctionne qu'une fois l'app hébergée en https.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
