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
        <form class="ajout-stock" data-action="ajout" autocomplete="off">
          <div class="recherche-ing">
            <input name="cherche" placeholder="Tapez les premières lettres : pom, crè, riz…" autocomplete="off" autocapitalize="off" spellcheck="false"/>
            <input type="hidden" name="ing"/>
            <ul class="plain suggestions-ing" hidden></ul>
          </div>
          <div class="ajout-ligne">
            <input name="qte" inputmode="decimal" placeholder="Qté" class="prix"/>
            <select name="unite">${App.mesures.options(null, 'g')}</select>
            <button class="btn btn-primary" type="submit" aria-label="Ajouter">＋</button>
          </div>
        </form>
        <small class="muted">Choisissez l’unité qui vous arrange (kg, litre, pack, unité…) : l’app convertit. Vide = un paquet (ou « j’en ai » pour un pot d’épices).</small>
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
      const a = e.target.closest('[data-action]:not(form)');
      if (!a) return;
      if (a.dataset.action === 'edit') App.views.stock.editer(a.dataset.id);
      if (a.dataset.action === 'repas') App.views.repas.detail(a.dataset.id);
      if (a.dataset.action === 'ia-idees') App.ia.ouvrirIdees('stock');
    };
    const form = el.querySelector('.ajout-stock');
    if (form) {
      const sug = form.querySelector('.suggestions-ing');
      const choisir = ing => {
        form.ing.value = ing ? ing.id : '';
        if (ing) form.cherche.value = ing.nom;
        form.unite.innerHTML = App.mesures.options(ing, ing ? App.mesures.defaut(ing, ing.pack) : 'g');
        sug.hidden = true;
      };
      form.cherche.oninput = () => {
        form.ing.value = '';
        const t = form.cherche.value.trim();
        const res = App.mesures.chercher(App.store.state, t);
        const exact = res.some(i => App.u.norm(i.nom) === App.u.norm(t));
        sug.innerHTML = res.map(i => `<li><button type="button" class="option" data-ing="${i.id}">${App.u.esc(i.nom)} <small class="muted">${App.u.esc(i.rayon || '')}</small></button></li>`).join('')
          + (t.length >= 2 && !exact ? `<li><button type="button" class="option" data-nouveau="1">＋ Nouveau produit « ${App.u.esc(t)} »</button></li>` : '');
        sug.hidden = !sug.innerHTML;
        if (!res.length) form.unite.innerHTML = App.mesures.options(null, 'g');
      };
      sug.onclick = e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.ing) { choisir(App.store.ingredient(b.dataset.ing)); form.qte.focus(); }
        else { sug.hidden = true; form.unite.innerHTML = App.mesures.options(null, 'g'); form.qte.focus(); }
      };
    }
    el.onsubmit = e => {
      e.preventDefault();
      const f = e.target;
      const t = f.cherche.value.trim();
      let ing = f.ing.value ? App.store.ingredient(f.ing.value)
        : App.store.state.ingredients.find(i => App.u.norm(i.nom) === App.u.norm(t));
      const q = App.u.num(f.qte.value);
      if (!ing) {
        if (t.length < 2) return App.ui.toast('Tapez le nom du produit');
        // Nouveau produit : son unité de base suit l'unité choisie
        const u = f.unite.value, base = ['g', 'kg'].includes(u) ? 'g' : ['ml', 'cl', 'l'].includes(u) ? 'ml' : 'pc';
        ing = { id: 'perso-' + App.u.uid(), nom: t.charAt(0).toUpperCase() + t.slice(1), rayon: 'Divers', unite: base,
          pack: base === 'pc' ? 1 : 500, prix: 0, placard: false, lieu: 'drive', kcal: null, stockMin: 0, importe: true };
        const nouveau = ing;
        App.store.update(s => { s.ingredients.push(nouveau); });
      }
      const qBase = q == null ? (ing.unite === 'pot' ? 1 : ing.pack) : App.mesures.versBase(ing, q, f.unite.value);
      const id = ing.id;
      App.store.update(s => App.stock.ajouter(s, { [id]: qBase }));
      App.ui.toast(`${ing.nom} : ${ing.unite === 'pot' ? 'ajouté' : App.u.qte(qBase, ing.unite).replace('× ', '') + ' ajouté' + (ing.unite === 'pc' && qBase > 1 ? 's' : '')}`);
    };
  },

  editer(id) {
    const st = App.store.state;
    const ing = App.store.ingredient(id);
    const e = st.stock[id] || { qty: 0 };
    const pot = ing.unite === 'pot';
    const u0 = App.mesures.defaut(ing, e.qty);
    let uCour = u0;
    App.ui.sheet(`
      <h2>${App.u.esc(ing.nom)}</h2>
      <form data-action="save" class="stack">
        ${pot ? '' : `<label>Unité
          <select name="unite" data-live="unite">${App.mesures.options(ing, u0)}</select></label>
          <label>Quantité à la maison
          <input name="qte" inputmode="decimal" value="${App.mesures.depuisBase(ing, e.qty, u0)}"/></label>
          <label>Toujours en avoir au moins — 0 = pas de minimum
          <input name="min" inputmode="decimal" value="${App.mesures.depuisBase(ing, ing.stockMin || 0, u0)}"/></label>`}
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
      if (action === 'unite') {
        // Changement d'unité : on convertit les nombres déjà affichés
        const f = target.form, nv = target.value;
        [f.qte, f.min].forEach(x => {
          const n = App.u.num(x.value);
          if (n != null) x.value = App.mesures.depuisBase(ing, App.mesures.versBase(ing, n, uCour), nv);
        });
        uCour = nv;
        return;
      }
      if (action === 'save') {
        const u = target.unite.value;
        set(App.mesures.versBase(ing, App.u.num(target.qte.value) || 0, u));
        App.store.update(() => { App.store.ingredient(id).stockMin = App.mesures.versBase(ing, App.u.num(target.min.value) || 0, u); });
      }
      else if (action === 'jai') set(1);
      else if (action === 'fini') set(0);
      else if (action === 'oublier') set(null);
      else return;
      App.ui.closeSheet();
    });
  }
};
