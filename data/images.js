/* Photos des repas (Unsplash, licence libre — voir images/CREDITS.md).
   1) photo choisie pour un repas précis ; 2) sinon mot-clé dans le nom ; 3) sinon photo de la catégorie. */
window.APP_DATA = window.APP_DATA || {};

APP_DATA.images = {
  parRepas: {
    'riz-chakchouka-poulet': 'poulet', 'saumon-puree-hv': 'poisson-legumes', 'lentilles-poulet-salade': 'lentilles',
    'riz-algerienne-poulet': 'poulet', 'omelette-epinards-salade': 'omelette', 'tortilla-tarte': 'omelette',
    'libanais': 'libanais', 'tajine-boulettes': 'boulettes', 'paella': 'paella', 'soupe-tortellini': 'soupe',
    'gnocchi-gorgonzola': 'gnocchi', 'chili-crevettes': 'chili', 'poke-teriyaki': 'poke',
    'omelette-legumes-four': 'omelette', 'loubia': 'chili', 'poulet-hv-pdt': 'poulet', 'poulet-tikka': 'curry',
    'boeuf-lok-lak': 'boeuf-riz', 'chili-con-carne': 'chili', 'fajitas': 'fajitas',
    'boulettes-lentilles-legumes': 'boulettes', 'riz-legumes-omelette': 'omelette',
    'omelette-legumes-tomate-mozza': 'omelette', 'soupe-tartines': 'soupe',
    'risotto-legumes': 'risotto', 'risotto-legumes-maquereau': 'risotto', 'risotto-champignons-poulet': 'risotto',
    'bavette-risotto': 'risotto', 'rigatoni-crevettes-epinards': 'crevettes', 'linguine-truite-epinards': 'crevettes',
    'pates-crevettes-courgettes': 'crevettes', 'pates-bolognaise': 'pates-viande', 'lasagnes': 'lasagnes',
    'saumon-legumes-four': 'poisson-legumes', 'saumon-ratatouille-riz': 'saumon-riz', 'lieu-legumes-four': 'legumes-four',
    'salade-pois-chiches': 'salade-pois-chiches', 'salade-haricots-blancs': 'salade-pois-chiches',
    'lentilles-salade-crevettes': 'lentilles', 'crepes': 'crepes',
    'banana-bread-avoine': 'banana-bread', 'gateau-pomme-amande': 'gateau-pomme', 'fondant-chocolat-dattes': 'fondant',
    'carrot-cake-healthy': 'carrot-cake', 'brownie-haricots': 'brownie', 'gateau-yaourt-citron': 'gateau-citron',
    'clafoutis-fruits-rouges': 'clafoutis', 'cookies-avoine-banane': 'cookies', 'crumble-pomme-poire': 'crumble',
    'muffins-avoine-fruits-rouges': 'muffins',
    // Bibliothèque enrichie
    'couscous-poulet-legumes': 'couscous', 'tajine-poulet-citron-olives': 'tajine', 'tajine-kefta-oeufs': 'boulettes',
    'chakchouka-oeufs': 'chakchouka', 'harira': 'soupe', 'dahl-lentilles-corail': 'curry',
    'curry-pois-chiches-epinards': 'curry', 'chili-sin-carne': 'chili', 'hachis-parmentier-patate-douce': 'gratin',
    'gratin-chou-fleur-dinde': 'gratin', 'tarte-poireaux-chevre': 'quiche', 'poulet-coco-patate-douce': 'curry',
    'wok-poulet-nouilles': 'wok', 'riz-cantonais-crevettes': 'wok', 'dinde-moutarde-haricots': 'poulet',
    'blanquette-poulet-legere': 'poulet', 'boeuf-carottes': 'boulettes', 'ratatouille-quinoa-feta': 'legumes-four',
    'falafels-pita': 'falafel', 'burger-maison-patate-douce': 'burger', 'pizza-maison-legumes': 'pizza',
    'wraps-poulet-crudites': 'fajitas', 'poulet-roti-legumes': 'poulet', 'dinde-champignons-puree': 'poulet',
    'kefta-boulgour': 'boulettes', 'tofu-saute-legumes': 'wok', 'mjadra': 'lentilles',
    'galettes-sarrasin-completes': 'omelette', 'veloute-butternut-lentilles': 'soupe', 'soupe-poireaux-pdt': 'soupe',
    'minestrone': 'soupe', 'soupe-thai-poulet-coco': 'soupe', 'cabillaud-brocoli-puree': 'poisson-legumes',
    'papillote-saumon-poireaux': 'saumon-riz', 'tajine-poisson-chermoula': 'tajine', 'curry-poisson-coco': 'curry',
    'brochettes-crevettes-quinoa': 'crevettes', 'saumon-lentilles': 'saumon-riz', 'pates-sicilienne-thon': 'pates',
    'one-pot-pasta-legumes': 'pates', 'pates-brocoli-ricotta': 'pates', 'risotto-butternut': 'risotto',
    'risotto-petits-pois-saumon': 'risotto', 'lasagnes-legumes-ricotta': 'lasagnes', 'pates-boulettes-dinde': 'pates-viande',
    'gnocchis-poeles-epinards': 'gnocchi', 'buddha-bowl-quinoa': 'bowl', 'salade-cesar-legere': 'salade',
    'taboule-boulgour-pois-chiches': 'taboule', 'salade-nicoise': 'salade', 'salade-lentilles-truite': 'lentilles'
  },
  motsCles: [
    ['couscous', 'couscous'], ['tajine', 'tajine'], ['chakchouka', 'chakchouka'], ['shakshuka', 'chakchouka'],
    ['wok', 'wok'], ['nouille', 'wok'], ['pizza', 'pizza'], ['burger', 'burger'], ['quiche', 'quiche'], ['tarte', 'quiche'],
    ['falafel', 'falafel'], ['taboule', 'taboule'], ['gratin', 'gratin'], ['bowl', 'bowl'],
    ['risotto', 'risotto'], ['lasagne', 'lasagnes'], ['bolognaise', 'pates-viande'], ['crevette', 'crevettes'],
    ['gnocchi', 'gnocchi'], ['paella', 'paella'], ['curry', 'curry'], ['tikka', 'curry'], ['chili', 'chili'],
    ['poke', 'poke'], ['fajita', 'fajitas'], ['taco', 'fajitas'], ['houmous', 'libanais'], ['omelette', 'omelette'],
    ['oeuf', 'omelette'], ['soupe', 'soupe'], ['veloute', 'soupe'], ['lentille', 'lentilles'], ['pois chiche', 'salade-pois-chiches'],
    ['boulette', 'boulettes'], ['saumon', 'saumon-riz'], ['poisson', 'poisson-legumes'], ['truite', 'poisson-legumes'],
    ['cabillaud', 'poisson-legumes'], ['boeuf', 'boeuf-riz'], ['steak', 'boeuf-riz'], ['poulet', 'poulet'],
    ['salade', 'salade'], ['pate', 'pates'], ['penne', 'pates'], ['spaghetti', 'pates'], ['brownie', 'brownie'],
    ['cookie', 'cookies'], ['muffin', 'muffins'], ['crumble', 'crumble'], ['crepe', 'crepes'], ['chocolat', 'fondant'],
    ['pomme', 'gateau-pomme'], ['citron', 'gateau-citron'], ['gateau', 'banana-bread'], ['cake', 'banana-bread'],
    ['legume', 'legumes-four']
  ],
  parCategorie: {
    'Bébé': 'soupe',
    'Plats': 'legumes-four', 'Pâtes & risottos': 'pates', 'Poisson': 'poisson-legumes',
    'Salades': 'salade', 'Douceurs': 'muffins'
  },
  accueil: 'marche'
};

