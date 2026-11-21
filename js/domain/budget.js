/* Budget : semaine (producteur + drive + quote-part La Fourche + repas dehors), mois et année. */
App.budget = {
  resume(semaine, state, k = state.semaineActive) {
    const l = App.shopping.liste(semaine, state, k);
    const dep = semaine.depenses || {};
    const lieux = ['producteur', 'drive', 'orchestra'].map(id => {
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
      (w.depenses && (w.depenses.drive != null || w.depenses.producteur != null || w.depenses.orchestra != null)));
  },

  historique(state, n = 8) {
    const res = [];
    let k = state.semaineActive;
    for (let i = 0; i < n; i++) {
      const w = state.semaines[k];
      if (App.budget.active(w)) res.unshift({ k, ...App.budget.resume(w, state, k) });
      else res.unshift({ k, total: 0, vide: true, plafond: state.settings.plafond });
      k = App.u.addWeeks(k, -1);
    }
    return res;
  },

  /** Coût de l'alimentation mois par mois sur une année : courses, repas dehors, La Fourche. */
  annee(state, annee) {
    const mois = [];
    for (let i = 1; i <= 12; i++) {
      const m = `${annee}-${String(i).padStart(2, '0')}`;
      let courses = 0, ext = 0, estime = false, nbSemaines = 0;
      App.u.semainesDuMois(m).forEach(k => {
        const w = state.semaines[k];
        if (!App.budget.active(w)) return;
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
