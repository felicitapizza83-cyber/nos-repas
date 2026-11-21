/* Écran d'accueil : la question de la semaine, les envies de chacun, et un résumé. */
App.views.accueil = {
  title: 'Nos repas',

  QUESTIONS: [
    'Qu’est-ce qui vous ferait plaisir cette semaine ?',
    'Une envie particulière en ce moment ?',
    'Quel plat vous ferait du bien cette semaine ?',
    'De quoi votre corps a-t-il besoin cette semaine ?'
  ],

  /** Le prochain repas du jour : le midi avant 14 h (si on planifie les midis), sinon le soir. */
  momentDuJour(state) {
    return new Date().getHours() < 14 && state.settings.midis ? 'midi' : 'soir';
  },

  carteAujourdhui(state) {
    const { esc, euro } = App.u;
    const k = App.u.mondayOf();
    const sem = App.store.semaine(k);
    const j = App.JOURS[App.u.todayIndex()];
    const mom = App.views.accueil.momentDuJour(state);
    const autre = mom === 'midi' ? 'soir' : (state.settings.midis ? 'midi' : null);
    const s = sem.slots[`${j.id}-${mom}`];
    const r = s && s.type === 'maison' && App.store.repas(s.repasId);
    const titre = mom === 'midi' ? 'Ce midi' : 'Ce soir';
    let hero;
    if (r) {
      const x = App.nutrition.points(r);
      hero = `
        <div class="jour-photo" data-action="fiche" data-id="${r.id}">
          <img src="${window.APP_DATA.imageRepas(r)}" alt=""/>
          <span class="jour-badge">${titre}</span>
        </div>
        <div class="jour-corps">
          <h2 data-action="fiche" data-id="${r.id}">${esc(r.nom)}</h2>
          <div class="jour-infos">
            ${state.settings.calories && x.kcal ? `<span>🔥 ${Math.round(x.kcal / 10) * 10} kcal</span><span>💪 ${Math.round(x.p)} g prot.</span>` : ''}
            <span>💶 ${euro(App.shopping.coutRepas(r, state))}</span>
          </div>
          <div class="jour-actions">
            <button class="btn btn-primary" data-action="cuisiner" data-id="${r.id}">👩‍🍳 Cuisiner</button>
            <button class="btn" data-action="changer" data-slot="${j.id}-${mom}">Changer</button>
          </div>
        </div>`;
    } else {
      const txt = !s ? 'Rien de prévu pour l’instant' : s.type === 'ext' ? `🍽️ ${esc(s.label || 'Repas à l’extérieur')}`
        : s.type === 'restes' ? '♻️ Restes' : s.type === 'envie' ? `💡 ${esc(s.label)} — recette à choisir` : 'Repas reporté';
      hero = `
        <div class="jour-corps">
          <span class="jour-badge plat">${titre}</span>
          <h2>${txt}</h2>
          <div class="jour-actions">
            <button class="btn ${s ? '' : 'btn-primary'}" data-action="changer" data-slot="${j.id}-${mom}">${s ? 'Changer' : 'Choisir un repas'}</button>
          </div>
        </div>`;
    }
    // Le reste de la journée : l'autre repas et bébé
    const lignes = [];
    if (autre) {
      const s2 = sem.slots[`${j.id}-${autre}`];
      lignes.push(`<button class="jour-ligne" data-action="changer" data-slot="${j.id}-${autre}">
        <small>${autre === 'midi' ? 'Midi' : 'Soir'}</small><span class="grow">${App.views.menu.slotTexte(s2)}</span><span class="chev">›</span></button>`);
    }
    if (state.settings.bebe && state.settings.bebe.actif) {
      const bb = App.MOMENTS_BEBE.map(m => {
        const rb = (sem.slots[`${j.id}-${m.id}`] || {}).repasId;
        const x = rb && App.store.repas(rb);
        return x ? esc(x.nom.replace(/^Purée (de |d’)?/i, '').replace(/^Compote (de )?/i, 'compote ')) : '—';
      });
      lignes.push(`<button class="jour-ligne" data-action="go" data-route="menu">
        <small>👶 Bébé</small><span class="grow">${bb.join(' · ')}</span><span class="chev">›</span></button>`);
    }
    const t = App.nutrition.jour(sem, j.id);
    const nutri = state.settings.calories && t.nb ? `
      <div class="jour-nutri">
        <span>Aujourd’hui, par personne</span>
        <b>≈ ${Math.round(t.kcal / 10) * 10} kcal</b><b>${Math.round(t.p)} g prot.</b><b>${Math.round(t.f)} g fibres</b>
      </div>` : '';
    return `
      <section class="card jour">
        ${hero}
        ${lignes.length || nutri ? `<div class="jour-reste">${lignes.join('')}${nutri}</div>` : ''}
      </section>`;
  },

  render(state) {
    const { esc, euro } = App.u;
    const sem = App.store.semaine();
    const obj = App.suggest.objectif(sem);
    const b = App.budget.resume(sem, state);
    const l = App.shopping.liste(sem, state);
    const moments = App.MOMENTS.filter(m => m.id === 'soir' || state.settings.midis);
    const nbCases = App.JOURS.length * moments.length;
    const nbPrevus = App.JOURS.reduce((n, j) => n + moments.filter(m => sem.slots[`${j.id}-${m.id}`]).length, 0);
    const courante = App.u.isCurrentWeek(state.semaineActive);
    const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    const envies = sem.envies.map(e => {
      const { resultats } = App.suggest.analyserEnvie(e.texte, state);
      const auMenu = App.suggest.envieAuMenu(sem, e);
      const slot = e.slotId ? sem.slots[e.slotId] : null;
      const plat = auMenu ? App.store.repas(e.douceurId || (slot && slot.repasId)) : null;
      const autres = resultats.map(x => x.r).filter(r => !plat || r.id !== plat.id).slice(0, 3);
      const plan = auMenu
        ? `<div class="envie-plan">
            ${plat ? `<img class="thumb sm" src="${window.APP_DATA.imageRepas(plat)}" alt=""/>` : '<span class="avatar">💡</span>'}
            <div class="grow">
              <small class="muted">${e.douceurId ? 'Gâteau de la semaine' : `Prévu ${esc(App.commun.slotLabel(e.slotId).toLowerCase())}`}</small>
              ${plat ? `<button class="link-plain" data-action="envie-repas" data-id="${plat.id}"><strong>${esc(plat.nom)}</strong></button>`
                     : '<strong>Recette à choisir</strong>'}
            </div>
            <button class="icon-btn small" data-action="envie-retirer" data-id="${e.id}" aria-label="Retirer du menu">✕</button>
          </div>`
        : `<div class="envie-plan vide">
            <span class="grow muted small">${e.retiree ? 'Retirée du menu' : 'Pas de case libre cette semaine'}</span>
            <button class="btn" data-action="envie-placer" data-id="${e.id}">Mettre au menu</button>
          </div>`;
      return `
        <li class="envie">
          <div class="envie-head">
            <strong class="grow">💭 ${esc(e.texte)}</strong>
            <button class="icon-btn small" data-action="envie-plus" data-id="${e.id}" aria-label="Plus d’options">⋯</button>
          </div>
          ${plan}
          ${autres.length ? `<div class="envie-matches chips scroll-x">
              <small class="muted">${auMenu ? 'Ou :' : 'Idées :'}</small>
              ${autres.map(r => `<button class="chip chip-btn" data-action="envie-choisir" data-id="${e.id}" data-repas="${r.id}">${esc(r.nom)}</button>`).join('')}
            </div>` : ''}
        </li>`;
    }).join('');

    const rappels = [App.views.accueil.carteStock(state), App.views.accueil.carteSuivi(state), App.views.accueil.carteFourche(state)].filter(Boolean);

    return `
      <div class="accueil-tete">
        <p class="date">${date}</p>
        <button class="chip chip-btn ${obj ? 'chip-good' : ''}" data-action="go" data-route="objectif">${obj ? `${obj.emoji} ${esc(obj.nom)}` : '🌱 Choisir un objectif'}</button>
      </div>

      ${App.views.accueil.carteAujourdhui(state)}

      <section class="card envies-carte">
        <button class="question" data-action="question">${esc(state.settings.question)}</button>
        <form class="envie-form" data-action="envie-add">
          <input name="texte" placeholder="Un bon poisson, réconfortant, chocolat…" autocomplete="off" enterkeyhint="done"/>
          <button class="btn btn-primary" type="submit" aria-label="Ajouter l’envie">＋</button>
        </form>
        ${envies ? `<ul class="plain envies">${envies}</ul>` : '<small class="muted">Le plat qui correspond se place tout seul dans le menu.</small>'}
      </section>

      <h3 class="section-title">${courante ? 'Cette semaine' : `Semaine ${esc(App.u.weekLabel(state.semaineActive))}`}</h3>
      <div class="tuiles">
        <button class="tuile" data-action="go" data-route="menu">
          <small>Menu</small><strong>${nbPrevus}<span>/${nbCases}</span></strong><i><em style="width:${(nbPrevus / nbCases * 100).toFixed(0)}%"></em></i>
        </button>
        <button class="tuile" data-action="go" data-route="courses">
          <small>Courses</small><strong>${l.nbCoches}<span>/${l.nb}</span></strong><i><em style="width:${l.nb ? (l.nbCoches / l.nb * 100).toFixed(0) : 0}%"></em></i>
        </button>
        <button class="tuile ${b.depasse ? 'attention' : ''}" data-action="go" data-route="budget">
          <small>Budget</small><strong>${Math.round(b.total)}<span> €</span></strong><i><em style="width:${b.pct.toFixed(0)}%"></em></i>
        </button>
      </div>
      <small class="muted tuiles-aide">${b.depasse ? `${euro(-b.reste)} au-dessus des ${euro(b.plafond)} — touchez Budget pour alléger` : `Il reste ${euro(b.reste)} sur ${euro(b.plafond)}`}</small>

      ${rappels.length ? `<h3 class="section-title">À faire</h3>${rappels.join('')}` : ''}`;
  },

  mount(el, state) {
    el.onclick = e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const act = a.dataset.action;
      if (act === 'go') App.router.go(a.dataset.route);
      else if (act === 'fiche') App.views.repas.detail(a.dataset.id);
      else if (act === 'cuisiner') App.cuisine.ouvrir(a.dataset.id);
      else if (act === 'changer') {
        // Le repas du jour est toujours dans la semaine en cours
        App.store.state.semaineActive = App.u.mondayOf();
        App.views.menu.ouvrirCase(a.dataset.slot);
      }
      else if (act === 'envie-plus') App.views.accueil.optionsEnvie(a.dataset.id);
      else if (act === 'question') App.views.accueil.choisirQuestion();
      else if (act === 'envie-del') App.store.update(st => {
        const sem = App.store.semaine(); const e = sem.envies.find(x => x.id === a.dataset.id);
        if (e) App.suggest.retirerEnvie(st, sem, e);
        sem.envies = sem.envies.filter(x => x.id !== a.dataset.id);
      });
      else if (act === 'envie-retirer') App.store.update(st => {
        const sem = App.store.semaine(); const e = sem.envies.find(x => x.id === a.dataset.id);
        App.suggest.retirerEnvie(st, sem, e); e.retiree = true;
      });
      else if (act === 'envie-placer' || act === 'envie-choisir') {
        let res = null;
        App.store.update(st => {
          const sem = App.store.semaine(); const e = sem.envies.find(x => x.id === a.dataset.id);
          e.retiree = false;
          res = App.suggest.placerEnvie(st, sem, e, a.dataset.repas || null);
        });
        App.views.accueil.annoncer(res);
      }
      else if (act === 'envie-repas') App.views.repas.detail(a.dataset.id);
      else if (act === 'envie-creer') App.views.repas.editer(null, a.dataset.texte);
    };
    el.onsubmit = e => {
      e.preventDefault();
      const texte = e.target.texte.value.trim();
      if (!texte) return;
      let res = null;
      App.store.update(st => {
        const sem = App.store.semaine();
        const e = { id: App.u.uid(), texte, date: Date.now() };
        sem.envies.push(e);
        res = App.suggest.placerEnvie(st, sem, e);
      });
      App.views.accueil.annoncer(res);
    };
  },

  /** Options d'une envie : chercher sur Cookidoo / Marmiton, créer le repas, supprimer. */
  optionsEnvie(id) {
    const sem = App.store.semaine();
    const e = sem.envies.find(x => x.id === id);
    if (!e) return;
    const { esc } = App.u;
    App.ui.sheet(`
      <h2>💭 ${esc(e.texte)}</h2>
      <div class="list-select">
        <a class="option" target="_blank" rel="noopener" href="${App.views.repas.urlCookidoo(e.texte)}">🟢 <span class="grow">Chercher sur Cookidoo</span>↗</a>
        <a class="option" target="_blank" rel="noopener" href="https://www.marmiton.org/recettes/recherche.aspx?aqt=${encodeURIComponent(e.texte)}">🍲 <span class="grow">Chercher sur Marmiton</span>↗</a>
        <button class="option" data-action="creer">＋ <span class="grow">Créer ce repas</span></button>
        <button class="option" data-action="suppr">🗑 <span class="grow">Supprimer l’envie</span></button>
      </div>`, action => {
      if (action === 'creer') App.views.repas.editer(null, e.texte);
      if (action === 'suppr') {
        App.store.update(st => {
          const w = App.store.semaine(); const x = w.envies.find(y => y.id === id);
          if (x) App.suggest.retirerEnvie(st, w, x);
          w.envies = w.envies.filter(y => y.id !== id);
        });
        App.ui.closeSheet();
      }
    });
  },

  annoncer(res) {
    if (!res) return App.ui.toast('Toutes les cases de la semaine sont déjà choisies : touchez « Mettre au menu » pour remplacer un repas.');
    const r = res.repasId && App.store.repas(res.repasId);
    if (res.type === 'douceur') App.ui.toast(`🍰 Gâteau de la semaine : ${r.nom}`);
    else if (res.type === 'plat') App.ui.toast(`💡 Ajouté au menu, ${App.commun.slotLabel(res.slotId).toLowerCase()} : ${r.nom}`);
    else App.ui.toast(`💡 Case réservée ${App.commun.slotLabel(res.slotId).toLowerCase()} : recette à choisir`);
  },

  carteStock(state) {
    const vite = App.stock.aUtiliserVite(state);
    if (!vite.length) return '';
    return `
      <section class="card link-card due" data-action="go" data-route="stock">
        <div class="grow">
          <small class="muted">Garde-manger</small>
          <h3>⏰ À utiliser vite</h3>
          <small class="muted">${vite.slice(0, 4).map(x => App.u.esc(x.ing.nom)).join(', ')}${vite.length > 4 ? '…' : ''}</small>
        </div><span class="chev">›</span>
      </section>`;
  },

  carteSuivi(state) {
    const lignes = state.settings.noms.map((nom, i) => {
      const s = App.suivi.resume(state, i);
      return { nom: App.u.esc(nom), s };
    });
    const aFaire = lignes.filter(x => x.s.aFaire).map(x => x.nom);
    if (!aFaire.length) return '';
    return `
      <section class="card link-card ${aFaire.length ? 'due' : ''}" data-action="go" data-route="suivi">
        <div class="grow">
          <small class="muted">Suivi du mois</small>
          ${aFaire.length ? `<h3>📏 Pesée du mois à faire : ${aFaire.join(' et ')}</h3>` : '<h3>📏 Suivi à jour</h3>'}
          <small class="muted">${lignes.map(x => `${x.nom} ${x.s.perdu > 0 ? `−${x.s.perdu.toFixed(1)} kg` : '—'} / −${x.s.objectifKg} kg`).join(' · ')}</small>
        </div><span class="chev">›</span>
      </section>`;
  },

  carteFourche(state) {
    const m = App.u.moisDeSemaine(state.semaineActive);
    const F = App.shopping.fourcheMois(m, state);
    if (F.passee || !F.items.length) return '';
    return `
      <section class="card link-card" data-action="go" data-route="fourche">
        <div class="grow">
          <small class="muted">Commande bio mensuelle · ${App.u.moisLabel(m)}</small>
          <h3>🌾 La Fourche ${F.passee ? '<small class="pill good">passée</small>' : ''}</h3>
          <small class="muted">${F.items.length} produits · ≈ ${App.u.euro(F.cout)}</small>
        </div><span class="chev">›</span>
      </section>`;
  },

  choisirQuestion() {
    const st = App.store.state;
    const { esc } = App.u;
    App.ui.sheet(`
      <h2>La question de l’accueil</h2>
      <div class="list-select">
        ${App.views.accueil.QUESTIONS.map(q =>
          `<button class="option ${q === st.settings.question ? 'on' : ''}" data-action="pick" data-q="${esc(q)}">${esc(q)}</button>`).join('')}
      </div>
      <form data-action="perso" class="stack">
        <label>Ou votre propre phrase<input name="q" placeholder="Votre question…" /></label>
        <button class="btn btn-primary" type="submit">Utiliser cette phrase</button>
      </form>`, (action, target) => {
      let q = null;
      if (action === 'pick') q = target.dataset.q;
      if (action === 'perso') q = target.q.value.trim();
      if (q) { App.store.update(s => { s.settings.question = q; }); App.ui.closeSheet(); }
    });
  }
};
