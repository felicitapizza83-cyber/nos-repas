/* Bibliothèque de repas — issue du document « Repas validés 🥘 ».
   Quantités pour 2 adultes (portions: 2). null = « un peu » (produit du placard).
   Tags : voir APP_DATA.tags ; ils relient les repas aux objectifs naturopathie. */
window.APP_DATA = window.APP_DATA || {};
APP_DATA.version = 4; // à augmenter quand on ajoute des repas / ingrédients de base

APP_DATA.tags = {
  'volaille': 'Volaille',
  'viande-rouge': 'Viande rouge',
  'poisson': 'Poisson',
  'poisson-gras': 'Poisson gras (oméga-3)',
  'fruits-de-mer': 'Fruits de mer',
  'oeufs': 'Œufs',
  'vegetarien': 'Végétarien',
  'legumineuses': 'Légumineuses',
  'legumes': 'Riche en légumes',
  'feuilles-vertes': 'Légumes verts',
  'cereales-completes': 'Céréales complètes',
  'cru': 'Crudités',
  'leger': 'Léger',
  'reconfortant': 'Réconfortant',
  'epices': 'Épices',
  'fromage': 'Fromage / crème',
  'thermomix': 'Thermomix',
  'rapide': 'Rapide',
  'batch': 'Se garde bien'
};

APP_DATA.categories = ['Plats', 'Pâtes & risottos', 'Poisson', 'Salades', 'Douceurs'];

