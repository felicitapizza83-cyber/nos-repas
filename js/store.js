/* État de l'application + sauvegarde.
   Étape 1 : sauvegarde locale (localStorage) sur chaque téléphone.
   Étape 2 : seul ce fichier changera pour synchroniser vos deux iPhone. */
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
      courses: { coches: {}, stock: {}, ajouts: [], auDrive: {}, restesJetes: {} },
      achats: null,            // ce qui a été acheté (« Courses faites ✓ »)
      coursesFaitesLe: null,
      depenses: { drive: null, producteur: null }
    };
  }

  /** Met à niveau une sauvegarde plus ancienne sans rien perdre. */
  function migrer() {
    const D = window.APP_DATA;
    const def = settingsParDefaut();
    state.settings = { ...def, ...state.settings };
    state.settings.profils = state.settings.profils || def.profils;
    state.fourche = state.fourche || {};
    state.suivi = state.suivi || [[], []];
    state.stock = state.stock || {};
    if (!state.collections) state.collections = collectionsDeDepart(state.repas);

    if ((state.dataVersion || 1) < D.version) {
      [['ingredients', D.ingredients], ['repas', D.repas], ['objectifs', D.objectifs]].forEach(([k, src]) => {
        const parId = new Map(state[k].map(x => [x.id, x]));
        src.forEach(x => {
          const ex = parId.get(x.id);
          if (!ex) state[k].push(structuredClone(x));
          else Object.keys(x).forEach(f => { if (!(f in ex)) ex[f] = structuredClone(x[f]); });
        });
      });
      state.dataVersion = D.version;
    }
    // Ingrédients créés à la main avant l'ajout des lieux d'achat
    state.ingredients.forEach(i => {
      if (!i.lieu) i.lieu = i.rayon === 'Fruits & légumes' ? 'producteur' : i.rayon === 'Placard' ? 'fourche' : 'drive';
    });
    Object.values(state.semaines).forEach(w => {
      const n = nouvelleSemaine();
      w.courses = { ...n.courses, ...w.courses };
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
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { App.ui.toast('Impossible de sauvegarder sur cet appareil'); }
  }

  App.store = {
    init() { load(); App.stock.reconcilier(state); save(); },
    /** À appeler quand l'app revient au premier plan (un nouveau jour a pu commencer). */
    rafraichir() { if (App.stock.reconcilier(state)) { save(); listeners.forEach(l => l(state)); } },
    get state() { return state; },

    /** Modifie l'état puis sauvegarde et rafraîchit l'écran. */
    update(fn) { fn(state); save(); listeners.forEach(l => l(state)); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

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

    exportJSON() { return JSON.stringify(state, null, 2); },
    importJSON(txt) {
      const data = JSON.parse(txt);
      if (!data || !data.repas || !data.semaines) throw new Error('Fichier non reconnu');
      state = data; migrer(); save(); listeners.forEach(l => l(state));
    },
    reset() { state = seed(); save(); listeners.forEach(l => l(state)); }
  };
})();
