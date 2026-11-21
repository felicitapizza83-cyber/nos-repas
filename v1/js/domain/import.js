/* Import d'une recette à partir d'un texte collé (Cookidoo, Instagram, TikTok, site, message, photo
   lue par « Texte en direct » de l'iPhone). Sans IA : on repère le titre, les portions, les ingrédients
   (quantité, unité, nom) et les étapes, puis on relie chaque ingrédient à la liste de courses. */
App.importer = {
  NOMBRES: { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, dix: 10, demi: 0.5, 'demie': 0.5 },
  FRACTIONS: { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 },

  /** Unités reconnues → unité de l'app et facteur de conversion. */
  UNITES: [
    { re: /^(kg|kilos?|kilogrammes?)$/, u: 'g', f: 1000 },
    { re: /^(g|gr|grs|grammes?)$/, u: 'g', f: 1 },
    { re: /^(l|litres?)$/, u: 'ml', f: 1000 },
    { re: /^(dl|décilitres?|decilitres?)$/, u: 'ml', f: 100 },
    { re: /^(cl|centilitres?)$/, u: 'ml', f: 10 },
    { re: /^(ml|millilitres?)$/, u: 'ml', f: 1 },
    { re: /^(cs|càs|cas|c\.à\.s\.?|c\.\s?à\s?s\.?|cuill?[eè]res?\s+à\s+soupe|cuill?\.?\s?à\s?soupe|tbsp)$/, u: 'ml', f: 15 },
    { re: /^(cc|càc|cac|c\.à\.c\.?|c\.\s?à\s?c\.?|cuill?[eè]res?\s+à\s+caf[ée]|cuill?\.?\s?à\s?caf[ée]|tsp)$/, u: 'ml', f: 5 },
    { re: /^(verres?)$/, u: 'ml', f: 200 },
    { re: /^(tasses?|mugs?)$/, u: 'ml', f: 250 },
    { re: /^(pinc[ée]es?|filets?|traits?|noisettes?|noix)$/, u: null, f: null },
    { re: /^(bo[iî]tes?|conserves?)$/, u: 'boîte', f: 1 },
    { re: /^(gousses?)$/, u: 'gousse', f: 1 },
    { re: /^(bottes?|bouquets?)$/, u: 'botte', f: 1 },
    { re: /^(sachets?|paquets?|pots?|tranches?|branches?|brins?|feuilles?|pavés?|paves?|filets?|blancs?|escalopes?|rouleaux?)$/, u: 'pc', f: 1 }
  ],

  /** Poids moyen d'une pièce, pour passer de « 2 courgettes » à des grammes (et inversement). */
  POIDS_PIECE: {
    courgette: 250, carotte: 100, tomate: 120, pdt: 150, 'patate-douce': 300, champignon: 20, oignon: 100,
    poireau: 200, 'tomate-cerise': 15, epinards: 30, brocoli: 400, saumon: 125, 'poulet-filet': 150,
    'cabillaud': 130, dinde: 120, 'lieu-noir': 130, fromage: 125, mozzarella: 125, feta: 200, butternut: 1000
  },

  /** Mots courants → identifiant d'ingrédient de l'app. */
  SYNONYMES: {
    'pomme de terre': 'pdt', 'pommes de terre': 'pdt', 'patates': 'pdt', 'patate': 'pdt',
    'oeuf': 'oeuf', 'oeufs': 'oeuf', 'jaune d oeuf': 'oeuf', 'blanc d oeuf': 'oeuf',
    'creme fraiche': 'creme', 'creme liquide': 'creme', 'creme': 'creme', 'lait': 'lait',
    'huile d olive': 'huile-olive', 'huile': 'huile-olive', 'beurre': 'beurre', 'farine': 'farine',
    'sucre': 'sucre', 'sel': null, 'poivre': null, 'eau': null, 'glacons': null,
    'ail': 'ail', 'gousse d ail': 'ail', 'oignon': 'oignon', 'oignon rouge': 'oignon-rouge', 'echalote': 'echalote',
    'persil': 'herbes', 'coriandre': 'herbes', 'basilic': 'herbes', 'menthe': 'herbes', 'ciboulette': 'herbes', 'aneth': 'herbes',
    'thym': 'herbes-provence', 'romarin': 'herbes-provence', 'origan': 'herbes-provence', 'laurier': 'herbes-provence',
    'parmesan': 'parmesan', 'gruyere': 'emmental', 'emmental': 'emmental', 'fromage rape': 'emmental', 'comte': 'emmental',
    'blanc de poulet': 'poulet-filet', 'filet de poulet': 'poulet-filet', 'escalope de poulet': 'poulet-filet', 'poulet': 'poulet-filet',
    'cuisse de poulet': 'poulet-cuisse', 'steak hache': 'boeuf-hache', 'viande hachee': 'boeuf-hache', 'boeuf hache': 'boeuf-hache',
    'riz': 'riz-basmati', 'riz basmati': 'riz-basmati', 'riz arborio': 'riz-risotto', 'riz rond': 'riz-paella',
    'riz pour risotto': 'riz-risotto', 'riz a risotto': 'riz-risotto', 'arborio': 'riz-risotto', 'riz complet': 'riz-complet',
    'vin blanc': '__nouveau', 'vin rouge': '__nouveau', 'muscade': '__nouveau', 'lardons': '__nouveau',
    'pates': 'pates', 'spaghetti': 'pates', 'spaghettis': 'pates', 'tagliatelle': 'pates', 'tagliatelles': 'pates', 'fusilli': 'pates', 'coquillettes': 'pates',
    'tomates concassees': 'tomate-concassee', 'coulis de tomate': 'tomate-concassee', 'pulpe de tomate': 'tomate-concassee', 'sauce tomate': 'tomate-concassee',
    'bouillon': 'bouillon', 'cube de bouillon': 'bouillon', 'levure': 'levure', 'levure chimique': 'levure',
    'cannelle': 'cannelle', 'cumin': 'cumin', 'paprika': 'paprika', 'curry': 'curry', 'curcuma': 'curcuma', 'ras el hanout': 'ras-el-hanout',
    'sauce soja': 'sauce-soja', 'moutarde': 'moutarde', 'vinaigre': 'vinaigre', 'miel': 'sucre', 'sirop d erable': 'sirop-erable',
    'chocolat': 'chocolat-noir', 'chocolat noir': 'chocolat-noir', 'cacao': 'cacao', 'amandes en poudre': 'poudre-amande', 'poudre d amande': 'poudre-amande',
    'flocons d avoine': 'flocons-avoine', 'yaourt': 'yaourt-grec', 'yaourt grec': 'yaourt-grec', 'fromage blanc': 'fromage-blanc',
    'citron': 'citron', 'jus de citron': 'citron', 'salade': 'salade', 'laitue': 'salade', 'roquette': 'salade', 'mache': 'salade'
  },
  MOTS_VIDES: new Set(['de', 'du', 'des', 'la', 'le', 'les', 'd', 'l', 'a', 'au', 'aux', 'et', 'ou', 'en', 'frais', 'fraiche',
    'fraiches', 'gros', 'grosse', 'petit', 'petite', 'petits', 'petites', 'bio', 'environ', 'bien', 'mur', 'mure', 'mures',
    'hache', 'hachee', 'haches', 'emince', 'emincee', 'coupe', 'coupee', 'rape', 'rapee', 'cuit', 'cuite', 'cru', 'crue',
    'surgele', 'surgeles', 'surgelee', 'surgelees', 'entier', 'entiere', 'moyen', 'moyenne', 'moyens', 'gros', 'facultatif']),

  nombre(t) {
    if (!t) return null;
    t = t.trim().toLowerCase();
    if (this.FRACTIONS[t] != null) return this.FRACTIONS[t];
    if (this.NOMBRES[t] != null) return this.NOMBRES[t];
    let m = t.match(/^(\d+)\s*([½¼¾⅓⅔])$/);
    if (m) return +m[1] + this.FRACTIONS[m[2]];
    m = t.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (m) return +m[1] / +m[2];
    m = t.match(/^(\d+(?:[.,]\d+)?)(?:\s*(?:-|à|a)\s*\d+(?:[.,]\d+)?)?$/);
    if (m) return parseFloat(m[1].replace(',', '.'));
    return null;
  },

  unite(t) {
    if (!t) return null;
    const n = App.u.norm(t).replace(/\s+/g, ' ').trim();
    const raw = t.toLowerCase().trim();
    return this.UNITES.find(U => U.re.test(raw) || U.re.test(n)) || null;
  },

  /** « 200 g de riz », « 2 courgettes », « 1 c. à s. d’huile d’olive », « Sel, poivre », « Courgettes : 300 g » */
  lireLigne(ligne) {
    let l = ligne.replace(/^[\s\-–—•*·▢☐☑✔✅◦○●▪︎▫️]+/u, '').replace(/[’`]/g, "'").trim();
    if (!l) return null;
    let qte = null, unite = null;
    // Quantité en fin de ligne : « Courgettes : 300 g » ou « courgettes (300 g) »
    let fin = l.match(/^(.+?)\s*[:(]\s*(\d+(?:[.,]\d+)?|[½¼¾])\s*([a-zA-Zàâçéèêëîïôûù.\s]*?)\)?\s*$/);
    if (fin && !/^\d/.test(l)) {
      qte = this.nombre(fin[2]); unite = this.unite(fin[3]); l = fin[1];
    } else {
      const m = l.match(/^((?:\d+(?:[.,]\d+)?\s*(?:\/\s*\d+)?(?:\s*(?:-|à)\s*\d+)?)|[½¼¾⅓⅔]|\d+\s*[½¼¾]|un|une|deux|trois|quatre|cinq|six|demi|demie)\s*(.*)$/i);
      if (m) {
        qte = this.nombre(m[1]);
        let rest = m[2];
        // Unité éventuelle (jusqu'à 4 mots : « cuillères à soupe »)
        const mots = rest.split(/\s+/);
        for (let n = Math.min(4, mots.length); n >= 1; n--) {
          const cand = mots.slice(0, n).join(' ').replace(/[.,]$/, '');
          const U = this.unite(cand);
          if (U) { unite = U; rest = mots.slice(n).join(' '); break; }
        }
        l = rest;
      }
    }
    const nom = l.replace(/^(de |d'|du |des )/i, '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/[,;].*$/, '').trim();
    return { qte, unite, nom };
  },

  /** Ingrédient de l'app le plus proche d'un nom libre (ou null). */
  correspondance(nomLibre, state) {
    const n = App.u.norm(nomLibre).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!n) return { id: null, ignore: true };
    // Synonymes : expression la plus longue d'abord
    const cles = Object.keys(this.SYNONYMES).sort((a, b) => b.length - a.length);
    for (const k of cles) {
      if ((' ' + n + ' ').includes(' ' + k + ' ') || n === k || n === k + 's') {
        const id = this.SYNONYMES[k];
        if (id === '__nouveau') return { id: null };        // ingrédient à créer (absent de la liste)
        return id ? { id } : { id: null, ignore: true };   // sel, poivre, eau : ignorés
      }
    }
    const mots = n.split(' ').filter(m => m.length >= 3 && !this.MOTS_VIDES.has(m)).map(m => m.replace(/(x|s)$/, ''));
    if (!mots.length) return { id: null };
    let best = null, bestScore = 0;
    state.ingredients.forEach(i => {
      const nomI = App.u.norm(i.nom).replace(/[^a-z0-9 ]/g, ' ');
      const motsI = nomI.split(/\s+/).map(m => m.replace(/(x|s)$/, ''));
      let s = 0;
      mots.forEach((m, k) => { if (motsI.includes(m)) s += k === 0 ? 3 : 2; else if (nomI.includes(m)) s += 1; });
      if (s > bestScore) { bestScore = s; best = i; }
    });
    return bestScore >= 2 ? { id: best.id } : { id: null };
  },

  /** Convertit la quantité lue dans l'unité de l'ingrédient de l'app. */
  convertir(lu, ing) {
    if (!ing) return null;
    if (lu.qte == null) return null;
    const U = lu.unite;
    if (U && U.u === null) return null;               // une pincée, un filet : « un peu »
    let q = U && U.f ? lu.qte * U.f : lu.qte;
    const uLu = U ? U.u : 'pc';
    if (uLu === ing.unite) return Math.round(q * 10) / 10;
    if (['g', 'ml'].includes(uLu) && ['g', 'ml'].includes(ing.unite)) return Math.round(q);
    const poids = this.POIDS_PIECE[ing.id];
    if (uLu === 'pc' && ing.unite === 'g') return poids ? Math.round(q * poids) : Math.round(q * 100);
    if (['g', 'ml'].includes(uLu) && ['pc', 'boîte'].includes(ing.unite)) return poids ? Math.max(1, Math.round(q / poids * 10) / 10) : 1;
    if (ing.unite === 'pot') return null;
    return Math.round(q * 10) / 10;
  },

  /** Titre propre : sans emojis, hashtags ni astérisques. */
  titre(l) {
    return l.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/[#*_]/g, '').replace(/\s+/g, ' ').trim();
  },

  /** Analyse complète d'un texte collé. */
  analyser(texte, state) {
    const lignes = String(texte || '').replace(/\r/g, '').split('\n').map(l => l.trim());
    const res = { nom: '', portions: null, ingredients: [], etapes: [], lien: '', inconnus: [] };
    const reIng = /^(ingr[ée]dients?|il vous faut|liste des ingr|pour la (p[âa]te|sauce|garniture))/i;
    const reEtapes = /^(pr[ée]paration|[ée]tapes?|instructions?|m[ée]thode|d[ée]roulement|recette|r[ée]alisation|cuisson)\s*:?\s*$/i;
    const rePortions = /(?:pour\s*:?\s*(\d+)\s*(?:pers|personnes?|portions?|parts?)?)|(\d+)\s*(?:pers\.?|personnes?|portions?|parts?|couverts?)/i;
    let section = null;

    lignes.forEach(l => {
      if (!l) return;
      const url = l.match(/https?:\/\/\S+/);
      if (url) { if (!res.lien) res.lien = url[0]; return; }
      const p = l.match(rePortions);
      if (p && !res.portions && l.length < 60) { res.portions = +(p[1] || p[2]); if (!/ingr/i.test(l)) return; }
      if (reIng.test(l)) { section = 'ing'; return; }
      if (reEtapes.test(l)) { section = 'etapes'; return; }
      if (/^#|^@/.test(l) || /^(\p{Emoji_Presentation}|\s)+$/u.test(l)) return; // hashtags, mentions, emojis seuls

      const numerotee = l.match(/^(?:[ée]tape\s*)?(\d{1,2})\s*[.)\-:]\s+(.{6,})$/i);
      const lu = this.lireLigne(l);
      const ressembleIngredient = lu && (lu.qte != null || lu.unite) && l.length < 80 && !numerotee;

      if (section === 'etapes' || numerotee) { res.etapes.push((numerotee ? numerotee[2] : l).trim()); return; }
      if (section === 'ing' || ressembleIngredient || (/^[-•*·▢☐]/.test(l) && l.length < 60)) {
        if (section !== 'ing' && !ressembleIngredient && !res.nom) { res.nom = App.importer.titre(l); return; }
        res.ingredients.push({ brut: l, ...lu });
        return;
      }
      if (!res.nom && l.length <= 90) { res.nom = App.importer.titre(l); return; }
      if (l.length > 25) res.etapes.push(l);
    });

    // Relier chaque ingrédient à la liste de courses
    res.lignes = [];
    res.ingredients.forEach(x => {
      const c = this.correspondance(x.nom, state);
      if (c.ignore) return;
      const ing = c.id ? App.store.ingredient(c.id) : null;
      res.lignes.push({ brut: x.brut, nom: x.nom, id: c.id, qte: ing ? this.convertir(x, ing) : x.qte, unite: x.unite });
    });
    res.nom = res.nom || 'Recette importée';
    return res;
  },

  /** Transforme l'analyse en brouillon de fiche (avec création des ingrédients inconnus). */
  brouillon(a, state) {
    const ingredients = [];
    const nouveaux = [];
    a.lignes.forEach(x => {
      let id = x.id;
      if (!id) {
        const nom = x.nom.charAt(0).toUpperCase() + x.nom.slice(1);
        const exist = state.ingredients.find(i => App.u.norm(i.nom) === App.u.norm(nom));
        if (exist) id = exist.id;
        else {
          const unite = x.unite && x.unite.u ? x.unite.u : 'pc';
          id = 'imp-' + App.u.uid();
          nouveaux.push({ id, nom, rayon: 'Divers', unite, pack: unite === 'pc' ? 1 : 500, prix: 0, placard: false,
            lieu: 'drive', kcal: null, stockMin: 0, importe: true });
        }
        if (x.unite && x.unite.u === null) x.qte = null;   // « une pincée » : un peu
        else x.qte = x.qte != null && x.unite && x.unite.f ? x.qte * x.unite.f : x.qte;
      }
      ingredients.push([id, x.qte]);
    });
    const ids = ingredients.map(([id]) => id);
    const contient = l => l.some(i => ids.includes(i));
    const tags = [];
    if (contient(['saumon', 'truite-fumee', 'maquereau', 'sardines'])) tags.push('poisson-gras');
    else if (contient(['cabillaud', 'lieu-noir', 'thon'])) tags.push('poisson');
    if (contient(['crevettes', 'fruits-mer'])) tags.push('fruits-de-mer');
    if (contient(['poulet-filet', 'poulet-cuisse', 'dinde'])) tags.push('volaille');
    if (contient(['boeuf-hache', 'boeuf-bavette', 'boeuf-braiser'])) tags.push('viande-rouge');
    if (!tags.length) tags.push('vegetarien');
    if (contient(['lentilles', 'lentilles-corail', 'pois-chiches', 'haricots-blancs', 'haricots-rouges'])) tags.push('legumineuses');
    if (/vitesse|varoma|thermomix|sens inverse/i.test(a.etapes.join(' '))) tags.push('thermomix');
    const n = App.u.norm(a.nom);
    const sucre = contient(['sucre', 'chocolat-noir', 'cacao', 'sirop-erable']) && !contient(['poulet-filet', 'boeuf-hache', 'saumon']);
    const categorie = sucre ? 'Douceurs' : /risotto|pate|penne|spaghetti|lasagne|gnocchi|tagliatelle/.test(n) ? 'Pâtes & risottos'
      : /salade|bowl|taboule/.test(n) ? 'Salades' : tags.includes('poisson') || tags.includes('poisson-gras') ? 'Poisson' : 'Plats';
    return {
      nouveaux,
      repas: {
        nom: a.nom, categorie, tags, ingredients, portions: a.portions || 2, cookidoo: a.lien || '',
        notes: a.etapes.map((e, i) => `${i + 1}. ${e}`).join('\n')
      }
    };
  }
};
