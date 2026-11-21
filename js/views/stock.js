/* Écran « Garde-manger » : ce qu'on a à la maison, à utiliser vite, ajustements à la main. */
App.views.stock = {
  title: 'Garde-manger',

  render(state) {
    const { esc, qte } = App.u;
    const vite = App.stock.aUtiliserVite(state);
    const viteIds = new Set(vite.map(x => x.id));

    // Repas de la bibliothèque qui finissent les produits à utiliser vite
    const idees = vite.length ? state.repas.filter(r => r.categorie !== 'Douceurs')
      .map(r => ({ r, n: r.ingredients.filter(([id]) => viteIds.has(id)).length }))
      .filter(x => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 5).map(x => x.r) : [];

    const ligne = (id, e) => {
      const ing = App.store.ingredient(id);
      if (!ing) return '';
      const jours = Math.floor(App.stock.joursDepuisAchat(e));
      const pot = ing.unite === 'pot';
      return `
        <li class="item tap ${e.qty > 0 ? '' : 'stock'}" data-action="edit" data-id="${id}">
          <div class="grow">
            <strong>${esc(ing.nom)}</strong>
            <span class="muted">${e.qty > 0 ? (pot ? '✓' : qte(e.qty, ing.unite)) : 'fini'}</span>
            ${ing.stockMin ? `<small class="pill ${e.qty < ing.stockMin ? 'low' : ''}">min ${qte(ing.stockMin, ing.unite).replace('× ', '')}</small>` : ''}
            ${e.qty > 0 && e.achatLe && App.stock.zone(ing) === 'frais'
              ? `<small class="muted for">${viteIds.has(id) ? '⏰ ' : ''}acheté il y a ${jours} jour${jours > 1 ? 's' : ''}</small>` : ''}
          </div>
          <span class="chev">›</span>
        </li>`;
    };

    const zones = App.stock.ZONES.map(z => {
      const its = Object.entries(state.stock)
        .filter(([id, e]) => App.stock.zone(App.store.ingredient(id)) === z.id && (e.qty > 0 || z.id === 'placard'))
        .sort((a, b) => (App.store.ingredient(a[0]) || {}).nom?.localeCompare((App.store.ingredient(b[0]) || {}).nom || '', 'fr'));
      return `
        <h3 class="section-title">${z.emoji} ${z.nom}</h3>
        ${its.length ? `<ul class="card list">${its.map(([id, e]) => ligne(id, e)).join('')}</ul>`
          : '<p class="muted small empty-zone">Rien pour l’instant.</p>'}`;
    }).join('');

    const options = window.APP_DATA.rayons.map(ray => {
      const ings = state.ingredients.filter(i => i.rayon === ray);
      return ings.length ? `<optgroup label="${esc(ray)}">${ings.map(i => `<option value="${i.id}">${esc(i.nom)}</option>`).join('')}</optgroup>` : '';
    }).join('');

    const vide = !Object.values(state.stock).some(e => e.qty > 0);
    return `
      ${vide ? App.ui.vide('🥫', 'Le garde-manger est vide', 'Il se remplit tout seul avec « Courses faites ✓ » et la commande La Fourche, puis se vide à mesure que les repas passent. Vous pouvez aussi ajouter ce que vous avez déjà, en bas.',
        '<a class="btn btn-primary" href="#/courses">Voir la liste de courses</a>')
      : `${App.ia.dispo() ? '<button class="btn btn-primary block btn-ia" data-action="ia-idees">✨ Idées de recettes avec ce qu’il reste</button>' : ''}
      <section class="card">
        <p class="small">Il se remplit avec <strong>« Courses faites ✓ »</strong> et La Fourche, et se vide tout seul quand un repas est passé.</p>
        <p class="muted small">Corrigez-le de temps en temps (touchez un produit), surtout après un repas pas cuisiné ou un produit jeté.</p>
      </section>`}

      ${vite.length ? `
        <h3 class="section-title">⏰ À utiliser vite</h3>
        <section class="card">
          <ul class="plain">${vite.map(x => `<li class="row-between small"><span>${esc(x.ing.nom)}</span>
            <span class="${x.restants < 0 ? 'danger' : 'muted'}">${qte(x.qty, x.ing.unite)} · ${x.restants < 0 ? 'à vérifier' : x.restants < 0.5 ? 'aujourd’hui' : 'demain'}</span></li>`).join('')}</ul>
          ${idees.length ? `<small class="muted">Des repas pour les finir :</small>
            <div class="chips">${idees.map(r => `<button class="chip chip-btn" data-action="repas" data-id="${r.id}">${esc(r.nom)}</button>`).join('')}</div>` : ''}
        </section>` : ''}

      ${App.views.stock.blocCuisinable(state)}

      ${zones}

      <h3 class="section-title">Ajouter quelque chose qu’on a déjà</h3>
      <section class="card">
        <form class="add-form" data-action="ajout">
          <select name="ing" required><option value="">— produit —</option>${options}</select>
          <input name="qte" inputmode="decimal" placeholder="Qté" class="prix"/>
          <button class="btn btn-primary" type="submit">+</button>
        </form>
        <small class="muted">En grammes, millilitres ou pièces selon le produit. Laisser vide pour un pot d’épices.</small>
      </section>`;
  },

  blocCuisinable(state) {
    const { esc } = App.u;
    const liste = App.stock.avecCeQueJai(state, 75).filter(x => x.r.categorie !== 'Douceurs').slice(0, 6); // bébé déjà exclu
    if (!liste.length) return '';
    return `
      <h3 class="section-title">👩‍🍳 Cuisiner avec ce qu’on a</h3>
      <ul class="card list">${liste.map(x => `
        <li class="item tap" data-action="repas" data-id="${x.r.id}">
          <img class="thumb sm" src="${window.APP_DATA.imageRepas(x.r)}" alt="" loading="lazy"/>
          <div class="grow"><strong>${esc(x.r.nom)}</strong>
            <small class="${x.ok ? 'ok' : 'muted'} for">${x.ok ? 'Tout est à la maison' : `Manque : ${x.manque.map(esc).join(', ')}`}</small></div>
          <span class="chev">›</span>
        </li>`).join('')}</ul>`;
  },

  mount(el) {
    el.onclick = e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      if (a.dataset.action === 'edit') App.views.stock.editer(a.dataset.id);
      if (a.dataset.action === 'repas') App.views.repas.detail(a.dataset.id);
      if (a.dataset.action === 'ia-idees') App.ia.ouvrirIdees('stock');
    };
    el.onsubmit = e => {
      e.preventDefault();
      const f = e.target, id = f.ing.value;
      if (!id) return;
      const ing = App.store.ingredient(id);
      const q = App.u.num(f.qte.value) ?? (ing.unite === 'pot' ? 1 : ing.pack);
      App.store.update(s => App.stock.ajouter(s, { [id]: q }));
      App.ui.toast(`${ing.nom} ajouté au garde-manger`);
    };
  },

  editer(id) {
    const st = App.store.state;
    const ing = App.store.ingredient(id);
    const e = st.stock[id] || { qty: 0 };
    const pot = ing.unite === 'pot';
    App.ui.sheet(`
      <h2>${App.u.esc(ing.nom)}</h2>
      <form data-action="save" class="stack">
        ${pot ? '' : `<label>Quantité à la maison (${App.u.esc(ing.unite)})
          <input name="qte" inputmode="decimal" value="${+e.qty.toFixed(1)}"/></label>
          <label>Toujours en avoir au moins (${App.u.esc(ing.unite)}) — 0 = pas de minimum
          <input name="min" inputmode="decimal" value="${ing.stockMin || 0}"/></label>`}
        <div class="grid2">
          ${pot ? '<button type="button" class="btn btn-primary" data-action="jai">J’en ai</button>'
                : '<button class="btn btn-primary" type="submit">Enregistrer</button>'}
          <button type="button" class="btn" data-action="fini">${pot ? 'Fini' : 'Fini / jeté'}</button>
        </div>
        <button type="button" class="btn btn-ghost-danger" data-action="oublier">Retirer du garde-manger</button>
      </form>`, (action, target) => {
      const set = q => App.store.update(s => {
        if (q == null) { delete s.stock[id]; return; }
        if (!s.stock[id]) s.stock[id] = { qty: 0, achatLe: Date.now() };
        s.stock[id].qty = Math.max(0, q);
      });
      if (action === 'save') {
        set(App.u.num(target.qte.value) || 0);
        App.store.update(() => { App.store.ingredient(id).stockMin = App.u.num(target.min.value) || 0; });
      }
      else if (action === 'jai') set(1);
      else if (action === 'fini') set(0);
      else if (action === 'oublier') set(null);
      else return;
      App.ui.closeSheet();
    });
  }
};
