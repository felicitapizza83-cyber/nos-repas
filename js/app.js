/* Démarrage de l'application. */
document.addEventListener('DOMContentLoaded', () => {
  try {
    App.apparence.init();
    App.store.init();
    App.router.init();
    App.minuteurs.init();
    App.drawer.init();
    App.sync.init(); // en arrière-plan : l'app reste utilisable sans réseau
  } catch (err) {
    // Jamais de page blanche : on explique et on propose de recharger.
    console.error(err);
    document.getElementById('view').innerHTML = `
      <section class="vide-illus">
        <div class="vide-cercle"><span>🫣</span></div>
        <h3>L’app n’a pas pu démarrer</h3>
        <p class="muted">Vos données sont intactes. Rechargez ; si cela recommence, notez-le dans Aide & support.</p>
        <button class="btn btn-primary" style="margin-top:12px" onclick="location.reload()">Recharger</button>
        <small class="muted erreur-detail">${String(err && err.message || err).replace(/</g, '&lt;')}</small>
      </section>`;
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { App.store.rafraichir(); App.minuteurs.maj(); }
  });

  // Le mode hors-ligne (service worker) ne fonctionne qu'une fois l'app hébergée en https.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
