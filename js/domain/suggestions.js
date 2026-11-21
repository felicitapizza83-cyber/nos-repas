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
      .filter(r => r.categorie !== 'Douceurs' && r.categorie !== 'Bébé')
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
    App.suggest.placerEnvies(state, semaine);
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
      if (r && r.categorie !== 'Bébé') { const f = App.suggest.famille(r); compte[f] = (compte[f] || 0) + 1; }
    });
    const pris = new Set(Object.values(semaine.slots).map(s => s && s.repasId));
    let precedent = null;
    libres.forEach(id => {
      // Case couverte par une consigne (végétarien, règles…) : le choix suit la consigne
      const R = App.consignes.pour(state, semaine, id);
      if (R) {
        const rc = App.consignes.choisir(state, semaine, R, id);
        if (rc) {
          semaine.slots[id] = { type: 'maison', repasId: rc.id, source: 'auto' };
          pris.add(rc.id);
          const f = App.suggest.famille(rc); compte[f] = (compte[f] || 0) + 1; precedent = f;
          return;
        }
      }
      const ok = r => !pris.has(r.id)
        && (compte[App.suggest.famille(r)] || 0) < (App.suggest.MAX_PAR_SEMAINE[App.suggest.famille(r)] ?? 3)
        && App.suggest.famille(r) !== precedent; // pas deux fois la même famille d'affilée
      const r = choix.find(ok) || choix.find(x => !pris.has(x.id)) || choix[0];
      if (!r) return;
      semaine.slots[id] = { type: 'maison', repasId: r.id, source: 'auto' };
      pris.add(r.id);
      const f = App.suggest.famille(r);
      compte[f] = (compte[f] || 0) + 1;
      precedent = f;
    });
    if (semaine.douceurs == null) App.suggest.proposerDouceurs(state, semaine);
    if (state.settings.bebe && state.settings.bebe.actif) App.suggest.remplirBebe(state, semaine);
    return libres.length;
  },

  /** Budget : remplace les plats choisis automatiquement les plus chers par des plats moins chers
      (bien classés pour l'objectif et variés) jusqu'à repasser sous le budget. Renvoie le nombre de changements. */
  alleger(state, semaine) {
    const k = state.semaineActive;
    let b = App.budget.resume(semaine, state, k);
    if (!b.depasse) return 0;
    const debut = App.u.isCurrentWeek(k) ? App.u.todayIndex() : (k < App.u.mondayOf() ? 7 : 0);
    const cout = r => App.shopping.coutRepas(r, state);
    const jourDe = id => App.JOURS.findIndex(j => id.startsWith(j.id + '-'));
    let n = 0;
    for (let it = 0; it < 14 && b.depasse; it++) {
      const cases = Object.entries(semaine.slots)
        .filter(([id, s]) => s && s.type === 'maison' && s.source === 'auto' && !id.includes('bebe') && jourDe(id) >= debut)
        .map(([id, s]) => ({ id, r: App.store.repas(s.repasId) }))
        .filter(x => x.r)
        .sort((a, c) => cout(c.r) - cout(a.r));
      const pris = new Set(Object.values(semaine.slots).map(s => s && s.repasId));
      const classes = App.suggest.classer(state, semaine).slice(0, 45);
      let fait = false;
      for (const c of cases) {
        const compte = {};
        Object.entries(semaine.slots).forEach(([id, s]) => {
          const r = id !== c.id && s && s.repasId && App.store.repas(s.repasId);
          if (r && r.categorie !== 'Bébé') { const f = App.suggest.famille(r); compte[f] = (compte[f] || 0) + 1; }
        });
        const okFam = r => (compte[App.suggest.famille(r)] || 0) < (App.suggest.MAX_PAR_SEMAINE[App.suggest.famille(r)] ?? 3);
        const cand = classes.filter(r => !pris.has(r.id) && okFam(r) && cout(r) < cout(c.r) - 1 && App.consignes.permis(state, semaine, c.id, r))
          .slice(0, 12).sort((a, x) => cout(a) - cout(x))[0];
        if (cand) { semaine.slots[c.id] = { ...semaine.slots[c.id], repasId: cand.id }; n++; fait = true; break; }
      }
      if (!fait) break;
      b = App.budget.resume(semaine, state, k);
    }
    return n;
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

  // ----- Repas de bébé -----

  /** Âge de bébé en mois (8 par défaut tant que la date de naissance n'est pas indiquée). */
  ageBebe(state) {
    const n = state.settings.bebe && state.settings.bebe.naissance; // « AAAA-MM »
    if (!n) return 8;
    const [y, m] = n.split('-').map(Number);
    const d = new Date();
    return Math.max(0, (d.getFullYear() - y) * 12 + (d.getMonth() + 1 - m));
  },

  /** Repas de bébé possibles pour un moment (« legumes » ou « fruit ») et son âge. */
  repasBebe(state, type, source = null) {
    const age = App.suggest.ageBebe(state);
    return state.repas.filter(r => r.categorie === 'Bébé' && r.moment === type && (r.ageMin || 0) <= age
      && (!source || r.source === source));
  },

  /** Remplit les repas de bébé de la semaine : purées maison variées, quelques pots Orchestra. */
  remplirBebe(state, semaine) {
    const age = App.suggest.ageBebe(state);
    const melanger = a => a.slice().sort(() => Math.random() - 0.5);
    const proteine = r => r.tags.some(t => ['volaille', 'poisson', 'poisson-gras', 'viande-rouge', 'legumineuses'].includes(t));
    const legumes = melanger(App.suggest.repasBebe(state, 'legumes', 'maison'));
    const avecProt = legumes.filter(proteine), sansProt = legumes.filter(r => !proteine(r));
    const fruits = melanger(App.suggest.repasBebe(state, 'fruit', 'maison'));
    const orch = { legumes: App.suggest.repasBebe(state, 'legumes', 'orchestra'), fruit: App.suggest.repasBebe(state, 'fruit', 'orchestra') };

    // Cases vides et répartition des pots Orchestra (de préférence le soir, pratique)
    const vides = [];
    App.JOURS.forEach(j => App.MOMENTS_BEBE.forEach(m => { const id = `${j.id}-${m.id}`; if (!semaine.slots[id]) vides.push({ id, m }); }));
    const nbOrch = Math.min(state.settings.bebe.orchestraParSemaine || 0, vides.length);
    const pourOrch = new Set(melanger(vides.filter(v => v.m.id === 'bebe-soir')).concat(melanger(vides.filter(v => v.m.id !== 'bebe-soir')))
      .slice(0, nbOrch).map(v => v.id));

    const compteurs = { midi: 0, soir: 0, fruit: 0 };
    const suivant = (liste, cle, jour) => {
      if (!liste.length) return null;
      for (let n = 0; n < liste.length; n++) {
        const r = liste[(compteurs[cle] + n) % liste.length];
        const memeJour = App.MOMENTS_BEBE.some(m => (semaine.slots[`${jour}-${m.id}`] || {}).repasId === r.id);
        if (!memeJour) { compteurs[cle] += n + 1; return r; }
      }
      return liste[compteurs[cle]++ % liste.length];
    };

    vides.forEach(({ id, m }) => {
      const jour = id.split('-')[0];
      let r = null;
      if (pourOrch.has(id)) {
        const choix = m.type === 'fruit' ? orch.fruit : orch.legumes.filter(x => age >= 6 || !proteine(x));
        r = choix[Math.floor(Math.random() * choix.length)] || null;
      }
      if (!r && m.type === 'fruit') r = suivant(fruits, 'fruit', jour);
      if (!r && m.id === 'bebe-midi') r = suivant(age >= 6 && avecProt.length ? avecProt : sansProt, 'midi', jour);
      if (!r) r = suivant(sansProt.length ? sansProt : legumes, 'soir', jour);
      if (r) semaine.slots[id] = { type: 'maison', repasId: r.id, source: 'auto' };
    });
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

  // ----- Envies : comprendre la phrase, puis placer un plat dans le menu -----

  /** Mots d'envie → caractéristiques (tags) et mots-clés de noms de plats. */
  ENVIES: [
    { mots: ['poisson', 'iode', 'saumon', 'cabillaud', 'thon', 'truite', 'sardine', 'maquereau'], cat: 'Poisson', tags: ['poisson', 'poisson-gras'], noms: ['saumon', 'cabillaud', 'thon', 'truite', 'sardine', 'maquereau', 'poisson', 'lieu'] },
    { mots: ['crevette', 'fruits', 'paella'], tags: ['fruits-de-mer'], noms: ['crevette', 'paella'] },
    { mots: ['viande', 'boeuf', 'steak', 'bavette', 'kefta', 'hache'], tags: ['viande-rouge'], noms: ['boeuf', 'bavette', 'kefta', 'boulette', 'burger', 'bolognaise', 'lok lak'] },
    { mots: ['poulet', 'volaille', 'dinde'], tags: ['volaille'], noms: ['poulet', 'dinde'] },
    { mots: ['vege', 'vegetarien', 'vegetal', 'legume', 'legumes', 'sans viande'], tags: ['vegetarien', 'legumes'], noms: [] },
    { mots: ['leger', 'light', 'leg', 'healthy', 'sain', 'mincir', 'detox'], tags: ['leger', 'legumes', 'cru'], noms: ['salade', 'soupe', 'veloute', 'vapeur', 'papillote'] },
    { mots: ['reconfortant', 'cocooning', 'chaud', 'hiver', 'doudou', 'gourmand', 'familial', 'famille', 'maman', 'grand-mere', 'enfance'], tags: ['reconfortant'], noms: ['gratin', 'hachis', 'lasagne', 'blanquette', 'tajine', 'risotto', 'soupe'] },
    { mots: ['oriental', 'marocain', 'maghreb', 'algerien', 'tunisien', 'libanais'], tags: ['epices'], noms: ['couscous', 'tajine', 'harira', 'chakchouka', 'kefta', 'loubia', 'mjadra', 'libanais', 'falafel', 'taboule', 'algerienne', 'chermoula'] },
    { mots: ['epice', 'epices', 'epicé', 'relevé', 'releve', 'piquant', 'indien', 'curry'], tags: ['epices'], noms: ['curry', 'dahl', 'tikka', 'chili'] },
    { mots: ['italien', 'italie', 'pates', 'pasta', 'pizza'], tags: [], noms: ['pates', 'penne', 'linguine', 'rigatoni', 'lasagne', 'risotto', 'gnocchi', 'pizza', 'minestrone', 'pasta'] },
    { mots: ['asiatique', 'asie', 'chinois', 'thai', 'japonais', 'wok', 'nouilles', 'soja', 'sushi', 'maki', 'poke'], tags: [], noms: ['poke', 'wok', 'nouille', 'cantonais', 'thai', 'teriyaki', 'lok lak', 'tofu'] },
    { mots: ['mexicain', 'tex', 'burritos', 'tacos', 'fajitas'], tags: [], noms: ['chili', 'fajitas', 'burrito', 'wrap'] },
    { mots: ['soupe', 'veloute', 'potage', 'bouillon'], tags: [], noms: ['soupe', 'veloute', 'harira', 'minestrone'] },
    { mots: ['salade composee', 'bowl'], tags: ['cru'], noms: ['bowl', 'salade'] },
    { mots: ['salade', 'frais', 'fraicheur', 'crudites', 'ete'], tags: ['cru'], noms: ['salade', 'taboule', 'bowl', 'poke'] },
    { mots: ['rapide', 'vite', 'simple', 'flemme', 'facile'], tags: ['rapide'], noms: [] },
    { mots: ['thermomix', 'tm6', 'tm7', 'cookidoo'], tags: ['thermomix'], noms: [] },
    { mots: ['oeuf', 'oeufs', 'omelette'], tags: ['oeufs'], noms: ['omelette', 'chakchouka', 'tortilla'] },
    { mots: ['legumineuse', 'lentille', 'lentilles', 'pois', 'haricot', 'haricots'], tags: ['legumineuses'], noms: ['lentille', 'pois chiche', 'haricot', 'dahl'] },
    { mots: ['sucre', 'dessert', 'gateau', 'douceur', 'gouter', 'chocolat', 'cake', 'patisserie'], douceur: true, tags: [], noms: ['chocolat', 'brownie', 'fondant', 'cookie', 'gateau', 'cake', 'muffin', 'crumble', 'clafoutis', 'crepe'] }
  ],

  /** Petits mots sans intérêt pour trouver un plat. */
  MOTS_VIDES: new Set(['des', 'une', 'les', 'aux', 'avec', 'sans', 'pour', 'chez', 'plus', 'moins', 'tres', 'bon', 'bonne',
    'bons', 'petit', 'petite', 'gros', 'envie', 'plat', 'plats', 'quelque', 'chose', 'truc', 'faire', 'manger', 'mange',
    'cette', 'semaine', 'soir', 'midi', 'aime', 'aimerais', 'voudrais', 'genre', 'style', 'fait', 'maison', 'beaucoup', 'bien']),

  /** Repas qui correspondent à une envie, du plus pertinent au moins pertinent : [{ r, s }] */
  analyserEnvie(texte, state) {
    const n = App.u.norm(texte);
    const mots = n.split(/[^a-z0-9-]+/).filter(m => m.length >= 3 && !App.suggest.MOTS_VIDES.has(m));
    if (!mots.length) return { douceur: false, resultats: [] };
    const regles = App.suggest.ENVIES.filter(R => R.mots.some(m => n.includes(App.u.norm(m))));
    const douceur = regles.some(R => R.douceur);
    const obj = App.suggest.objectif(App.store.semaine());
    const resultats = state.repas
      .filter(r => douceur ? r.categorie === 'Douceurs' : (r.categorie !== 'Douceurs' && r.categorie !== 'Bébé'))
      .map(r => {
        const nom = App.u.norm(r.nom);
        const ings = App.u.norm(r.ingredients.map(([id]) => (App.store.ingredient(id) || {}).nom || id).join(' '));
        let s = 0;
        mots.forEach(m => {
          const m2 = m.replace(/s$/, '');
          if (nom.includes(m2)) s += 4;          // le mot est dans le nom du plat
          else if (ings.includes(m2)) s += 2;    // c'est un ingrédient du plat
        });
        regles.forEach(R => {
          const i = R.noms.findIndex(k => nom.includes(App.u.norm(k)));
          if (i >= 0) s += i < 3 ? 5 : 3;                 // les plats les plus typiques en premier
          if (R.cat && r.categorie === R.cat) s += 3;     // « un bon poisson » : un plat de poisson
          s += 2 * R.tags.filter(t => r.tags.includes(t)).length;
        });
        if (s > 0) s += 0.3 * App.suggest.score(r, obj) + (r.favori ? 1 : 0) + ({ adore: 1, bof: -3 }[r.avis] || 0);
        return { r, s };
      })
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s);
    return { douceur, resultats };
  },

  /** Compatibilité : liste simple des repas correspondants. */
  pourEnvie(texte, state) {
    return App.suggest.analyserEnvie(texte, state).resultats.slice(0, 5).map(x => x.r);
  },

  /** Cases encore à venir de la semaine (on ne place pas une envie sur un repas passé). */
  casesAVenir(state, k = state.semaineActive) {
    const res = [];
    const maintenant = new Date();
    App.JOURS.forEach((j, i) => App.MOMENTS.forEach(m => {
      if (m.id === 'midi' && !state.settings.midis) return;
      const d = App.u.parseKey(k); d.setDate(d.getDate() + i);
      d.setHours(m.id === 'midi' ? 12 : 19, 0, 0, 0);
      if (d > maintenant) res.push(`${j.id}-${m.id}`);
    }));
    return res;
  },

  /** L'envie est-elle toujours au menu ? */
  envieAuMenu(semaine, e) {
    if (e.douceurId) return (semaine.douceurs || []).includes(e.douceurId);
    const s = e.slotId && semaine.slots[e.slotId];
    return !!(s && s.envieId === e.id);
  },

  /** Place une envie dans le menu : plat de la bibliothèque, ou case « à choisir » si rien ne correspond. */
  placerEnvie(state, semaine, e, repasId = null) {
    const { douceur, resultats } = App.suggest.analyserEnvie(e.texte, state);
    const deja = new Set(Object.values(semaine.slots).map(s => s && s.repasId));
    let choix = repasId || (resultats.find(x => !deja.has(x.r.id)) || resultats[0] || {}).r?.id || null;
    if (douceur && !choix) choix = (App.suggest.candidatsDouceur(state, semaine)[0] || {}).id || null; // « envie de sucré »

    // Envie sucrée : elle remplace un des gâteaux de la semaine
    if (douceur && choix && !repasId || (repasId && (App.store.repas(repasId) || {}).categorie === 'Douceurs')) {
      semaine.douceurs = semaine.douceurs || [];
      const ancien = e.douceurId && semaine.douceurs.includes(e.douceurId) ? e.douceurId : null;
      if (ancien) semaine.douceurs = semaine.douceurs.map(x => x === ancien ? choix : x);
      else if (!semaine.douceurs.includes(choix)) {
        if (semaine.douceurs.length >= state.settings.douceursParSemaine) semaine.douceurs[semaine.douceurs.length - 1] = choix;
        else semaine.douceurs.push(choix);
      }
      e.douceurId = choix; e.slotId = null;
      return { type: 'douceur', repasId: choix };
    }

    // Plat : sa case actuelle, sinon une case libre à venir, sinon un plat proposé automatiquement
    const aVenir = App.suggest.casesAVenir(state);
    let slotId = e.slotId && semaine.slots[e.slotId] && semaine.slots[e.slotId].envieId === e.id ? e.slotId : null;
    if (!slotId) slotId = aVenir.find(id => !semaine.slots[id]);
    if (!slotId) slotId = aVenir.find(id => {
      const s = semaine.slots[id];
      return s && s.type === 'maison' && !s.consomme && !s.envieId && s.source !== 'manuel';
    });
    if (!slotId) return null; // semaine passée ou entièrement choisie à la main
    App.stock.annulerConso(state, semaine.slots[slotId]);
    semaine.slots[slotId] = choix
      ? { type: 'maison', repasId: choix, source: 'envie', envieId: e.id }
      : { type: 'envie', label: e.texte, source: 'envie', envieId: e.id };
    e.slotId = slotId; e.douceurId = null;
    return { type: choix ? 'plat' : 'a-choisir', slotId, repasId: choix };
  },

  /** Avant de compléter le menu : chaque envie non placée trouve sa place. */
  placerEnvies(state, semaine) {
    (semaine.envies || []).forEach(e => {
      if (!e.consigne && !e.retiree && !App.suggest.envieAuMenu(semaine, e)) App.suggest.placerEnvie(state, semaine, e);
    });
  },

  /** Retire le plat d'une envie du menu (la case redevient libre). */
  retirerEnvie(state, semaine, e) {
    if (e.consigne) return App.consignes.annuler(state, semaine, e);
    if (e.douceurId) semaine.douceurs = (semaine.douceurs || []).filter(x => x !== e.douceurId);
    else if (e.slotId && semaine.slots[e.slotId] && semaine.slots[e.slotId].envieId === e.id) {
      App.stock.annulerConso(state, semaine.slots[e.slotId]);
      delete semaine.slots[e.slotId];
    }
    e.slotId = null; e.douceurId = null;
  }
};
