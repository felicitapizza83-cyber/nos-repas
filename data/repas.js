/* Bibliothèque de repas — issue du document « Repas validés 🥘 ».
   Quantités pour 2 adultes (portions: 2). null = « un peu » (produit du placard).
   Tags : voir APP_DATA.tags ; ils relient les repas aux objectifs naturopathie. */
window.APP_DATA = window.APP_DATA || {};
APP_DATA.version = 5; // à augmenter quand on ajoute des repas / ingrédients de base

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

    // ---------- Bibliothèque enrichie (inspirée des grands classiques familiaux et Thermomix) ----------
    // Plats du monde & mijotés
    R('couscous-poulet-legumes', 'Couscous poulet & légumes (Varoma)', 'Plats',
      ['volaille', 'legumes', 'legumineuses', 'epices', 'reconfortant', 'batch', 'thermomix'],
      [['semoule', 150], ['poulet-cuisse', 500], ['carotte', 200], ['courgette', 300], ['navet', 200], ['pois-chiches', 1], ['oignon', 1], ['tomate-concassee', 1], ['ras-el-hanout', null], ['huile-olive', null]],
      'Bouillon épicé dans le bol, légumes et poulet dans le Varoma, semoule gonflée avec un peu de bouillon.'),
    R('tajine-poulet-citron-olives', 'Tajine de poulet, citron & olives', 'Plats',
      ['volaille', 'epices', 'reconfortant', 'batch'],
      [['poulet-cuisse', 600], ['citron', 1], ['olives', 80], ['oignon', 2], ['pdt', 400], ['gingembre', 10], ['herbes', 1], ['curcuma', null], ['huile-olive', null]]),
    R('tajine-kefta-oeufs', 'Tajine de kefta à la tomate', 'Plats',
      ['viande-rouge', 'epices', 'reconfortant'],
      [['boeuf-hache', 350], ['tomate-concassee', 2], ['oignon', 1], ['herbes', 1], ['pain', 1], ['cumin', null], ['paprika', null]],
      'Boulettes de kefta mijotées dans une sauce tomate au cumin. Avec du pain pour saucer.'),
    R('chakchouka-oeufs', 'Chakchouka aux œufs', 'Plats',
      ['oeufs', 'vegetarien', 'legumes', 'epices', 'rapide'],
      [['poivron', 3], ['tomate-concassee', 2], ['oignon', 1], ['oeuf', 4], ['ail', 2], ['pain', 1], ['cumin', null], ['paprika', null]]),
    R('harira', 'Harira (soupe marocaine lentilles & pois chiches)', 'Plats',
      ['legumineuses', 'reconfortant', 'epices', 'batch'],
      [['lentilles', 100], ['pois-chiches', 1], ['tomate-concassee', 1], ['oignon', 1], ['herbes', 1], ['pates', 40], ['citron', 1], ['curcuma', null], ['cumin', null]]),
    R('dahl-lentilles-corail', 'Dahl de lentilles corail & riz basmati', 'Plats',
      ['vegetarien', 'legumineuses', 'epices', 'thermomix', 'batch'],
      [['lentilles-corail', 200], ['lait-coco', 200], ['tomate-concassee', 1], ['oignon', 1], ['ail', 2], ['gingembre', 15], ['riz-basmati', 120], ['curry', null], ['curcuma', null]]),
    R('curry-pois-chiches-epinards', 'Curry de pois chiches & épinards', 'Plats',
      ['vegetarien', 'legumineuses', 'feuilles-vertes', 'epices'],
      [['pois-chiches', 2], ['epinards', 300], ['lait-coco', 200], ['tomate-concassee', 1], ['oignon', 1], ['riz-basmati', 120], ['curry', null]]),
    R('chili-sin-carne', 'Chili sin carne (haricots & lentilles)', 'Plats',
      ['vegetarien', 'legumineuses', 'cereales-completes', 'epices', 'batch'],
      [['haricots-rouges', 2], ['lentilles', 80], ['mais', 1], ['poivron', 1], ['tomate-concassee', 1], ['oignon', 1], ['riz-complet', 120], ['cumin', null], ['paprika', null]]),
    R('hachis-parmentier-patate-douce', 'Hachis parmentier à la patate douce', 'Plats',
      ['viande-rouge', 'reconfortant', 'batch', 'thermomix'],
      [['boeuf-hache', 350], ['patate-douce', 600], ['carotte', 150], ['oignon', 1], ['lait', 100], ['emmental', 40]],
      'Purée de patate douce au Thermomix, viande et carottes revenues, gratiné au four.'),
    R('gratin-chou-fleur-dinde', 'Gratin chou-fleur & brocoli, escalope de dinde', 'Plats',
      ['volaille', 'legumes', 'feuilles-vertes', 'reconfortant'],
      [['chou-fleur', 1], ['brocoli', 300], ['lait', 400], ['emmental', 60], ['dinde', 250], ['farine', null], ['beurre', null]]),
    R('tarte-poireaux-chevre', 'Tarte poireaux & chèvre, salade verte', 'Plats',
      ['vegetarien', 'legumes', 'fromage'],
      [['pate-brisee', 1], ['poireau', 600], ['oeuf', 3], ['creme', 150], ['fromage-chevre', 100], ['salade', 1]]),
    R('poulet-coco-patate-douce', 'Poulet coco, patate douce & épinards', 'Plats',
      ['volaille', 'epices', 'feuilles-vertes'],
      [['poulet-filet', 300], ['patate-douce', 400], ['lait-coco', 200], ['epinards', 150], ['riz-basmati', 120], ['curry', null]]),
    R('wok-poulet-nouilles', 'Wok de poulet, légumes & nouilles', 'Plats',
      ['volaille', 'legumes', 'rapide'],
      [['poulet-filet', 300], ['nouilles', 200], ['poivron', 1], ['carotte', 150], ['brocoli', 200], ['gingembre', 10], ['ail', 2], ['sauce-soja', null]]),
    R('riz-cantonais-crevettes', 'Riz sauté aux crevettes & petits pois', 'Plats',
      ['fruits-de-mer', 'rapide'],
      [['riz-basmati', 150], ['crevettes', 200], ['oeuf', 2], ['petits-pois', 150], ['carotte', 100], ['sauce-soja', null]]),
    R('dinde-moutarde-haricots', 'Dinde à la moutarde, haricots verts & riz complet', 'Plats',
      ['volaille', 'feuilles-vertes', 'cereales-completes', 'rapide'],
      [['dinde', 300], ['creme', 100], ['haricots-verts', 300], ['riz-complet', 120], ['moutarde', null]]),
    R('blanquette-poulet-legere', 'Blanquette de poulet légère (Thermomix)', 'Plats',
      ['volaille', 'reconfortant', 'thermomix'],
      [['poulet-filet', 400], ['carotte', 200], ['champignon', 200], ['oignon', 1], ['creme', 100], ['bouillon', 1], ['riz-basmati', 120]]),
    R('boeuf-carottes', 'Bœuf carottes mijoté', 'Plats',
      ['viande-rouge', 'reconfortant', 'batch', 'thermomix'],
      [['boeuf-braiser', 500], ['carotte', 500], ['oignon', 1], ['tomate-concassee', 1], ['pdt', 400], ['herbes-provence', null]]),
    R('ratatouille-quinoa-feta', 'Ratatouille, quinoa & feta', 'Plats',
      ['vegetarien', 'legumes', 'cereales-completes', 'thermomix'],
      [['courgette', 300], ['aubergine', 1], ['poivron', 2], ['tomate', 400], ['oignon', 1], ['quinoa', 140], ['feta', 100], ['huile-olive', null]]),
    R('falafels-pita', 'Falafels maison en pita, sauce yaourt', 'Plats',
      ['vegetarien', 'legumineuses', 'cru', 'thermomix'],
      [['pois-chiches', 2], ['oignon', 1], ['herbes', 1], ['pain-pita', 4], ['yaourt-grec', 150], ['concombre', 1], ['tomate', 200], ['salade', 1], ['cumin', null], ['farine', null]],
      'Pois chiches, oignon, herbes et cumin mixés au Thermomix, boulettes cuites au four.'),
    R('burger-maison-patate-douce', 'Burger maison & frites de patate douce au four', 'Plats',
      ['viande-rouge', 'reconfortant'],
      [['boeuf-hache', 300], ['pain-burger', 2], ['tomate', 200], ['salade', 1], ['cheddar', 40], ['oignon-rouge', 1], ['patate-douce', 500], ['huile-olive', null]]),
    R('pizza-maison-legumes', 'Pizza maison aux légumes', 'Plats',
      ['vegetarien', 'fromage', 'reconfortant'],
      [['pate-pizza', 1], ['tomate-concassee', 1], ['mozzarella', 125], ['poivron', 1], ['champignon', 150], ['olives', 40], ['salade', 1], ['herbes-provence', null]]),
    R('wraps-poulet-crudites', 'Wraps poulet & crudités', 'Plats',
      ['volaille', 'cru', 'rapide'],
      [['tortilla-wrap', 4], ['poulet-filet', 250], ['avocat', 1], ['tomate', 200], ['salade', 1], ['yaourt-grec', 80]]),
    R('poulet-roti-legumes', 'Poulet rôti & légumes du four', 'Plats',
      ['volaille', 'legumes', 'reconfortant'],
      [['poulet-cuisse', 600], ['pdt', 500], ['carotte', 300], ['oignon-rouge', 1], ['herbes-provence', null], ['huile-olive', null]]),
    R('dinde-champignons-puree', 'Escalope de dinde aux champignons & purée', 'Plats',
      ['volaille', 'reconfortant', 'thermomix'],
      [['dinde', 300], ['champignon', 250], ['creme', 80], ['pdt', 500], ['lait', 80]]),
    R('kefta-boulgour', 'Brochettes de kefta, boulgour & salade concombre', 'Plats',
      ['viande-rouge', 'epices', 'cru'],
      [['boeuf-hache', 300], ['boulgour', 140], ['oignon', 1], ['herbes', 1], ['concombre', 1], ['tomate', 200], ['yaourt-grec', 100], ['cumin', null]]),
    R('tofu-saute-legumes', 'Tofu sauté aux légumes & riz complet', 'Plats',
      ['vegetarien', 'legumes', 'cereales-completes', 'rapide'],
      [['tofu', 300], ['brocoli', 250], ['poivron', 1], ['carotte', 150], ['gingembre', 10], ['riz-complet', 120], ['sauce-soja', null]]),
    R('mjadra', 'Mjadra (lentilles, riz & oignons fondants)', 'Plats',
      ['vegetarien', 'legumineuses', 'epices', 'batch'],
      [['lentilles', 150], ['riz-basmati', 100], ['oignon', 3], ['yaourt-grec', 150], ['concombre', 1], ['cumin', null], ['huile-olive', null]]),
    R('galettes-sarrasin-completes', 'Galettes de sarrasin champignons, épinards & emmental', 'Plats',
      ['oeufs', 'vegetarien', 'feuilles-vertes', 'rapide'],
      [['galette-sarrasin', 4], ['oeuf', 2], ['emmental', 60], ['champignon', 150], ['epinards', 150], ['salade', 1]]),

    // Soupes & veloutés
    R('veloute-butternut-lentilles', 'Velouté butternut & lentilles corail (Thermomix)', 'Plats',
      ['vegetarien', 'legumineuses', 'leger', 'reconfortant', 'thermomix'],
      [['butternut', 1], ['lentilles-corail', 80], ['carotte', 200], ['oignon', 1], ['lait-coco', 100], ['pain', 1]]),
    R('soupe-poireaux-pdt', 'Soupe poireaux-pommes de terre (Thermomix)', 'Plats',
      ['vegetarien', 'leger', 'reconfortant', 'thermomix'],
      [['poireau', 500], ['pdt', 400], ['oignon', 1], ['bouillon', 1], ['creme', 50], ['pain', 1]]),
    R('minestrone', 'Minestrone aux haricots blancs', 'Plats',
      ['vegetarien', 'legumineuses', 'legumes', 'batch'],
      [['courgette', 200], ['carotte', 200], ['haricots-blancs', 1], ['pates', 60], ['tomate-concassee', 1], ['poireau', 200], ['parmesan', 30], ['bouillon', 1]]),
    R('soupe-thai-poulet-coco', 'Soupe thaï poulet-coco', 'Plats',
      ['volaille', 'epices', 'leger'],
      [['poulet-filet', 250], ['lait-coco', 200], ['nouilles', 100], ['champignon', 150], ['citron', 1], ['gingembre', 15], ['carotte', 100], ['herbes', 1]]),

    // Poisson
    R('cabillaud-brocoli-puree', 'Cabillaud vapeur, brocoli & purée (Varoma)', 'Poisson',
      ['poisson', 'leger', 'feuilles-vertes', 'thermomix'],
      [['cabillaud', 400], ['brocoli', 300], ['pdt', 400], ['citron', 1], ['lait', 100]]),
    R('papillote-saumon-poireaux', 'Papillote de saumon aux poireaux, riz complet', 'Poisson',
      ['poisson-gras', 'leger', 'cereales-completes'],
      [['saumon', 250], ['poireau', 400], ['creme', 50], ['citron', 1], ['riz-complet', 120]]),
    R('tajine-poisson-chermoula', 'Tajine de poisson à la chermoula', 'Poisson',
      ['poisson', 'epices', 'legumes'],
      [['cabillaud', 400], ['pdt', 400], ['tomate', 300], ['poivron', 1], ['citron', 1], ['herbes', 1], ['olives', 40], ['cumin', null], ['paprika', null]]),
    R('curry-poisson-coco', 'Curry de poisson au lait de coco', 'Poisson',
      ['poisson', 'epices', 'feuilles-vertes'],
      [['cabillaud', 400], ['lait-coco', 200], ['tomate-concassee', 1], ['epinards', 150], ['riz-basmati', 120], ['curry', null]]),
    R('brochettes-crevettes-quinoa', 'Brochettes de crevettes & quinoa citronné', 'Poisson',
      ['fruits-de-mer', 'leger', 'cereales-completes'],
      [['crevettes', 300], ['quinoa', 140], ['courgette', 300], ['citron', 1], ['ail', 2], ['herbes', 1]]),
    R('saumon-lentilles', 'Pavé de saumon & lentilles vertes', 'Poisson',
      ['poisson-gras', 'legumineuses'],
      [['saumon', 250], ['lentilles', 150], ['carotte', 150], ['oignon', 1]]),

    // Pâtes, risottos & gratins
    R('pates-sicilienne-thon', 'Pâtes à la sicilienne (thon, tomate, câpres)', 'Pâtes & risottos',
      ['poisson', 'rapide'],
      [['pates', 200], ['thon', 2], ['tomate-concassee', 1], ['olives', 40], ['capres', 20], ['oignon', 1]]),
    R('one-pot-pasta-legumes', 'One pot pasta aux légumes (Thermomix)', 'Pâtes & risottos',
      ['vegetarien', 'legumes', 'rapide', 'thermomix'],
      [['pates', 200], ['tomate-cerise', 250], ['courgette', 200], ['epinards', 150], ['oignon', 1], ['parmesan', 30], ['bouillon', 1]]),
    R('pates-brocoli-ricotta', 'Pâtes brocoli, ricotta & citron', 'Pâtes & risottos',
      ['vegetarien', 'feuilles-vertes', 'rapide'],
      [['pates', 200], ['brocoli', 300], ['ricotta', 150], ['citron', 1], ['parmesan', 20]]),
    R('risotto-butternut', 'Risotto à la butternut (Thermomix)', 'Pâtes & risottos',
      ['vegetarien', 'reconfortant', 'thermomix'],
      [['riz-risotto', 160], ['butternut', 1], ['oignon', 1], ['bouillon', 1], ['parmesan', 40]]),
    R('risotto-petits-pois-saumon', 'Risotto petits pois & saumon (Thermomix)', 'Pâtes & risottos',
      ['poisson-gras', 'thermomix'],
      [['riz-risotto', 160], ['petits-pois', 200], ['saumon', 200], ['citron', 1], ['oignon', 1], ['bouillon', 1]]),
    R('lasagnes-legumes-ricotta', 'Lasagnes légumes & ricotta', 'Pâtes & risottos',
      ['vegetarien', 'legumes', 'batch', 'fromage'],
      [['lasagne', 200], ['courgette', 400], ['epinards', 300], ['ricotta', 250], ['tomate-concassee', 2], ['mozzarella', 125]]),
    R('pates-boulettes-dinde', 'Pâtes aux boulettes de dinde, sauce tomate', 'Pâtes & risottos',
      ['volaille', 'reconfortant'],
      [['pates', 200], ['dinde', 300], ['tomate-concassee', 1], ['oignon', 1], ['herbes', 1]]),
    R('gnocchis-poeles-epinards', 'Gnocchis poêlés, épinards & tomates cerises', 'Pâtes & risottos',
      ['vegetarien', 'feuilles-vertes', 'rapide'],
      [['gnocchi', 500], ['epinards', 200], ['tomate-cerise', 250], ['parmesan', 30], ['ail', 2]]),

    // Salades & bowls
    R('buddha-bowl-quinoa', 'Buddha bowl quinoa, pois chiches & patate douce', 'Salades',
      ['vegetarien', 'legumineuses', 'cru', 'cereales-completes'],
      [['quinoa', 140], ['pois-chiches', 1], ['patate-douce', 300], ['avocat', 1], ['salade', 1], ['carotte', 150], ['houmous', 100]]),
    R('salade-cesar-legere', 'Salade César légère', 'Salades',
      ['volaille', 'cru', 'leger'],
      [['poulet-filet', 250], ['salade', 2], ['parmesan', 30], ['pain', 1], ['yaourt-grec', 80], ['citron', 1], ['tomate-cerise', 250]]),
    R('taboule-boulgour-pois-chiches', 'Taboulé boulgour, herbes & pois chiches', 'Salades',
      ['vegetarien', 'cru', 'legumineuses'],
      [['boulgour', 150], ['tomate', 300], ['concombre', 1], ['herbes', 2], ['citron', 2], ['oignon-rouge', 1], ['pois-chiches', 1], ['huile-olive', null]]),
    R('salade-nicoise', 'Salade niçoise', 'Salades',
      ['poisson', 'cru', 'feuilles-vertes'],
      [['thon', 2], ['oeuf', 2], ['haricots-verts', 200], ['tomate', 300], ['pdt', 300], ['olives', 40], ['salade', 1], ['huile-olive', null]]),
    R('salade-lentilles-truite', 'Salade de lentilles & truite fumée', 'Salades',
      ['poisson-gras', 'legumineuses', 'cru'],
      [['lentilles', 150], ['truite-fumee', 120], ['oignon-rouge', 1], ['salade', 1], ['moutarde', null], ['huile-olive', null]]),

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
