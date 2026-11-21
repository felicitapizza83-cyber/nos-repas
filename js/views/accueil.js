/* Écran d'accueil : la question de la semaine, les envies de chacun, et un résumé. */
App.views.accueil = {
  title: 'Cook Easy',

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

  /** Avant le début du suivi : le compte à rebours du démarrage. */
  carteDemarrage(state) {
    const d = App.u.parseKey(App.store.debut());
    const jours = Math.round((d - new Date(new Date().setHours(12, 0, 0, 0))) / 864e5);
    const sem = App.store.semaine(App.store.debut());
    const lundi = sem.slots['lun-midi'] || sem.slots['lun-soir'];
    return `
      <section class="card jour demarrage">
        <div class="jour-corps">
          <span class="jour-badge plat">🚀 Démarrage ${jours <= 1 ? 'demain' : `dans ${jours} jours`}</span>
          <h2>Le plan commence ${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          <p class="muted small">${lundi ? 'Le menu de la première semaine est prêt : faites les courses, et c’est parti.' : 'Préparez le menu de la première semaine, puis faites les courses.'}</p>
          <div class="jour-actions">
            <button class="btn btn-primary" data-action="go" data-route="${lundi ? 'courses' : 'menu'}">${lundi ? '🛒 Faire les courses' : '📅 Préparer le menu'}</button>
            <button class="btn" data-action="go" data-route="${lundi ? 'menu' : 'courses'}">${lundi ? 'Le menu' : 'Courses'}</button>
          </div>
        </div>
      </section>`;
  },

  carteAujourdhui(state) {
    const { esc, euro } = App.u;
    if (App.u.mondayOf() < App.store.debut()) return '';   // avant le début du suivi : rien à afficher
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
    const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    const envies = sem.envies.map(e => {
      if (e.consigne) return App.views.accueil.ligneConsigne(sem, e);
      const { resultats } = App.suggest.analyserEnvie(e.texte, state);
      const auMenu = App.suggest.envieAuMenu(sem, e);
      const slot = e.slotId ? sem.slots[e.slotId] : null;
      const plat = auMenu ? App.store.repas(e.douceurId || (slot && slot.repasId)) : null;
      const proposes = e.ia ? e.ia.map(id => App.store.repas(id)).filter(Boolean) : resultats.map(x => x.r);
      const autres = proposes.filter(r => !plat || r.id !== plat.id).slice(0, 3);
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

    const ess = state.essentiels || [];
    const essAVerifier = ess.filter(e => (sem.courses.maison || {})[e.id] == null).length;
    const carteMaison = essAVerifier && !sem.coursesFaitesLe ? `
      <section class="card link-card due" data-action="courses-maison">
        <div class="grow"><small class="muted">Avant les courses</small>
          <h3>✅ Vérifier les desserts et la maison</h3>
          <small class="muted">${essAVerifier} à vérifier : fruits, yaourts, eau, papier toilette…</small></div><span class="chev">›</span>
      </section>` : '';
    const rappels = [carteMaison, App.views.accueil.carteStock(state), App.views.accueil.carteSuivi(state), App.views.accueil.carteFourche(state)].filter(Boolean);

    return `
      <div class="accueil-tete">
        <p class="date">${date}</p>
        <button class="chip chip-btn ${obj ? 'chip-good' : ''}" data-action="go" data-route="objectif">${obj ? `${obj.emoji} ${esc(obj.nom)}` : '🌱 Choisir un objectif'}</button>
      </div>

      <div class="colonnes">
      <div class="col">
      ${App.views.accueil.carteAujourdhui(state)}

      <section class="card envies-carte">
        <button class="question" data-action="question">${esc(state.settings.question)}</button>
        <form class="envie-form" data-action="envie-add">
          <input name="texte" placeholder="Un bon poisson, végé tous les soirs, j’ai mes règles…" autocomplete="off" enterkeyhint="send"/>
          <button class="envoyer" type="submit" aria-label="Envoyer"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </form>
        ${envies ? `<ul class="plain envies">${envies}</ul>` : ''}
      </section>
      </div>
      <div class="col">

      ${rappels.length ? `<h3 class="section-title">À faire</h3>${rappels.join('')}` : ''}
      </div>
      </div>`;
  },

  mount(el, state) {
    el.onclick = e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const act = a.dataset.action;
      if (act === 'go') App.router.go(a.dataset.route);
      else if (act === 'fiche') App.views.repas.detail(a.dataset.id);
      else if (act === 'courses-maison') {
        const m = App.store.semaine().courses.maison || {};
        App.views.courses.onglet = App.store.state.essentiels.some(e => e.groupe === 'desserts' && m[e.id] == null) ? 'desserts' : 'maison';
        App.router.go('courses');
      }
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
    el.onsubmit = async e => {
      e.preventDefault();
      const form = e.target;
      const texte = form.texte.value.trim();
      if (!texte) return;
      let res = null, bilan = null;
      let consigne = App.consignes.analyser(texte, App.store.state);
      // Avec l'IA : elle répond librement à tout (cuisine, invités, santé…) puis propose, sans rien changer d'elle-même.
      // Seule une envie de plat très courte (« un bon poisson ») reste traitée directement sur le téléphone.
      {
        const { resultats } = App.suggest.analyserEnvie(texte, App.store.state);
        const mots = App.u.norm(texte).split(/[^a-z0-9]+/).filter(m => m.length > 2).length;
        const envieSimple = !consigne && resultats.length && mots <= 3 && !texte.includes('?');
        if (App.ia.dispo() && !envieSimple) {
          form.texte.value = '';
          return App.ia.ouvrirDiscussion(texte);
        }
      }
      let iaRecettes = null;
      // Ce que l'app ne comprend pas seule (ou une longue phrase) part à l'IA ; le reste reste sur le téléphone
      const { resultats } = App.suggest.analyserEnvie(texte, App.store.state);
      const mots = App.u.norm(texte).split(/[^a-z0-9]+/).filter(m => m.length > 2).length;
      const complexe = mots >= 6;
      if (App.ia.dispo() && !App.consignes.fiable(consigne) && (consigne ? complexe : (!resultats.length || mots >= 5))) {
        form.texte.disabled = true;
        form.classList.add('ia-en-cours');
        App.ui.toast('✨ L’IA réfléchit…');
        try {
          const r = await App.ia.comprendrePhrase(texte, App.store.state);
          const ia = App.ia.versConsigne(r, App.store.state);
          if (ia) consigne = ia;
          else if ((r.recettes || []).length) { consigne = null; iaRecettes = r.recettes.filter(id => App.store.repas(id)).slice(0, 4); }
        } catch (err) { App.ui.toast(err.message + ' — je fais au mieux sans IA'); }
        form.texte.disabled = false;
        form.classList.remove('ia-en-cours');
      }
      App.store.update(st => {
        const sem = App.store.semaine();
        const e = { id: App.u.uid(), texte, date: Date.now() };
        if (iaRecettes && iaRecettes.length) e.ia = iaRecettes;
        sem.envies.push(e);
        if (consigne) { e.consigne = consigne; App.consignes.casesFixes(st, e); bilan = App.consignes.appliquer(st, sem, e); }
        else res = App.suggest.placerEnvie(st, sem, e);
      });
      App.ui.haptique();
      if (consigne) App.views.accueil.annoncerConsigne(consigne, bilan);
      else App.views.accueil.annoncer(res);
    };
  },

  /** Options d'une envie : chercher sur Cookidoo / Marmiton, créer le repas, supprimer. */
  optionsEnvie(id) {
    const sem = App.store.semaine();
    const e = sem.envies.find(x => x.id === id);
    if (!e) return;
    const { esc } = App.u;
    if (e.consigne) return App.ui.sheet(`
      <h2>📝 ${esc(e.texte)}</h2>
      <div class="list-select">
        <button class="option" data-action="reappliquer">🔄 <span class="grow">Réappliquer au menu<small class="muted block">Après avoir complété ou changé le menu</small></span></button>
        <button class="option" data-action="suppr">↩︎ <span class="grow">Annuler la consigne<small class="muted block">Les repas qu’elle avait changés reviennent</small></span></button>
      </div>`, action => {
      if (action === 'reappliquer') {
        let bilan = null;
        App.store.update(st => { const w = App.store.semaine(); const x = w.envies.find(y => y.id === id); bilan = App.consignes.appliquer(st, w, x); });
        App.ui.closeSheet();
        App.views.accueil.annoncerConsigne(e.consigne, bilan);
      }
      if (action === 'suppr') {
        App.store.update(st => {
          const w = App.store.semaine(); const x = w.envies.find(y => y.id === id);
          if (x) App.suggest.retirerEnvie(st, w, x);
          w.envies = w.envies.filter(y => y.id !== id);
        });
        App.ui.closeSheet();
        App.ui.toast('Consigne annulée : le menu est revenu comme avant');
      }
    });
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

  /** Une consigne dans la liste des envies : ce qu'elle a compris, ce qu'elle a changé, le conseil. */
  ligneConsigne(sem, e) {
    const { esc } = App.u;
    const c = e.consigne;
    const changes = (c.changes || []).filter(id => sem.slots[id] && sem.slots[id].consigneId === e.id);
    const conseils = App.consignes.conseils(c);
    return `
      <li class="envie consigne">
        <div class="envie-head">
          <strong class="grow">📝 ${esc(e.texte)}</strong>
          <button class="icon-btn small" data-action="envie-plus" data-id="${e.id}" aria-label="Plus d’options">⋯</button>
        </div>
        <div class="chips">
          ${App.consignes.libelles(c).map(l => `<span class="chip chip-good">${esc(l)}</span>`).join('')}
          <span class="chip">🗓 ${esc(c.porteeTexte)}</span>
        </div>
        ${changes.length ? `<div class="consigne-repas">
            <small class="muted">${changes.length} repas adapté${changes.length > 1 ? 's' : ''} :</small>
            ${changes.slice(0, 4).map(id => {
              const r = App.store.repas(sem.slots[id].repasId);
              return r ? `<button class="consigne-plat" data-action="envie-repas" data-id="${r.id}">
                <img class="thumb sm" src="${window.APP_DATA.imageRepas(r)}" alt=""/>
                <span><small class="muted">${esc(App.commun.slotLabel(id))}</small>${esc(r.nom)}</span></button>` : '';
            }).join('')}
            ${changes.length > 4 ? `<button class="link-btn" data-action="go" data-route="menu">+ ${changes.length - 4} autres dans le menu ›</button>` : ''}
          </div>` : '<small class="muted block">Le menu respectait déjà cette consigne 👍</small>'}
        ${(c.gardes || []).length ? `<small class="muted block">⚠️ Gardé car choisi à la main : ${c.gardes.map(id => esc(App.commun.slotLabel(id).toLowerCase())).join(', ')}</small>` : ''}
        ${conseils.length ? `<p class="note consigne-conseil">💡 ${conseils.map(esc).join('<br>💡 ')}</p>` : ''}
      </li>`;
  },

  annoncerConsigne(c, bilan) {
    const l = App.consignes.libelles(c).join(', ').toLowerCase();
    const n = bilan ? bilan.changes.length : 0;
    App.ui.toast(n ? `📝 Compris : ${l} (${c.porteeTexte}) · ${n} repas adapté${n > 1 ? 's' : ''}`
      : bilan && !bilan.cases ? `📝 Noté : ${l} · plus de repas à venir cette semaine`
      : `📝 Noté : ${l} · le menu la respectait déjà`);
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
