/* Budget : semaine (producteur, drive, La Fourche, repas dehors) et année (coût de l'alimentation). */
App.views.budget = {
  title: 'Budget',
  mode: 'semaine',
  annee: null,

  render(state) {
    const v = App.views.budget;
    return `
      <div class="who center-who">
        <button class="seg ${v.mode === 'semaine' ? 'on' : ''}" data-action="mode" data-mode="semaine">Semaine</button>
        <button class="seg ${v.mode === 'annee' ? 'on' : ''}" data-action="mode" data-mode="annee">Année</button>
      </div>
      ${v.mode === 'annee' ? v.vueAnnee(state) : v.vueSemaine(state)}
      ${v.reglages(state)}`;
  },

  vueSemaine(state) {
    const { esc, euro } = App.u;
    const sem = App.store.semaine();
    const b = App.budget.resume(sem, state);
    const hist = App.budget.historique(state, 8);
    const max = Math.max(state.settings.plafond, ...hist.map(h => h.total)) || 1;
    const lieu = (x, label) => `
      <div class="row-between"><span>${label} ${x.reel ? '<small class="pill">ticket</small>' : '<small class="muted">(estimation)</small>'}</span><strong>${euro(x.montant)}</strong></div>
      <form class="add-form" data-action="depense" data-lieu="${x.id}">
        <input name="v" inputmode="decimal" placeholder="Montant réel (€)" value="${x.reel ? x.montant : ''}"/>
        <button class="btn" type="submit">OK</button>
      </form>`;

    return `
      ${App.commun.weekNav(state.semaineActive)}
      <section class="card budget-main ${b.depasse ? 'over' : ''}">
        <small class="muted">Total de la semaine</small>
        <div class="big">${euro(b.total)} <small class="muted">/ ${euro(b.plafond)}</small></div>
        ${App.commun.bar(b.pct, b.depasse)}
        <p class="${b.depasse ? 'danger' : 'ok'}">${b.depasse ? `Dépassement de ${euro(-b.reste)}` : `Il reste ${euro(b.reste)}`}</p>
      </section>

      <section class="card stack">
        ${lieu(b.lieux[0], '🧺 Producteur')}
        ${lieu(b.lieux[1], '🚗 Drive')}
        ${b.lieux[2].montant || b.lieux[2].reel ? lieu(b.lieux[2], '🍼 Orchestra') : ''}
      </section>

      ${state.settings.fourcheDansBudget ? `
      <section class="card link-card" data-action="go-fourche">
        <div class="grow">
          <div class="row-between"><span>🌾 La Fourche <small class="muted">(part de la semaine)</small></span><strong>${euro(b.fourche)}</strong></div>
          <small class="muted">Commande de ${App.u.moisLabel(b.fourcheMois.m)} : ${euro(b.fourcheMois.cout)}${b.fourcheMois.montant != null ? '' : ' estimés'} ÷ ${b.fourcheMois.semaines.length} semaines</small>
        </div><span class="chev">›</span>
      </section>` : ''}

      <section class="card">
        <div class="row-between"><span>🍽️ Repas à l’extérieur</span><strong>${euro(b.extTotal)}</strong></div>
        ${b.ext.length ? `<ul class="plain">${b.ext.map(e => `
            <li class="row-between small"><span>${App.commun.slotLabel(e.slotId)} · ${esc(e.label)}</span><span>${euro(e.montant)}</span></li>`).join('')}</ul>`
          : '<small class="muted">Aucun cette semaine. À ajouter depuis le menu (« On mange dehors »), avec le montant.</small>'}
      </section>

      <h3 class="section-title">8 dernières semaines</h3>
      <section class="card">
        <div class="histo">
          ${hist.map(h => `
            <div class="histo-col ${h.k === state.semaineActive ? 'current' : ''}">
              <span class="histo-val">${h.vide ? '' : Math.round(h.total)}</span>
              <span class="histo-track"><span class="histo-bar ${h.total > h.plafond ? 'over' : ''}" style="height:${(h.total / max * 100).toFixed(0)}%"></span></span>
              <small>${App.u.parseKey(h.k).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' })}</small>
            </div>`).join('')}
          <span class="histo-line" style="bottom:calc(1.4rem + ${(state.settings.plafond / max * 110).toFixed(1)}px)"><em>${euro(state.settings.plafond)}</em></span>
        </div>
      </section>`;
  },

  vueAnnee(state) {
    const { euro } = App.u;
    const y = App.views.budget.annee || +App.u.moisCourant().slice(0, 4);
    const A = App.budget.annee(state, y);
    const max = Math.max(1, ...A.mois.map(x => x.total));
    const h = v => `${(v / max * 110).toFixed(1)}px`;
    const part = v => A.total ? Math.round(v / A.total * 100) : 0;
    return `
      <div class="weeknav">
        <button class="icon-btn" data-action="annee-prev" aria-label="Année précédente">‹</button>
        <div class="weeknav-label"><strong>${y}</strong><span>Coût de l’alimentation</span></div>
        <button class="icon-btn" data-action="annee-next" aria-label="Année suivante">›</button>
      </div>
      <section class="card budget-main">
        <small class="muted">Total de l’année</small>
        <div class="big">${euro(A.total)}</div>
        <small class="muted">En moyenne ${euro(A.moyenne)} par mois</small>
        <div class="split">
          <span><i class="dot c1"></i>Courses ${euro(A.courses)} · ${part(A.courses)} %</span>
          <span><i class="dot c2"></i>La Fourche ${euro(A.fourche)} · ${part(A.fourche)} %</span>
          <span><i class="dot c3"></i>Repas dehors ${euro(A.ext)} · ${part(A.ext)} %</span>
        </div>
      </section>
      <section class="card">
        <div class="histo annee">
          ${A.mois.map(x => `
            <div class="histo-col">
              <span class="histo-val">${x.total ? Math.round(x.total) : ''}</span>
              <span class="histo-track stack-bar">
                <span class="seg-bar c3" style="height:${h(x.ext)}"></span>
                <span class="seg-bar c2" style="height:${h(x.fourche)}"></span>
                <span class="seg-bar c1" style="height:${h(x.courses)}"></span>
              </span>
              <small>${new Date(y, +x.m.slice(5) - 1, 1).toLocaleDateString('fr-FR', { month: 'narrow' })}</small>
            </div>`).join('')}
        </div>
      </section>
      <section class="card">
        <ul class="plain">${A.mois.filter(x => x.total).map(x => `
          <li class="row-between month-row">
            <span>${App.u.moisLabel(x.m).split(' ')[0]}</span>
            <small class="muted">${euro(x.courses)} · ${euro(x.fourche)} · ${euro(x.ext)}</small>
            <strong>${x.estime ? '≈ ' : ''}${euro(x.total)}</strong>
          </li>`).join('') || '<li class="muted small">Pas encore de données cette année.</li>'}</ul>
        <small class="muted">≈ : contient des estimations. Saisissez les montants réels (tickets, commande La Fourche) pour un bilan exact.</small>
      </section>`;
  },

  reglages(state) {
    const { esc } = App.u;
    return `
      <h3 class="section-title">Réglages</h3>
      <section class="card stack">
        <label>Budget par semaine (€)<input name="plafond" inputmode="decimal" value="${state.settings.plafond}"/></label>
        <label class="toggle-line"><input type="checkbox" name="fourcheDansBudget" ${state.settings.fourcheDansBudget ? 'checked' : ''}/> Inclure La Fourche dans le budget de la semaine</label>
        <label class="toggle-line"><input type="checkbox" name="calories" ${state.settings.calories ? 'checked' : ''}/> Afficher les calories estimées des repas</label>
        <label>Drive utilisé<select name="drive">${['Leclerc Drive ou Chronodrive', 'Leclerc Drive', 'Chronodrive'].map(d =>
          `<option ${d === state.settings.drive ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
        <label>Portions par repas<input name="portions" inputmode="decimal" value="${state.settings.portions}"/>
          <small class="muted">2 adultes ; passez à 2,5 si le bébé mange une part des plats.</small></label>
        <div class="row">
          <label class="grow">Prénom 1<input name="nom0" value="${esc(state.settings.noms[0])}"/></label>
          <label class="grow">Prénom 2<input name="nom1" value="${esc(state.settings.noms[1])}"/></label>
        </div>
        <button class="btn" data-action="apparence">🎨 Apparence (couleur, clair / sombre) ›</button>
        <button class="btn" data-action="ingredients">Ingrédients, prix & lieux d’achat ›</button>
      </section>

      <h3 class="section-title">Sauvegarde</h3>
      <section class="card stack">
        <small class="muted">Pour l’instant, chaque téléphone garde ses propres données. Exportez pour sauvegarder ou envoyer à l’autre téléphone.</small>
        <div class="grid2">
          <button class="btn" data-action="export">Exporter</button>
          <label class="btn file-btn">Importer<input type="file" accept="application/json,.json" name="import" hidden/></label>
        </div>
        <button class="btn btn-ghost-danger" data-action="reset">Tout réinitialiser</button>
      </section>`;
  },

  mount(el) {
    el.onsubmit = e => {
      e.preventDefault();
      const f = e.target;
      if (f.dataset.action === 'depense') App.store.update(() => {
        App.store.semaine().depenses[f.dataset.lieu] = App.u.num(f.v.value);
      });
    };
    el.onchange = async e => {
      const t = e.target;
      const set = fn => App.store.update(s => fn(s.settings));
      if (t.name === 'plafond') set(s => { s.plafond = App.u.num(t.value) || 0; });
      if (t.name === 'portions') set(s => { s.portions = App.u.num(t.value) || 2; });
      if (t.name === 'fourcheDansBudget') set(s => { s.fourcheDansBudget = t.checked; });
      if (t.name === 'calories') set(s => { s.calories = t.checked; });
      if (t.name === 'drive') set(s => { s.drive = t.value; });
      if (t.name === 'nom0' || t.name === 'nom1') set(s => { const n = +t.name.slice(-1); s.noms[n] = t.value.trim() || s.noms[n]; });
      if (t.name === 'import' && t.files[0]) {
        try { App.store.importJSON(await t.files[0].text()); App.ui.toast('Données importées'); }
        catch (err) { App.ui.toast('Fichier non reconnu'); }
      }
    };
    el.onclick = async e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const act = a.dataset.action, v = App.views.budget;
      if (App.commun.handle(act)) return;
      if (act === 'mode') { v.mode = a.dataset.mode; App.router.render(true); }
      else if (act === 'annee-prev' || act === 'annee-next') {
        v.annee = (v.annee || +App.u.moisCourant().slice(0, 4)) + (act === 'annee-prev' ? -1 : 1);
        App.router.render(true);
      }
      else if (act === 'go-fourche') App.router.go('fourche');
      else if (act === 'ingredients') App.router.go('ingredients');
      else if (act === 'apparence') App.apparence.ouvrir(false);
      else if (act === 'export') {
        const json = App.store.exportJSON();
        const file = new File([json], `nos-repas-${App.u.key(new Date())}.json`, { type: 'application/json' });
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'Nos repas' });
          else {
            const url = URL.createObjectURL(file);
            const link = Object.assign(document.createElement('a'), { href: url, download: file.name });
            link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        } catch (err) { /* annulé */ }
      }
      else if (act === 'reset') App.ui.confirmSheet('Effacer toutes les données (menus, repas ajoutés, suivi, réglages) ?', 'Tout effacer', () => App.store.reset());
    };
  }
};
