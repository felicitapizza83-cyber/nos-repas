/* Budget : semaine (producteur + drive + quote-part La Fourche + repas dehors), mois et année. */
App.budget = {
  resume(semaine, state, k = state.semaineActive) {
    const l = App.shopping.liste(semaine, state, k);
    const dep = semaine.depenses || {};
    const lieux = App.shopping.LIEUX.map(id => {
      const reel = dep[id] != null;
      return { id, estime: l.lieux[id].total, reel, montant: reel ? dep[id] : l.lieux[id].total };
    });
    const courses = lieux.reduce((s, x) => s + x.montant, 0);

    const ext = Object.entries(semaine.slots)
      .filter(([, s]) => s && s.type === 'ext')
      .map(([slotId, s]) => ({ slotId, label: s.label || 'Repas extérieur', montant: s.montant || 0 }));
    const extTotal = ext.reduce((s, e) => s + e.montant, 0);

    const m = App.u.moisDeSemaine(k);
    const F = App.shopping.fourcheMois(m, state);
    const fourche = state.settings.fourcheDansBudget ? F.cout / (F.semaines.length || 4) : 0;

    const total = courses + extTotal + fourche;
    const plafond = state.settings.plafond;
    return {
      lieux, courses, ext, extTotal, fourche, fourcheMois: F, total, plafond,
      reste: plafond - total,
      pct: plafond > 0 ? Math.min(100, (total / plafond) * 100) : 0,
      depasse: total > plafond
    };
  },

  /** Une semaine compte dans les bilans si elle a un menu ou une dépense saisie. */
  active(w) {
    return w && (Object.keys(w.slots).length || (w.douceurs || []).length ||
      (w.depenses && App.shopping.LIEUX.some(l => w.depenses[l] != null)));
  },

  historique(state, n = 8) {
    const res = [];
    let k = state.semaineActive;
    for (let i = 0; i < n; i++) {
      const w = state.semaines[k];
      if (App.store.compte(k) && App.budget.active(w)) res.unshift({ k, ...App.budget.resume(w, state, k) });
      else res.unshift({ k, total: 0, vide: true, plafond: state.settings.plafond });
      k = App.u.addWeeks(k, -1);
    }
    return res;
  },

  /** Un mois (« AAAA-MM ») : par lieu d'achat, par catégorie, semaine par semaine.
      Une semaine appartient au mois de son jeudi ; La Fourche compte pour sa commande entière du mois. */
  mois(state, m) {
    const parLieu = {};
    App.shopping.LIEUX.forEach(l => { parLieu[l] = 0; });
    const cat = { repas: 0, desserts: 0, maison: 0, bebe: 0 };
    let ext = 0, estime = false;
    const semaines = App.u.semainesDuMois(m).filter(k => App.store.compte(k)).map(k => {
      const w = state.semaines[k];
      if (!App.budget.active(w)) return { k, total: 0, vide: true };
      const r = App.budget.resume(w, state, k);
      r.lieux.forEach(x => { parLieu[x.id] += x.montant; if (!x.reel && x.montant) estime = true; });
      ext += r.extTotal;
      const ess = App.shopping.essentiels(w, state);
      const des = ess.filter(e => e.groupe === 'desserts').reduce((s, e) => s + e.cout, 0);
      const mai = ess.filter(e => e.groupe === 'maison').reduce((s, e) => s + e.cout, 0);
      const bebe = (r.lieux.find(x => x.id === 'orchestra') || {}).montant || 0;
      cat.desserts += des; cat.maison += mai; cat.bebe += bebe;
      cat.repas += Math.max(0, r.courses - bebe - des - mai);
      return { k, total: r.courses + r.extTotal, courses: r.courses, ext: r.extTotal };
    });
    const F = App.shopping.fourcheMois(m, state);
    const fActive = F.montant != null || F.prevues.length > 0;
    const fourche = fActive ? F.cout : 0;
    if (fActive && F.montant == null) estime = true;
    const courses = Object.values(parLieu).reduce((s, x) => s + x, 0);
    const total = courses + ext + fourche;
    const nbSemaines = semaines.length;
    return {
      m, parLieu, cat, ext, fourche, fourcheMois: F, courses, total, estime, semaines, nbSemaines,
      plafond: state.settings.plafond * nbSemaines, actif: semaines.some(s => !s.vide) || fourche > 0
    };
  },

  /** Coût de l'alimentation mois par mois sur une année : courses, repas dehors, La Fourche. */
  annee(state, annee) {
    const mois = [];
    for (let i = 1; i <= 12; i++) {
      const m = `${annee}-${String(i).padStart(2, '0')}`;
      let courses = 0, ext = 0, estime = false, nbSemaines = 0;
      App.u.semainesDuMois(m).forEach(k => {
        const w = state.semaines[k];
        if (!App.store.compte(k) || !App.budget.active(w)) return;
        const r = App.budget.resume(w, state, k);
        nbSemaines++;
        courses += r.courses; ext += r.extTotal;
        if (r.lieux.some(x => !x.reel)) estime = true;
      });
      const F = App.shopping.fourcheMois(m, state);
      const fActive = F.montant != null || F.prevues.length > 0;
      const fourche = fActive ? F.cout : 0;
      if (fActive && F.montant == null) estime = true;
      mois.push({ m, courses, ext, fourche, total: courses + ext + fourche, estime, nbSemaines });
    }
    const total = mois.reduce((s, x) => s + x.total, 0);
    const actifs = mois.filter(x => x.total > 0);
    return {
      mois, total,
      courses: mois.reduce((s, x) => s + x.courses, 0),
      ext: mois.reduce((s, x) => s + x.ext, 0),
      fourche: mois.reduce((s, x) => s + x.fourche, 0),
      moyenne: actifs.length ? total / actifs.length : 0
    };
  }
};
