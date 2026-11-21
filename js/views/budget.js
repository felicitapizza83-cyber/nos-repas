/* Budget : semaine (producteur, drive, La Fourche, repas dehors) et année (coût de l'alimentation). */
App.views.budget = {
  title: 'Budget',
  mode: 'semaine',
  annee: null,

  render(state) {
    const v = App.views.budget;
    return `
      <div class="who center-who segment">
        <button class="seg ${v.mode === 'semaine' ? 'on' : ''}" data-action="mode" data-mode="semaine">Semaine</button>
        <button class="seg ${v.mode === 'mois' ? 'on' : ''}" data-action="mode" data-mode="mois">Mois</button>
        <button class="seg ${v.mode === 'annee' ? 'on' : ''}" data-action="mode" data-mode="annee">Année</button>
      </div>
      ${v.mode === 'annee' ? v.vueAnnee(state) : v.mode === 'mois' ? v.vueMois(state) : v.vueSemaine(state)}
      <a class="ligne-lien discret" href="#/reglages"><span class="grow">⚙️ Budget, drive, La Fourche, sauvegarde : réglages</span><span class="chev">›</span></a>`;
  },

  vueSemaine(state) {
    const { esc, euro } = App.u;
    const sem = App.store.semaine();
    const b = App.budget.resume(sem, state);
    const hist = App.budget.historique(state, 8);
    const max = Math.max(state.settings.plafond, ...hist.map(h => h.total)) || 1;
    const lieu = (x, label) => `
      <button class="ligne-budget" data-action="ticket" data-lieu="${x.id}" data-label="${esc(label)}">
        <span class="grow">${label}<small class="muted block">${x.reel ? '🧾 montant du ticket' : 'estimation · toucher pour saisir le ticket'}</small></span>
        <strong>${euro(x.montant)}</strong><span class="chev">›</span>
      </button>`;
    const P = Math.max(b.plafond, b.total) || 1;
    const seg = (v, cls) => v > 0 ? `<span class="${cls}" style="width:${(v / P * 100).toFixed(1)}%"></span>` : '';

    return `
      ${App.commun.weekNav(state.semaineActive)}
      <section class="card budget-main ${b.depasse ? 'attention' : ''}">
        <small class="muted">Total de la semaine</small>
        <div class="big">${euro(b.total)} <small class="muted">/ ${euro(b.plafond)}</small></div>
        <div class="bar-empile">${seg(b.courses, 'c1')}${seg(b.fourche, 'c2')}${seg(b.extTotal, 'c3')}
          ${b.depasse ? `<i style="left:${(b.plafond / P * 100).toFixed(1)}%"></i>` : ''}</div>
        <div class="split ligne">
          <span><i class="dot c1"></i>Courses ${euro(b.courses)}</span>
          ${b.fourche ? `<span><i class="dot c2"></i>La Fourche ${euro(b.fourche)}</span>` : ''}
          ${b.extTotal ? `<span><i class="dot c3"></i>Dehors ${euro(b.extTotal)}</span>` : ''}
        </div>
        ${b.depasse
          ? `<div class="alerte-douce"><span class="grow">${euro(-b.reste)} au-dessus du budget</span>
              <button class="btn btn-primary" data-action="alleger">Alléger le menu</button></div>`
          : `<p class="ok">Il reste ${euro(b.reste)} 👍</p>`}
      </section>

      <h3 class="section-title">Par lieu d’achat</h3>
      <section class="card liste-budget">
        ${b.lieux.map(x => {
          const L = window.APP_DATA.lieux.find(y => y.id === x.id) || { emoji: '', nom: x.id };
          // Toujours visibles : producteur, boucherie, drive ; Orchestra si les repas de bébé sont planifiés
          const visible = x.id !== 'orchestra' || (state.settings.bebe && state.settings.bebe.actif) || x.montant || x.reel;
          return visible ? lieu(x, `${L.emoji} ${L.nom}`) : '';
        }).join('')}
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

  /** Vue du mois : total, comparaison avec le mois d'avant, par lieu, par catégorie, semaine par semaine, 6 derniers mois. */
  vueMois(state) {
    const { esc, euro } = App.u;
    const v = App.views.budget;
    const m = v.moisAffiche || App.u.moisDeSemaine(state.semaineActive);
    const debutM = App.u.moisDeSemaine(App.store.debut());
    const B = App.budget.mois(state, m);
    const prec = App.u.addMois(m, -1);
    const P = prec >= debutM ? App.budget.mois(state, prec) : null;
    const nomMois = x => App.u.moisLabel(x);
    const ecart = P && P.actif && P.total ? (B.total - P.total) / P.total * 100 : null;
    const pct = B.plafond ? Math.min(100, B.total / B.plafond * 100) : 0;
    const depasse = B.plafond && B.total > B.plafond;
    const Pm = Math.max(B.plafond, B.total) || 1;
    const seg = (x, cls) => x > 0 ? `<span class="${cls}" style="width:${(x / Pm * 100).toFixed(1)}%"></span>` : '';
    const lieuNom = id => { const L = window.APP_DATA.lieux.find(y => y.id === id) || { emoji: '', nom: id }; return `${L.emoji} ${L.nom}`; };
    const ligne = (label, montant, extra = '') => `<li class="row-between ligne-mois"><span>${label}</span>${extra}<strong>${euro(montant)}</strong></li>`;
    const cats = [['🥕 Repas', B.cat.repas], ['🍎 Desserts & fruits', B.cat.desserts], ['🧻 Maison', B.cat.maison], ['👶 Bébé (Orchestra)', B.cat.bebe],
      ['🌾 La Fourche', B.fourche], ['🍽️ Repas dehors', B.ext]];
    const maxCat = Math.max(1, ...cats.map(c => c[1]));
    // 6 derniers mois (jamais avant le début du suivi)
    const six = [];
    for (let i = 5; i >= 0; i--) { const x = App.u.addMois(m, -i); if (x >= debutM) six.push(App.budget.mois(state, x)); }
    const maxSix = Math.max(1, ...six.map(x => Math.max(x.total, x.plafond)));
    return `
      <div class="weeknav">
        <button class="icon-btn" data-action="mois-prev" aria-label="Mois précédent" ${m <= debutM ? 'disabled style="opacity:.3"' : ''}>‹</button>
        <div class="weeknav-label"><strong style="text-transform:capitalize">${nomMois(m)}</strong><span>${B.nbSemaines} semaine${B.nbSemaines > 1 ? 's' : ''} · budget ${euro(B.plafond)}</span></div>
        <button class="icon-btn" data-action="mois-next" aria-label="Mois suivant">›</button>
      </div>
      <section class="card budget-main ${depasse ? 'attention' : ''}">
        <small class="muted">Total du mois${B.estime ? ' (contient des estimations)' : ''}</small>
        <div class="big">${B.estime ? '≈ ' : ''}${euro(B.total)} <small class="muted">/ ${euro(B.plafond)}</small></div>
        <div class="bar-empile">${seg(B.courses, 'c1')}${seg(B.fourche, 'c2')}${seg(B.ext, 'c3')}
          ${depasse ? `<i style="left:${(B.plafond / Pm * 100).toFixed(1)}%"></i>` : ''}</div>
        <div class="split ligne">
          <span><i class="dot c1"></i>Courses ${euro(B.courses)}</span>
          ${B.fourche ? `<span><i class="dot c2"></i>La Fourche ${euro(B.fourche)}</span>` : ''}
          ${B.ext ? `<span><i class="dot c3"></i>Dehors ${euro(B.ext)}</span>` : ''}
        </div>
        <p class="${depasse ? 'danger' : 'ok'}">${depasse ? `${euro(B.total - B.plafond)} au-dessus du budget du mois` : `Il reste ${euro(B.plafond - B.total)} sur le mois`}</p>
        ${ecart != null ? `<p class="comparaison ${ecart > 0 ? 'hausse' : 'baisse'}">${ecart > 0 ? '▲' : '▼'} ${Math.abs(ecart).toFixed(0)} % par rapport à ${nomMois(prec).split(' ')[0]} (${euro(P.total)})</p>`
          : `<p class="muted small">${P ? `Pas de dépenses en ${nomMois(prec).split(' ')[0]} pour comparer.` : 'Premier mois du suivi : la comparaison arrivera le mois prochain.'}</p>`}
      </section>

      <h3 class="section-title">Par lieu d’achat</h3>
      <section class="card"><ul class="plain">
        ${App.shopping.LIEUX.map(id => B.parLieu[id] || id !== 'orchestra' ? ligne(lieuNom(id), B.parLieu[id]) : '').join('')}
        ${ligne(`🌾 La Fourche <small class="muted">commande du mois${B.fourcheMois.montant != null ? '' : ', estimée'}</small>`, B.fourche)}
        ${ligne('🍽️ Repas dehors', B.ext)}
      </ul></section>

      <h3 class="section-title">Par catégorie</h3>
      <section class="card categories">
        ${cats.map(([nom, x]) => `
          <div class="cat-ligne"><span>${nom}</span><b>${euro(x)}</b>
            <i><em style="width:${(x / maxCat * 100).toFixed(0)}%"></em></i></div>`).join('')}
        <small class="muted">Répartition calculée sur les estimations de la liste de courses.</small>
      </section>

      <h3 class="section-title">Semaine par semaine</h3>
      <section class="card"><ul class="plain">
        ${B.semaines.map(s => `
          <li><button class="ligne-budget" data-action="voir-semaine" data-k="${s.k}">
            <span class="grow">${esc(App.u.weekLabel(s.k))}${s.vide ? ' <small class="muted">· rien de prévu</small>' : ''}</span>
            <strong>${euro(s.total)}</strong><span class="chev">›</span></button></li>`).join('') || '<li class="muted small">Aucune semaine suivie ce mois-ci.</li>'}
      </ul></section>

      ${six.length > 1 ? `
      <h3 class="section-title">Mois par mois</h3>
      <section class="card">
        <div class="histo">
          ${six.map(x => `
            <div class="histo-col ${x.m === m ? 'current' : ''}">
              <span class="histo-val">${x.total ? Math.round(x.total) : ''}</span>
              <span class="histo-track"><span class="histo-bar ${x.plafond && x.total > x.plafond ? 'over' : ''}" style="height:${(x.total / maxSix * 100).toFixed(0)}%"></span></span>
              <small>${new Date(+x.m.slice(0, 4), +x.m.slice(5) - 1, 1).toLocaleDateString('fr-FR', { month: 'short' })}</small>
            </div>`).join('')}
        </div>
      </section>` : ''}`;
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

  /** Saisir le montant réel d'un ticket (producteur, drive, Orchestra). */
  ticket(lieu, label) {
    const dep = App.store.semaine().depenses || {};
    App.ui.sheet(`
      <h2>${App.u.esc(label)}</h2>
      <p class="muted small">Montant réel payé cette semaine (ticket de caisse, récapitulatif du drive).</p>
      <form data-action="ok" class="stack">
        <input name="v" inputmode="decimal" placeholder="Montant (€)" value="${dep[lieu] != null ? dep[lieu] : ''}" autofocus/>
        <div class="sheet-actions">
          <button class="btn" type="button" data-action="effacer">Revenir à l’estimation</button>
          <button class="btn btn-primary" type="submit">Enregistrer</button>
        </div>
      </form>`, (action, target) => {
      if (action !== 'ok' && action !== 'effacer') return;
      const v = action === 'ok' ? App.u.num(target.v.value) : null;
      App.store.update(() => { App.store.semaine().depenses[lieu] = v; });
      App.ui.closeSheet();
    });
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
      else if (act === 'mois-prev' || act === 'mois-next') {
        const m = v.moisAffiche || App.u.moisDeSemaine(App.store.state.semaineActive);
        const n = App.u.addMois(m, act === 'mois-prev' ? -1 : 1);
        if (n < App.u.moisDeSemaine(App.store.debut())) return;
        v.moisAffiche = n; App.router.render(true);
      }
      else if (act === 'voir-semaine') { v.mode = 'semaine'; App.store.update(s => { s.semaineActive = a.dataset.k; }); }
      else if (act === 'annee-prev' || act === 'annee-next') {
        v.annee = (v.annee || +App.u.moisCourant().slice(0, 4)) + (act === 'annee-prev' ? -1 : 1);
        App.router.render(true);
      }
      else if (act === 'go-fourche') App.router.go('fourche');
      else if (act === 'alleger') App.views.menu.alleger(true);
      else if (act === 'ticket') v.ticket(a.dataset.lieu, a.dataset.label);
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
