/* Menu de la semaine : midi / soir, repas maison, extérieur, restes, report. */
App.views.menu = {
  title: 'Menu de la semaine',

  slotTexte(s) {
    const { esc, euro } = App.u;
    if (!s) return '<span class="muted">—</span>';
    if (s.type === 'ext') return `🍽️ ${esc(s.label || 'Repas extérieur')}${s.montant ? ` · ${euro(s.montant)}` : ''}`;
    if (s.type === 'restes') return '♻️ Restes';
    if (s.type === 'envie') return `💡 Envie : ${esc(s.label)} <small class="muted">— recette à choisir</small>`;
    const r = App.store.repas(s.repasId);
    const nom = r ? esc(r.nom) : 'Repas supprimé';
    if (s.type === 'reporte') return `<s>${nom}</s> <small class="muted">→ semaine suivante</small>`;
    return nom;
  },

  render(state) {
    const { esc } = App.u;
    const k = state.semaineActive;
    const sem = App.store.semaine();
    const obj = App.suggest.objectif(sem);
    const today = App.u.isCurrentWeek(k) ? App.u.todayIndex() : -1;
    const moments = App.MOMENTS.filter(m => m.id === 'soir' || state.settings.midis);

    const bebe = state.settings.bebe && state.settings.bebe.actif;
    const kcal = state.settings.calories;
    const jours = App.JOURS.map((j, i) => {
      const t = kcal ? App.nutrition.jour(sem, j.id) : null;
      return `
      <section class="card day ${i === today ? 'today' : ''} ${i < today ? 'past' : ''}" id="jour-${j.id}">
        <div class="day-tete"><h3>${j.nom} <small class="muted">${App.u.dayDate(k, i)}</small></h3>
          ${i === today ? '<span class="pill good">Aujourd’hui</span>' : ''}
          ${t && t.nb ? `<small class="muted day-kcal">≈ ${Math.round(t.kcal / 10) * 10} kcal · ${Math.round(t.p)} g prot.</small>` : ''}</div>
        ${moments.map(m => {
          const id = `${j.id}-${m.id}`, s = sem.slots[id];
          const r = s && s.repasId ? App.store.repas(s.repasId) : null;
          const cls = !s ? 'empty' : s.type;
          return `
            <button class="slot ${cls}" data-action="slot" data-slot="${id}">
              ${r && s.type !== 'reporte' ? `<img class="thumb" src="${window.APP_DATA.imageRepas(r)}" alt="" loading="lazy"/>` : `<span class="thumb vide-thumb">${!s ? '＋' : s.type === 'ext' ? '🍽️' : s.type === 'restes' ? '♻️' : '💡'}</span>`}
              <span class="slot-body"><small class="slot-moment">${m.nom}</small>
                ${s ? App.views.menu.slotTexte(s) : '<span class="muted">Choisir un repas</span>'}
                ${s && s.envieId ? '<small class="pill envie-pill">💡 envie</small>' : ''}
                ${r && s.type === 'maison' && App.suggest.conseille(r, obj) ? `<small class="pill good">${obj.emoji}</small>` : ''}
              </span>
            </button>`;
        }).join('')}
        ${bebe ? App.views.menu.ligneBebe(sem, j) : ''}
      </section>`;
    }).join('');

    const bande = App.JOURS.map((j, i) => {
      const plein = moments.every(m => sem.slots[`${j.id}-${m.id}`]);
      return `<button class="bande-jour ${i === today ? 'today' : ''} ${plein ? 'plein' : ''}" data-action="aller-jour" data-j="${j.id}">
        <small>${j.nom.slice(0, 3)}</small><strong>${new Date(App.u.parseKey(k).getTime() + i * 864e5).getDate()}</strong><i></i></button>`;
    }).join('');

    return `
      ${App.commun.weekNav(k)}
      <div class="jours-bande">${bande}</div>
      <div class="toolbar menu-actions">
        <button class="btn btn-primary" data-action="remplir">✨ Compléter le menu</button>
        <button class="rond ${obj ? 'primary-soft' : ''}" data-action="go-objectif" aria-label="Objectif de la semaine" title="${obj ? esc(obj.nom) : 'Choisir un objectif'}">${obj ? obj.emoji : '🌱'}</button>
        <button class="rond" data-action="options" aria-label="Plus d’options">⋯</button>
      </div>
      ${jours}
      ${App.views.menu.carteDouceurs(sem)}
      <a class="ligne-lien discret" href="#/reglages"><span class="grow">⚙️ Midis, bébé, gâteaux : réglages du menu</span><span class="chev">›</span></a>`;
  },

  /** Options du menu : menu type, objectif, gâteaux, vider. */
  options() {
    const sem = App.store.semaine();
    App.ui.sheet(`
      <h2>Options du menu</h2>
      <div class="list-select">
        <button class="option" data-action="menu-type">📋 <span class="grow">Appliquer un menu type<small class="muted block">Vos semaines habituelles</small></span></button>
        <button class="option" data-action="objectif">🌱 <span class="grow">Objectif de la semaine</span></button>
        <button class="option" data-action="alleger">💶 <span class="grow">Alléger le budget<small class="muted block">Remplace les plats proposés les plus chers</small></span></button>
        <button class="option" data-action="douceurs">🍰 <span class="grow">${(sem.douceurs || []).length ? 'Changer les gâteaux' : 'Proposer les gâteaux'}</span></button>
        <button class="option danger-opt" data-action="vider">🗑 <span class="grow">Vider la semaine</span></button>
      </div>`, action => {
      App.ui.closeSheet(true);
      if (action === 'menu-type') App.views.menu.menuType();
      if (action === 'objectif') App.router.go('objectif');
      if (action === 'alleger') App.views.menu.alleger(true);
      if (action === 'douceurs') App.store.update(s => App.suggest.proposerDouceurs(s, App.store.semaine()));
      if (action === 'vider') App.ui.confirmSheet('Vider tout le menu de cette semaine ?', 'Vider', () =>
        App.store.update(s => { const w = App.store.semaine(); Object.values(w.slots).forEach(x => App.stock.annulerConso(s, x)); w.slots = {}; }));
    });
  },

  alleger(annoncer) {
    let n = 0;
    App.store.update(s => { n = App.suggest.alleger(s, App.store.semaine()); });
    const b = App.budget.resume(App.store.semaine(), App.store.state);
    if (n) App.ui.toast(`💶 ${n} plat${n > 1 ? 's' : ''} remplacé${n > 1 ? 's' : ''} : ${App.u.euro(b.total)} / ${App.u.euro(b.plafond)}`);
    else if (annoncer) App.ui.toast(b.depasse ? 'Rien à alléger : les plats restants sont choisis par vous' : 'Le menu est déjà dans le budget 👍');
    return n;
  },

  /** Ligne « 👶 Bébé » d'un jour : midi, goûter, soir. */
  ligneBebe(sem, j) {
    const { esc } = App.u;
    return `
      <div class="bebe-ligne">
        <span class="bebe-icone" aria-hidden="true">👶</span>
        ${App.MOMENTS_BEBE.map(m => {
          const id = `${j.id}-${m.id}`, s = sem.slots[id];
          const r = s && s.repasId ? App.store.repas(s.repasId) : null;
          return `<button class="bebe-case ${r ? '' : 'vide'} ${r && r.source === 'orchestra' ? 'orch' : ''}" data-action="slot-bebe" data-slot="${id}">
            <small>${m.nom}</small>
            <span>${r ? esc(r.nom.replace(/^Purée (de |d’)?/i, '').replace(/^Compote (de )?/i, 'Compote ')) : '+'}</span>
            ${r ? `<i>${r.source === 'orchestra' ? '🍼 Orchestra' : '🏠 maison'}</i>` : ''}
          </button>`;
        }).join('')}
      </div>`;
  },

  carteBebe(state) {
    const b = state.settings.bebe;
    const age = App.suggest.ageBebe(state);
    return `
      <section class="card bebe-reglages">
        <h3>👶 Repas de bébé</h3>
        <div class="row">
          <label class="grow">Né(e) en<input type="month" name="bebe-naissance" value="${b.naissance || ''}"/></label>
          <label class="grow">Pots Orchestra / semaine<input name="bebe-orch" inputmode="numeric" value="${b.orchestraParSemaine}"/></label>
        </div>
        <small class="muted">${b.naissance ? `${age} mois : ` : 'Âge non indiqué (8 mois par défaut) : '}les purées proposées sont adaptées à son âge.</small>
        <details class="reperes">
          <summary>Repères pour les repas de bébé</summary>
          <ul>
            <li>Ni sel, ni sucre, ni miel avant 1 an.</li>
            <li>1 cuillère à café d’huile de colza dans chaque purée de légumes.</li>
            <li>Viande, poisson ou œuf : environ 10 g par jour vers 6-8 mois, 15-20 g vers 1 an, une seule fois par jour.</li>
            <li>Purées maison : cuisson vapeur, puis congélation en bacs à glaçons (3 mois).</li>
            <li>Pour les pots du commerce, vérifier l’âge indiqué sur l’étiquette.</li>
            <li>Ces repères ne remplacent pas l’avis du pédiatre.</li>
          </ul>
        </details>
      </section>`;
  },

  ouvrirCaseBebe(slotId) {
    const st = App.store.state;
    const { esc } = App.u;
    const sem = App.store.semaine();
    const s = sem.slots[slotId];
    const m = App.MOMENTS_BEBE.find(x => slotId.endsWith(x.id));
    const option = r => `<button class="option ${s && s.repasId === r.id ? 'on' : ''}" data-action="pick" data-id="${r.id}">
        <span class="grow">${esc(r.nom)}</span><small class="muted">${r.ageMin} mois +</small></button>`;
    const maison = App.suggest.repasBebe(st, m.type, 'maison');
    const orch = App.suggest.repasBebe(st, m.type, 'orchestra');
    App.ui.sheet(`
      <h2>${esc(App.commun.slotLabel(slotId))}</h2>
      ${s && s.repasId ? `<div class="chips"><button class="chip chip-btn" data-action="fiche">Voir la recette</button>
        <button class="chip chip-btn" data-action="vider">Vider</button></div>` : ''}
      <h3>🏠 Fait maison <small class="muted">· légumes du producteur</small></h3>
      <div class="list-select">${maison.map(option).join('')}</div>
      <h3>🍼 Acheté chez Orchestra</h3>
      <div class="list-select">${orch.map(option).join('')}</div>`, (action, target) => {
      const set = val => { App.store.update(st2 => {
        const w = App.store.semaine();
        App.stock.annulerConso(st2, w.slots[slotId]);
        if (val) w.slots[slotId] = val; else delete w.slots[slotId];
      }); App.ui.closeSheet(); };
      if (action === 'pick') set({ type: 'maison', repasId: target.dataset.id, source: 'manuel' });
      else if (action === 'vider') set(null);
      else if (action === 'fiche') App.views.repas.detail(s.repasId);
    });
  },

  mount(el) {
    el.onclick = e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const act = a.dataset.action;
      if (App.commun.handle(act)) return;
      if (act === 'slot') App.views.menu.ouvrirCase(a.dataset.slot);
      else if (act === 'slot-bebe') App.views.menu.ouvrirCaseBebe(a.dataset.slot);
      else if (act === 'douceur') App.views.repas.detail(a.dataset.id);
      else if (act === 'douceurs-proposer') App.store.update(s => App.suggest.proposerDouceurs(s, App.store.semaine()));
      else if (act === 'douceur-changer') {
        let autre = null;
        App.store.update(s => { autre = App.suggest.remplacerDouceur(s, App.store.semaine(), a.dataset.id); });
        App.ui.toast(autre ? `Remplacé par : ${autre.nom}` : 'Pas d’autre gâteau disponible');
      }
      else if (act === 'douceur-retirer') App.store.update(() => {
        const w = App.store.semaine(); w.douceurs = (w.douceurs || []).filter(x => x !== a.dataset.id);
      });
      else if (act === 'go-objectif') App.router.go('objectif');
      else if (act === 'remplir') {
        let n = 0, m = 0;
        App.store.update(s => { n = App.suggest.remplir(s, App.store.semaine()); m = App.suggest.alleger(s, App.store.semaine()); });
        App.ui.haptique();
        const b = App.budget.resume(App.store.semaine(), App.store.state);
        App.ui.toast(n ? `✨ ${n} repas proposés · ${App.u.euro(b.total)} / ${App.u.euro(b.plafond)}${m && !b.depasse ? ' · budget respecté 👍' : b.depasse ? ' · « ⋯ › Alléger » pour réduire' : ''}` : 'Le menu est déjà complet');
      }
      else if (act === 'options') App.views.menu.options();
      else if (act === 'aller-jour') {
        const d = document.getElementById('jour-' + a.dataset.j);
        if (d) window.scrollTo({ top: d.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
      }
      else if (act === 'menu-type') App.views.menu.menuType();
      else if (act === 'vider') App.ui.confirmSheet('Vider tout le menu de cette semaine ?', 'Vider', () =>
        App.store.update(s => { const w = App.store.semaine(); Object.values(w.slots).forEach(x => App.stock.annulerConso(s, x)); w.slots = {}; }));
    };
    el.onchange = e => {
      const t = e.target;
      if (t.name === 'midis') App.store.update(s => { s.settings.midis = t.checked; });
      if (t.name === 'bebe') App.store.update(s => { s.settings.bebe.actif = t.checked; });
      if (t.name === 'bebe-naissance') App.store.update(s => { s.settings.bebe.naissance = t.value || null; });
      if (t.name === 'bebe-orch') App.store.update(s => { s.settings.bebe.orchestraParSemaine = Math.max(0, Math.round(App.u.num(t.value) || 0)); });
    };
  },

  carteDouceurs(sem) {
    const { esc } = App.u;
    const liste = (sem.douceurs || []).map(id => App.store.repas(id)).filter(Boolean);
    return `
      <section class="card douceurs">
        <div class="row-between">
          <h3>🍰 Gâteaux healthy de la semaine</h3>
          <button class="link-btn" data-action="douceurs-proposer">${liste.length ? 'Tout changer' : 'Proposer'}</button>
        </div>
        ${liste.length ? liste.map(r => `
          <div class="douceur">
            <img class="thumb" src="${window.APP_DATA.imageRepas(r)}" alt="" loading="lazy"/>
            <button class="douceur-main" data-action="douceur" data-id="${r.id}">
              <strong>${esc(r.nom)}</strong>
              ${r.classique ? `<small class="muted">Revisite healthy · ${esc(r.classique)}</small>` : ''}
            </button>
            <button class="icon-btn small" data-action="douceur-changer" data-id="${r.id}" aria-label="Changer">↻</button>
            <button class="icon-btn small" data-action="douceur-retirer" data-id="${r.id}" aria-label="Retirer">✕</button>
          </div>`).join('')
        : '<p class="muted small">Deux gâteaux sans farine blanche ni sucre raffiné, différents chaque semaine. Leurs ingrédients s’ajoutent aux courses.</p>'}
      </section>`;
  },

  ouvrirCase(slotId) {
    const st = App.store.state;
    const { esc, euro } = App.u;
    const sem = App.store.semaine();
    const s = sem.slots[slotId];
    const obj = App.suggest.objectif(sem);
    const classes = App.suggest.classer(st, sem);
    const restes = App.stock.frais(st);
    const ligneRepas = r => `
      <button class="option" data-action="pick" data-id="${r.id}">
        <img class="thumb sm" src="${window.APP_DATA.imageRepas(r)}" alt="" loading="lazy"/>
        <span class="grow">${esc(r.nom)}</span>
        ${App.suggest.utiliseRestes(r, restes) ? '<small class="pill good">♻️ déjà au frigo</small>' : ''}
        ${App.suggest.conseille(r, obj) ? `<span>${obj.emoji}</span>` : ''}
      </button>`;
    const liste = q => {
      const nq = App.u.norm(q);
      const items = nq ? st.repas.filter(r => App.u.norm(r.nom).includes(nq)) : classes.slice(0, 8);
      return (nq ? '' : '<small class="muted">Suggestions pour cette semaine</small>') +
        (items.map(ligneRepas).join('') || '<p class="muted">Aucun repas trouvé.</p>');
    };

    const actuel = s ? `
      <div class="current-slot">
        <div>${App.views.menu.slotTexte(s)}</div>
        <div class="chips">
          ${s.repasId && s.type !== 'reporte' ? '<button class="chip chip-btn" data-action="fiche">Voir la fiche</button>' : ''}
          ${s.type === 'maison' ? '<button class="chip chip-btn" data-action="reporter">Pas cuisiné → reporter</button>' : ''}
          <button class="chip chip-btn" data-action="vider">Vider</button>
        </div>
      </div>` : '';

    App.ui.sheet(`
      <h2>${App.commun.slotLabel(slotId)}</h2>
      ${actuel}
      <div class="grid2">
        <button class="btn" data-action="ext-toggle">🍽️ On mange dehors</button>
        <button class="btn" data-action="restes">♻️ Restes</button>
      </div>
      <form class="ext-form ${s && s.type === 'ext' ? '' : 'hidden'} stack" data-action="ext">
        <div class="row">
          <label class="grow">Où ?<input name="label" placeholder="Restaurant, chez maman, cantine…" value="${esc(s && s.type === 'ext' ? s.label : '')}"/></label>
          <label style="width:6.5rem">Montant €<input name="montant" inputmode="decimal" placeholder="0" value="${s && s.type === 'ext' && s.montant ? s.montant : ''}"/></label>
        </div>
        <button class="btn btn-primary" type="submit">Enregistrer</button>
        <small class="muted">Ce repas sort de la liste de courses et son montant compte dans le budget.</small>
      </form>
      ${s && s.type === 'envie' ? `<div class="chips">
          <a class="chip chip-btn" target="_blank" rel="noopener" href="${App.views.repas.urlCookidoo(s.label)}">Chercher « ${esc(s.label)} » sur Cookidoo ↗</a>
          <a class="chip chip-btn" target="_blank" rel="noopener" href="https://www.marmiton.org/recettes/recherche.aspx?aqt=${encodeURIComponent(s.label)}">Marmiton ↗</a>
          <button class="chip chip-btn" data-action="creer-envie">+ Créer ce repas</button></div>` : ''}
      <h3>${s ? 'Changer de repas' : 'Choisir un repas'}</h3>
      <input type="search" placeholder="Rechercher…" data-live="search" autocomplete="off"/>
      <div class="list-select" id="slot-list">${liste('')}</div>`, (action, target, ov) => {
      const set = val => { App.store.update(st2 => {
        const w = App.store.semaine();
        App.stock.annulerConso(st2, w.slots[slotId]);
        if (val) w.slots[slotId] = val; else delete w.slots[slotId];
      }); App.ui.closeSheet(); };

      if (action === 'search') ov.querySelector('#slot-list').innerHTML = liste(target.value);
      else if (action === 'pick') set({ type: 'maison', repasId: target.dataset.id, source: 'manuel' });
      else if (action === 'restes') set({ type: 'restes' });
      else if (action === 'creer-envie') App.views.repas.editer(null, s.label);
      else if (action === 'vider') set(null);
      else if (action === 'fiche') App.views.repas.detail(s.repasId);
      else if (action === 'ext-toggle') ov.querySelector('.ext-form').classList.toggle('hidden');
      else if (action === 'ext') set({ type: 'ext', label: target.label.value.trim(), montant: App.u.num(target.montant.value) || 0 });
      else if (action === 'reporter') { App.views.menu.reporter(slotId); App.ui.closeSheet(); }
    });
  },

  /** Repas pas cuisiné : ses ingrédients ont été achetés, on le décale à la semaine suivante. */
  reporter(slotId) {
    const st = App.store.state;
    const k = st.semaineActive;
    const s = App.store.semaine(k).slots[slotId];
    const suivante = App.u.addWeeks(k, 1);
    let place = null;
    App.store.update(() => {
      const w = App.store.semaine(suivante);
      const ordre = [];
      App.JOURS.forEach(j => ordre.push(`${j.id}-soir`));
      if (st.settings.midis) App.JOURS.forEach(j => ordre.push(`${j.id}-midi`));
      place = ordre.find(id => !w.slots[id]);
      App.stock.annulerConso(st, s);
      if (place) w.slots[place] = { type: 'maison', repasId: s.repasId };
      App.store.semaine(k).slots[slotId] = { type: 'reporte', repasId: s.repasId };
    });
    App.ui.toast(place ? `Reporté à ${App.commun.slotLabel(place)} (semaine suivante) — ses ingrédients restent au garde-manger`
                       : 'Semaine suivante pleine : le repas est marqué reporté');
  },

  /** Depuis la fiche d'un repas : choisir la case où le placer. */
  choisirCase(repasId) {
    const st = App.store.state;
    const sem = App.store.semaine();
    const moments = App.MOMENTS.filter(m => m.id === 'soir' || st.settings.midis);
    App.ui.sheet(`
      <h2>Ajouter au menu</h2>
      <p class="muted small">${App.u.weekLabel(st.semaineActive)}</p>
      <div class="slot-grid" style="--cols:${moments.length}">
        ${App.JOURS.map(j => `
          <span class="slot-grid-day">${j.nom}</span>
          ${moments.map(m => {
            const id = `${j.id}-${m.id}`, occ = sem.slots[id];
            return `<button class="slot-cell ${occ ? 'occ' : ''}" data-action="place" data-slot="${id}">${m.nom}${occ ? ' •' : ''}</button>`;
          }).join('')}`).join('')}
      </div>
      <small class="muted">• = déjà un repas prévu (il sera remplacé)</small>`, (action, target) => {
      if (action !== 'place') return;
      App.store.update(s => { const w = App.store.semaine(); App.stock.annulerConso(s, w.slots[target.dataset.slot]); w.slots[target.dataset.slot] = { type: 'maison', repasId, source: 'manuel' }; });
      App.ui.closeSheet();
      App.ui.toast(`Ajouté : ${App.commun.slotLabel(target.dataset.slot)}`);
    });
  },

  menuType() {
    const st = App.store.state;
    const { esc } = App.u;
    App.ui.sheet(`
      <h2>Appliquer un menu type</h2>
      <p class="muted small">Remplace les dîners de la semaine par l’un de vos menus habituels.</p>
      <div class="list-select">
        ${st.menusTypes.map(m => `
          <button class="option col" data-action="apply" data-id="${m.id}">
            <strong>${esc(m.nom)}</strong>
            <small class="muted">${m.soirs.map(x => x.startsWith('ext:') ? x.slice(4)
              : (App.store.repas(x) || { nom: '?' }).nom).map(esc).join(' · ')}</small>
          </button>`).join('')}
      </div>`, (action, target) => {
      if (action !== 'apply') return;
      const m = st.menusTypes.find(x => x.id === target.dataset.id);
      App.store.update(() => {
        const w = App.store.semaine();
        m.soirs.forEach((x, i) => {
          const id = `${App.JOURS[i].id}-soir`;
          App.stock.annulerConso(App.store.state, w.slots[id]);
          w.slots[id] = x.startsWith('ext:') ? { type: 'ext', label: x.slice(4), montant: 0 }
                                             : { type: 'maison', repasId: x, source: 'manuel' };
        });
      });
      App.ui.closeSheet();
      App.ui.toast(`« ${m.nom} » appliqué`);
    });
  }
};