// Photos générées sur mesure (images/recettes/<id>.jpg) : prioritaires.
APP_DATA.images.recettes = [
    'bavette-risotto', 'blanquette-poulet-legere', 'boeuf-carottes', 'galettes-sarrasin-completes',
    'hachis-parmentier-patate-douce', 'harira', 'kefta-boulgour', 'lentilles-salade-crevettes',
    'linguine-truite-epinards', 'loubia', 'pates-legumes-feta', 'pates-pesto-maquereau',
    'pates-poulet-champignons', 'pates-poulet-epinards', 'riz-algerienne-poulet', 'riz-legumes-omelette',
    'salade-gnocchis-legumes', 'salade-nicoise', 'salade-pates-thon-avocat', 'soupe-thai-poulet-coco',
    'tajine-kefta-oeufs', 'tortilla-tarte'
];

APP_DATA.imageBebe = function (r) {
  if (r.source === 'orchestra') return 'bebe-pot';
  if (r.moment === 'fruit') return 'bebe-compote';
  const n = String(r.nom).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /courgette|haricots verts|petits pois|brocoli|epinard|poireau/.test(n) ? 'bebe-puree-verte' : 'bebe-puree-orange';
};

APP_DATA.imageRepas = function (r) {
  const I = APP_DATA.images;
  if (r.categorie === 'Bébé') return `images/recettes/${APP_DATA.imageBebe(r)}.jpg`;
  if (I.recettes.includes(r.id)) return `images/recettes/${r.id}.jpg`;
  let nom = I.parRepas[r.id];
  if (!nom) {
    const n = String(r.nom).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const m = I.motsCles.find(([mot]) => n.includes(mot));
    nom = m ? m[1] : (I.parCategorie[r.categorie] || 'legumes-four');
  }
  return `images/${nom}.jpg`;
};
