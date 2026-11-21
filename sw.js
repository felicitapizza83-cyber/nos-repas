/* Service worker : garde l'app disponible hors-ligne (une fois hébergée en https).
   Changer VERSION à chaque mise à jour pour que les téléphones récupèrent les nouveaux fichiers. */
const VERSION = 'nos-repas-v10';
const FICHIERS = [
  './', 'index.html', 'manifest.webmanifest',
  'css/base.css', 'css/components.css',
  'data/ingredients.js', 'data/repas.js', 'data/objectifs.js', 'data/images.js',
  'images/banana-bread.jpg', 'images/boeuf-riz.jpg', 'images/boulettes.jpg', 'images/brownie.jpg', 'images/carrot-cake.jpg', 'images/chili.jpg', 'images/clafoutis.jpg', 'images/cookies.jpg', 'images/crepes.jpg', 'images/crevettes.jpg', 'images/crumble.jpg', 'images/curry.jpg', 'images/fajitas.jpg', 'images/fondant.jpg', 'images/gateau-citron.jpg', 'images/gateau-pomme.jpg', 'images/gnocchi.jpg', 'images/lasagnes.jpg', 'images/legumes-four.jpg', 'images/lentilles.jpg', 'images/libanais.jpg', 'images/marche.jpg', 'images/muffins.jpg', 'images/omelette.jpg', 'images/paella.jpg', 'images/pates-viande.jpg', 'images/pates.jpg', 'images/poisson-legumes.jpg', 'images/poke.jpg', 'images/poulet.jpg', 'images/risotto.jpg', 'images/salade-pois-chiches.jpg', 'images/salade.jpg', 'images/saumon-riz.jpg', 'images/soupe.jpg', 'images/couscous.jpg', 'images/tajine.jpg', 'images/chakchouka.jpg', 'images/wok.jpg', 'images/pizza.jpg', 'images/burger.jpg', 'images/quiche.jpg', 'images/falafel.jpg', 'images/taboule.jpg', 'images/gratin.jpg', 'images/bowl.jpg',
  'js/utils.js', 'js/store.js', 'js/router.js', 'js/app.js',
  'js/domain/shopping.js', 'js/domain/budget.js', 'js/domain/suggestions.js', 'js/domain/suivi.js', 'js/domain/stock.js', 'js/domain/nutrition.js',
  'js/views/commun.js', 'js/views/accueil.js', 'js/views/objectif.js', 'js/views/repas.js',
  'js/views/menu.js', 'js/views/courses.js', 'js/views/budget.js',
  'js/views/suivi.js', 'js/views/fourche.js', 'js/views/ingredients.js', 'js/views/stock.js', 'js/views/cuisine.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Réseau d'abord (pour avoir la dernière version), cache si pas de connexion.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
