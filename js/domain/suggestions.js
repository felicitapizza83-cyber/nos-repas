/* Objectif de la semaine + envies → repas recommandés. */
App.suggest = {
  objectif(semaine) {
    return semaine.objectifId ? App.store.objectif(semaine.objectifId) : null;
  },

  score(r, objectif) {
    if (!objectif) return 0;
    return r.tags.reduce((s, t) =>
      s + (objectif.favoriser.includes(t) ? 2 : 0) - (objectif.limiter.includes(t) ? 2 : 0), 0);
  },

  /** Nombre d'ingrédients frais du repas déjà présents dans le garde-manger. */
  utiliseRestes(r, restes) {
    return r.ingredients.filter(([id]) => restes[id] > 0).length;
  },

  conseille(r, objectif) { return !!objectif && App.suggest.score(r, objectif) >= 4; },

  /** Repas classés pour la semaine : objectif, pas déjà au menu, pas mangés la semaine d'avant. */
  classer(state, semaine) {
    const obj = App.suggest.objectif(semaine);
    const dejaCetteSemaine = new Set(Object.values(semaine.slots).map(s => s && s.repasId));
    const prec = state.semaines[App.u.addWeeks(state.semaineActive, -1)];
    const semainePrec = new Set(prec ? Object.values(prec.slots).map(s => s && s.repasId) : []);
    const restes = App.stock.frais(state);
    const vite = new Set(App.stock.aUtiliserVite(state).map(x => x.id));
    return state.repas
      .filter(r => r.categorie !== 'Douceurs')
      .map(r => ({
        r,
        s: App.suggest.score(r, obj)
          - (dejaCetteSemaine.has(r.id) ? 5 : 0)
          - (semainePrec.has(r.id) ? 1.5 : 0)
          + Math.min(4, 2 * App.suggest.utiliseRestes(r, restes))
          + 2 * r.ingredients.filter(([id]) => vite.has(id)).length
          + (r.favori ? 2 : 0) + ({ adore: 2, refaire: 1, bof: -3 }[r.avis] || 0)
          + Math.random() * 3
      }))
      .sort((a, b) => b.s - a.s)
      .map(x => x.r);
  },

  /** Remplit les cases vides de la semaine (soirs, et midis si activés). */
  remplir(state, semaine) {
    const libres = [];
    App.JOURS.forEach(j => App.MOMENTS.forEach(m => {
      if (m.id === 'midi' && !state.settings.midis) return;
      const id = `${j.id}-${m.id}`;
      if (!semaine.slots[id]) libres.push(id);
    }));
    const choix = App.suggest.classer(state, semaine);
    // Ce qui est déjà au menu compte dans la variété
    const compte = {};
    Object.values(semaine.slots).forEach(s => {
      const r = s && s.repasId && App.store.repas(s.repasId);
      if (r) { const f = App.suggest.famille(r); compte[f] = (compte[f] || 0) + 1; }
    });
    const pris = new Set(Object.values(semaine.slots).map(s => s && s.repasId));
    let precedent = null;
    libres.forEach(id => {
      const ok = r => !pris.has(r.id)
        && (compte[App.suggest.famille(r)] || 0) < (App.suggest.MAX_PAR_SEMAINE[App.suggest.famille(r)] ?? 3)
        && App.suggest.famille(r) !== precedent; // pas deux fois la même famille d'affilée
      const r = choix.find(ok) || choix.find(x => !pris.has(x.id)) || choix[0];
      if (!r) return;
      semaine.slots[id] = { type: 'maison', repasId: r.id };
      pris.add(r.id);
      const f = App.suggest.famille(r);
      compte[f] = (compte[f] || 0) + 1;
      precedent = f;
    });
    if (semaine.douceurs == null) App.suggest.proposerDouceurs(state, semaine);
    return libres.length;
  },

  /** Variété : nombre maximum de repas d'une même « famille » par semaine. */
  MAX_PAR_SEMAINE: {
    oeufs: 1, risotto: 1, pates: 3, soupe: 2, salade: 3, tarte: 1,
    'viande-rouge': 2, volaille: 4, poisson: 3, legumineuses: 3, vegetarien: 3
  },

  /** Famille d'un repas : sert à éviter trois omelettes ou quatre plats de pâtes la même semaine. */
  famille(r) {
    const n = App.u.norm(r.nom);
    if (/omelette|tortilla|chakchouka|galette/.test(n)) return 'oeufs';
    if (/risotto/.test(n)) return 'risotto';
    if (/tarte|quiche|pizza/.test(n)) return 'tarte';
    if (/soupe|veloute|harira|minestrone/.test(n)) return 'soupe';
    if (r.categorie === 'Salades' || /salade|taboule|bowl/.test(n)) return 'salade';
    if (r.categorie === 'Pâtes & risottos' || /pate|penne|rigatoni|linguine|lasagne|gnocchi|spaghetti/.test(n)) return 'pates';
    const t = r.tags;
    if (t.includes('poisson') || t.includes('poisson-gras') || t.includes('fruits-de-mer')) return 'poisson';
    if (t.includes('viande-rouge')) return 'viande-rouge';
    if (t.includes('volaille')) return 'volaille';
    if (t.includes('legumineuses')) return 'legumineuses';
    return 'vegetarien';
  },

  // ----- Gâteaux de la semaine : 2 différents, sans reprendre ceux des 3 dernières semaines -----
  gateaux(state) { return state.repas.filter(r => r.categorie === 'Douceurs' && r.classique); },

  douceursRecentes(state, k = state.semaineActive, n = 3) {
    const ids = new Set();
    for (let i = 1; i <= n; i++) {
      const w = state.semaines[App.u.addWeeks(k, -i)];
      (w && w.douceurs || []).forEach(id => ids.add(id));
    }
    return ids;
  },

  candidatsDouceur(state, semaine, exclure = []) {
    const recentes = App.suggest.douceursRecentes(state);
    const deja = new Set([...(semaine.douceurs || []), ...exclure]);
    const tous = App.suggest.gateaux(state).filter(r => !deja.has(r.id));
    const frais = tous.filter(r => !recentes.has(r.id));
    const pool = frais.length ? frais : tous;
    return pool.sort(() => Math.random() - 0.5);
  },

  proposerDouceurs(state, semaine) {
    semaine.douceurs = [];
    const n = state.settings.douceursParSemaine;
    App.suggest.candidatsDouceur(state, semaine).slice(0, n).forEach(r => semaine.douceurs.push(r.id));
  },

  remplacerDouceur(state, semaine, id) {
    const [autre] = App.suggest.candidatsDouceur(state, semaine, [id]);
    if (!autre) return null;
    semaine.douceurs = semaine.douceurs.map(x => x === id ? autre.id : x);
    return autre;
  },

  /** Repas de la bibliothèque qui correspondent à une envie (« poisson », « pâtes crème »…). */
  pourEnvie(texte, state) {
    const mots = App.u.norm(texte).split(/[^a-z0-9]+/).filter(m => m.length >= 3);
    if (!mots.length) return [];
    return state.repas
      .map(r => {
        const hay = App.u.norm(r.nom + ' ' + r.categorie + ' ' +
          r.tags.map(t => window.APP_DATA.tags[t] || t).join(' ') + ' ' +
          r.ingredients.map(([id]) => (App.store.ingredient(id) || {}).nom || id).join(' '));
        const s = mots.reduce((n, m) => n + (hay.includes(m) || hay.includes(m.replace(/s$/, '')) ? 1 : 0), 0);
        return { r, s };
      })
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
      .map(x => x.r);
  }
};
