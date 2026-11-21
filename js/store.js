/* État de l'application + sauvegarde sur le téléphone (localStorage).
   La synchronisation entre les deux iPhone (js/sync.js) part de chaque sauvegarde. */
(function () {
  const KEY = 'repas-app-v1';
  const listeners = new Set();
  let state;

  function settingsParDefaut() {
    return {
      plafond: 150,
      portions: 2,            // 2 adultes (le bébé mange une part des plats)
      midis: true,            // planifier aussi les déjeuners
      douceursParSemaine: 2,
      drive: 'Leclerc Drive ou Chronodrive',
      fourcheDansBudget: true, // la commande La Fourche est répartie dans le budget de la semaine
      calories: true,          // afficher les calories estimées par portion
      bebe: { actif: true, naissance: null, orchestraParSemaine: 3 },
      eauLitresParJour: 4,
      ia: true,                // IA Gemini (photo → recette, phrases libres, idées)     // eau bue par jour pour le foyer (2 L chacun)
      debut: null,             // lundi du début du suivi : les semaines d'avant sont ignorées
      noms: ['Elle', 'Lui'],
      moi: 0,                 // qui utilise ce téléphone
      question: 'Qu’est-ce qui vous ferait plaisir cette semaine ?',
      profils: [
        { objectifKg: 20, mensurations: true, allaitement: true },
        { objectifKg: 10, mensurations: false, allaitement: false }
      ]
    };
  }

  function collectionsDeDepart(repas) {
    return window.APP_DATA.collections.map(c => ({
      id: c.id, emoji: c.emoji, nom: c.nom,
      repas: c.depuisTag ? repas.filter(r => r.tags.includes(c.depuisTag)).map(r => r.id) : []
    }));
  }

  function seed() {
    const D = window.APP_DATA;
    return {
      version: 1,
      settings: settingsParDefaut(),
      objectifs: structuredClone(D.objectifs),
      ingredients: structuredClone(D.ingredients),
      repas: structuredClone(D.repas),
      menusTypes: structuredClone(D.menusTypes),
      semaines: {},
      fourche: {},             // commandes mensuelles La Fourche, par mois « AAAA-MM »
      suivi: [[], []],         // pesées mensuelles de chaque personne
      stock: {},               // garde-manger : { ingId: { qty, achatLe } }
      collections: collectionsDeDepart(D.repas),
      essentiels: structuredClone(D.essentiels),
      semaineActive: App.u.mondayOf(),
      dataVersion: D.version
    };
  }

  function nouvelleSemaine() {
    return {
      objectifId: null, objectifPar: null, motObjectif: '',
      envies: [],
      slots: {},
      douceurs: null,          // null = pas encore proposées
      courses: { coches: {}, stock: {}, ajouts: [], auDrive: {}, restesJetes: {}, maison: {} },
      achats: null,            // ce qui a été acheté (« Courses faites ✓ »)
      coursesFaitesLe: null,
      depenses: { drive: null, producteur: null, orchestra: null, boucherie: null }
    };
  }

  /** Met à niveau une sauvegarde plus ancienne sans rien perdre. */
  function migrer() {
    const D = window.APP_DATA;
    const def = settingsParDefaut();
    state.settings = { ...def, ...state.settings };
    state.settings.profils = state.settings.profils || def.profils;
    state.settings.bebe = { ...def.bebe, ...(state.settings.bebe || {}) };
    state.fourche = state.fourche || {};
    state.suivi = state.suivi || [[], []];
    state.stock = state.stock || {};
    if (!state.collections) state.collections = collectionsDeDepart(state.repas);
    if (!state.essentiels) state.essentiels = structuredClone(D.essentiels);
    state.migrations = state.migrations || [];
    // La viande s'achète à la boucherie halal (plus au drive)
    if (!state.migrations.includes('boucherie')) {
      state.ingredients.forEach(i => { if (i.rayon === 'Boucherie & volaille' && i.lieu === 'drive') i.lieu = 'boucherie'; });
      state.migrations.push('boucherie');
    }
    // Essentiels : unité, taille du pack et consommation par semaine (pour compter ce qu'on a)
    if (!state.migrations.includes('essentiels-qte')) {
      state.essentiels.forEach(e => {
        const d = D.essentiels.find(x => x.id === e.id);
        if (d) { ['unite', 'pack', 'parSemaine'].forEach(k => { if (e[k] == null) e[k] = d[k]; }); if (d.id === 'eau') e.nom = d.nom; }
        else { e.unite = e.unite || 'unité'; e.pack = e.pack || 1; e.parSemaine = e.parSemaine ?? 1; }
      });
      state.migrations.push('essentiels-qte');
    }
    // Desserts, fruits et en-cas (dans les courses seulement)
    if (!state.migrations.includes('desserts')) {
      D.essentiels.filter(e => e.groupe === 'desserts' && !state.essentiels.some(x => x.id === e.id))
        .forEach(e => state.essentiels.push(structuredClone(e)));
      state.migrations.push('desserts');
    }
    // Démarrage du foyer : le plan commence le lundi 23 novembre 2026
    if (!state.migrations.includes('debut-2026-11-23')) {
      if (!state.settings.debut) state.settings.debut = '2026-11-23';
      state.migrations.push('debut-2026-11-23');
    }

    if ((state.dataVersion || 1) < D.version) {
      const nouveauxRepas = [];
      [['ingredients', D.ingredients], ['repas', D.repas], ['objectifs', D.objectifs]].forEach(([k, src]) => {
        const parId = new Map(state[k].map(x => [x.id, x]));
        src.forEach(x => {
          const ex = parId.get(x.id);
          if (!ex) { state[k].push(structuredClone(x)); if (k === 'repas') nouveauxRepas.push(x); }
          else Object.keys(x).forEach(f => { if (!(f in ex)) ex[f] = structuredClone(x[f]); });
        });
      });
      state.dataVersion = D.version;
      (state.collections || []).forEach(c => {
        const def = D.collections.find(x => x.id === c.id);
        if (def && def.depuisTag) nouveauxRepas.filter(r => r.tags.includes(def.depuisTag))
          .forEach(r => { if (!c.repas.includes(r.id)) c.repas.push(r.id); });
      });
    }
    // Ingrédients créés à la main avant l'ajout des lieux d'achat
    state.ingredients.forEach(i => {
      if (!i.lieu) i.lieu = i.rayon === 'Fruits & légumes' ? 'producteur' : i.rayon === 'Placard' ? 'fourche' : 'drive';
    });
    Object.values(state.semaines).forEach(w => {
      const n = nouvelleSemaine();
      w.courses = { ...n.courses, ...w.courses };
      w.courses.maison = w.courses.maison || {};
      if (!w.depenses) w.depenses = { drive: w.depenseReelle ?? null, producteur: null };
      delete w.depenseReelle;
      if (!('douceurs' in w)) w.douceurs = null;
      if (!('achats' in w)) w.achats = null;
    });
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : seed();
    } catch (e) { state = seed(); }
    migrer();
    // Revenir sur la semaine en cours si la semaine affichée est passée depuis longtemps
    if (!state.semaineActive || state.semaineActive < App.u.addWeeks(App.u.mondayOf(), -1)) {
      state.semaineActive = App.u.mondayOf();
    }
    // Jamais avant le début du suivi
    if (state.semaineActive < App.store.debut()) state.semaineActive = App.store.debut();
  }

  function save(depuisSync) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { App.ui.toast('Impossible de sauvegarder sur cet appareil'); }
    // Envoyer les changements à l'autre téléphone (sauf s'ils viennent de lui)
    if (!depuisSync && App.sync) App.sync.local(state);
  }

  App.store = {
    init() { load(); App.stock.reconcilier(state); save(); },
    /** À appeler quand l'app revient au premier plan (un nouveau jour a pu commencer). */
    rafraichir() { if (App.stock.reconcilier(state)) { save(); listeners.forEach(l => l(state)); } },
    get state() { return state; },

    /** Modifie l'état puis sauvegarde et rafraîchit l'écran. */
    update(fn) { fn(state); save(); listeners.forEach(l => l(state)); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /** Changements venus de l'autre téléphone : appliqués, sauvegardés, affichés, mais pas renvoyés. */
    appliquerDistant(fn) {
      fn(state);
      migrer();
      save(true);
      listeners.forEach(l => l(state));
    },

    semaine(k = state.semaineActive) {
      if (!state.semaines[k]) state.semaines[k] = nouvelleSemaine();
      return state.semaines[k];
    },
    /** Commande La Fourche d'un mois (« AAAA-MM »). */
    fourche(m) {
      if (!state.fourche[m]) state.fourche[m] = { passee: false, montant: null, stock: {}, ajouts: [], coches: {} };
      return state.fourche[m];
    },
    repas(id) { return state.repas.find(r => r.id === id); },
    ingredient(id) { return state.ingredients.find(i => i.id === id); },
    objectif(id) { return state.objectifs.find(o => o.id === id); },
    moi() { return state.settings.noms[state.settings.moi] || 'Moi'; },
    /** Lundi du début du suivi (« AAAA-MM-JJ ») : les semaines d'avant sont ignorées partout. */
    debut() { return state && state.settings.debut ? App.u.mondayOf(App.u.parseKey(state.settings.debut)) : '0000-00-00'; },
    /** Semaine « d'aujourd'hui » pour l'app : la semaine en cours, ou la première semaine du suivi. */
    semaineDuJour() { const m = App.u.mondayOf(), d = App.store.debut(); return m < d ? d : m; },
    compte(k) { return k >= App.store.debut(); },

    exportJSON() { return JSON.stringify(state, null, 2); },
    importJSON(txt) {
      const data = JSON.parse(txt);
      if (!data || !data.repas || !data.semaines) throw new Error('Fichier non reconnu');
      state = data; migrer(); save(); listeners.forEach(l => l(state));
    },
    reset() { state = seed(); save(); listeners.forEach(l => l(state)); }
  };
})();
