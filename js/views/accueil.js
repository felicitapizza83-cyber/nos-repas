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
    const heure = new Date().getHours();
    const salut = heure < 18 ? 'Bonjour' : 'Bonsoir';
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
      const matches = App.suggest.pourEnvie(e.texte, state);
      return `
        <li class="envie">
          <div class="envie-head">
            <span class="avatar">${esc((e.auteur || '?')[0])}</span>
            <div class="grow"><strong>${esc(e.texte)}</strong><small class="muted">${esc(e.auteur)}</small></div>
            <button class="icon-btn small" data-action="envie-del" data-id="${e.id}" aria-label="Supprimer">✕</button>
          </div>
          ${matches.length ? `<div class="envie-matches">
              <small class="muted">Dans notre bibliothèque :</small>
              ${matches.map(r => `<button class="chip chip-btn" data-action="envie-repas" data-id="${r.id}">${esc(r.nom)}</button>`).join('')}
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
      <div class="hello">
        <p class="muted">${salut},</p>
        <div class="who">
          ${state.settings.noms.map((n, i) =>
            `<button class="seg ${i === state.settings.moi ? 'on' : ''}" data-action="moi" data-i="${i}">${esc(n)}</button>`).join('')}
        </div>
      </div>

      <section class="card hero">
        <img class="hero-img" src="images/${window.APP_DATA.images.accueil}.jpg" alt=""/>
        <button class="question" data-action="question">${esc(state.settings.question)} <span class="edit">✎</span></button>
        <form class="envie-form" data-action="envie-add">
          <input name="texte" placeholder="Ex. un bon poisson, quelque chose de réconfortant…" autocomplete="off" />
          <button class="btn btn-primary" type="submit">Ajouter</button>
        </form>
        ${envies ? `<ul class="plain envies">${envies}</ul>` : '<p class="muted small">Notez vos envies ici : on vous propose les repas qui correspondent, ou des idées de recettes.</p>'}
      </section>

      <section class="card link-card" data-action="go" data-route="objectif">
        <div class="grow">
          <small class="muted">Objectif de la semaine</small>
          ${obj ? `<h3>${obj.emoji} ${esc(obj.nom)}</h3>${sem.objectifPar ? `<small class="muted">Choisi par ${esc(sem.objectifPar)}</small>` : ''}`
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
      else if (act === 'moi') App.store.update(s => { s.settings.moi = +a.dataset.i; });
      else if (act === 'question') App.views.accueil.choisirQuestion();
      else if (act === 'envie-del') App.store.update(() => {
        const sem = App.store.semaine(); sem.envies = sem.envies.filter(x => x.id !== a.dataset.id);
      });
      else if (act === 'envie-repas') App.views.repas.detail(a.dataset.id);
      else if (act === 'envie-creer') App.views.repas.editer(null, a.dataset.texte);
    };
    el.onsubmit = e => {
      e.preventDefault();
      const texte = e.target.texte.value.trim();
      if (!texte) return;
      App.store.update(() => {
        App.store.semaine().envies.push({ id: App.u.uid(), texte, auteur: App.store.moi(), date: Date.now() });
      });
    };
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
    const i = state.settings.moi;
    const s = App.suivi.resume(state, i);
    const nom = App.u.esc(state.settings.noms[i]);
    return `
      <section class="card link-card ${s.aFaire ? 'due' : ''}" data-action="go" data-route="suivi">
        <div class="grow">
          <small class="muted">Suivi du mois · ${nom}</small>
          ${s.aFaire ? '<h3>📏 C’est le moment de la pesée du mois</h3>'
            : `<h3>${s.perdu > 0 ? `−${s.perdu.toFixed(1)} kg` : 'Suivi en cours'} <small class="muted">/ objectif −${s.objectifKg} kg</small></h3>
               <small class="muted">Prochaine pesée vers le ${s.prochaine}</small>`}
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
