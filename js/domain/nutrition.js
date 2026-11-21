/* Points nutritionnels estimés par portion : calories, protéines, glucides, lipides, fibres.
   Valeurs moyennes (type table Ciqual), même base que les prix : pour 100 g / 100 ml,
   ou par pièce (pc, boîte, gousse, botte). Ordre de grandeur pour s'orienter, pas un comptage précis. */
App.nutrition = {
  HUILE_PAR_PORTION_ML: 10, // « un peu d'huile » = environ 1 c. à soupe par portion

  /** [protéines, glucides, lipides, fibres] en grammes. */
  MACROS: {
    // Fruits & légumes (100 g, ou la pièce)
    'tomate': [0.9, 3, 0.2, 1.2], 'tomate-cerise': [1, 3.5, 0.2, 1.5], 'avocat': [4, 4, 30, 13], 'concombre': [2, 9, 0.3, 2],
    'courgette': [1.2, 2, 0.3, 1], 'aubergine': [3, 12, 0.6, 9], 'poivron': [1.5, 7, 0.4, 3], 'carotte': [0.8, 7, 0.2, 2.7],
    'oignon': [1, 8, 0.1, 1.7], 'oignon-rouge': [1, 8, 0.1, 1.7], 'echalote': [0.5, 1.5, 0, 0.3], 'salade': [4, 6, 0.6, 4],
    'pdt': [2, 17, 0.1, 2], 'champignon': [3, 1, 0.3, 1.5], 'butternut': [10, 100, 1, 20], 'citron': [0.3, 3, 0.1, 1],
    'herbes': [2, 3, 0.5, 2], 'gingembre': [1.8, 15, 0.7, 2], 'ail': [0.2, 1, 0, 0.1], 'banane': [1.3, 25, 0.4, 3],
    'pomme': [0.4, 20, 0.3, 3.5], 'poire': [0.6, 22, 0.2, 5], 'navet': [0.9, 4, 0.1, 2], 'patate-douce': [1.6, 17, 0.1, 3],
    'chou-fleur': [19, 30, 3, 20], 'poireau': [1.5, 5, 0.3, 2.5],
    // Viandes, poissons
    'poulet-filet': [23, 0, 1.5, 0], 'poulet-cuisse': [19, 0, 10, 0], 'boeuf-hache': [21, 0, 5, 0], 'boeuf-bavette': [21, 0, 6, 0],
    'boeuf-braiser': [22, 0, 9, 0], 'dinde': [23, 0, 1.5, 0], 'saumon': [20, 0, 13, 0], 'truite-fumee': [22, 0, 6, 0],
    'cabillaud': [18, 0, 0.7, 0], 'lieu-noir': [18, 0, 1, 0], 'crevettes': [18, 0, 1.2, 0], 'fruits-mer': [14, 2, 1.5, 0],
    // Œufs, crèmerie
    'oeuf': [6.5, 0.4, 5.5, 0], 'feta': [14, 1, 22, 0], 'mozzarella': [18, 1, 17, 0], 'parmesan': [33, 0, 28, 0],
    'cheddar': [25, 1, 33, 0], 'gorgonzola': [19, 0, 29, 0], 'creme': [2.5, 4, 12, 0], 'yaourt-grec': [4, 4, 10, 0],
    'lait': [3.3, 4.8, 1.6, 0], 'lait-soja': [3.3, 2, 1.8, 0.5], 'fromage-blanc': [7, 4, 3, 0], 'beurre': [0.7, 0.6, 82, 0],
    'fromage-chevre': [20, 1, 24, 0], 'ricotta': [10, 3, 11, 0], 'emmental': [28, 0, 29, 0], 'tofu': [13, 2, 7, 1.5],
    // Frais
    'tortellini': [11, 40, 8, 2], 'gnocchi': [3, 32, 0.3, 1.5], 'houmous': [7, 14, 24, 6],
    'pate-brisee': [13, 100, 58, 4], 'pate-pizza': [20, 130, 10, 5], 'galette-sarrasin': [4, 24, 1, 3],
    // Épicerie
    'riz-basmati': [8, 77, 1, 1.5], 'riz-complet': [8, 74, 2.5, 3.5], 'riz-risotto': [7, 79, 0.6, 1], 'riz-paella': [7, 79, 0.6, 1],
    'pates': [12.5, 70, 1.5, 3], 'linguine': [12.5, 70, 1.5, 3], 'lasagne': [12.5, 70, 1.5, 3], 'nouilles': [11, 72, 2, 3],
    'semoule': [12, 70, 1.5, 4], 'quinoa': [14, 64, 6, 7], 'boulgour': [12, 70, 1.5, 8],
    'lentilles': [24, 50, 1, 11], 'lentilles-corail': [24, 50, 1.5, 11], 'pesto': [5, 6, 45, 2], 'olives': [1.5, 4, 25, 3],
    'capres': [2.4, 5, 0.9, 3], 'sauce-teriyaki': [5, 18, 0, 0], 'lait-coco': [2, 3, 18, 0], 'tortilla-wrap': [5, 30, 4, 2],
    'flocons-avoine': [13, 58, 7, 10], 'poudre-amande': [21, 7, 53, 11], 'noix': [15, 7, 65, 6], 'dattes': [2.5, 65, 0.4, 7],
    'chocolat-noir': [8, 33, 43, 11], 'cacao': [20, 13, 21, 33], 'farine': [11, 70, 1.5, 7], 'maizena': [0.3, 86, 0.1, 1],
    'sucre': [0, 100, 0, 0], 'sirop-erable': [0, 67, 0, 0], 'huile-olive': [0, 0, 100, 0], 'huile-colza': [0, 0, 100, 0],
    'bouillon': [0.3, 1, 0.5, 0],
    // Conserves (la boîte)
    'tomate-concassee': [4, 14, 1, 5], 'pois-chiches': [17, 35, 5, 12], 'haricots-blancs': [15, 30, 1, 13],
    'haricots-rouges': [17, 36, 1, 14], 'mais': [5, 30, 2, 5], 'thon': [33, 0, 1.5, 0], 'maquereau': [18, 1, 19, 0], 'sardines': [22, 0, 13, 0],
    // Surgelés
    'epinards': [3, 1, 0.4, 2.5], 'haricots-verts': [2, 4, 0.2, 3], 'brocoli': [3, 3, 0.4, 3], 'petits-pois': [5.5, 9, 0.4, 5],
    'fruits-rouges': [1, 7, 0.3, 4],
    // Boulangerie (la pièce)
    'pain': [22, 125, 3, 8], 'pain-pita': [6, 33, 1, 2], 'pain-burger': [5, 27, 2.5, 1.5],
    // Bébé (le pot)
    'orchestra-puree-legumes': [1.5, 9, 2, 2.5], 'orchestra-puree-proteines': [5, 10, 3, 2], 'orchestra-compote': [0.5, 16, 0, 2]
  },

  /** Repères journaliers pour un adulte (protéines plus hautes en allaitement). */
  REPERES: { kcal: 2000, p: 70, g: 260, l: 70, f: 30 },

  base(id, q) {
    const ing = App.store.ingredient(id);
    if (!ing || q == null) return null;
    return { ing, f: ['g', 'ml'].includes(ing.unite) ? q / 100 : q };
  },

  kcal(id, q) {
    const b = App.nutrition.base(id, q);
    return b && b.ing.kcal != null ? b.ing.kcal * b.f : 0;
  },

  /** Quantités réelles utilisées (l'huile « un peu » compte pour 1 c. à soupe par portion). */
  lignes(r) {
    const portions = r.portions || 2;
    return r.ingredients.map(([id, q]) =>
      q != null ? [id, q] : (id === 'huile-olive' || id === 'huile-colza') ? [id, App.nutrition.HUILE_PAR_PORTION_ML * portions] : null
    ).filter(Boolean);
  },

  /** kcal pour une portion (ou une part de gâteau). */
  parPortion(r) {
    return App.nutrition.lignes(r).reduce((s, [id, q]) => s + App.nutrition.kcal(id, q), 0) / (r.portions || 2);
  },

  /** Points nutritionnels complets d'une portion : { kcal, p, g, l, f }. */
  points(r) {
    const n = r.portions || 2;
    const t = { kcal: 0, p: 0, g: 0, l: 0, f: 0 };
    App.nutrition.lignes(r).forEach(([id, q]) => {
      const b = App.nutrition.base(id, q);
      if (!b) return;
      t.kcal += (b.ing.kcal || 0) * b.f;
      const m = App.nutrition.MACROS[id];
      if (m) { t.p += m[0] * b.f; t.g += m[1] * b.f; t.l += m[2] * b.f; t.f += m[3] * b.f; }
    });
    Object.keys(t).forEach(k => { t[k] /= n; });
    return t;
  },

  /** Total d'une journée pour une personne (repas adultes du midi et du soir prévus). */
  jour(sem, jourId) {
    const t = { kcal: 0, p: 0, g: 0, l: 0, f: 0, nb: 0 };
    App.MOMENTS.forEach(m => {
      const s = sem.slots[`${jourId}-${m.id}`];
      const r = s && s.type === 'maison' && App.store.repas(s.repasId);
      if (!r) return;
      const x = App.nutrition.points(r);
      Object.keys(x).forEach(k => { t[k] += x[k]; });
      t.nb++;
    });
    return t;
  },

  /** Libellé arrondi à la dizaine : « ≈ 520 kcal ». */
  label(r) {
    const k = App.nutrition.parPortion(r);
    return k > 0 ? `≈ ${Math.round(k / 10) * 10} kcal` : '';
  },

  /** Bloc visuel : calories en anneau + barres protéines / glucides / lipides / fibres. */
  bloc(x, titre = 'Par portion') {
    const R = App.nutrition.REPERES;
    const pct = Math.min(100, x.kcal / R.kcal * 100);
    const barre = (nom, v, ref, cls) => `
      <div class="macro ${cls}"><span>${nom}</span><b>${Math.round(v)} g</b>
        <i><em style="width:${Math.min(100, v / ref * 100).toFixed(0)}%"></em></i></div>`;
    return `
      <div class="nutri">
        <div class="anneau" style="--pct:${pct.toFixed(1)}">
          <div><strong>${Math.round(x.kcal / 10) * 10}</strong><small>kcal</small></div>
        </div>
        <div class="macros">
          <small class="muted">${titre} · % des repères du jour</small>
          ${barre('Protéines', x.p, R.p, 'm-p')}
          ${barre('Glucides', x.g, R.g, 'm-g')}
          ${barre('Lipides', x.l, R.l, 'm-l')}
          ${barre('Fibres', x.f, R.f, 'm-f')}
        </div>
      </div>`;
  }
};
