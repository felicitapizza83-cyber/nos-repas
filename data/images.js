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
    'muffins-avoine-fruits-rouges': 'muffins'
  },
  motsCles: [
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
    'Plats': 'legumes-four', 'Pâtes & risottos': 'pates', 'Poisson': 'poisson-legumes',
    'Salades': 'salade', 'Douceurs': 'muffins'
  },
  accueil: 'marche'
};

APP_DATA.imageRepas = function (r) {
  const I = APP_DATA.images;
  let nom = I.parRepas[r.id];
  if (!nom) {
    const n = String(r.nom).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const m = I.motsCles.find(([mot]) => n.includes(mot));
    nom = m ? m[1] : (I.parCategorie[r.categorie] || 'legumes-four');
  }
  return `images/${nom}.jpg`;
};
