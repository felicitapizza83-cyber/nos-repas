/* Liste de courses de la semaine, par lieu : producteur, drive, et rappel de la commande La Fourche. */
App.views.courses = {
  title: 'Liste de courses',
  RAPIDES: [
    { nom: 'Fruits de la semaine', prix: 10, lieu: 'producteur' },
    { nom: 'Pain', prix: 1.5, lieu: 'drive' },
    { nom: 'Lait infantile', prix: 15, lieu: 'drive' },
    { nom: 'Yaourts nature', prix: 2.5, lieu: 'drive' }
  ],

  render(state) {
    const { esc, euro, qte } = App.u;
    const sem = App.store.semaine();
    const l = App.shopping.liste(sem, state);
    const slots = Object.values(sem.slots);
    const nbMaison = slots.filter(App.shopping.compteDansCourses).length;
    const nbExt = slots.filter(s => s.type === 'ext').length;
    const m = App.u.moisDeSemaine(state.semaineActive);

    const ligne = i => `
      <li class="item ${i.coche ? 'done' : ''} ${i.enStock ? 'stock' : ''}">
        <label class="check">
          <input type="checkbox" data-kind="coche" data-id="${i.id}" ${i.coche ? 'checked' : ''} ${i.enStock ? 'disabled' : ''}/>
          <span class="grow">
            <strong>${esc(i.nom)}</strong> <span class="muted">${i.couvert ? '' : qte(i.qty, i.unite)}</span>
            ${i.reste > 0 ? `<small class="pill good">🥫 ${i.couvert ? 'déjà à la maison' : `${qte(i.reste, i.unite).replace('× ', '')} déjà à la maison`}</small>` : ''}
            <small class="muted for">${i.repas.map(esc).join(', ')}</small>
          </span>
        </label>
        <div class="item-side">
          <small>${i.enStock ? '' : euro(i.cout)}</small>
          ${i.couvert ? '' : `<button class="link-btn tiny" data-action="stock" data-id="${i.id}" data-val="${i.enStock ? 0 : 1}">
            ${i.enStock ? 'À acheter' : (i.placard ? 'J’en ai' : 'Déjà à la maison')}</button>`}
        </div>
      </li>`;

    const ligneAjout = a => `
      <li class="item ${a.coche ? 'done' : ''}">
        <label class="check">
          <input type="checkbox" data-kind="ajout" data-id="${a.id}" ${a.coche ? 'checked' : ''}/>
          <span class="grow"><strong>${esc(a.nom)}</strong></span>
        </label>
        <div class="item-side">
          <small>${a.prix ? euro(a.prix) : ''}</small>
          <button class="icon-btn small" data-action="ajout-del" data-id="${a.id}" aria-label="Retirer">✕</button>
        </div>
      </li>`;

    const blocLieu = (id, titre, sousTitre) => {
      const L = l.lieux[id];
      const placard = id === 'drive' ? l.placard : [];
      if (!L.rayons.length && !L.ajouts.length && !placard.length) return '';
      return `
        <div class="lieu-head"><h2>${titre}</h2><strong>${euro(L.total)}</strong></div>
        ${sousTitre ? `<small class="muted lieu-sub">${sousTitre}</small>` : ''}
        ${L.rayons.map(r => `
          <h3 class="section-title">${esc(r.rayon)}</h3>
          <ul class="card list">${r.items.map(ligne).join('')}</ul>`).join('')}
        ${placard.length ? `<h3 class="section-title">À vérifier dans les placards</h3>
          <ul class="card list">${placard.map(ligne).join('')}</ul>` : ''}
        ${L.ajouts.length ? `<h3 class="section-title">En plus</h3><ul class="card list">${L.ajouts.map(ligneAjout).join('')}</ul>` : ''}`;
    };

    const vide = !l.lieux.producteur.rayons.length && !l.lieux.drive.rayons.length && !l.lieux.orchestra.rayons.length && !l.fourche.length;

    return `
      ${App.commun.weekNav(state.semaineActive)}
      <section class="card summary">
        <div class="row-between">
          <div><strong>${euro(l.total)}</strong><small class="muted"> cette semaine</small></div>
          <div><strong>${l.nbCoches}/${l.nb}</strong><small class="muted"> dans le panier</small></div>
        </div>
        <small class="muted">${nbMaison} repas maison · ${nbExt} dehors${(sem.douceurs || []).length ? ` · ${sem.douceurs.length} gâteaux` : ''}</small>
        ${sem.coursesFaitesLe
          ? `<div class="done-banner">✓ Courses faites le ${new Date(sem.coursesFaitesLe).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
               <button class="link-btn tiny" data-action="annuler-faites">Annuler</button></div>
             <small class="muted">Les achats sont entrés dans le garde-manger. Si un repas change (repas dehors…), ses ingrédients y restent et seront déduits des prochaines courses.</small>`
          : ''}
      </section>

      <section class="card link-card" data-action="go-stock">
        <div class="grow">
          <strong>🥫 Garde-manger</strong>
          <small class="muted for">${l.nbDeduits ? `${l.nbDeduits} produit${l.nbDeduits > 1 ? 's' : ''} déjà à la maison, déduit${l.nbDeduits > 1 ? 's' : ''} de la liste` : 'Ce que vous avez à la maison est déduit automatiquement'}${App.stock.aUtiliserVite(App.store.state).length ? ' · ⏰ des produits à utiliser vite' : ''}</small>
        </div><span class="chev">›</span>
      </section>

      ${vide ? `<section class="card empty-state">
          <p>La liste se remplit toute seule à partir du menu.</p>
          <button class="btn btn-primary" data-action="go-menu">Préparer le menu</button>
        </section>` : ''}

      ${blocLieu('producteur', '🧺 Producteur', 'Fruits et légumes, chez le producteur à côté')}
      ${blocLieu('drive', '🚗 Drive', App.u.esc(state.settings.drive))}
      ${blocLieu('orchestra', '🍼 Orchestra', 'Purées et compotes de bébé achetées')}

      ${l.fourche.length ? `
        <div class="lieu-head"><h2>🌾 La Fourche</h2><button class="link-btn" data-action="go-fourche">Commande de ${App.u.moisLabel(m).split(' ')[0]} ›</button></div>
        <small class="muted lieu-sub">Déjà prévu dans la commande bio mensuelle. S’il en manque, basculez l’article sur le drive.</small>
        <ul class="card list">${l.fourche.map(i => `
          <li class="item">
            <div class="grow"><strong>${esc(i.nom)}</strong> <span class="muted">${qte(i.qty, i.unite)}</span>
              <small class="muted for">${i.repas.map(esc).join(', ')}</small></div>
            <button class="link-btn tiny" data-action="au-drive" data-id="${i.id}">Il en manque → drive</button>
          </li>`).join('')}</ul>` : ''}

      <h3 class="section-title">Ajouter un article</h3>
      <section class="card">
        <form class="add-form" data-action="ajout">
          <input name="nom" placeholder="Article…" autocomplete="off"/>
          <input name="prix" inputmode="decimal" placeholder="€" class="prix"/>
          <select name="lieu" class="lieu-select"><option value="drive">Drive</option><option value="producteur">Producteur</option><option value="orchestra">Orchestra</option></select>
          <button class="btn btn-primary" type="submit">+</button>
        </form>
        <div class="chips">
          ${App.views.courses.RAPIDES.map((r, i) =>
            `<button class="chip chip-btn" data-action="rapide" data-i="${i}">+ ${esc(r.nom)}</button>`).join('')}
        </div>
      </section>

      <div class="toolbar sticky-bottom">
        <button class="btn" data-action="partager">Partager / exporter</button>
        ${sem.coursesFaitesLe ? '' : '<button class="btn btn-primary" data-action="faites">Courses faites ✓</button>'}
      </div>`;
  },

  mount(el) {
    const sem = () => App.store.semaine();
    el.onchange = e => {
      const t = e.target;
      if (t.dataset.kind === 'coche') App.store.update(() => {
        const c = sem().courses.coches;
        if (t.checked) c[t.dataset.id] = true; else delete c[t.dataset.id];
      });
      if (t.dataset.kind === 'ajout') App.store.update(() => {
        const a = sem().courses.ajouts.find(x => x.id === t.dataset.id);
        if (a) a.coche = t.checked;
      });
    };
    el.onsubmit = e => {
      e.preventDefault();
      const f = e.target, nom = f.nom.value.trim();
      if (!nom) return;
      App.store.update(() => sem().courses.ajouts.push(
        { id: App.u.uid(), nom, prix: App.u.num(f.prix.value) || 0, lieu: f.lieu.value, coche: false }));
    };
    el.onclick = e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const act = a.dataset.action;
      if (App.commun.handle(act)) return;
      if (act === 'go-menu') App.router.go('menu');
      else if (act === 'go-fourche') App.router.go('fourche');
      else if (act === 'stock') App.store.update(() => { sem().courses.stock[a.dataset.id] = a.dataset.val === '1'; });
      else if (act === 'au-drive') App.store.update(() => { sem().courses.auDrive[a.dataset.id] = true; });
      else if (act === 'go-stock') App.router.go('stock');
      else if (act === 'ajout-del') App.store.update(() => {
        const c = sem().courses; c.ajouts = c.ajouts.filter(x => x.id !== a.dataset.id);
      });
      else if (act === 'rapide') {
        const r = App.views.courses.RAPIDES[+a.dataset.i];
        App.store.update(() => sem().courses.ajouts.push({ id: App.u.uid(), ...r, coche: false }));
      }
      else if (act === 'faites') {
        App.store.update(s => {
          const w = sem();
          w.dispoAuxCourses = App.shopping.disponible(w, s, s.semaineActive);
          w.achats = App.shopping.snapshotAchats(w, s);
          App.stock.ajouter(s, w.achats);
          w.coursesFaitesLe = Date.now();
        });
        App.ui.toast('Courses rangées dans le garde-manger 🥫');
      }
      else if (act === 'annuler-faites') App.store.update(s => {
        const w = sem();
        App.stock.retirer(s, w.achats || {});
        w.achats = null; w.coursesFaitesLe = null; w.dispoAuxCourses = null;
      });
      else if (act === 'partager') App.views.courses.partager();
    };
  },

  partager() {
    const st = App.store.state;
    App.ui.sheet(`
      <h2>Partager / exporter</h2>
      <p class="muted small">Le texte est prêt à coller dans Messages, Notes, ou à côté de la recherche du drive. Les quantités sont en paquets, comme sur le drive.</p>
      <div class="list-select">
        <button class="option" data-action="lieu" data-lieu="drive">🚗 <span class="grow">Liste drive (${App.u.esc(st.settings.drive)})</span></button>
        <button class="option" data-action="lieu" data-lieu="producteur">🧺 <span class="grow">Liste producteur</span></button>
        <button class="option" data-action="lieu" data-lieu="orchestra">🍼 <span class="grow">Liste Orchestra (bébé)</span></button>
      </div>
      <p class="muted small">Remplir automatiquement le panier drive viendra à l’étape suivante.</p>`, async (action, target) => {
      if (action !== 'lieu') return;
      const txt = App.shopping.texte(App.store.semaine(), st, target.dataset.lieu);
      try {
        if (navigator.share) await navigator.share({ title: 'Liste de courses', text: txt });
        else { await navigator.clipboard.writeText(txt); App.ui.toast('Liste copiée'); }
      } catch (err) { /* partage annulé */ }
    });
  }
};
