/* Consignes : la phrase de l'accueil comprise comme une demande pour le menu (sans IA).
   « Végétarien tous les soirs », « j'ai mes règles douloureuses », « pas de champignons cette semaine »,
   « du poisson vendredi », « rapide ce week-end »…
   Une consigne a une PORTÉE (quels repas) et des RÈGLES (exclure, exiger, favoriser) ;
   elle adapte les repas proposés par l'app, garde ceux choisis à la main, et peut être annulée. */
App.consignes = {
  /** États du corps : ce qui fait du bien, ce qui est à éviter, et un conseil. */
  ETATS: [
    { id: 'regles', label: 'Règles douloureuses', mots: ['regles', 'menstru', 'crampe', 'dysmenor', 'mes ragnagnas'], jours: 3,
      favoriser: ['legumineuses', 'feuilles-vertes', 'poisson-gras', 'viande-rouge', 'reconfortant', 'cereales-completes'],
      noms: ['lentille', 'dahl', 'epinard', 'soupe', 'veloute', 'curry', 'saumon', 'sardine', 'maquereau', 'pois chiche'],
      eviter: ['cru', 'fromage'],
      conseil: 'Fer (lentilles, épinards, viande rouge), magnésium (chocolat noir, noix, légumineuses), oméga-3 (poisson gras) et plats chauds. Une tisane de gingembre et une bouillotte aident aussi. Si les douleurs sont fortes ou inhabituelles, parlez-en au médecin.' },
    { id: 'fatigue', label: 'Fatigue', mots: ['fatigu', 'epuise', 'crevee', 'creve', 'a plat', 'pas d energie', 'manque d energie', 'naze', 'videe'], jours: 3,
      favoriser: ['volaille', 'viande-rouge', 'legumineuses', 'feuilles-vertes', 'cereales-completes', 'rapide'], noms: ['lentille', 'epinard'], eviter: [],
      conseil: 'Protéines et fer à chaque repas, céréales complètes, et des plats rapides pour souffler. Avec l’allaitement, pensez à bien boire.' },
    { id: 'ventre', label: 'Ventre sensible', mots: ['ballonn', 'gonfle', 'digestion', 'digere', 'mal au ventre', 'ventre', 'brulure d estomac', 'reflux'], jours: 2,
      favoriser: ['leger'], noms: ['soupe', 'veloute', 'vapeur', 'papillote', 'riz'], eviter: ['cru', 'legumineuses', 'epices', 'fromage'],
      conseil: 'Plats cuits et simples, peu de crudités, de légumineuses et d’épices pendant 2-3 jours ; une tisane menthe ou fenouil après le repas.' },
    { id: 'rhume', label: 'Malade', mots: ['rhume', 'malade', 'grippe', 'gorge', 'tousse', 'toux', 'fievre', 'enrhume', 'covid'], jours: 3,
      favoriser: ['reconfortant', 'legumes', 'epices'], noms: ['soupe', 'veloute', 'bouillon', 'harira', 'curry', 'dahl'], eviter: ['cru'],
      conseil: 'Soupes et plats chauds, légumes colorés (vitamine C), gingembre et ail ; beaucoup boire et se reposer.' },
    { id: 'transit', label: 'Transit paresseux', mots: ['constip', 'transit'], jours: 4,
      favoriser: ['legumes', 'legumineuses', 'cereales-completes', 'feuilles-vertes'], noms: [], eviter: [],
      conseil: 'Des fibres (légumes, légumineuses, céréales complètes, pruneaux) et beaucoup d’eau.' },
    { id: 'stress', label: 'Stress', mots: ['stress', 'angoiss', 'anxi', 'deprim', 'moral', 'tendu', 'nerveu', 'tete dans le guidon'], jours: 4,
      favoriser: ['poisson-gras', 'legumineuses', 'cereales-completes', 'feuilles-vertes', 'reconfortant'], noms: [], eviter: [],
      conseil: 'Magnésium (légumineuses, céréales complètes, chocolat noir, oléagineux) et oméga-3 (poisson gras) ; des repas réguliers, sans sauter le dîner.' },
    { id: 'nausee', label: 'Nausées', mots: ['nause', 'envie de vomir', 'barbouill', 'mal au coeur', 'ecoeure'], jours: 2,
      favoriser: ['leger'], noms: ['riz', 'soupe', 'pates', 'puree'], eviter: ['epices', 'fromage', 'viande-rouge', 'poisson-gras'],
      conseil: 'Petites portions, plats simples et peu odorants ; boire par petites gorgées. Si ça dure, consultez.' },
    { id: 'lait', label: 'Allaitement', mots: ['lactation', 'montee de lait', 'peu de lait', 'pas assez de lait', 'tire-lait', 'tirelait', 'allaite'], jours: 7,
      favoriser: ['poisson-gras', 'legumineuses', 'cereales-completes', 'feuilles-vertes'], noms: ['avoine', 'saumon', 'lentille', 'pois chiche'], eviter: [],
      conseil: 'Flocons d’avoine, poisson gras, légumineuses et beaucoup d’eau ; manger à sa faim à chaque repas. La sage-femme ou une consultante en lactation peut aider.' },
    { id: 'sport', label: 'Sport', mots: ['sport', 'muscu', 'entrainement', 'seance', 'footing', 'course a pied', 'salle de sport'], jours: 3,
      favoriser: ['volaille', 'oeufs', 'legumineuses', 'poisson', 'cereales-completes'], noms: [], eviter: [],
      conseil: 'Des protéines à chaque repas et des féculents complets les jours d’entraînement.' },
    { id: 'faim', label: 'Grosse faim', mots: ['affame', 'tres faim', 'grosse faim', 'fringale', 'toujours faim'], jours: 3,
      favoriser: ['legumineuses', 'cereales-completes', 'reconfortant'], noms: [], eviter: ['leger'],
      conseil: 'Des plats rassasiants : légumineuses, céréales complètes et protéines.' },
    { id: 'leger', label: 'Envie de léger', mots: ['pas faim', 'peu faim', 'trop mange', 'exces', 'abuse', 'lourde', 'lourd'], jours: 3,
      favoriser: ['leger', 'legumes', 'cru'], noms: ['salade', 'soupe', 'veloute', 'papillote'], eviter: ['fromage', 'reconfortant'],
      conseil: 'Plats légers et riches en légumes pour quelques jours, sans sauter de repas.' }
  ],

  /** Régimes et contraintes : ce qu'on exclut (ou exige). L'ordre compte (le plus précis d'abord). */
  REGIMES: [
    { id: 'vegetarien', label: 'Végétarien', mots: ['vegetarien', 'vegetarienne', 'vege', 'veggie', 'sans viande ni poisson', 'ni viande ni poisson'],
      rayons: ['Boucherie & volaille', 'Poissonnerie'], tags: ['volaille', 'viande-rouge', 'poisson', 'poisson-gras', 'fruits-de-mer'], ings: ['thon', 'maquereau', 'sardines', 'crevettes', 'fruits-mer', 'lieu-noir'] },
    { id: 'sans-viande', label: 'Sans viande', mots: ['sans viande', 'pas de viande', 'moins de viande', 'zero viande'],
      rayons: ['Boucherie & volaille'], tags: ['volaille', 'viande-rouge'], ings: [] },
    { id: 'sans-poisson', label: 'Sans poisson', mots: ['sans poisson', 'pas de poisson', 'sans fruits de mer', 'pas de fruits de mer'],
      rayons: ['Poissonnerie'], tags: ['poisson', 'poisson-gras', 'fruits-de-mer'], ings: ['thon', 'maquereau', 'sardines', 'crevettes', 'fruits-mer', 'lieu-noir'] },
    { id: 'sans-gluten', label: 'Sans gluten', mots: ['sans gluten', 'gluten', 'coeliaque'],
      rayons: [], tags: [], ings: ['pates', 'linguine', 'lasagne', 'farine', 'pain', 'tortilla-wrap', 'semoule', 'boulgour', 'nouilles', 'pate-brisee', 'pate-pizza', 'pain-pita', 'pain-burger', 'tortellini', 'gnocchi', 'flocons-avoine', 'galette-sarrasin', 'sauce-soja', 'sauce-teriyaki'] },
    { id: 'sans-lactose', label: 'Sans lactose', mots: ['sans lactose', 'lactose', 'sans produits laitiers', 'sans laitage', 'pas de laitage', 'sans fromage', 'pas de fromage'],
      rayons: [], tags: ['fromage'], ings: ['lait', 'creme', 'fromage-blanc', 'yaourt-grec', 'beurre', 'feta', 'mozzarella', 'parmesan', 'cheddar', 'gorgonzola', 'fromage-chevre', 'ricotta', 'emmental', 'tortellini'] },
    { id: 'rapide', label: 'Rapide', mots: ['rapide', 'pas le temps', 'vite fait', 'peu de temps', 'debordee', 'deborde', 'press', 'sans cuisiner', 'flemme'],
      exiger: ['rapide'] },
    { id: 'leger-regime', label: 'Léger', mots: ['leger', 'legere', 'light', 'mincir', 'regime', 'healthy'],
      favoriserRegime: ['leger', 'legumes', 'cru'] }
  ],

  JOURS: { lundi: 'lun', mardi: 'mar', mercredi: 'mer', jeudi: 'jeu', vendredi: 'ven', samedi: 'sam', dimanche: 'dim' },
  /** Mots qui ne désignent pas un ingrédient après « pas de » / « sans ». */
  PAS_INGREDIENT: ['viande', 'poisson', 'gluten', 'lactose', 'produits', 'laitage', 'fromage', 'fruits', 'temps', 'sucre', 'sel', 'faim',
    'envie', 'repas', 'cuisine', 'cuisiner', 'energie', 'lait', 'force', 'courage', 'idee', 'midi', 'soir'],

  // ---------- Lecture de la phrase ----------
  /** Renvoie une consigne, ou null si la phrase est une simple envie de plat. */
  analyser(texte, state) {
    const n = ' ' + App.u.norm(texte).replace(/['’]/g, ' ').replace(/\s+/g, ' ') + ' ';
    const contient = m => n.includes(App.u.norm(m));
    const etats = App.consignes.ETATS.filter(E => E.mots.some(contient));
    const regimes = [];
    App.consignes.REGIMES.forEach(R => {
      if (!R.mots.some(contient)) return;
      if (R.id === 'sans-viande' && regimes.some(x => x.id === 'vegetarien')) return;
      regimes.push(R);
    });
    // « Pas de champignons », « sans oignon », « je n'aime pas les poivrons »
    const exclus = [];
    const re = /(?:\bpas de |\bpas d |\bsans |\bplus de |\bjamais de |\bn aime pas (?:les |le |la |l )?|\bdeteste (?:les |le |la |l )?)([a-z-]+(?: [a-z-]+)?)/g;
    let m;
    while ((m = re.exec(n))) {
      const mot = m[1].split(' ')[0].replace(/s$/, '');
      if (mot.length < 3 || App.consignes.PAS_INGREDIENT.some(x => mot.startsWith(x))) continue;
      state.ingredients.forEach(i => {
        const nom = App.u.norm(i.nom);
        if (nom.includes(mot) && !exclus.includes(i.id)) exclus.push(i.id);
      });
    }
    // Plat ou type de cuisine demandé (« du poisson vendredi », « oriental tout le week-end »)
    const positifs = regimes.length || etats.length ? [] :
      App.suggest.ENVIES.filter(R => !R.douceur && R.mots.some(mm => mm.length > 3 && n.includes(' ' + App.u.norm(mm))));

    const portee = App.consignes.portee(n, state);
    const estConsigne = etats.length || regimes.length || exclus.length || (positifs.length && portee.explicite);
    if (!estConsigne) return null;

    // « Du poisson vendredi » : un seul repas (le soir), sauf « tous les… »
    if (!etats.length && !regimes.length && !exclus.length && portee.moments.length === 2 && !/ tous | toutes | chaque /.test(n)) portee.moments = ['soir'];
    const jours = portee.explicite ? null : (etats.length ? Math.max(...etats.map(e => e.jours)) : null);
    return {
      etats: etats.map(e => e.id),
      regimes: regimes.map(r => r.id),
      exclus,
      positifs: positifs.map(p => App.suggest.ENVIES.indexOf(p)),
      moments: portee.moments,
      jours: portee.jours,
      nbJours: jours,
      porteeTexte: jours ? `${jours} prochains jours` : portee.texte
    };
  },

  /** Quels repas sont concernés : moments (midi / soir) et jours. */
  portee(n, state) {
    const has = r => r.test(n);
    let moments = [];
    if (has(/ soirs? | diners? | souper/)) moments.push('soir');
    if (has(/ midis? | dejeuners? | dej /)) moments.push('midi');
    if (!moments.length) moments = ['midi', 'soir'];
    if (!state.settings.midis) moments = moments.filter(x => x !== 'midi');

    const auj = App.JOURS[App.u.todayIndex()].id;
    const demain = App.JOURS[(App.u.todayIndex() + 1) % 7].id;
    let jours = null, texte = '', explicite = false;
    const nommes = Object.entries(App.consignes.JOURS).filter(([nom]) => has(new RegExp(` ${nom}s? `))).map(([, id]) => id);
    if (nommes.length) { jours = nommes; texte = nommes.map(id => App.JOURS.find(j => j.id === id).nom.toLowerCase()).join(', '); explicite = true; }
    else if (has(/ week-?end /)) { jours = ['sam', 'dim']; texte = 'le week-end'; explicite = true; }
    else if (has(/ en semaine /)) { jours = ['lun', 'mar', 'mer', 'jeu', 'ven']; texte = 'en semaine'; explicite = true; }
    else if (has(/ ce soir /)) { jours = [auj]; moments = ['soir']; texte = 'ce soir'; explicite = true; }
    else if (has(/ ce midi /)) { jours = [auj]; moments = ['midi']; texte = 'ce midi'; explicite = true; }
    else if (has(/ aujourd hui /)) { jours = [auj]; texte = 'aujourd’hui'; explicite = true; }
    else if (has(/ demain /)) { jours = [demain]; texte = 'demain'; explicite = true; }
    else if (has(/ tous les | toutes les | chaque | toute la semaine | cette semaine | les soirs | les midis | tout le temps /)) { texte = 'toute la semaine'; explicite = true; }
    else texte = 'toute la semaine';
    const qui = moments.length === 2 ? '' : moments[0] === 'soir' ? 'les soirs' : 'les midis';
    if (qui && !['ce soir', 'ce midi'].includes(texte)) texte = `${qui} · ${texte}`;
    return { moments, jours, texte, explicite };
  },

  // ---------- Règles ----------
  regles(c) {
    const R = { rayons: [], tags: [], ings: [...(c.exclus || [])], exiger: [], favoriser: [], noms: [], eviter: [], positifs: [] };
    c.regimes.forEach(id => {
      const g = App.consignes.REGIMES.find(x => x.id === id);
      if (!g) return;
      R.rayons.push(...(g.rayons || [])); R.tags.push(...(g.tags || [])); R.ings.push(...(g.ings || []));
      R.exiger.push(...(g.exiger || [])); R.favoriser.push(...(g.favoriserRegime || []));
    });
    c.etats.forEach(id => {
      const e = App.consignes.ETATS.find(x => x.id === id);
      if (!e) return;
      R.favoriser.push(...e.favoriser); R.noms.push(...e.noms); R.eviter.push(...e.eviter);
    });
    R.positifs = (c.positifs || []).map(i => App.suggest.ENVIES[i]).filter(Boolean);
    // Une contrainte l'emporte sur un conseil (ex. végétarien + règles : pas de viande rouge)
    R.favoriser = R.favoriser.filter(t => !R.tags.includes(t));
    return R;
  },

  /** Le repas respecte-t-il les exclusions ? */
  respecte(r, R) {
    if (r.tags.some(t => R.tags.includes(t))) return false;
    return !r.ingredients.some(([id]) => {
      if (R.ings.includes(id)) return true;
      const ing = App.store.ingredient(id);
      return ing && R.rayons.includes(ing.rayon);
    });
  },

  /** Correspond-il à ce qui est demandé (rapide, poisson…) ? */
  correspond(r, R) {
    if (R.exiger.length && !R.exiger.every(t => r.tags.includes(t))) return false;
    if (R.positifs.length) {
      const nom = App.u.norm(r.nom);
      return R.positifs.some(P => (P.cat && r.categorie === P.cat) || P.tags.some(t => r.tags.includes(t)) || P.noms.some(x => nom.includes(App.u.norm(x))));
    }
    return true;
  },

  /** Points « ça fait du bien » (états du corps, léger…). */
  bienfait(r, R) {
    const nom = App.u.norm(r.nom);
    return r.tags.filter(t => R.favoriser.includes(t)).length * 2
      + R.noms.filter(x => nom.includes(App.u.norm(x))).length * 2
      - r.tags.filter(t => R.eviter.includes(t)).length * 3;
  },

  /** Cases du menu concernées (repas adultes à venir de la semaine affichée). */
  cases(state, c) {
    let ids = App.suggest.casesAVenir(state).filter(id => {
      const [j, mo] = id.split('-');
      return c.moments.includes(mo) && (!c.jours || c.jours.includes(j));
    });
    if (c.nbJours) {
      const jours = [...new Set(ids.map(id => id.split('-')[0]))].slice(0, c.nbJours);
      ids = ids.filter(id => jours.includes(id.split('-')[0]));
    }
    return ids;
  },

  /** Le meilleur repas pour une case, en respectant la consigne et la variété. */
  choisir(state, semaine, R, slotId) {
    const pris = new Set(Object.entries(semaine.slots).filter(([id]) => id !== slotId).map(([, s]) => s && s.repasId));
    const compte = {};
    Object.entries(semaine.slots).forEach(([id, s]) => {
      const r = id !== slotId && s && s.repasId && App.store.repas(s.repasId);
      if (r && r.categorie !== 'Bébé') { const f = App.suggest.famille(r); compte[f] = (compte[f] || 0) + 1; }
    });
    const okFam = r => (compte[App.suggest.famille(r)] || 0) < (App.suggest.MAX_PAR_SEMAINE[App.suggest.famille(r)] ?? 3);
    const classes = App.suggest.classer(state, semaine);
    const valides = classes.filter(r => App.consignes.respecte(r, R) && App.consignes.correspond(r, R));
    const rang = new Map(classes.map((r, i) => [r.id, i]));
    const trier = l => l.slice().sort((a, b) => (App.consignes.bienfait(b, R) - App.consignes.bienfait(a, R)) || (rang.get(a.id) - rang.get(b.id)));
    return trier(valides.filter(r => !pris.has(r.id) && okFam(r)))[0]
      || trier(valides.filter(r => !pris.has(r.id)))[0]
      || trier(valides)[0] || null;
  },

  /** Applique la consigne au menu de la semaine. Renvoie le bilan. */
  appliquer(state, semaine, e) {
    const c = e.consigne, R = App.consignes.regles(c);
    const bilan = { changes: [], gardes: [], cases: 0 };
    c.avant = c.avant || {};
    App.consignes.cases(state, c).forEach(slotId => {
      bilan.cases++;
      const s = semaine.slots[slotId];
      if (s && ['ext', 'restes', 'reporte'].includes(s.type)) return;
      if (s && s.consomme) return;
      const r = s && s.repasId && App.store.repas(s.repasId);
      const ok = r && App.consignes.respecte(r, R) && App.consignes.correspond(r, R);
      const aFavoriser = R.favoriser.length || R.noms.length;
      if (ok && (!aFavoriser || App.consignes.bienfait(r, R) > 0 || s.source === 'manuel')) return;
      // Choisi à la main (ou une envie) : on ne touche pas, on signale si ça ne respecte pas la consigne
      if (s && (s.source === 'manuel' || s.envieId) && s.consigneId !== e.id) { if (!ok) bilan.gardes.push(slotId); return; }
      const nouveau = App.consignes.choisir(state, semaine, R, slotId);
      if (!nouveau || (r && nouveau.id === r.id)) return;
      if (!(slotId in c.avant)) c.avant[slotId] = s ? JSON.parse(JSON.stringify(s)) : null;
      App.stock.annulerConso(state, s);
      semaine.slots[slotId] = { type: 'maison', repasId: nouveau.id, source: 'consigne', consigneId: e.id };
      bilan.changes.push(slotId);
    });
    c.changes = bilan.changes; c.gardes = bilan.gardes;
    return bilan;
  },

  /** Annule la consigne : les repas qu'elle avait changés reviennent (s'ils n'ont pas été modifiés depuis). */
  annuler(state, semaine, e) {
    const c = e.consigne;
    if (!c) return;
    Object.entries(c.avant || {}).forEach(([slotId, avant]) => {
      const s = semaine.slots[slotId];
      if (!s || s.consigneId !== e.id) return;
      App.stock.annulerConso(state, s);
      if (avant) semaine.slots[slotId] = avant; else delete semaine.slots[slotId];
    });
    c.avant = {};
  },

  /** Consigne qui s'applique à une case (pour « Compléter le menu » et « Alléger »). */
  pour(state, semaine, slotId) {
    const liste = (semaine.envies || []).filter(e => e.consigne && !e.retiree);
    const actives = liste.filter(e => App.consignes.casesFixes(state, e).includes(slotId));
    if (!actives.length) return null;
    // Plusieurs consignes : on cumule leurs règles
    const R = App.consignes.regles(actives[0].consigne);
    actives.slice(1).forEach(e => {
      const x = App.consignes.regles(e.consigne);
      Object.keys(R).forEach(k => { R[k] = [...R[k], ...x[k]]; });
    });
    return R;
  },

  /** Cases d'une consigne telles qu'au moment où elle a été écrite (une consigne « 3 jours » ne glisse pas). */
  casesFixes(state, e) {
    const c = e.consigne;
    if (!c.casesFixes) c.casesFixes = App.consignes.cases(state, c);
    return c.casesFixes;
  },

  permis(state, semaine, slotId, r) {
    const R = App.consignes.pour(state, semaine, slotId);
    return !R || (App.consignes.respecte(r, R) && App.consignes.correspond(r, R));
  },

  // ---------- Textes ----------
  libelles(c) {
    return [
      ...c.regimes.map(id => (App.consignes.REGIMES.find(x => x.id === id) || {}).label),
      ...c.etats.map(id => (App.consignes.ETATS.find(x => x.id === id) || {}).label),
      ...(c.exclus.length ? [`Sans ${c.exclus.map(id => (App.store.ingredient(id) || { nom: id }).nom.toLowerCase()).slice(0, 3).join(', ')}`] : []),
      ...(c.positifs || []).map(i => { const P = App.suggest.ENVIES[i]; return P ? (P.cat || P.mots[0]).replace(/^./, x => x.toUpperCase()) : ''; })
    ].filter(Boolean);
  },

  conseils(c) {
    return c.etats.map(id => (App.consignes.ETATS.find(x => x.id === id) || {}).conseil).filter(Boolean);
  }
};
