/* Écran « Suivi » : une pesée par mois, mensurations pour qui le souhaite. */
App.views.suivi = {
  title: 'Suivi du mois',
  qui: null,

  render(state) {
    const { esc } = App.u;
    const i = App.views.suivi.qui ?? state.settings.moi;
    const profil = state.settings.profils[i];
    const s = App.suivi.resume(state, i);
    const pesees = s.entrees.filter(x => x.poids != null);

    const alerte = profil.allaitement && s.dernierEcart > 2.5
      ? `<p class="note">Le dernier mois a été rapide (−${s.dernierEcart.toFixed(1)} kg). Pendant l’allaitement, mieux vaut viser 2 kg par mois au maximum : pensez à bien manger à chaque repas.</p>` : '';

    return `
      <div class="who center-who">
        ${state.settings.noms.map((n, j) =>
          `<button class="seg ${j === i ? 'on' : ''}" data-action="qui" data-i="${j}">${esc(n)}</button>`).join('')}
      </div>

      <section class="card budget-main">
        <small class="muted">Objectif : −${profil.objectifKg} kg${profil.allaitement ? ' · en douceur (allaitement)' : ''}</small>
        <div class="big">${s.dernier ? `${s.dernier.poids.toFixed(1)} kg` : '—'}
          ${s.perdu ? `<small class="${s.perdu > 0 ? 'ok' : 'muted'}">${s.perdu > 0 ? '−' : '+'}${Math.abs(s.perdu).toFixed(1)} kg</small>` : ''}</div>
        ${App.commun.bar(s.pct, false)}
        <small class="muted">${s.dernier
          ? `${s.pct.toFixed(0)} % de l’objectif · rythme moyen ${s.rythme > 0 ? '−' : '+'}${Math.abs(s.rythme).toFixed(1)} kg/mois · prochaine pesée vers le ${s.prochaine}`
          : 'Première pesée à faire : elle servira de point de départ.'}</small>
      </section>
      ${alerte}

      <button class="btn btn-primary block" data-action="ajouter">${s.aFaire ? '📏 Faire la pesée du mois' : '+ Ajouter une mesure'}</button>

      ${pesees.length >= 2 ? `<h3 class="section-title">Courbe</h3><section class="card">${App.views.suivi.courbe(pesees, profil)}</section>` : ''}

      ${s.entrees.length ? `
        <h3 class="section-title">Historique</h3>
        <ul class="card list">${[...s.entrees].reverse().map((e, n, arr) => {
          const prec = arr[n + 1];
          const d = prec && e.poids != null && prec.poids != null ? e.poids - prec.poids : null;
          const mes = profil.mensurations ? App.suivi.MESURES.filter(m => e[m.id] != null)
            .map(m => `${m.nom.replace('Tour de ', '')} ${e[m.id]} cm`).join(' · ') : '';
          return `
            <li class="item">
              <div class="grow">
                <strong>${App.u.parseKey(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                <span class="muted">${e.poids != null ? `${e.poids.toFixed(1)} kg` : ''}
                  ${d != null ? `<span class="${d <= 0 ? 'ok' : 'danger'}">(${d <= 0 ? '' : '+'}${d.toFixed(1)})</span>` : ''}</span>
                ${mes ? `<small class="muted for">${mes}</small>` : ''}
              </div>
              <button class="icon-btn small" data-action="suppr" data-id="${e.id}" aria-label="Supprimer">✕</button>
            </li>`;
        }).join('')}</ul>` : ''}

      ${profil.mensurations && s.entrees.length >= 2 ? App.views.suivi.tableauMesures(s.entrees) : ''}

      <h3 class="section-title">Réglages de ${esc(state.settings.noms[i])}</h3>
      <section class="card stack">
        <label>Objectif de perte (kg)<input name="objectifKg" inputmode="decimal" value="${profil.objectifKg}"/></label>
        <label class="toggle-line"><input type="checkbox" name="mensurations" ${profil.mensurations ? 'checked' : ''}/> Suivre les mensurations</label>
        <label class="toggle-line"><input type="checkbox" name="allaitement" ${profil.allaitement ? 'checked' : ''}/> Allaitement en cours (rythme doux)</label>
      </section>
      <p class="disclaimer">Une pesée par mois suffit : le poids varie d’un jour à l’autre. Ce suivi ne remplace pas l’avis d’un professionnel de santé.</p>`;
  },

  courbe(pesees, profil) {
    const W = 320, H = 140, P = 24;
    const vals = pesees.map(p => p.poids);
    const cible = vals[0] - profil.objectifKg;
    const min = Math.min(...vals, cible) - 1, max = Math.max(...vals) + 1;
    const x = n => P + (n / Math.max(1, pesees.length - 1)) * (W - 2 * P);
    const y = v => H - P - ((v - min) / (max - min)) * (H - 2 * P);
    const pts = pesees.map((p, n) => `${x(n).toFixed(1)},${y(p.poids).toFixed(1)}`).join(' ');
    return `
      <svg class="courbe" viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution du poids">
        <line x1="${P}" x2="${W - P}" y1="${y(cible)}" y2="${y(cible)}" class="cible"/>
        <text x="${W - P}" y="${y(cible) - 4}" text-anchor="end" class="lbl">objectif ${cible.toFixed(0)} kg</text>
        <polyline points="${pts}" class="trait"/>
        ${pesees.map((p, n) => `<circle cx="${x(n)}" cy="${y(p.poids)}" r="3.5" class="pt"/>
          <text x="${x(n)}" y="${y(p.poids) - 8}" text-anchor="middle" class="lbl">${p.poids.toFixed(1)}</text>`).join('')}
      </svg>`;
  },

  tableauMesures(entrees) {
    const premier = entrees[0], dernier = entrees[entrees.length - 1];
    const lignes = App.suivi.MESURES.filter(m => premier[m.id] != null && dernier[m.id] != null).map(m => {
      const d = dernier[m.id] - premier[m.id];
      return `<li class="row-between"><span>${m.nom}</span><span>${dernier[m.id]} cm <span class="${d <= 0 ? 'ok' : 'danger'}">(${d <= 0 ? '' : '+'}${d.toFixed(1)})</span></span></li>`;
    }).join('');
    return lignes ? `<h3 class="section-title">Mensurations depuis le début</h3><section class="card"><ul class="plain stack">${lignes}</ul></section>` : '';
  },

  mount(el, state) {
    const i = () => App.views.suivi.qui ?? App.store.state.settings.moi;
    el.onclick = e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const act = a.dataset.action;
      if (act === 'qui') { App.views.suivi.qui = +a.dataset.i; App.router.render(true); }
      else if (act === 'ajouter') App.views.suivi.saisir(i());
      else if (act === 'suppr') App.ui.confirmSheet('Supprimer cette mesure ?', 'Supprimer', () =>
        App.store.update(s => { s.suivi[i()] = s.suivi[i()].filter(x => x.id !== a.dataset.id); }));
    };
    el.onchange = e => {
      const t = e.target;
      App.store.update(s => {
        const p = s.settings.profils[i()];
        if (t.name === 'objectifKg') p.objectifKg = App.u.num(t.value) || 0;
        if (t.name === 'mensurations') p.mensurations = t.checked;
        if (t.name === 'allaitement') p.allaitement = t.checked;
      });
    };
  },

  saisir(i) {
    const st = App.store.state;
    const profil = st.settings.profils[i];
    App.ui.sheet(`
      <h2>Pesée du mois · ${App.u.esc(st.settings.noms[i])}</h2>
      <form data-action="save" class="stack">
        <div class="row">
          <label class="grow">Date<input type="date" name="date" value="${App.u.key(new Date())}"/></label>
          <label class="grow">Poids (kg)<input name="poids" inputmode="decimal" placeholder="ex. 72,4"/></label>
        </div>
        ${profil.mensurations ? `
          <fieldset><legend>Mensurations (cm)</legend>
            <div class="grid2">${App.suivi.MESURES.map(m =>
              `<label>${m.nom}<input name="${m.id}" inputmode="decimal"/></label>`).join('')}</div>
            <small class="muted">Toujours au même endroit, le matin, mètre ruban à plat.</small>
          </fieldset>` : ''}
        <button class="btn btn-primary" type="submit">Enregistrer</button>
      </form>`, (action, f) => {
      if (action !== 'save') return;
      const entree = { id: App.u.uid(), date: f.date.value || App.u.key(new Date()), poids: App.u.num(f.poids.value) };
      if (profil.mensurations) App.suivi.MESURES.forEach(m => { const v = App.u.num(f[m.id].value); if (v != null) entree[m.id] = v; });
      if (entree.poids == null && Object.keys(entree).length <= 3) return App.ui.toast('Indiquez au moins le poids');
      App.store.update(s => { (s.suivi[i] = s.suivi[i] || []).push(entree); });
      App.ui.closeSheet();
      App.ui.toast('Mesure enregistrée');
    });
  }
};
