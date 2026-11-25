/* Menu → liste de courses, par lieu d'achat (producteur, drive, La Fourche).
   Règles :
   - on compte les repas « maison », les repas « reportés » (achetés cette semaine) et les douceurs prévues ;
   - repas à l'extérieur, restes, et repas reportés depuis la semaine d'avant : pas d'achat ;
   - ce qui a été acheté mais pas mangé (« Courses faites ✓ » puis repas dehors…) est déduit
     de la liste de la semaine suivante ;
   - l'épicerie sèche bio (La Fourche) est commandée une fois par mois : voir fourcheMois(). */
App.shopping = {
  /** Lieux où l'on fait les courses chaque semaine (La Fourche est mensuelle). */
  LIEUX: ['producteur', 'boucherie', 'boulangerie', 'drive', 'orchestra'],
  NOMS_LIEUX: { producteur: 'Producteur', boucherie: 'Boucherie halal', boulangerie: 'Boulangerie', orchestra: 'Orchestra (bébé)' },
  /** Menu déroulant « où l'acheter » (lieux de la semaine). */
  optionsLieux(sel = 'drive') {
    return App.shopping.LIEUX.map(id => { const L = window.APP_DATA.lieux.find(x => x.id === id) || { nom: id, emoji: '' };
      return `<option value="${id}" ${id === sel ? 'selected' : ''}>${L.emoji} ${L.nom}</option>`; }).join('');
  },
  /** Listes à vérifier chaque semaine dans les courses. */
  GROUPES: {
    desserts: { emoji: '🍎', nom: 'Desserts & fruits', aide: 'fruits, yaourts, compotes, glaces…' },
    maison: { emoji: '🧻', nom: 'Maison', aide: 'eau, papier toilette, sacs poubelle…' }
  },
  groupe(e) { return e.groupe || 'maison'; },

  /** Consommation d'un essentiel pour la semaine (l'eau suit les litres bus par jour). */
  besoinEssentiel(e, state) {
    if (e.auto === 'eau') return Math.ceil((state.settings.eauLitresParJour || 0) * 7 / 1.5 - 1e-9);
    return e.parSemaine || 0;
  },

  /** Ce qu'il faut acheter pour un essentiel, selon ce qu'on a à la maison.
      Valeur de la semaine : un nombre (ce qu'on a), 'ok' (assez), ou 'acheter' (ancienne version). */
  calculEssentiel(e, v, state) {
    const besoin = App.shopping.besoinEssentiel(e, state);
    const pack = e.pack || 1;
    let packs = 0;
    if (typeof v === 'number') packs = Math.max(0, Math.ceil((besoin - v) / pack - 1e-9));
    else if (v === 'acheter') packs = Math.max(1, Math.ceil(besoin / pack - 1e-9));
    return { besoin, packs, cout: packs * (e.prix || 0), verifie: v != null };
  },

  /** Essentiels à acheter cette semaine (d'après les quantités indiquées). */
  essentiels(semaine, state) {
    const m = (semaine.courses && semaine.courses.maison) || {};
    return (state.essentiels || []).map(e => {
      const c = App.shopping.calculEssentiel(e, m[e.id], state);
      return { id: 'ess-' + e.id, ess: e.id, groupe: App.shopping.groupe(e), nom: e.nom, emoji: e.emoji, lieu: e.lieu || 'drive', packs: c.packs,
        pack: e.pack || 1, unite: e.unite, cout: c.cout, coche: !!semaine.courses.coches['ess-' + e.id] };
    }).filter(x => x.packs > 0);
  },

  compteDansCourses(slot) {
    if (!slot || !slot.repasId) return false;
    return slot.type === 'reporte' || slot.type === 'maison';
  },

  /** Coefficient appliqué aux quantités : un gâteau se fait en entier. */
  facteur(r, state, slot = null) {
    // Gâteau : on le fait en entier · bébé : une portion par repas · adultes : selon le nombre de portions
    if (r.categorie === 'Douceurs' || r.categorie === 'Bébé') return 1;
    // Repas avec des invités (« raclette pour 10 ») : selon le nombre de convives de ce repas
    return ((slot && slot.personnes) || state.settings.portions) / (r.portions || 2);
  },

  ing(id) {
    return App.store.ingredient(id) ||
      { id, nom: id, rayon: 'Divers', unite: 'pc', pack: 1, prix: 0, placard: false, lieu: 'drive' };
  },

  /** Besoins d'une semaine : { ingId: { qty, repas: [noms] } }.
      nonConsommes = true : seulement ce qui n'a pas encore été mangé (déjà retiré du garde-manger). */
  besoins(semaine, state, nonConsommes = false) {
    const res = {};
    const aCuisiner = Object.values(semaine.slots)
      // un repas reporté a été acheté cette semaine mais sera mangé la semaine suivante
      .filter(s => App.shopping.compteDansCourses(s) && !(nonConsommes && (s.consomme || s.type === 'reporte')))
      .map(s => ({ repasId: s.repasId, slot: s }))
      .concat((nonConsommes && semaine.douceursConsommees ? []
        : (semaine.douceurs || []).filter(id => !(nonConsommes && (semaine.douceursCuites || []).includes(id)))).map(repasId => ({ repasId })));
    aCuisiner.forEach(({ repasId, slot }) => {
      const r = App.store.repas(repasId);
      if (!r) return;
      const f = App.shopping.facteur(r, state, slot);
      r.ingredients.forEach(([id, q]) => {
        const e = res[id] || (res[id] = { qty: 0, repas: [] });
        if (q != null) e.qty += q * f;
        if (!e.repas.includes(r.nom)) e.repas.push(r.nom);
      });
    });
    return res;
  },

  coutRepas(r, state) {
    const f = App.shopping.facteur(r, state);
    return r.ingredients.reduce((s, [id, q]) => {
      const ing = App.store.ingredient(id);
      if (!ing || ing.placard || q == null) return s;
      return s + (q * f / ing.pack) * ing.prix;
    }, 0);
  },

  /** Ce qu'on a déjà pour la semaine k : figé au moment des courses, sinon le garde-manger projeté. */
  disponible(semaine, state, k) {
    if (semaine.coursesFaitesLe) return semaine.dispoAuxCourses || {};
    if (k < App.u.mondayOf()) return {};
    return App.stock.projection(state, k);
  },

  liste(semaine, state, k = state.semaineActive) {
    // Semaine en cours ou à venir, courses pas encore faites : seulement ce qui reste à cuisiner.
    const toutCompter = !!semaine.coursesFaitesLe || k < App.u.mondayOf();
    const besoins = App.shopping.besoins(semaine, state, !toutCompter);
    const dispo = App.shopping.disponible(semaine, state, k);
    const c = semaine.courses;
    const auDrive = c.auDrive || {};

    // Stock minimum (hors La Fourche, gérée au mois) : on complète jusqu'au minimum souhaité
    if (k >= App.u.mondayOf()) state.ingredients.forEach(i => {
      if (i.stockMin > 0 && i.lieu !== 'fourche' && !i.placard) {
        const b = besoins[i.id] || (besoins[i.id] = { qty: 0, repas: [] });
        b.min = i.stockMin;
        b.repas.push('Réserve minimum');
      }
    });

    const items = Object.entries(besoins).map(([id, b]) => {
      const ing = App.shopping.ing(id);
      const total = b.qty + (b.min || 0);
      const reste = ing.placard ? 0 : Math.min(dispo[id] || 0, total);
      const net = Math.max(0, total - reste);
      const lieu = ing.lieu === 'fourche' && auDrive[id] ? 'drive' : ing.lieu;
      const couvert = total > 0 && net <= 0.001;
      const packs = Math.max(1, Math.ceil(net / ing.pack - 1e-9));
      const enStock = couvert || (c.stock[id] ?? (ing.placard ? App.stock.aLePlacard(state, id) : false));
      return {
        id, nom: ing.nom, rayon: ing.rayon, unite: ing.unite, pack: ing.pack, lieu,
        qty: net, besoin: b.qty, reste, couvert, packs, cout: packs * ing.prix, repas: b.repas,
        placard: ing.placard, enStock, coche: !!c.coches[id], min: b.min || 0, seulementMin: b.qty === 0
      };
    }).filter(i => !(i.seulementMin && i.couvert)); // réserve déjà suffisante : rien à afficher

    const ordre = window.APP_DATA.rayons;
    const grouper = list => {
      const par = {};
      list.forEach(i => (par[i.rayon] = par[i.rayon] || []).push(i));
      return Object.keys(par).sort((a, b) => ordre.indexOf(a) - ordre.indexOf(b))
        .map(r => ({ rayon: r, items: par[r].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')) }));
    };

    const hebdo = items.filter(i => i.lieu !== 'fourche');
    const ess = App.shopping.essentiels(semaine, state);
    const lieux = {};
    App.shopping.LIEUX.forEach(l => {
      const its = hebdo.filter(i => i.lieu === l && !i.placard);
      const ajouts = c.ajouts.filter(a => (a.lieu || 'drive') === l);
      const maison = ess.filter(e => e.lieu === l);
      const total = its.filter(i => !i.enStock).reduce((s, i) => s + i.cout, 0) +
        ajouts.reduce((s, a) => s + (a.prix || 0), 0) + maison.reduce((s, e) => s + e.cout, 0) +
        (l === 'drive' ? hebdo.filter(i => i.placard && !i.enStock).reduce((s, i) => s + i.cout, 0) : 0);
      lieux[l] = { rayons: grouper(its), ajouts, maison, total };
    });
    const placard = hebdo.filter(i => i.placard).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    const fourche = items.filter(i => i.lieu === 'fourche').sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    const nbDeduits = items.filter(i => i.reste > 0).length;

    const aAcheter = hebdo.filter(i => !i.enStock);
    const total = App.shopping.LIEUX.reduce((s, l) => s + lieux[l].total, 0);
    const nb = aAcheter.length + c.ajouts.length + ess.length;
    const nbCoches = aAcheter.filter(i => i.coche).length + c.ajouts.filter(a => a.coche).length + ess.filter(e => e.coche).length;
    return { lieux, placard, fourche, nbDeduits, total, nb, nbCoches, aAcheter, dispo };
  },

  /** Ce qui est acheté au moment où l'on valide « Courses faites ✓ » (en quantité réelle de paquets). */
  snapshotAchats(semaine, state) {
    const l = App.shopping.liste(semaine, state);
    const achats = {};
    l.aAcheter.forEach(i => { if (i.qty > 0 || i.placard) achats[i.id] = i.packs * i.pack; });
    return achats;
  },

  /** Texte à partager pour un lieu (Messages, Notes, et plus tard le panier drive). */
  texte(semaine, state, lieu) {
    const l = App.shopping.liste(semaine, state);
    const L = l.lieux[lieu];
    const nomLieu = lieu === 'drive' ? state.settings.drive : App.shopping.NOMS_LIEUX[lieu] || lieu;
    const lignes = [`🛒 ${nomLieu} — ${App.u.weekLabel(state.semaineActive)}`];
    L.rayons.forEach(r => {
      const it = r.items.filter(i => !i.enStock);
      if (!it.length) return;
      lignes.push('', r.rayon.toUpperCase());
      it.forEach(i => lignes.push(`${i.coche ? '✅' : '▫️'} ${App.shopping.ligneDrive(i)}`));
    });
    if (lieu === 'drive') {
      const pl = l.placard.filter(i => !i.enStock);
      if (pl.length) { lignes.push('', 'PLACARD'); pl.forEach(i => lignes.push(`▫️ ${i.nom}`)); }
    }
    Object.entries(App.shopping.GROUPES).forEach(([g, G]) => {
      const its = L.maison.filter(e => e.groupe === g);
      if (its.length) { lignes.push('', G.nom.toUpperCase()); its.forEach(e => lignes.push(`${e.coche ? '✅' : '▫️'} ${e.nom}${e.pack > 1 ? ` (pack de ${e.pack})` : ''} × ${e.packs}`)); }
    });
    if (L.ajouts.length) { lignes.push('', 'EN PLUS'); L.ajouts.forEach(a => lignes.push(`${a.coche ? '✅' : '▫️'} ${a.nom}`)); }
    lignes.push('', `Estimation : ${App.u.euro(L.total)}`);
    return lignes.join('\n');
  },

  /** « Courgettes — 1 kg × 1 » : quantité en paquets, comme on la commande sur le drive. */
  ligneDrive(i) {
    const unitPack = App.u.qte(i.pack, i.unite);
    if (['g', 'ml'].includes(i.unite)) return `${i.nom} — ${unitPack} × ${i.packs}`;
    if (i.unite === 'pc' && i.pack > 1) return `${i.nom} — paquet de ${i.pack} × ${i.packs}`;
    return `${i.nom} ${App.u.qte(i.qty, i.unite)}`.trim();
  },

  /** Commande mensuelle La Fourche : besoins des menus du mois, extrapolés au mois complet. */
  fourcheMois(m, state) {
    const f = state.fourche[m] || { passee: false, montant: null, stock: {}, ajouts: [], coches: {} };
    // Seulement les semaines suivies (le mois du démarrage peut n'en compter qu'une)
    const semaines = App.u.semainesDuMois(m).filter(k => App.store.compte(k));
    const prevues = semaines.filter(k => {
      const w = state.semaines[k];
      if (!App.store.compte(k)) return false;
      return w && (Object.keys(w.slots).length || (w.douceurs || []).length);
    });
    const besoins = {};
    prevues.forEach(k => {
      const w = state.semaines[k];
      const b = App.shopping.besoins(w, state);
      Object.entries(b).forEach(([id, e]) => {
        const ing = App.shopping.ing(id);
        if (ing.lieu !== 'fourche' || (w.courses.auDrive || {})[id]) return;
        const x = besoins[id] || (besoins[id] = { qty: 0, repas: new Set() });
        x.qty += e.qty; e.repas.forEach(r => x.repas.add(r));
      });
    });
    const coef = prevues.length ? semaines.length / prevues.length : 1;
    if (m >= App.u.moisCourant()) state.ingredients.forEach(i => {
      if (i.stockMin > 0 && i.lieu === 'fourche' && !i.placard) {
        (besoins[i.id] = besoins[i.id] || { qty: 0, repas: new Set() }).min = i.stockMin;
      }
    });
    const dispo = f.passee ? (f.dispo || {}) : (m >= App.u.moisCourant() ? App.stock.projection(state, semaines[0] > App.u.mondayOf() ? semaines[0] : App.u.mondayOf()) : {});
    const items = Object.entries(besoins).map(([id, b]) => {
      const ing = App.shopping.ing(id);
      const brute = b.qty * coef + (b.min || 0);
      const enReserve = ing.placard ? 0 : Math.min(dispo[id] || 0, brute);
      const estimee = brute - enReserve;
      const packs = Math.max(1, Math.ceil(estimee / ing.pack - 1e-9));
      const enStock = (f.stock[id] ?? (ing.placard ? App.stock.aLePlacard(state, id) : false)) || (!ing.placard && estimee <= 0.001);
      return {
        id, nom: ing.nom, rayon: ing.rayon, unite: ing.unite, pack: ing.pack, placard: ing.placard,
        prevue: b.qty, qty: estimee, enReserve, packs, cout: packs * ing.prix, enStock, coche: !!f.coches[id],
        nbRepas: b.repas.size, min: b.min || 0, seulementMin: b.qty === 0
      };
    }).filter(i => !(i.seulementMin && i.enStock)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    const total = items.filter(i => !i.enStock).reduce((s, i) => s + i.cout, 0) +
      f.ajouts.reduce((s, a) => s + (a.prix || 0), 0);
    return {
      m, semaines, prevues, coef, items, ajouts: f.ajouts, total, dispo,
      montant: f.montant, passee: f.passee,
      cout: f.montant != null ? f.montant : total
    };
  },

  texteFourche(m, state) {
    const F = App.shopping.fourcheMois(m, state);
    const lignes = [`🌾 La Fourche — ${App.u.moisLabel(m)}`, ''];
    F.items.filter(i => !i.enStock).forEach(i => lignes.push(`▫️ ${App.shopping.ligneDrive(i)}`));
    F.ajouts.forEach(a => lignes.push(`▫️ ${a.nom}`));
    lignes.push('', `Estimation : ${App.u.euro(F.total)}`);
    return lignes.join('\n');
  }
};
