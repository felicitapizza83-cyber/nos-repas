/* Bibliothèque de repas : recherche, favoris, « avec ce que j'ai », collections, fiche, mode cuisine. */
App.views.repas = {
  title: 'Nos repas',
  filtre: { q: '', cat: 'Tous', conseilles: false, favoris: false, stock: false, collection: null },

  render(state) {
    const f = App.views.repas.filtre;
    const { esc } = App.u;
    const cats = ['Tous', ...window.APP_DATA.categories];
    const obj = App.suggest.objectif(App.store.semaine());
    const col = f.collection ? state.collections.find(c => c.id === f.collection) : null;
    return `
      <div class="searchbar row-search">
        <input type="search" name="q" placeholder="Rechercher un repas, un ingrédient…" value="${esc(f.q)}" autocomplete="off"/>
        <button class="btn btn-primary btn-import" data-action="importer">⤓ Importer</button>
      </div>
      <div class="collections scroll-x">
        ${state.collections.map(c => `
          <button class="collection ${f.collection === c.id ? 'on' : ''}" data-action="collection" data-id="${c.id}">
            <span class="col-emoji">${esc(c.emoji)}</span><strong>${esc(c.nom)}</strong><small>${c.repas.length} repas</small>
          </button>`).join('')}
        <button class="collection add" data-action="collection-new"><span class="col-emoji">＋</span><strong>Nouvelle collection</strong></button>
      </div>
      ${col ? `<div class="row-between col-head"><h3>${esc(col.emoji)} ${esc(col.nom)}</h3>
          <span><button class="link-btn" data-action="collection-edit">Modifier</button>
          <button class="link-btn" data-action="collection-off">Tout afficher</button></span></div>` : ''}
      <div class="chips scroll-x">
        <button class="chip chip-btn ${f.favoris ? 'on' : ''}" data-action="favoris">★ Favoris</button>
        <button class="chip chip-btn ${f.stock ? 'on' : ''}" data-action="stock">🥫 Avec ce que j’ai</button>
        ${obj ? `<button class="chip chip-btn chip-good ${f.conseilles ? 'on' : ''}" data-action="conseilles">${obj.emoji} Conseillés</button>` : ''}
        ${cats.map(c => `<button class="chip chip-btn ${f.cat === c ? 'on' : ''}" data-action="cat" data-cat="${c}">${c}</button>`).join('')}
      </div>
      <div id="repas-list">${App.views.repas.liste(state)}</div>
      <button class="fab" data-action="nouveau" aria-label="Nouveau repas">＋</button>`;
  },

  liste(state) {
    const { esc, euro, norm } = App.u;
    const f = App.views.repas.filtre;
    const obj = App.suggest.objectif(App.store.semaine());
    const q = norm(f.q);
    const col = f.collection ? state.collections.find(c => c.id === f.collection) : null;
    const cuisinable = new Map(f.stock ? App.stock.avecCeQueJai(state, 50).map(x => [x.r.id, x]) : []);
    let items = state.repas.filter(r => {
      if (f.cat !== 'Tous' && r.categorie !== f.cat) return false;
      if (f.cat === 'Tous' && r.categorie === 'Bébé' && !f.q) return false;
      if (f.conseilles && !App.suggest.conseille(r, obj)) return false;
      if (f.favoris && !r.favori) return false;
      if (col && !col.repas.includes(r.id)) return false;
      if (f.stock && !cuisinable.has(r.id)) return false;
      if (!q) return true;
      const hay = norm(r.nom + ' ' + r.ingredients.map(([id]) => (App.store.ingredient(id) || {}).nom).join(' '));
      return hay.includes(q);
    });
    if (f.stock) items.sort((a, b) => cuisinable.get(b.id).pct - cuisinable.get(a.id).pct);
    if (!items.length) return f.stock
      ? '<p class="empty">Pas assez d’ingrédients au garde-manger pour l’instant.<br>Il se remplit avec « Courses faites ✓ ».</p>'
      : '<p class="empty">Aucun repas trouvé.</p>';
    const kcal = state.settings.calories;
    return `<ul class="cards">${items.map(r => {
      const c = cuisinable.get(r.id);
      return `
      <li class="card meal" data-action="detail" data-id="${r.id}">
        <img class="thumb" src="${window.APP_DATA.imageRepas(r)}" alt="" loading="lazy"/>
        <div class="grow">
          <strong>${r.favori ? '<span class="star">★</span> ' : ''}${esc(r.nom)}</strong>
          ${c ? `<small class="${c.ok ? 'ok' : 'muted'} for">${c.ok ? '🥫 Tout est à la maison' : `🥫 ${c.pct} % · manque : ${c.manque.slice(0, 3).map(esc).join(', ')}${c.manque.length > 3 ? '…' : ''}`}</small>`
              : `<div class="chips small">${r.tags.slice(0, 3).map(t => App.commun.tag(t)).join('')}</div>`}
        </div>
        <div class="meal-side">
          ${App.suggest.conseille(r, obj) ? `<span class="badge-good" title="Conseillé pour l’objectif">${obj.emoji}</span>` : ''}
          ${r.avis === 'adore' ? '<span title="On adore">😍</span>' : ''}
          <small class="muted">≈ ${euro(App.shopping.coutRepas(r, state))}</small>
          ${kcal ? `<small class="muted">${App.nutrition.label(r)}</small>` : ''}
        </div>
      </li>`;
    }).join('')}</ul>
      <p class="muted small center">${items.length} repas</p>`;
  },

  mount(el, state) {
    el.oninput = e => {
      if (e.target.name === 'q') {
        App.views.repas.filtre.q = e.target.value;
        el.querySelector('#repas-list').innerHTML = App.views.repas.liste(App.store.state);
      }
    };
    el.onclick = e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const act = a.dataset.action, f = App.views.repas.filtre;
      const toggle = k => { f[k] = !f[k]; App.router.render(true); };
      if (act === 'cat') { f.cat = a.dataset.cat; App.router.render(true); }
      else if (act === 'conseilles' || act === 'favoris' || act === 'stock') toggle(act);
      else if (act === 'collection') { f.collection = f.collection === a.dataset.id ? null : a.dataset.id; App.router.render(true); }
      else if (act === 'collection-off') { f.collection = null; App.router.render(true); }
      else if (act === 'collection-new') App.views.repas.editerCollection(null);
      else if (act === 'collection-edit') App.views.repas.editerCollection(f.collection);
      else if (act === 'detail') App.views.repas.detail(a.dataset.id);
      else if (act === 'nouveau') App.views.repas.editer(null);
      else if (act === 'importer') App.importUI.ouvrir('coller');
    };
  },

  urlCookidoo(q) { return `https://cookidoo.fr/search/fr-FR?query=${encodeURIComponent(q)}`; },

  detail(id) {
    const st = App.store.state;
    const r = App.store.repas(id);
    if (!r) return;
    const { esc, euro, qte } = App.u;
    const f = App.shopping.facteur(r, st);
    const douceur = r.categorie === 'Douceurs';
    const prevu = (App.store.semaine().douceurs || []).includes(id);
    const obj = App.suggest.objectif(App.store.semaine());
    const c = App.stock.cuisinable(st, r);
    const cols = st.collections.filter(x => x.repas.includes(id));
    App.ui.sheet(`
      <img class="sheet-hero" src="${window.APP_DATA.imageRepas(r)}" alt=""/>
      <div class="row-between">
        <h2>${esc(r.nom)}</h2>
        <button class="icon-btn fav ${r.favori ? 'on' : ''}" data-action="favori" aria-label="Favori">${r.favori ? '★' : '☆'}</button>
      </div>
      <div class="chips">${r.tags.map(t => App.commun.tag(t,
        obj && obj.favoriser.includes(t) ? 'chip-good' : obj && obj.limiter.includes(t) ? 'chip-bad' : '')).join('')}</div>
      ${r.classique ? `<p class="muted small">✨ Revisite healthy · ${esc(r.classique)} — sans farine blanche ni sucre raffiné</p>` : ''}

      <div class="infos">
        <span>💶 ≈ ${euro(App.shopping.coutRepas(r, st))}</span>
        ${st.settings.calories && App.nutrition.parPortion(r) ? `<span>🔥 ${App.nutrition.label(r)} / ${douceur ? 'part' : 'portion'}</span>` : ''}
        <span class="${c.ok ? 'ok' : ''}">🥫 ${c.ok ? 'tout est à la maison' : `${c.pct} % à la maison`}</span>
      </div>

      <button class="btn btn-primary block" data-action="cuisiner">👩‍🍳 Cuisiner (mode pas à pas)</button>
      ${r.cookidoo
        ? `<a class="btn ${/cookidoo/.test(r.cookidoo) ? 'btn-cookidoo' : ''} block" href="${esc(r.cookidoo)}" target="_blank" rel="noopener">${/cookidoo/.test(r.cookidoo) ? 'Ouvrir la recette dans Cookidoo' : 'Ouvrir la recette d’origine'} ↗</a>`
        : `<a class="link-btn" href="${App.views.repas.urlCookidoo(r.classique ? r.classique + ' healthy' : r.nom)}" target="_blank" rel="noopener">Chercher sur Cookidoo ↗</a>`}

      <div class="avis">
        ${[['adore', '😍 On adore'], ['refaire', '👍 À refaire'], ['bof', '😐 Bof']].map(([v, l]) =>
          `<button class="chip chip-btn ${r.avis === v ? 'on' : ''}" data-action="avis" data-v="${v}">${l}</button>`).join('')}
      </div>
      <textarea class="commentaire" data-live="commentaire" rows="2" placeholder="Nos notes : moins salé, doubler la sauce, le bébé a aimé…">${esc(r.commentaire || '')}</textarea>

      ${r.notes ? `<p class="note">${esc(r.notes)}</p>` : ''}
      <h3>Ingrédients <small class="muted">· ${douceur ? `${r.portions} parts` : `${st.settings.portions} portions`}</small></h3>
      <ul class="ing-list">${r.ingredients.map(([iid, q]) => {
        const ing = App.store.ingredient(iid) || { nom: iid, unite: '' };
        return `<li><span>${esc(ing.nom)}</span><span class="muted">${q == null ? 'un peu' : qte(q * f, ing.unite)}</span></li>`;
      }).join('')}</ul>
      ${c.manque.length && !c.ok ? `<small class="muted">Manque au garde-manger : ${c.manque.map(esc).join(', ')}</small>` : ''}

      <div class="row-between col-line">
        <small class="muted">${cols.length ? `Collections : ${cols.map(x => esc(x.emoji + ' ' + x.nom)).join(', ')}` : 'Dans aucune collection'}</small>
        <button class="link-btn" data-action="collections">Collections…</button>
      </div>
      <div class="sheet-actions">
        <button class="btn" data-action="edit">Modifier</button>
        ${douceur
          ? `<button class="btn btn-primary" data-action="douceur">${prevu ? 'Retirer de la semaine' : 'Prévoir cette semaine'}</button>`
          : '<button class="btn btn-primary" data-action="menu">Ajouter au menu</button>'}
      </div>`, (action, target) => {
      const maj = fn => App.store.update(() => fn(App.store.repas(id)));
      if (action === 'commentaire') { clearTimeout(App.views.repas._t); App.views.repas._t = setTimeout(() => maj(x => { x.commentaire = target.value; }), 600); return; }
      if (action === 'favori') { maj(x => { x.favori = !x.favori; }); return App.views.repas.detail(id); }
      if (action === 'avis') { maj(x => { x.avis = x.avis === target.dataset.v ? null : target.dataset.v; }); return App.views.repas.detail(id); }
      if (action === 'cuisiner') return App.cuisine.ouvrir(id);
      if (action === 'collections') return App.views.repas.choisirCollections(id);
      if (action === 'douceur') {
        App.store.update(() => {
          const w = App.store.semaine(); w.douceurs = w.douceurs || [];
          w.douceurs = prevu ? w.douceurs.filter(x => x !== id) : [...w.douceurs, id];
        });
        App.ui.closeSheet();
        App.ui.toast(prevu ? 'Retiré des courses' : 'Ingrédients ajoutés aux courses de la semaine');
      }
      if (action === 'edit') App.views.repas.editer(id);
      if (action === 'menu') App.views.menu.choisirCase(id);
    });
  },

  choisirCollections(id) {
    const st = App.store.state;
    const { esc } = App.u;
    App.ui.sheet(`
      <h2>Ranger dans…</h2>
      <div class="list-select">
        ${st.collections.map(c => `
          <label class="option"><input type="checkbox" data-col="${c.id}" ${c.repas.includes(id) ? 'checked' : ''}/>
            <span class="grow">${esc(c.emoji)} ${esc(c.nom)}</span></label>`).join('')}
      </div>
      <button class="btn btn-primary block" data-action="ok">Terminé</button>`, (action, target, ov) => {
      if (action !== 'ok') return;
      App.store.update(s => {
        ov.querySelectorAll('[data-col]').forEach(cb => {
          const c = s.collections.find(x => x.id === cb.dataset.col);
          c.repas = c.repas.filter(x => x !== id);
          if (cb.checked) c.repas.push(id);
        });
      });
      App.views.repas.detail(id);
    });
  },

  editerCollection(colId) {
    const st = App.store.state;
    const { esc } = App.u;
    const c = colId ? st.collections.find(x => x.id === colId) : null;
    App.ui.sheet(`
      <h2>${c ? 'Modifier la collection' : 'Nouvelle collection'}</h2>
      <form data-action="save" class="stack">
        <div class="row">
          <label style="width:5rem">Emoji<input name="emoji" maxlength="4" value="${esc(c ? c.emoji : '📁')}"/></label>
          <label class="grow">Nom<input name="nom" required value="${esc(c ? c.nom : '')}" placeholder="Ex. Plats du dimanche"/></label>
        </div>
        <button class="btn btn-primary" type="submit">Enregistrer</button>
        ${c ? '<button type="button" class="btn btn-ghost-danger" data-action="delete">Supprimer la collection (les repas restent)</button>' : ''}
      </form>`, (action, f) => {
      if (action === 'delete') {
        App.store.update(s => { s.collections = s.collections.filter(x => x.id !== colId); });
        App.views.repas.filtre.collection = null;
        return App.ui.closeSheet();
      }
      if (action !== 'save') return;
      App.store.update(s => {
        if (c) Object.assign(s.collections.find(x => x.id === colId), { emoji: f.emoji.value.trim() || '📁', nom: f.nom.value.trim() });
        else {
          const n = { id: App.u.uid(), emoji: f.emoji.value.trim() || '📁', nom: f.nom.value.trim(), repas: [] };
          s.collections.push(n);
          App.views.repas.filtre.collection = n.id;
        }
      });
      App.ui.closeSheet();
      if (!c) App.ui.toast('Collection créée : ajoutez-y des repas depuis leur fiche');
    });
  },

  /** Édition d'un repas. « brouillon » : fiche pré-remplie (import d'une recette), pas encore enregistrée. */
  editer(id, nomPrefill = '', brouillon = null) {
    const st = App.store.state;
    const { esc } = App.u;
    const r = id ? App.store.repas(id) : brouillon;
    const existant = !!(r && r.id);
    const rayons = window.APP_DATA.rayons;

    const options = sel => rayons.map(ray => {
      const ings = st.ingredients.filter(i => i.rayon === ray);
      if (!ings.length) return '';
      return `<optgroup label="${esc(ray)}">${ings.map(i =>
        `<option value="${i.id}" ${i.id === sel ? 'selected' : ''}>${esc(i.nom)}</option>`).join('')}</optgroup>`;
    }).join('');
    const unite = iid => { const i = App.store.ingredient(iid); return i ? i.unite : ''; };
    const ligne = (iid = '', q = '') => `
      <div class="ing-row">
        <select name="ing"><option value="">— choisir —</option>${options(iid)}</select>
        <input name="qte" inputmode="decimal" placeholder="qté" value="${q ?? ''}"/>
        <span class="unit">${esc(unite(iid))}</span>
        <button type="button" class="icon-btn small" data-action="row-del" aria-label="Retirer">✕</button>
      </div>`;

    const tags = Object.keys(window.APP_DATA.tags);
    const ov = App.ui.sheet(`
      <h2>${existant ? 'Modifier le repas' : brouillon ? 'Vérifier la recette importée' : 'Nouveau repas'}</h2>
      ${brouillon ? '<p class="note">Vérifiez les ingrédients reconnus (ils servent à la liste de courses) puis enregistrez.</p>' : ''}
      <form data-action="save" class="stack">
        <label>Nom<input name="nom" required value="${esc(r ? r.nom : nomPrefill)}"/></label>
        <label>Catégorie<select name="categorie">${window.APP_DATA.categories.map(c =>
          `<option ${r && r.categorie === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <fieldset><legend>Caractéristiques</legend><div class="chips">${tags.map(t =>
          `<label class="chip chip-check"><input type="checkbox" name="tag" value="${t}" ${r && r.tags.includes(t) ? 'checked' : ''}/>${esc(window.APP_DATA.tags[t])}</label>`).join('')}</div></fieldset>
        <label>Nombre de portions de la recette<input name="portions" inputmode="numeric" value="${r && r.portions ? r.portions : 2}"/></label>
        <fieldset><legend>Ingrédients</legend>
          <div class="ing-rows">${(r ? r.ingredients : [['', '']]).map(([iid, q]) => ligne(iid, q)).join('')}</div>
          <div class="row">
            <button type="button" class="link-btn" data-action="row-add">+ Ajouter un ingrédient</button>
            <button type="button" class="link-btn" data-action="ing-new-toggle">+ Ingrédient absent de la liste</button>
          </div>
          <div class="ing-new hidden">
            <input name="n_nom" placeholder="Nom (ex. patate douce)"/>
            <div class="row">
              <select name="n_rayon">${rayons.map(x => `<option>${esc(x)}</option>`).join('')}</select>
              <select name="n_unite"><option value="g">g</option><option value="ml">ml</option><option value="pc">pièce</option><option value="boîte">boîte</option><option value="pot">pot</option></select>
            </div>
            <div class="row">
              <label class="grow">Vendu par<input name="n_pack" inputmode="decimal" placeholder="ex. 500"/></label>
              <label class="grow">Prix €<input name="n_prix" inputmode="decimal" placeholder="ex. 2,50"/></label>
            </div>
            <button type="button" class="btn" data-action="ing-new-save">Créer l’ingrédient</button>
          </div>
        </fieldset>
        <label>Lien de la recette (Cookidoo, site, Instagram…)<input name="cookidoo" type="url" inputmode="url" placeholder="https://cookidoo.fr/recipes/recipe/fr-FR/…" value="${esc(r ? r.cookidoo || '' : '')}"/></label>
        <label>Notes / recette<textarea name="notes" rows="3">${esc(r ? r.notes : '')}</textarea></label>
        <button class="btn btn-primary" type="submit">Enregistrer</button>
        ${existant ? '<button type="button" class="btn btn-ghost-danger" data-action="delete">Supprimer ce repas</button>' : ''}
      </form>`, (action, target, ov) => {
      const rows = ov.querySelector('.ing-rows');
      if (action === 'row-add') { rows.insertAdjacentHTML('beforeend', ligne()); return; }
      if (action === 'row-del') { target.closest('.ing-row').remove(); return; }
      if (action === 'ing-new-toggle') { ov.querySelector('.ing-new').classList.toggle('hidden'); return; }
      if (action === 'ing-new-save') {
        const g = n => ov.querySelector(`[name=${n}]`).value.trim();
        if (!g('n_nom')) return App.ui.toast('Donnez un nom à l’ingrédient');
        const ing = {
          id: App.u.uid(), nom: g('n_nom'), rayon: g('n_rayon'), unite: g('n_unite'),
          pack: App.u.num(g('n_pack')) || 1, prix: App.u.num(g('n_prix')) || 0,
          placard: g('n_rayon') === 'Placard'
        };
        App.store.update(s => s.ingredients.push(ing));
        // Rafraîchir les listes déroulantes en gardant les choix
        rows.querySelectorAll('select[name=ing]').forEach(sel => {
          const v = sel.value; sel.innerHTML = `<option value="">— choisir —</option>${options(v)}`;
        });
        rows.insertAdjacentHTML('beforeend', ligne(ing.id));
        ov.querySelector('.ing-new').classList.add('hidden');
        ['n_nom', 'n_pack', 'n_prix'].forEach(n => { ov.querySelector(`[name=${n}]`).value = ''; });
        return;
      }
      if (action === 'delete') {
        App.ui.confirmSheet(`Supprimer « ${r.nom} » de la bibliothèque ?`, 'Supprimer', () =>
          App.store.update(s => { s.repas = s.repas.filter(x => x.id !== r.id); }));
        return;
      }
      if (action !== 'save') return;
      const f = target;
      const ingredients = [...f.querySelectorAll('.ing-row')].map(row => {
        const iid = row.querySelector('[name=ing]').value;
        return iid ? [iid, App.u.num(row.querySelector('[name=qte]').value)] : null;
      }).filter(Boolean);
      const data = {
        nom: f.nom.value.trim(),
        categorie: f.categorie.value,
        tags: [...f.querySelectorAll('[name=tag]:checked')].map(x => x.value),
        ingredients,
        notes: f.notes.value.trim(),
        cookidoo: f.cookidoo.value.trim(),
        portions: Math.max(1, Math.round(App.u.num(f.portions.value) || 2))
      };
      App.store.update(s => {
        if (existant) Object.assign(s.repas.find(x => x.id === r.id), data);
        else s.repas.push({ id: App.u.uid(), favori: false, avis: null, commentaire: '', ...data });
      });
      App.ui.closeSheet();
      App.ui.toast(existant ? 'Repas modifié' : 'Recette ajoutée à la bibliothèque');
    });

    // Afficher l'unité quand on change d'ingrédient
    ov.addEventListener('change', e => {
      if (e.target.name === 'ing') e.target.closest('.ing-row').querySelector('.unit').textContent = unite(e.target.value);
    });
  }
};
