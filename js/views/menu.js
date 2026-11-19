/* Menu de la semaine : midi / soir, repas maison, extérieur, restes, report. */
App.views.menu = {
  title: 'Menu de la semaine',

  slotTexte(s) {
    const { esc, euro } = App.u;
    if (!s) return '<span class="muted">—</span>';
    if (s.type === 'ext') return `🍽️ ${esc(s.label || 'Repas extérieur')}${s.montant ? ` · ${euro(s.montant)}` : ''}`;
    if (s.type === 'restes') return '♻️ Restes';
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

    const jours = App.JOURS.map((j, i) => `
      <section class="card day ${i === today ? 'today' : ''} ${i < today ? 'past' : ''}">
        <h3>${j.nom} <small class="muted">${App.u.dayDate(k, i)}</small></h3>
        ${moments.map(m => {
          const id = `${j.id}-${m.id}`, s = sem.slots[id];
          const r = s && s.repasId ? App.store.repas(s.repasId) : null;
          const cls = !s ? 'empty' : s.type;
          return `
            <button class="slot ${cls}" data-action="slot" data-slot="${id}">
              <span class="slot-moment">${m.nom}</span>
              ${r && s.type !== 'reporte' ? `<img class="thumb sm" src="${window.APP_DATA.imageRepas(r)}" alt="" loading="lazy"/>` : ''}
              <span class="slot-body">${s ? App.views.menu.slotTexte(s) : '<span class="muted">+ Choisir</span>'}
                ${s && s.dejaAchete ? '<small class="pill">déjà acheté</small>' : ''}
                ${r && s.type === 'maison' && App.suggest.conseille(r, obj) ? `<small class="pill good">${obj.emoji}</small>` : ''}
              </span>
            </button>`;
        }).join('')}
      </section>`).join('');

    return `
      ${App.commun.weekNav(k)}
      ${obj ? `<button class="banner" data-action="go-objectif">${obj.emoji} Objectif : <strong>${esc(obj.nom)}</strong></button>`
            : '<button class="banner muted" data-action="go-objectif">🌱 Aucun objectif choisi — en choisir un</button>'}
      <div class="toolbar">
        <button class="btn btn-primary" data-action="remplir">✨ Compléter le menu</button>
        <button class="btn" data-action="menu-type">Menu type</button>
        <button class="btn btn-ghost" data-action="vider" aria-label="Vider la semaine">Vider</button>
      </div>
      ${jours}
      ${App.views.menu.carteDouceurs(sem)}
      <label class="toggle-line">
        <input type="checkbox" name="midis" ${state.settings.midis ? 'checked' : ''}/> Planifier aussi les midis
      </label>`;
  },

  mount(el) {
    el.onclick = e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const act = a.dataset.action;
      if (App.commun.handle(act)) return;
      if (act === 'slot') App.views.menu.ouvrirCase(a.dataset.slot);
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
        let n = 0;
        App.store.update(s => { n = App.suggest.remplir(s, App.store.semaine()); });
        App.ui.toast(n ? `${n} repas proposés selon l’objectif — touchez-en un pour le changer` : 'Le menu est déjà complet');
      }
      else if (act === 'menu-type') App.views.menu.menuType();
      else if (act === 'vider') App.ui.confirmSheet('Vider tout le menu de cette semaine ?', 'Vider', () =>
        App.store.update(s => { const w = App.store.semaine(); Object.values(w.slots).forEach(x => App.stock.annulerConso(s, x)); w.slots = {}; }));
    };
    el.onchange = e => {
      if (e.target.name === 'midis') App.store.update(s => { s.settings.midis = e.target.checked; });
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
      <h3>${s ? 'Changer de repas' : 'Choisir un repas'}</h3>
      <input type="search" placeholder="Rechercher…" data-live="search" autocomplete="off"/>
      <div class="list-select" id="slot-list">${liste('')}</div>`, (action, target, ov) => {
      const set = val => { App.store.update(st2 => {
        const w = App.store.semaine();
        App.stock.annulerConso(st2, w.slots[slotId]);
        if (val) w.slots[slotId] = val; else delete w.slots[slotId];
      }); App.ui.closeSheet(); };

      if (action === 'search') ov.querySelector('#slot-list').innerHTML = liste(target.value);
      else if (action === 'pick') set({ type: 'maison', repasId: target.dataset.id });
      else if (action === 'restes') set({ type: 'restes' });
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
      App.store.update(s => { const w = App.store.semaine(); App.stock.annulerConso(s, w.slots[target.dataset.slot]); w.slots[target.dataset.slot] = { type: 'maison', repasId }; });
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
                                             : { type: 'maison', repasId: x };
        });
      });
      App.ui.closeSheet();
      App.ui.toast(`« ${m.nom} » appliqué`);
    });
  }
};