(function () {
  const R = (id, nom, categorie, tags, ingredients, notes = '', portions = 2) =>
    ({ id, nom, categorie, tags, ingredients, notes, portions, cookidoo: '', favori: false, avis: null, commentaire: '' });
  const G = (id, nom, classique, tags, ingredients, notes) =>
    ({ ...R(id, nom, 'Douceurs', ['vegetarien', 'thermomix', ...tags], ingredients, notes, 8), classique });

  APP_DATA.repas = [
    // ---------- Plats ----------
    R('riz-chakchouka-poulet', 'Riz basmati, poulet au four poivrons & sauce chakchouka, avocat', 'Plats',
      ['volaille', 'legumes', 'epices'],
      [['riz-basmati', 150], ['poulet-filet', 300], ['poivron', 3], ['tomate-concassee', 1], ['oignon', 1], ['ail', 2], ['avocat', 1], ['paprika', null], ['herbes-provence', null], ['huile-olive', null]],
      'Poulet au four avec poivrons et épices italiennes, nappé de sauce chakchouka. Avocat en sortie de four.'),
    R('saumon-puree-hv', 'Saumon, purée, haricots verts + salade tomate-avocat', 'Poisson',
      ['poisson-gras', 'feuilles-vertes', 'reconfortant'],
      [['saumon', 250], ['pdt', 500], ['haricots-verts', 300], ['tomate', 300], ['avocat', 1], ['beurre', null], ['moutarde', null], ['huile-olive', null]],
      'Vinaigrette huile + moutarde pour la salade.'),
    R('lentilles-poulet-salade', 'Lentilles, escalope de poulet et salade', 'Plats',
      ['legumineuses', 'volaille', 'feuilles-vertes'],
      [['lentilles', 200], ['poulet-filet', 250], ['salade', 1], ['carotte', 150], ['oignon', 1], ['huile-olive', null]]),
    R('riz-algerienne-poulet', 'Riz à l’algérienne (Thermomix) + escalope de poulet', 'Plats',
      ['volaille', 'epices', 'thermomix'],
      [['riz-basmati', 150], ['poulet-filet', 250], ['tomate-concassee', 1], ['oignon', 1], ['carotte', 150], ['petits-pois', 150], ['ras-el-hanout', null]]),
    R('omelette-epinards-salade', 'Omelette aux épinards & salade verte', 'Plats',
      ['oeufs', 'vegetarien', 'feuilles-vertes', 'leger', 'rapide'],
      [['oeuf', 4], ['epinards', 300], ['salade', 1], ['huile-olive', null]],
      '✨✨✨✨ 3 blocs d’épinards + 4 œufs.'),
    R('tortilla-tarte', 'Tortilla patate façon tarte (tomates, mozza, concombre, échalote)', 'Plats',
      ['oeufs', 'vegetarien', 'cru'],
      [['pdt', 400], ['oeuf', 5], ['tomate', 200], ['mozzarella', 125], ['concombre', 1], ['echalote', 1], ['moutarde', null], ['huile-olive', null]],
      'Tortilla pomme de terre-œuf ; disposer par-dessus tomates, mozza, concombre, échalote comme une tarte. Vinaigrette huile-moutarde.'),
    R('libanais', 'Libanais : brochettes de poulet, houmous, batata harra, haricots verts, sauce à l’ail', 'Plats',
      ['volaille', 'feuilles-vertes', 'epices'],
      [['poulet-filet', 300], ['houmous', 200], ['pdt', 500], ['haricots-verts', 300], ['yaourt-grec', 150], ['ail', 3], ['herbes', 1], ['citron', 1], ['paprika', null]]),
    R('tajine-boulettes', 'Tajine de boulettes', 'Plats',
      ['viande-rouge', 'legumes', 'epices', 'reconfortant'],
      [['boeuf-hache', 400], ['tomate-concassee', 1], ['oignon', 1], ['carotte', 200], ['courgette', 300], ['herbes', 1], ['cumin', null], ['ras-el-hanout', null]]),
    R('paella', 'Paella', 'Plats',
      ['volaille', 'fruits-de-mer', 'legumes', 'batch'],
      [['riz-paella', 150], ['poulet-filet', 250], ['fruits-mer', 300], ['poivron', 1], ['petits-pois', 100], ['tomate-concassee', 1], ['oignon', 1], ['curcuma', null], ['paprika', null]]),
    R('soupe-tortellini', 'Soupe de tortellini', 'Plats',
      ['reconfortant', 'leger'],
      [['tortellini', 250], ['epinards', 150], ['tomate-concassee', 1], ['carotte', 100], ['bouillon', 1], ['parmesan', 30]]),
    R('gnocchi-gorgonzola', 'Gnocchis au gorgonzola', 'Plats',
      ['vegetarien', 'fromage', 'reconfortant', 'rapide'],
      [['gnocchi', 500], ['gorgonzola', 150], ['creme', 100], ['epinards', 150]]),
    R('chili-crevettes', 'Chili de crevettes, riz basmati', 'Plats',
      ['fruits-de-mer', 'legumineuses', 'epices'],
      [['crevettes', 300], ['riz-basmati', 150], ['haricots-rouges', 1], ['tomate-concassee', 1], ['poivron', 1], ['oignon', 1], ['paprika', null], ['cumin', null]]),
    R('poke-teriyaki', 'Poke riz & poulet teriyaki', 'Plats',
      ['volaille', 'cru', 'legumes'],
      [['riz-basmati', 150], ['poulet-filet', 300], ['sauce-teriyaki', 60], ['avocat', 1], ['concombre', 1], ['carotte', 150], ['mais', 1]]),
    R('omelette-legumes-four', 'Omelette aux épinards & légumes au four', 'Plats',
      ['oeufs', 'vegetarien', 'feuilles-vertes', 'legumes'],
      [['oeuf', 4], ['epinards', 200], ['courgette', 300], ['poivron', 1], ['aubergine', 1], ['huile-olive', null], ['herbes-provence', null]]),
    R('loubia', 'Loubia', 'Plats',
      ['legumineuses', 'vegetarien', 'epices', 'reconfortant', 'batch'],
      [['haricots-blancs', 2], ['tomate-concassee', 1], ['oignon', 1], ['ail', 2], ['pain', 1], ['cumin', null], ['paprika', null]]),
    R('poulet-hv-pdt', 'Poulet, haricots verts & pommes de terre', 'Plats',
      ['volaille', 'feuilles-vertes'],
      [['poulet-cuisse', 600], ['haricots-verts', 300], ['pdt', 600], ['ail', 2], ['herbes-provence', null], ['huile-olive', null]]),
    R('poulet-tikka', 'Poulet tikka masala + riz basmati', 'Plats',
      ['volaille', 'epices'],
      [['poulet-filet', 300], ['yaourt-grec', 150], ['lait-coco', 200], ['tomate-concassee', 1], ['oignon', 1], ['ail', 2], ['gingembre', 20], ['riz-basmati', 150], ['curry', null], ['curcuma', null]]),
    R('boeuf-lok-lak', 'Bœuf lok lak, riz sauté à la tomate & brocolis', 'Plats',
      ['viande-rouge', 'feuilles-vertes'],
      [['boeuf-bavette', 300], ['riz-basmati', 150], ['tomate', 200], ['brocoli', 300], ['ail', 2], ['citron', 1], ['sauce-soja', null]]),
    R('chili-con-carne', 'Chili con carne / burritos', 'Plats',
      ['viande-rouge', 'legumineuses', 'epices', 'batch'],
      [['boeuf-hache', 350], ['haricots-rouges', 1], ['tomate-concassee', 1], ['poivron', 1], ['oignon', 1], ['mais', 1], ['riz-basmati', 120], ['tortilla-wrap', 4], ['cumin', null], ['paprika', null]]),
    R('fajitas', 'Soirée fajitas', 'Plats',
      ['volaille', 'legumes', 'epices'],
      [['poulet-filet', 300], ['tortilla-wrap', 6], ['poivron', 2], ['oignon', 1], ['avocat', 1], ['cheddar', 60], ['yaourt-grec', 100], ['paprika', null]]),
    R('boulettes-lentilles-legumes', 'Boulettes sauce tomate, lentilles & légumes au four', 'Plats',
      ['viande-rouge', 'legumineuses', 'legumes'],
      [['boeuf-hache', 350], ['tomate-concassee', 1], ['lentilles', 150], ['courgette', 300], ['poivron', 1], ['oignon', 1], ['herbes-provence', null]]),
    R('riz-legumes-omelette', 'Riz, légumes & omelette aux épinards', 'Plats',
      ['oeufs', 'vegetarien', 'feuilles-vertes', 'cereales-completes'],
      [['riz-complet', 150], ['oeuf', 4], ['epinards', 200], ['courgette', 200], ['carotte', 150]]),
    R('omelette-legumes-tomate-mozza', 'Omelette aux légumes + tomates-mozza', 'Plats',
      ['oeufs', 'vegetarien', 'leger', 'rapide'],
      [['oeuf', 4], ['courgette', 200], ['poivron', 1], ['tomate', 300], ['mozzarella', 125], ['huile-olive', null]]),
    R('soupe-tartines', 'Soupe de légumes & tartines', 'Plats',
      ['vegetarien', 'legumes', 'leger', 'reconfortant'],
      [['carotte', 400], ['courgette', 300], ['pdt', 300], ['oignon', 1], ['bouillon', 1], ['pain', 1], ['avocat', 1]]),

    // ---------- Pâtes & risottos ----------
    R('risotto-legumes', 'Risotto végétarien carottes-courgettes (Thermomix)', 'Pâtes & risottos',
      ['vegetarien', 'legumes', 'thermomix', 'reconfortant'],
      [['riz-risotto', 160], ['carotte', 200], ['courgette', 300], ['oignon', 1], ['bouillon', 1], ['parmesan', 40]]),
    R('risotto-legumes-maquereau', 'Risotto aux légumes & maquereau', 'Pâtes & risottos',
      ['poisson-gras', 'legumes', 'thermomix'],
      [['riz-risotto', 160], ['carotte', 150], ['courgette', 300], ['oignon', 1], ['bouillon', 1], ['maquereau', 2]]),
    R('risotto-champignons-poulet', 'Risotto champignons & poulet', 'Pâtes & risottos',
      ['volaille', 'reconfortant', 'fromage'],
      [['riz-risotto', 160], ['champignon', 300], ['poulet-filet', 250], ['oignon', 1], ['bouillon', 1], ['parmesan', 40], ['creme', 50]]),
    R('bavette-risotto', 'Bavette & risotto', 'Pâtes & risottos',
      ['viande-rouge', 'reconfortant'],
      [['boeuf-bavette', 300], ['riz-risotto', 160], ['champignon', 200], ['oignon', 1], ['bouillon', 1], ['parmesan', 30]]),
    R('rigatoni-crevettes-epinards', 'Rigatoni crevettes & épinards', 'Pâtes & risottos',
      ['fruits-de-mer', 'feuilles-vertes'],
      [['pates', 200], ['crevettes', 250], ['epinards', 200], ['creme', 100], ['ail', 2]]),
    R('linguine-truite-epinards', 'Linguine truite fumée & épinards', 'Pâtes & risottos',
      ['poisson-gras', 'feuilles-vertes', 'rapide'],
      [['linguine', 200], ['truite-fumee', 120], ['epinards', 200], ['creme', 100], ['citron', 1]]),
    R('pates-crevettes-courgettes', 'Pâtes crevettes & courgettes', 'Pâtes & risottos',
      ['fruits-de-mer', 'legumes', 'rapide'],
      [['pates', 200], ['crevettes', 250], ['courgette', 300], ['ail', 2], ['citron', 1], ['huile-olive', null]]),
    R('pates-thon-courgettes-feta', 'Pâtes thon, courgettes & feta', 'Pâtes & risottos',
      ['poisson', 'legumes', 'fromage', 'rapide'],
      [['pates', 200], ['thon', 2], ['courgette', 300], ['feta', 100], ['huile-olive', null]]),
    R('pates-butternut', 'Pâtes sauce butternut', 'Pâtes & risottos',
      ['vegetarien', 'legumes', 'reconfortant'],
      [['pates', 200], ['butternut', 1], ['creme', 100], ['parmesan', 30], ['oignon', 1]]),
    R('pates-legumes-feta', 'Pâtes sauce feta & légumes au four (+ salade tomate-mozza)', 'Pâtes & risottos',
      ['vegetarien', 'legumes', 'fromage'],
      [['pates', 200], ['courgette', 200], ['poivron', 1], ['aubergine', 1], ['tomate-cerise', 250], ['feta', 150], ['tomate', 300], ['mozzarella', 125], ['huile-olive', null]]),
    R('lasagnes', 'Lasagnes', 'Pâtes & risottos',
      ['viande-rouge', 'reconfortant', 'fromage', 'batch'],
      [['lasagne', 250], ['boeuf-hache', 400], ['tomate-concassee', 2], ['oignon', 1], ['carotte', 150], ['lait', 500], ['beurre', null], ['farine', null], ['parmesan', 40]]),
    R('pates-bolognaise', 'Pâtes bolognaise', 'Pâtes & risottos',
      ['viande-rouge', 'reconfortant'],
      [['pates', 200], ['boeuf-hache', 300], ['tomate-concassee', 1], ['oignon', 1], ['carotte', 100], ['herbes-provence', null]]),
    R('pates-poulet-epinards', 'Pâtes crème, poulet & épinards', 'Pâtes & risottos',
      ['volaille', 'feuilles-vertes', 'fromage'],
      [['pates', 200], ['poulet-filet', 250], ['epinards', 200], ['creme', 150]]),
    R('pates-poulet-champignons', 'Pâtes crème, poulet & champignons', 'Pâtes & risottos',
      ['volaille', 'fromage', 'reconfortant'],
      [['pates', 200], ['poulet-filet', 250], ['champignon', 250], ['creme', 150]]),
    R('penne-pesto-petits-pois', 'Penne petits pois, épinards, pesto & cheddar', 'Pâtes & risottos',
      ['vegetarien', 'feuilles-vertes', 'rapide'],
      [['pates', 200], ['petits-pois', 200], ['epinards', 150], ['pesto', 80], ['cheddar', 60]]),
    R('pasta-lenticchie', 'Pasta e lenticchie, tomate-mozzarella', 'Pâtes & risottos',
      ['legumineuses', 'vegetarien', 'reconfortant'],
      [['pates', 160], ['lentilles', 120], ['tomate-concassee', 1], ['oignon', 1], ['carotte', 100], ['mozzarella', 125]]),
    R('pates-pesto-maquereau', 'Pâtes pesto & maquereau', 'Pâtes & risottos',
      ['poisson-gras', 'rapide'],
      [['pates', 200], ['pesto', 80], ['maquereau', 2], ['tomate-cerise', 250]]),

    // ---------- Poisson ----------
    R('saumon-legumes-four', 'Saumon (ou truite) & légumes au four', 'Poisson',
      ['poisson-gras', 'legumes', 'leger'],
      [['saumon', 250], ['courgette', 300], ['poivron', 2], ['oignon-rouge', 1], ['tomate-cerise', 250], ['herbes-provence', null], ['huile-olive', null]]),
    R('saumon-ratatouille-riz', 'Saumon, ratatouille & riz semi-complet', 'Poisson',
      ['poisson-gras', 'legumes', 'cereales-completes'],
      [['saumon', 250], ['riz-complet', 150], ['courgette', 300], ['aubergine', 1], ['poivron', 1], ['tomate', 300], ['oignon', 1], ['huile-olive', null]]),
    R('lieu-legumes-four', 'Lieu noir & légumes au four', 'Poisson',
      ['poisson', 'legumes', 'leger'],
      [['lieu-noir', 400], ['courgette', 300], ['poivron', 1], ['carotte', 200], ['citron', 1], ['huile-olive', null]]),

    // ---------- Salades ----------
    R('salade-pates-thon-avocat', 'Salade de pâtes, tomate, thon, concombre & avocat', 'Salades',
      ['poisson', 'cru', 'rapide'],
      [['pates', 200], ['thon', 2], ['tomate', 300], ['concombre', 1], ['avocat', 1], ['moutarde', null], ['huile-olive', null]],
      'Vinaigrette moutarde + huile d’olive.'),
    R('salade-pates-courgettes-feta', 'Salade de pâtes courgettes, thon, olives & feta', 'Salades',
      ['poisson', 'legumes', 'fromage'],
      [['pates', 200], ['courgette', 300], ['thon', 2], ['olives', 60], ['feta', 100], ['huile-olive', null]]),
    R('salade-gnocchis-legumes', 'Salade de gnocchis, légumes grillés, mozza & pesto', 'Salades',
      ['vegetarien', 'legumes', 'cru'],
      [['gnocchi', 500], ['courgette', 200], ['aubergine', 1], ['poivron', 1], ['tomate-cerise', 250], ['mozzarella', 125], ['salade', 1], ['pesto', 60], ['moutarde', null]],
      'Sauce : pesto + moutarde + huile d’olive.'),
    R('salade-haricots-blancs', 'Salade de haricots blancs, maquereau, câpres & olives', 'Salades',
      ['legumineuses', 'poisson-gras', 'cru'],
      [['haricots-blancs', 1], ['tomate-cerise', 250], ['maquereau', 1], ['capres', 30], ['olives', 60], ['parmesan', 30], ['oignon-rouge', 1]],
      'Maquereau ou thon.'),
    R('salade-pois-chiches', 'Salade de pois chiches', 'Salades',
      ['legumineuses', 'vegetarien', 'cru'],
      [['pois-chiches', 2], ['tomate', 300], ['concombre', 1], ['oignon-rouge', 1], ['feta', 100], ['herbes', 1], ['citron', 1], ['huile-olive', null]]),
    R('salade-pdt-sardines', 'Salade de pommes de terre, haricots verts, sardines & mozza', 'Salades',
      ['poisson-gras', 'feuilles-vertes'],
      [['pdt', 500], ['haricots-verts', 250], ['sardines', 2], ['mozzarella', 125], ['moutarde', null], ['huile-olive', null]]),
    R('lentilles-salade-crevettes', 'Lentilles + salade de crevettes', 'Salades',
      ['legumineuses', 'fruits-de-mer', 'cru'],
      [['lentilles', 200], ['crevettes', 200], ['salade', 1], ['tomate', 200], ['citron', 1]]),

    // ---------- Douceurs ----------
    R('crepes', 'Crêpes', 'Douceurs',
      ['vegetarien'],
      [['farine', 125], ['maizena', 125], ['lait-soja', 500], ['oeuf', 3], ['fleur-oranger', null], ['sucre', null]],
      '125 g farine T80 · 125 g maïzena · 500 ml lait de soja · 3 œufs · 1 c. à s. fleur d’oranger · 1 c. à s. sucre, sirop d’érable ou 1 sachet de sucre vanillé.',
      4),

    /* Gâteaux healthy en rotation (2 différents par semaine).
       Sans farine blanche ni sucre raffiné ; « classique » = la version gourmande qu'ils remplacent.
       Chocolat : prendre du 70 % minimum (ou 85 %, encore moins sucré). */
    G('banana-bread-avoine', 'Banana bread avoine & noix', 'Banana bread',
      ['cereales-completes'],
      [['banane', 3], ['oeuf', 2], ['flocons-avoine', 150], ['poudre-amande', 50], ['noix', 50], ['yaourt-grec', 100], ['cannelle', null], ['levure', null]],
      'Four 180 °C · moule à cake.\n' +
      '1. Mixer 150 g de flocons d’avoine en farine : 15 s / vitesse 10.\n' +
      '2. Ajouter 3 bananes bien mûres, 2 œufs, 100 g de yaourt grec : 20 s / vitesse 4.\n' +
      '3. Ajouter 50 g de poudre d’amande, 1 c. à c. de cannelle, 1 c. à c. de levure : 15 s / vitesse 3.\n' +
      '4. Ajouter 50 g de noix : 10 s / sens inverse / vitesse 3.\n' +
      '5. Cuire 40 à 45 min.\n' +
      'Le sucre vient des bananes : plus elles sont tachées, plus c’est doux.'),
    G('gateau-pomme-amande', 'Moelleux pomme-amande aux dattes', 'Gâteau aux pommes',
      [],
      [['pomme', 3], ['oeuf', 3], ['poudre-amande', 150], ['dattes', 100], ['yaourt-grec', 125], ['flocons-avoine', 40], ['cannelle', null], ['levure', null]],
      'Four 180 °C · moule de 22 cm.\n' +
      '1. Mixer 100 g de dattes et 125 g de yaourt grec : 20 s / vitesse 8, racler, recommencer.\n' +
      '2. Ajouter 3 œufs : 15 s / vitesse 4.\n' +
      '3. Ajouter 150 g de poudre d’amande, 40 g de flocons d’avoine, 1 c. à c. de levure et de cannelle : 15 s / vitesse 4.\n' +
      '4. Incorporer 2 pommes en dés à la spatule ; la 3e en lamelles sur le dessus.\n' +
      '5. Cuire 35 à 40 min.'),
    G('fondant-chocolat-dattes', 'Fondant chocolat noir & dattes', 'Fondant au chocolat',
      [],
      [['chocolat-noir', 120], ['dattes', 120], ['oeuf', 3], ['fromage-blanc', 100], ['poudre-amande', 60]],
      'Four 180 °C · moule de 20 cm.\n' +
      '1. Râper 120 g de chocolat : 10 s / vitesse 8.\n' +
      '2. Ajouter 120 g de dattes et 50 g d’eau : 3 min / 50 °C / vitesse 2, puis 20 s / vitesse 8.\n' +
      '3. Ajouter 100 g de fromage blanc et 3 œufs : 20 s / vitesse 4.\n' +
      '4. Ajouter 60 g de poudre d’amande : 10 s / vitesse 3.\n' +
      '5. Cuire 20 à 22 min : le cœur doit rester tremblotant.'),
    G('carrot-cake-healthy', 'Carrot cake avoine & glaçage fromage blanc', 'Carrot cake',
      ['cereales-completes'],
      [['carotte', 250], ['flocons-avoine', 120], ['poudre-amande', 80], ['dattes', 100], ['oeuf', 2], ['noix', 50], ['fromage-blanc', 150], ['citron', 1], ['cannelle', null], ['levure', null]],
      'Four 175 °C · moule à cake.\n' +
      '1. Mixer 120 g de flocons d’avoine : 15 s / vitesse 10. Réserver.\n' +
      '2. Mixer 100 g de dattes : 10 s / vitesse 8. Ajouter 250 g de carottes en tronçons : 5 s / vitesse 5.\n' +
      '3. Ajouter 2 œufs, l’avoine, 80 g de poudre d’amande, 1 c. à c. de levure, 2 c. à c. de cannelle : 20 s / vitesse 4.\n' +
      '4. Ajouter 50 g de noix : 10 s / sens inverse / vitesse 3. Cuire 40 min.\n' +
      '5. Glaçage : 150 g de fromage blanc + zeste de citron, sur le gâteau refroidi.'),
    G('brownie-haricots', 'Brownie aux haricots rouges', 'Brownie',
      ['legumineuses'],
      [['haricots-rouges', 1], ['dattes', 100], ['chocolat-noir', 60], ['cacao', 30], ['oeuf', 3], ['noix', 50], ['levure', null]],
      'Four 180 °C · moule carré de 20 cm.\n' +
      '1. Râper 60 g de chocolat : 10 s / vitesse 8.\n' +
      '2. Ajouter les haricots rouges rincés et égouttés + 100 g de dattes : 30 s / vitesse 8, racler.\n' +
      '3. Ajouter 3 œufs, 30 g de cacao, ½ c. à c. de levure : 20 s / vitesse 5.\n' +
      '4. Ajouter 50 g de noix : 10 s / sens inverse / vitesse 3.\n' +
      '5. Cuire 22 à 25 min. Encore meilleur le lendemain : personne ne devine les haricots !'),
    G('gateau-yaourt-citron', 'Gâteau au yaourt citron-amande', 'Gâteau au yaourt',
      ['cereales-completes'],
      [['yaourt-grec', 250], ['oeuf', 3], ['flocons-avoine', 150], ['poudre-amande', 80], ['citron', 2], ['dattes', 80], ['sirop-erable', null], ['levure', null]],
      'Four 180 °C · moule de 22 cm.\n' +
      '1. Mixer 150 g de flocons d’avoine + le zeste de 2 citrons : 20 s / vitesse 10. Réserver.\n' +
      '2. Mixer 80 g de dattes + le jus d’1 citron : 20 s / vitesse 8.\n' +
      '3. Ajouter 250 g de yaourt grec, 3 œufs, 1 c. à s. de sirop d’érable : 20 s / vitesse 4.\n' +
      '4. Ajouter l’avoine, 80 g de poudre d’amande, 1 sachet de levure : 15 s / vitesse 4.\n' +
      '5. Cuire 35 min.'),
    G('clafoutis-fruits-rouges', 'Clafoutis fruits rouges sans farine', 'Clafoutis',
      [],
      [['fruits-rouges', 400], ['oeuf', 3], ['lait', 250], ['poudre-amande', 60], ['flocons-avoine', 40], ['sirop-erable', null]],
      'Four 180 °C · plat à gratin.\n' +
      '1. Mixer 40 g de flocons d’avoine : 15 s / vitesse 10.\n' +
      '2. Ajouter 3 œufs, 250 ml de lait, 60 g de poudre d’amande, 2 c. à s. de sirop d’érable : 20 s / vitesse 5.\n' +
      '3. Répartir 400 g de fruits rouges (encore surgelés) dans le plat, verser la pâte.\n' +
      '4. Cuire 35 à 40 min. Délicieux tiède.'),
    G('cookies-avoine-banane', 'Cookies avoine, banane & chocolat noir', 'Cookies',
      ['cereales-completes', 'rapide'],
      [['banane', 2], ['flocons-avoine', 150], ['poudre-amande', 40], ['chocolat-noir', 50], ['cannelle', null], ['levure', null]],
      'Four 180 °C · 12 cookies.\n' +
      '1. Concasser 50 g de chocolat : 3 s / vitesse 6. Réserver.\n' +
      '2. Écraser 2 bananes : 10 s / vitesse 4.\n' +
      '3. Ajouter 150 g de flocons, 40 g de poudre d’amande, cannelle, ½ c. à c. de levure : 20 s / sens inverse / vitesse 3.\n' +
      '4. Incorporer le chocolat. Former 12 boules aplaties.\n' +
      '5. Cuire 15 min.'),
    G('crumble-pomme-poire', 'Crumble pomme-poire avoine & amande', 'Crumble',
      [],
      [['pomme', 3], ['poire', 2], ['flocons-avoine', 100], ['poudre-amande', 60], ['noix', 40], ['beurre', null], ['cannelle', null]],
      'Four 180 °C · plat à gratin.\n' +
      '1. Couper 3 pommes et 2 poires en dés dans le plat, saupoudrer de cannelle.\n' +
      '2. Crumble : 100 g de flocons, 60 g de poudre d’amande, 40 g de noix, 30 g de beurre froid : 10 s / vitesse 5 (texture sableuse).\n' +
      '3. Parsemer sur les fruits.\n' +
      '4. Cuire 30 min. Les fruits bien mûrs suffisent à sucrer.'),
    G('muffins-avoine-fruits-rouges', 'Muffins avoine & fruits rouges', 'Muffins',
      ['cereales-completes'],
      [['flocons-avoine', 150], ['poudre-amande', 50], ['oeuf', 2], ['yaourt-grec', 150], ['dattes', 60], ['fruits-rouges', 150], ['levure', null]],
      'Four 180 °C · 12 muffins.\n' +
      '1. Mixer 150 g de flocons d’avoine : 15 s / vitesse 10. Réserver.\n' +
      '2. Mixer 60 g de dattes + 150 g de yaourt grec : 20 s / vitesse 8.\n' +
      '3. Ajouter 2 œufs, l’avoine, 50 g de poudre d’amande, 1 c. à c. de levure : 15 s / vitesse 4.\n' +
      '4. Incorporer 150 g de fruits rouges à la spatule. Remplir les moules aux ¾.\n' +
      '5. Cuire 20 à 22 min.')
  ];
})();
