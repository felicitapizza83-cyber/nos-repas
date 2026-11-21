/* Garde-manger : ce qu'on a à la maison.
   - Il augmente avec « Courses faites ✓ » (drive + producteur) et « Commande passée » (La Fourche).
   - Il diminue tout seul quand un repas maison est passé (le lendemain du repas) ;
     les gâteaux sont comptés à la fin de leur semaine.
   - Si on change un repas déjà compté (repas dehors, pas cuisiné…), ses ingrédients reviennent.
   - La liste de courses déduit le stock ; pour une semaine future, on retire d'abord ce qui
     sera mangé d'ici là (projection).
   state.stock = { ingId: { qty, achatLe } } */
App.stock = {
  /** Durée de conservation indicative (jours) : par rayon, avec exceptions pour ce qui se garde longtemps. */
  CONSERVATION_RAYON: {
    'Boucherie & volaille': 2, 'Poissonnerie': 2, 'Boulangerie': 3, 'Frais': 6,
    'Crèmerie & œufs': 7, 'Fruits & légumes': 5
  },
  CONSERVATION: {
    'pdt': 21, 'oignon': 30, 'oignon-rouge': 30, 'echalote': 30, 'ail': 30, 'carotte': 14, 'citron': 14,
    'pomme': 14, 'poire': 7, 'butternut': 30, 'gingembre': 14, 'banane': 5, 'oeuf': 21, 'parmesan': 30,
    'cheddar': 21, 'beurre': 30, 'lait': 7, 'lait-soja': 7, 'feta': 10, 'fromage-blanc': 7, 'yaourt-grec': 10,
    'truite-fumee': 4, 'salade': 4, 'herbes': 4
  },
  conservation(id) {
    const ing = App.store.ingredient(id);
    return App.stock.CONSERVATION[id] || (ing && App.stock.CONSERVATION_RAYON[ing.rayon]) || 7;
  },
  /** Jours restants avant que le produit ne soit plus à son meilleur. */
  joursRestants(id, e) { return App.stock.conservation(id) - App.stock.joursDepuisAchat(e); },

  zone(ing) {
    if (!ing) return 'placard';
    if (ing.rayon === 'Surgelés') return 'congelateur';
    if (['Épicerie', 'Conserves', 'Placard'].includes(ing.rayon)) return 'placard';
    return 'frais';
  },
  ZONES: [
    { id: 'frais', nom: 'Frigo, fruits & légumes', emoji: '🥬' },
    { id: 'congelateur', nom: 'Congélateur', emoji: '🧊' },
    { id: 'placard', nom: 'Placard & épicerie', emoji: '🫙' }
  ],

  qty(state, id) { const e = state.stock[id]; return e ? e.qty : 0; },

  /** Produit de placard (épices, huile…) : on l'a seulement s'il est au garde-manger.
      Au départ le garde-manger est vide : la première commande les inclut, ensuite ils sont « en stock ». */
  aLePlacard(state, id) { const e = state.stock[id]; return e ? e.qty > 0 : false; },

  ajouter(state, map, date = Date.now()) {
    Object.entries(map).forEach(([id, q]) => {
      if (!(q > 0)) return;
      const e = state.stock[id];
      if (!e || e.qty <= 0) state.stock[id] = { qty: q, achatLe: date };
      else e.qty += q; // on garde la date du plus ancien : c'est lui qu'il faut finir en premier
    });
  },

  retirer(state, map) {
    Object.entries(map).forEach(([id, q]) => {
      const e = state.stock[id];
      if (!e || q == null) return;
      e.qty = Math.max(0, e.qty - q);
      if (e.qty < 1e-6) { e.qty = 0; }
    });
  },

  /** Quantités utilisées par un repas (pour 1 fois). */
  conso(r, state) {
    const f = App.shopping.facteur(r, state);
    const m = {};
    r.ingredients.forEach(([id, q]) => {
      const ing = App.store.ingredient(id);
      if (q == null || !ing || ing.unite === 'pot') return;
      m[id] = (m[id] || 0) + q * f;
    });
    return m;
  },

  /** Si un repas déjà compté change (dehors, vidé, reporté…), on remet ses ingrédients. */
  annulerConso(state, slot) {
    if (!slot || !slot.consomme) return;
    const r = App.store.repas(slot.repasId);
    if (r) App.stock.ajouter(state, App.stock.conso(r, state));
    slot.consomme = false;
  },

  /** Décompte des repas passés. Renvoie true si le stock a changé. */
  reconcilier(state) {
    const auj = App.u.key(new Date());
    let change = false;
    Object.entries(state.semaines).forEach(([k, w]) => {
      if (k > App.u.mondayOf() || !App.store.compte(k)) return;
      App.JOURS.forEach((j, i) => {
        const d = App.u.parseKey(k); d.setDate(d.getDate() + i);
        if (App.u.key(d) >= auj) return; // le jour n'est pas encore terminé
        [...App.MOMENTS, ...App.MOMENTS_BEBE].forEach(m => {
          const s = w.slots[`${j.id}-${m.id}`];
          if (!s || s.type !== 'maison' || s.consomme) return;
          const r = App.store.repas(s.repasId);
          if (r) App.stock.retirer(state, App.stock.conso(r, state));
          s.consomme = true; change = true;
        });
      });
      // Gâteaux : comptés une fois la semaine terminée
      if (App.u.addWeeks(k, 1) <= App.u.mondayOf() && (w.douceurs || []).length && !w.douceursConsommees) {
        w.douceurs.filter(id => !(w.douceursCuites || []).includes(id))
          .forEach(id => { const r = App.store.repas(id); if (r) App.stock.retirer(state, App.stock.conso(r, state)); });
        w.douceursConsommees = true; change = true;
      }
    });
    return change;
  },

  /** Stock disponible au début de la semaine k (on retire ce qui sera mangé d'ici là). */
  projection(state, k) {
    const s = {};
    Object.entries(state.stock).forEach(([id, e]) => { if (e.qty > 0) s[id] = e.qty; });
    let w = App.u.mondayOf();
    while (w < k) {
      const sem = state.semaines[w];
      if (sem && App.store.compte(w)) {
        const b = App.shopping.besoins(sem, state, true);
        Object.entries(b).forEach(([id, x]) => { if (s[id]) s[id] = Math.max(0, s[id] - x.qty); });
      }
      w = App.u.addWeeks(w, 1);
    }
    return s;
  },

  /** Ce repas est-il faisable avec le garde-manger ? { pct, manque: [noms], ok } */
  cuisinable(state, r) {
    const f = App.shopping.facteur(r, state);
    let total = 0, couverts = 0;
    const manque = [];
    r.ingredients.forEach(([id, q]) => {
      const ing = App.store.ingredient(id);
      if (!ing || ing.unite === 'pot') return;
      if (q == null) { if (!App.stock.aLePlacard(state, id) && !state.stock[id]) return; } // « un peu de » : ignoré si inconnu
      total++;
      const ok = q == null ? App.stock.aLePlacard(state, id) : App.stock.qty(state, id) >= q * f * 0.9;
      if (ok) couverts++; else manque.push(ing.nom);
    });
    const pct = total ? Math.round(couverts / total * 100) : 0;
    return { pct, manque, ok: total > 0 && manque.length === 0 };
  },

  /** Repas classés par ce qu'on a déjà (au moins la moitié des ingrédients). */
  avecCeQueJai(state, min = 50) {
    return state.repas
      .filter(r => r.categorie !== 'Bébé')
      .map(r => ({ r, ...App.stock.cuisinable(state, r) }))
      .filter(x => x.pct >= min)
      .sort((a, b) => b.pct - a.pct || a.manque.length - b.manque.length);
  },

  /** Fin du mode cuisine : on décompte le repas tout de suite (et on évite de le décompter deux fois). */
  marquerCuisine(state, repasId) {
    const k = App.u.mondayOf();
    const w = state.semaines[k];
    const auj = App.u.todayIndex();
    let slot = null;
    if (w) {
      for (let i = auj; i >= 0 && !slot; i--) {
        for (const m of ['soir', 'midi']) {
          const s = w.slots[`${App.JOURS[i].id}-${m}`];
          if (s && s.type === 'maison' && s.repasId === repasId && !s.consomme) { slot = s; break; }
        }
      }
    }
    const r = App.store.repas(repasId);
    if (r) App.stock.retirer(state, App.stock.conso(r, state));
    if (slot) slot.consomme = true;
    else if (w && (w.douceurs || []).includes(repasId)) (w.douceursCuites = w.douceursCuites || []).push(repasId);
    return !!slot;
  },

  joursDepuisAchat(e) { return e && e.achatLe ? (Date.now() - e.achatLe) / 864e5 : 0; },

  /** Produits frais en stock (pour l'anti-gaspi) : { id: qty }. */
  frais(state) {
    const res = {};
    Object.entries(state.stock).forEach(([id, e]) => {
      if (e.qty > 0 && App.stock.zone(App.store.ingredient(id)) === 'frais') res[id] = e.qty;
    });
    return res;
  },

  aUtiliserVite(state) {
    return Object.entries(state.stock)
      .filter(([id, e]) => e.qty > 0 && App.stock.zone(App.store.ingredient(id)) === 'frais'
        && App.stock.joursRestants(id, e) <= 1.5)
      .map(([id, e]) => ({ id, ...e, ing: App.store.ingredient(id), restants: App.stock.joursRestants(id, e) }))
      .filter(x => x.ing)
      .sort((a, b) => a.restants - b.restants);
  }
};
