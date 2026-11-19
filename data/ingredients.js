/* Ingrédients de base.
   Format : [id, nom, rayon, unité, taille du paquet, prix du paquet (€), placard?]
   - « taille du paquet » sert à arrondir aux paquets réellement achetés.
   - « placard » = produit qu'on a souvent à la maison : il est listé à part
     (« à vérifier ») et n'est compté dans le budget que si on le coche « à acheter ».
   Les prix sont des estimations moyennes supermarché ; ils sont modifiables dans l'app. */
window.APP_DATA = window.APP_DATA || {};

APP_DATA.lieux = [
  { id: 'producteur', nom: 'Producteur', emoji: '🧺', rythme: 'hebdo' },
  { id: 'drive', nom: 'Drive', emoji: '🚗', rythme: 'hebdo' },
  { id: 'fourche', nom: 'La Fourche', emoji: '🌾', rythme: 'mensuel' }
];

APP_DATA.rayons = [
  'Fruits & légumes',
  'Boucherie & volaille',
  'Poissonnerie',
  'Crèmerie & œufs',
  'Frais',
  'Épicerie',
  'Conserves',
  'Surgelés',
  'Boulangerie',
  'Bébé',
  'Placard',
  'Divers'
];

(function () {
  const FL = 'Fruits & légumes', BV = 'Boucherie & volaille', PO = 'Poissonnerie',
        CR = 'Crèmerie & œufs', FR = 'Frais', EP = 'Épicerie', CO = 'Conserves',
        SU = 'Surgelés', BO = 'Boulangerie', PL = 'Placard';

  const rows = [
    // Fruits & légumes
    ['tomate', 'Tomates', FL, 'g', 1000, 2.9],
    ['tomate-cerise', 'Tomates cerises', FL, 'g', 250, 1.9],
    ['avocat', 'Avocats', FL, 'pc', 1, 1.1],
    ['concombre', 'Concombre', FL, 'pc', 1, 0.99],
    ['courgette', 'Courgettes', FL, 'g', 1000, 2.6],
    ['aubergine', 'Aubergines', FL, 'pc', 1, 1.3],
    ['poivron', 'Poivrons', FL, 'pc', 1, 1.0],
    ['carotte', 'Carottes', FL, 'g', 1000, 1.4],
    ['oignon', 'Oignons jaunes', FL, 'pc', 8, 1.6],
    ['oignon-rouge', 'Oignons rouges', FL, 'pc', 4, 1.5],
    ['echalote', 'Échalotes', FL, 'pc', 6, 1.6],
    ['salade', 'Salade verte', FL, 'pc', 1, 1.1],
    ['pdt', 'Pommes de terre', FL, 'g', 2500, 3.6],
    ['champignon', 'Champignons de Paris', FL, 'g', 500, 2.6],
    ['butternut', 'Butternut', FL, 'pc', 1, 2.6],
    ['citron', 'Citrons', FL, 'pc', 1, 0.45],
    ['herbes', 'Herbes fraîches (persil, coriandre…)', FL, 'botte', 1, 1.0],
    ['gingembre', 'Gingembre frais', FL, 'g', 100, 0.9],
    ['ail', 'Ail', FL, 'gousse', 12, 0.8, true],
    ['banane', 'Bananes bien mûres', FL, 'pc', 1, 0.25],
    ['pomme', 'Pommes', FL, 'pc', 1, 0.45],
    ['poire', 'Poires', FL, 'pc', 1, 0.6],

    // Boucherie & volaille
    ['poulet-filet', 'Filets / escalopes de poulet', BV, 'g', 500, 6.9],
    ['poulet-cuisse', 'Cuisses de poulet', BV, 'g', 1000, 5.9],
    ['boeuf-hache', 'Bœuf haché 5 %', BV, 'g', 500, 6.9],
    ['boeuf-bavette', 'Bavette de bœuf', BV, 'g', 300, 7.9],

    // Poissonnerie
    ['saumon', 'Pavés de saumon', PO, 'g', 250, 6.9],
    ['truite-fumee', 'Truite fumée', PO, 'g', 120, 3.9],

    // Crèmerie & œufs
    ['oeuf', 'Œufs', CR, 'pc', 6, 2.3],
    ['feta', 'Feta', CR, 'g', 200, 2.3],
    ['mozzarella', 'Mozzarella', CR, 'g', 125, 1.0],
    ['parmesan', 'Parmesan', CR, 'g', 150, 3.2],
    ['cheddar', 'Cheddar râpé', CR, 'g', 150, 2.1],
    ['gorgonzola', 'Gorgonzola', CR, 'g', 150, 2.6],
    ['creme', 'Crème fraîche légère', CR, 'ml', 200, 1.3],
    ['yaourt-grec', 'Yaourt grec', CR, 'g', 500, 2.1],
    ['lait', 'Lait demi-écrémé', CR, 'ml', 1000, 1.1],
    ['lait-soja', 'Lait de soja', CR, 'ml', 1000, 1.8],
    ['fromage-blanc', 'Fromage blanc', CR, 'g', 500, 1.9],
    ['beurre', 'Beurre', CR, 'g', 250, 2.7, true],

    // Frais
    ['tortellini', 'Tortellini frais', FR, 'g', 250, 2.6],
    ['gnocchi', 'Gnocchis', FR, 'g', 500, 1.9],
    ['houmous', 'Houmous', FR, 'g', 200, 2.1],

    // Épicerie
    ['riz-basmati', 'Riz basmati', EP, 'g', 1000, 2.9],
    ['riz-complet', 'Riz semi-complet', EP, 'g', 1000, 2.6],
    ['riz-risotto', 'Riz à risotto (arborio)', EP, 'g', 1000, 3.3],
    ['riz-paella', 'Riz rond (paella)', EP, 'g', 1000, 2.2],
    ['pates', 'Pâtes (penne, rigatoni…)', EP, 'g', 500, 1.2],
    ['linguine', 'Linguine', EP, 'g', 500, 1.4],
    ['lasagne', 'Feuilles de lasagne', EP, 'g', 500, 1.7],
    ['lentilles', 'Lentilles vertes', EP, 'g', 500, 1.9],
    ['pesto', 'Pesto', EP, 'g', 190, 2.4],
    ['olives', 'Olives Kalamata', EP, 'g', 150, 2.3],
    ['capres', 'Câpres', EP, 'g', 90, 1.4],
    ['sauce-teriyaki', 'Sauce teriyaki', EP, 'ml', 250, 2.6],
    ['lait-coco', 'Lait de coco', EP, 'ml', 400, 1.7],
    ['tortilla-wrap', 'Tortillas (wraps)', EP, 'pc', 8, 2.3],
    ['flocons-avoine', "Flocons d'avoine", EP, 'g', 500, 1.5],
    ['poudre-amande', "Poudre d'amande", EP, 'g', 125, 2.6],
    ['noix', 'Cerneaux de noix', EP, 'g', 100, 2.9],
    ['dattes', 'Dattes dénoyautées', EP, 'g', 250, 3.0],
    ['chocolat-noir', 'Chocolat noir 70 %', EP, 'g', 100, 1.9],
    ['cacao', 'Cacao en poudre non sucré', EP, 'g', 250, 3.5],

    // Conserves
    ['tomate-concassee', 'Tomates concassées (boîte 400 g)', CO, 'boîte', 1, 0.95],
    ['pois-chiches', 'Pois chiches (boîte 400 g)', CO, 'boîte', 1, 0.95],
    ['haricots-blancs', 'Haricots blancs (boîte 400 g)', CO, 'boîte', 1, 1.0],
    ['haricots-rouges', 'Haricots rouges (boîte 400 g)', CO, 'boîte', 1, 0.95],
    ['mais', 'Maïs (boîte)', CO, 'boîte', 1, 0.9],
    ['thon', 'Thon au naturel (boîte)', CO, 'boîte', 1, 1.9],
    ['maquereau', 'Maquereau (boîte)', CO, 'boîte', 1, 1.8],
    ['sardines', 'Sardines (boîte)', CO, 'boîte', 1, 1.6],

    // Surgelés
    ['epinards', 'Épinards hachés surgelés', SU, 'g', 1000, 2.3],
    ['haricots-verts', 'Haricots verts surgelés', SU, 'g', 1000, 2.6],
    ['brocoli', 'Brocolis surgelés', SU, 'g', 1000, 2.4],
    ['petits-pois', 'Petits pois surgelés', SU, 'g', 1000, 2.1],
    ['crevettes', 'Crevettes décortiquées', SU, 'g', 400, 7.2],
    ['fruits-mer', 'Mélange fruits de mer', SU, 'g', 600, 6.2],
    ['lieu-noir', 'Filets de lieu noir', SU, 'g', 400, 5.2],
    ['fruits-rouges', 'Fruits rouges surgelés', SU, 'g', 500, 4.5],

    // Boulangerie
    ['pain', 'Pain (complet ou tradition)', BO, 'pc', 1, 1.5],

    // Placard (à vérifier avant les courses)
    ['huile-olive', "Huile d'olive", PL, 'ml', 750, 7.5, true],
    ['moutarde', 'Moutarde', PL, 'g', 200, 1.3, true],
    ['vinaigre', 'Vinaigre', PL, 'ml', 500, 1.2, true],
    ['sauce-soja', 'Sauce soja', PL, 'ml', 250, 2.2, true],
    ['bouillon', 'Bouillon de légumes (cubes)', PL, 'pc', 10, 1.5, true],
    ['paprika', 'Paprika', PL, 'pot', 1, 1.6, true],
    ['cumin', 'Cumin', PL, 'pot', 1, 1.6, true],
    ['ras-el-hanout', 'Ras el hanout', PL, 'pot', 1, 1.8, true],
    ['curry', 'Curry / garam masala', PL, 'pot', 1, 1.8, true],
    ['curcuma', 'Curcuma', PL, 'pot', 1, 1.7, true],
    ['herbes-provence', 'Herbes de Provence / italiennes', PL, 'pot', 1, 1.6, true],
    ['farine', 'Farine T80', PL, 'g', 1000, 1.5, true],
    ['maizena', 'Maïzena', PL, 'g', 400, 2.0, true],
    ['sucre', 'Sucre / sirop d’érable', PL, 'g', 1000, 1.4, true],
    ['fleur-oranger', "Eau de fleur d'oranger", PL, 'ml', 200, 2.2, true],
    ['cannelle', 'Cannelle', PL, 'pot', 1, 1.8, true],
    ['levure', 'Levure chimique', PL, 'pot', 1, 1.2, true],
    ['sirop-erable', "Sirop d'érable", PL, 'ml', 250, 4.5, true]
  ];

  /* Lieu d'achat par défaut (modifiable dans l'app, écran « Ingrédients & prix ») :
     - fruits & légumes → producteur ;
     - épicerie sèche, conserves végétales et placard → La Fourche (commande bio mensuelle) ;
     - le reste → drive (Leclerc ou Chronodrive). */
  const FOURCHE_EPICERIE = new Set(['riz-basmati', 'riz-complet', 'riz-risotto', 'riz-paella', 'pates', 'linguine',
    'lasagne', 'lentilles', 'flocons-avoine', 'poudre-amande', 'noix', 'dattes', 'chocolat-noir', 'cacao',
    'olives', 'capres', 'lait-coco', 'tomate-concassee', 'pois-chiches', 'haricots-blancs', 'haricots-rouges', 'mais']);
  const lieuPar = (id, rayon) =>
    rayon === FL ? 'producteur'
      : (rayon === PL || FOURCHE_EPICERIE.has(id)) ? 'fourche'
      : 'drive';

  /* Calories indicatives (valeurs moyennes de type table Ciqual / ANSES) :
     pour 100 g ou 100 ml si l'unité est g / ml ; sinon par pièce, boîte (égouttée), gousse ou botte. */
  const KCAL = {
    'tomate': 18, 'tomate-cerise': 20, 'avocat': 240, 'concombre': 40, 'courgette': 17, 'aubergine': 75,
    'poivron': 40, 'carotte': 36, 'oignon': 40, 'oignon-rouge': 40, 'echalote': 8, 'salade': 50, 'pdt': 80,
    'champignon': 25, 'butternut': 450, 'citron': 15, 'herbes': 20, 'gingembre': 80, 'ail': 4,
    'banane': 105, 'pomme': 80, 'poire': 90,
    'poulet-filet': 110, 'poulet-cuisse': 170, 'boeuf-hache': 125, 'boeuf-bavette': 140,
    'saumon': 200, 'truite-fumee': 140,
    'oeuf': 75, 'feta': 270, 'mozzarella': 250, 'parmesan': 400, 'cheddar': 400, 'gorgonzola': 350,
    'creme': 140, 'yaourt-grec': 120, 'lait': 46, 'lait-soja': 40, 'fromage-blanc': 75, 'beurre': 740,
    'tortellini': 280, 'gnocchi': 150, 'houmous': 300,
    'riz-basmati': 350, 'riz-complet': 350, 'riz-risotto': 350, 'riz-paella': 350, 'pates': 355,
    'linguine': 355, 'lasagne': 355, 'lentilles': 330, 'pesto': 450, 'olives': 250, 'capres': 25,
    'sauce-teriyaki': 100, 'lait-coco': 180, 'tortilla-wrap': 180, 'flocons-avoine': 370,
    'poudre-amande': 620, 'noix': 690, 'dattes': 280, 'chocolat-noir': 580, 'cacao': 380,
    'tomate-concassee': 80, 'pois-chiches': 290, 'haricots-blancs': 230, 'haricots-rouges': 250,
    'mais': 150, 'thon': 150, 'maquereau': 250, 'sardines': 210,
    'epinards': 25, 'haricots-verts': 30, 'brocoli': 30, 'petits-pois': 70, 'crevettes': 80,
    'fruits-mer': 70, 'lieu-noir': 80, 'fruits-rouges': 45, 'pain': 650,
    'huile-olive': 900, 'bouillon': 10, 'farine': 340, 'maizena': 350, 'sucre': 400, 'sirop-erable': 260
  };

  /* Stock minimum (Garde-manger) : en dessous, le produit s'ajoute tout seul aux courses
     (drive / producteur) ou à la commande La Fourche. Modifiable dans l'app. */
  const STOCK_MIN = {
    'riz-basmati': 1000, 'pates': 1000, 'lentilles': 500, 'flocons-avoine': 500,
    'tomate-concassee': 2, 'pois-chiches': 1, 'oeuf': 6
  };

  APP_DATA.ingredients = rows.map(([id, nom, rayon, unite, pack, prix, placard]) =>
    ({ id, nom, rayon, unite, pack, prix, placard: !!placard, lieu: lieuPar(id, rayon),
       kcal: KCAL[id] ?? null, stockMin: STOCK_MIN[id] || 0 }));
})();
