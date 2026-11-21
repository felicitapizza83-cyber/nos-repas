/* Ingrédients & prix : où on achète chaque produit, à quel prix, en quel conditionnement. */
App.views.ingredients = {
  title: 'Ingrédients & prix',
  q: '',

  render(state) {
    return `
      <p class="muted small">Touchez un produit pour corriger son prix, son conditionnement ou son lieu d’achat. Les prix de départ sont des estimations : remplacez-les par ceux de votre drive, du producteur et de La Fourche.</p>
      <div class="searchbar"><input type="search" name="q" placeholder="Rechercher…" value="${App.u.esc(App.views.ingredients.q)}" autocomplete="off"/></div>
      <div id="ing-list">${App.views.ingredients.liste(state)}</div>`;
  },

  liste(state) {
    const { esc, euro, norm, qte } = App.u;
    const q = norm(App.views.ingredients.q);
    return window.APP_DATA.lieux.map(L => {
      const its = state.ingredients.filter(i => i.lieu === L.id && (!q || norm(i.nom).includes(q)))
        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
      if (!its.length) return '';
      return `<h3 class="section-title">${L.emoji} ${L.nom} · ${L.rythme === 'mensuel' ? 'chaque mois' : 'chaque semaine'}</h3>
        <ul class="card list">${its.map(i => `
          <li class="item tap" data-action="edit" data-id="${i.id}">
            <div class="grow"><strong>${esc(i.nom)}</strong>
              <small class="muted for">${esc(i.rayon)} · ${i.unite === 'pot' ? 'pot' : qte(i.pack, i.unite)}${i.placard ? ' · placard' : ''}${i.stockMin ? ` · min ${qte(i.stockMin, i.unite).replace('× ', '')}` : ''}</small></div>
            <small>${euro(i.prix)}</small>
          </li>`).join('')}</ul>`;
    }).join('');
  },

  mount(el) {
    el.oninput = e => {
      if (e.target.name !== 'q') return;
      App.views.ingredients.q = e.target.value;
      el.querySelector('#ing-list').innerHTML = App.views.ingredients.liste(App.store.state);
    };
    el.onclick = e => {
      const a = e.target.closest('[data-action]');
      if (a && a.dataset.action === 'edit') App.views.ingredients.editer(a.dataset.id);
    };
  },

  editer(id) {
    const { esc } = App.u;
    const i = App.store.ingredient(id);
    App.ui.sheet(`
      <h2>${esc(i.nom)}</h2>
      <form data-action="save" class="stack">
        <label>Nom<input name="nom" value="${esc(i.nom)}"/></label>
        <label>Où l’acheter<select name="lieu">${window.APP_DATA.lieux.map(L =>
          `<option value="${L.id}" ${L.id === i.lieu ? 'selected' : ''}>${L.emoji} ${L.nom}</option>`).join('')}</select></label>
        <label>Rayon<select name="rayon">${window.APP_DATA.rayons.map(r =>
          `<option ${r === i.rayon ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></label>
        <div class="row">
          <label class="grow">Vendu par (${esc(i.unite)})<input name="pack" inputmode="decimal" value="${i.pack}"/></label>
          <label class="grow">Prix €<input name="prix" inputmode="decimal" value="${i.prix}"/></label>
        </div>
        <label>Stock minimum à garder (${esc(i.unite)}) — 0 = aucun
          <input name="stockMin" inputmode="decimal" value="${i.stockMin || 0}"/></label>
        <label class="toggle-line"><input type="checkbox" name="placard" ${i.placard ? 'checked' : ''}/> Produit de placard (on en a souvent : à vérifier)</label>
        <button class="btn btn-primary" type="submit">Enregistrer</button>
      </form>`, (action, f) => {
      if (action !== 'save') return;
      App.store.update(() => Object.assign(App.store.ingredient(id), {
        nom: f.nom.value.trim() || i.nom, lieu: f.lieu.value, rayon: f.rayon.value,
        pack: App.u.num(f.pack.value) || i.pack, prix: App.u.num(f.prix.value) ?? i.prix, placard: f.placard.checked,
        stockMin: App.u.num(f.stockMin.value) || 0
      }));
      App.ui.closeSheet();
    });
  }
};
