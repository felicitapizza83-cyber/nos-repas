/* Objectifs naturopathie proposés par défaut — modifiables dans l'app.
   « favoriser » / « limiter » utilisent les tags des repas (voir data/repas.js). */
window.APP_DATA = window.APP_DATA || {};

APP_DATA.objectifs = [
  {
    id: 'minceur-allaitement', emoji: '🌸', nom: 'Perte de poids en douceur',
    description: 'Mincir progressivement, compatible avec l’allaitement.',
    favoriser: ['legumes', 'feuilles-vertes', 'leger', 'legumineuses', 'poisson-gras', 'cereales-completes'],
    limiter: ['fromage', 'reconfortant'],
    conseils: [
      'Assiette : ½ légumes, ¼ protéines, ¼ féculents complets',
      'Pendant l’allaitement : viser 2 kg par mois maximum, ne jamais sauter de repas',
      'Collations : fruit, yaourt nature, une poignée d’oléagineux',
      'Bien s’hydrater (eau, tisanes)',
      'Remplacer la crème par du yaourt grec ou du fromage blanc',
      'En parler à la sage-femme ou au médecin'
    ]
  },
  {
    id: 'digestion', emoji: '🌿', nom: 'Digestion douce',
    description: 'Alléger le système digestif, privilégier le cuit et le simple.',
    favoriser: ['legumes', 'leger', 'poisson', 'oeufs', 'cereales-completes'],
    limiter: ['fromage', 'viande-rouge', 'epices'],
    conseils: ['Légumes plutôt cuits le soir', 'Manger au calme et bien mâcher', 'Une tisane fenouil ou verveine après le dîner']
  },
  {
    id: 'energie', emoji: '⚡', nom: 'Énergie & vitalité',
    description: 'Retrouver du tonus : fer, protéines et bons glucides.',
    favoriser: ['legumineuses', 'feuilles-vertes', 'poisson-gras', 'cereales-completes', 'oeufs'],
    limiter: ['fromage'],
    conseils: ['Associer légumineuses et céréales', 'Un filet de citron sur les légumes verts aide à absorber le fer', 'Bien s’hydrater dans la journée']
  },
  {
    id: 'anti-inflammatoire', emoji: '🫒', nom: 'Anti-inflammatoire',
    description: 'Oméga-3, légumes colorés et épices douces.',
    favoriser: ['poisson-gras', 'legumes', 'feuilles-vertes', 'legumineuses', 'epices'],
    limiter: ['viande-rouge', 'fromage'],
    conseils: ['Huile d’olive crue sur les plats', 'Curcuma toujours avec une pincée de poivre', 'Limiter les produits transformés']
  },
  {
    id: 'immunite', emoji: '🛡️', nom: 'Immunité',
    description: 'Renforcer les défenses avec des légumes variés et du frais.',
    favoriser: ['legumes', 'feuilles-vertes', 'poisson-gras', 'legumineuses', 'cru'],
    limiter: ['fromage'],
    conseils: ['Ail, oignon et herbes fraîches à volonté', 'Agrumes ou kiwis en dessert', 'Dormir suffisamment']
  },
  {
    id: 'post-partum', emoji: '🤱', nom: 'Récupération & douceur',
    description: 'Recharger les réserves après la naissance : fer, oméga-3, plats chauds.',
    favoriser: ['poisson-gras', 'legumineuses', 'feuilles-vertes', 'reconfortant', 'oeufs'],
    limiter: [],
    conseils: ['Des plats chauds et réconfortants', 'Fer : lentilles, épinards, viande rouge 1 à 2 fois', 'Oméga-3 : saumon, maquereau, sardines', 'Si allaitement : bien s’hydrater']
  },
  {
    id: 'legerete', emoji: '🥗', nom: 'Légèreté & équilibre',
    description: 'Des assiettes plus légères, riches en légumes.',
    favoriser: ['legumes', 'leger', 'cru', 'poisson', 'feuilles-vertes'],
    limiter: ['fromage', 'reconfortant'],
    conseils: ['La moitié de l’assiette en légumes', 'Dîner un peu plus tôt', 'Des crudités en entrée']
  },
  {
    id: 'sommeil', emoji: '🌙', nom: 'Sommeil apaisé',
    description: 'Des dîners qui favorisent l’endormissement.',
    favoriser: ['cereales-completes', 'legumineuses', 'leger', 'poisson'],
    limiter: ['epices', 'viande-rouge'],
    conseils: ['Dîner léger et pas trop tard', 'Féculents complets le soir', 'Écrans coupés après le repas']
  }
];

/* Menus types repris du document (dîners). « ext: … » = repas à l'extérieur. */
APP_DATA.menusTypes = [
  {
    id: 'semaine-a1', nom: 'Dîners semaine A',
    soirs: ['lentilles-salade-crevettes', 'poulet-hv-pdt', 'chili-con-carne', 'omelette-epinards-salade', 'linguine-truite-epinards', 'risotto-legumes-maquereau']
  },
  {
    id: 'semaine-3', nom: 'Dîners semaine 3',
    soirs: ['salade-pdt-sardines', 'pates-legumes-feta', 'salade-pates-courgettes-feta', 'omelette-epinards-salade', 'paella', 'bavette-risotto', 'lieu-legumes-four']
  },
  {
    id: 'semaine-a2', nom: 'Semaine A (bis)',
    soirs: ['boulettes-lentilles-legumes', 'pates-bolognaise', 'riz-legumes-omelette', 'fajitas', 'poulet-hv-pdt', 'penne-pesto-petits-pois', 'saumon-legumes-four']
  },
  {
    id: 'semaine-b', nom: 'Semaine B',
    soirs: ['pasta-lenticchie', 'ext:Chez maman', 'saumon-ratatouille-riz', 'omelette-legumes-tomate-mozza', 'soupe-tartines', 'paella', 'pates-legumes-feta']
  }
];

/* Collections de départ (modifiables) : les repas sont ajoutés selon leurs caractéristiques. */
APP_DATA.collections = [
  { id: 'rapide', emoji: '⚡', nom: 'Rapide en semaine', depuisTag: 'rapide' },
  { id: 'batch', emoji: '🍲', nom: 'Batch cooking du dimanche', depuisTag: 'batch' },
  { id: 'thermomix', emoji: '🤖', nom: 'Au Thermomix', depuisTag: 'thermomix' },
  { id: 'maman', emoji: '💛', nom: 'Recettes de famille', depuisTag: null }
];
