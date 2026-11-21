/* Écran d'accueil : la question de la semaine, les envies de chacun, et un résumé. */
App.views.accueil = {
  title: 'Nos repas',

  QUESTIONS: [
    'Qu’est-ce qui vous ferait plaisir cette semaine ?',
    'Une envie particulière en ce moment ?',
    'Quel plat vous ferait du bien cette semaine ?',
    'De quoi votre corps a-t-il besoin cette semaine ?'
  ],

  render(state) {
    const { esc, euro } = App.u;
    const sem = App.store.semaine();
    const obj = App.suggest.objectif(sem);
    const b = App.budget.resume(sem, state);
    const l = App.shopping.liste(sem, state);
    const nbRepas = Object.keys(sem.slots).length;

    // Ce qui est prévu aujourd'hui (seulement si on regarde la semaine en cours)
    let aujourdhui = '';
    if (App.u.isCurrentWeek(state.semaineActive)) {
      const j = App.JOURS[App.u.todayIndex()];
      const lignes = App.MOMENTS.map(m => {
        const s = sem.slots[`${j.id}-${m.id}`];
        return `<li><span class="muted">${m.nom}</span> ${App.views.menu.slotTexte(s)}</li>`;
      }).join('');
      aujourdhui = `<section class="card"><h3>Aujourd’hui · ${j.nom}</h3><ul class="plain">${lignes}</ul></section>`;
    }

    const envies = sem.envies.map(e => {
      const { resultats } = App.suggest.analyserEnvie(e.texte, state);
      const auMenu = App.suggest.envieAuMenu(sem, e);
      const slot = e.slotId ? sem.slots[e.slotId] : null;
      const plat = auMenu ? App.store.repas(e.douceurId || (slot && slot.repasId)) : null;
      const autres = resultats.map(x => x.r).filter(r => !plat || r.id !== plat.id).slice(0, 4);
      const plan = auMenu
        ? `<div class="envie-plan">
            ${plat ? `<img class="thumb sm" src="${window.APP_DATA.imageRepas(plat)}" alt=""/>` : '<span class="avatar">💡</span>'}
            <div class="grow">
              <small class="muted">${e.douceurId ? 'Gâteau de la semaine' : `Prévu ${esc(App.commun.slotLabel(e.slotId).toLowerCase())}`}</small>
              ${plat ? `<button class="link-plain" data-action="envie-repas" data-id="${plat.id}"><strong>${esc(plat.nom)}</strong></button>`
                     : '<strong>Recette à choisir</strong><small class="muted">Aucun plat de la bibliothèque ne correspond encore</small>'}
            </div>
            <button class="icon-btn small" data-action="envie-retirer" data-id="${e.id}" aria-label="Retirer du menu" title="Retirer du menu">✕</button>
          </div>`
        : `<div class="envie-plan vide">
            <span class="grow muted small">${e.retiree ? 'Retirée du menu' : 'Pas de case libre cette semaine'}</span>
            <button class="btn" data-action="envie-placer" data-id="${e.id}">Mettre au menu</button>
          </div>`;
      return `
        <li class="envie">
          <div class="envie-head">
            <span class="avatar">💭</span>
            <div class="grow"><strong>${esc(e.texte)}</strong></div>
            <button class="icon-btn small" data-action="envie-del" data-id="${e.id}" aria-label="Supprimer l’envie">🗑</button>
          </div>
          ${plan}
          ${autres.length ? `<div class="envie-matches">
              <small class="muted">${auMenu ? 'Ou plutôt :' : 'Idées :'}</small>
              ${autres.map(r => `<button class="chip chip-btn" data-action="envie-choisir" data-id="${e.id}" data-repas="${r.id}">${esc(r.nom)}</button>`).join('')}
            </div>` : ''}
          <div class="envie-actions">
            <a class="link-btn" target="_blank" rel="noopener"
               href="https://www.marmiton.org/recettes/recherche.aspx?aqt=${encodeURIComponent(e.texte)}">Marmiton ↗</a>
            <a class="link-btn" target="_blank" rel="noopener" href="${App.views.repas.urlCookidoo(e.texte)}">Cookidoo ↗</a>
            <button class="link-btn" data-action="envie-creer" data-texte="${esc(e.texte)}">+ Créer ce repas</button>
          </div>
        </li>`;
    }).join('');

    return `

      <section class="card hero">
        <img class="hero-img" src="../images/${window.APP_DATA.images.accueil}.jpg" alt=""/>
        <button class="question" data-action="question">${esc(state.settings.question)} <span class="edit">✎</span></button>
        <form class="envie-form" data-action="envie-add">
          <input name="texte" placeholder="Ex. un bon poisson, quelque chose de réconfortant…" autocomplete="off" />
          <button class="btn btn-primary" type="submit">Ajouter</button>
        </form>
        ${envies ? `<ul class="plain envies">${envies}</ul>` : '<p class="muted small">Écrivez une envie (« un bon poisson », « oriental », « réconfortant », « chocolat »…) : un plat qui correspond est placé tout de suite dans le menu de la semaine.</p>'}
      </section>

      <section class="card link-card" data-action="go" data-route="objectif">
        <div class="grow">
          <small class="muted">Objectif de la semaine</small>
          ${obj ? `<h3>${obj.emoji} ${esc(obj.nom)}</h3>`
                : '<h3>À choisir 🌱</h3>'}
        </div><span class="chev">›</span>
      </section>

      ${aujourdhui}

      <div class="grid2">
        <section class="card link-card stat" data-action="go" data-route="menu">
          <small class="muted">Menu</small><strong>${nbRepas}</strong><small>repas prévus</small>
        </section>
        <section class="card link-card stat" data-action="go" data-route="courses">
          <small class="muted">Courses</small><strong>${l.nbCoches}/${l.nb}</strong><small>articles</small>
        </section>
      </div>

      ${App.views.accueil.carteStock(state)}
      ${App.views.accueil.carteSuivi(state)}
      ${App.views.accueil.carteFourche(state)}

      <section class="card link-card" data-action="go" data-route="budget">
        <div class="grow">
          <div class="row-between"><small class="muted">Budget de la semaine</small>
            <small><strong>${euro(b.total)}</strong> / ${euro(b.plafond)}</small></div>
          ${App.commun.bar(b.pct, b.depasse)}
        </div>
      </section>`;
  },

  mount(el, state) {
    el.onclick = e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const act = a.dataset.action;
      if (act === 'go') App.router.go(a.dataset.route);
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
