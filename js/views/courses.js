/* Liste de courses de la semaine, par lieu : producteur, drive, et rappel de la commande La Fourche. */
App.views.courses = {
  title: 'Liste de courses',
  RAPIDES: [
    { nom: 'Fruits de la semaine', prix: 10, lieu: 'producteur' },
    { nom: 'Pain', prix: 1.5, lieu: 'drive' },
    { nom: 'Lait infantile', prix: 15, lieu: 'drive' },
    { nom: 'Yaourts nature', prix: 2.5, lieu: 'drive' }
  ],

  magasin: false,
  verrou: null,
  onglet: 'repas',

  tete() {
    return `<button class="rond" data-action="partager" aria-label="Partager la liste">
      <svg viewBox="0 0 24 24"><path d="M12 15V3m0 0L8 7m4-4 4 4M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg></button>`;
  },
  teteClic(action) { if (action === 'partager') App.views.courses.partager(); },

  render(state) {
    const { esc, euro, qte } = App.u;
    const V = App.views.courses;
    const sem = App.store.semaine();
    const l = App.shopping.liste(sem, state);
    const b = App.budget.resume(sem, state);
    const m = App.u.moisDeSemaine(state.semaineActive);
    const pct = l.nb ? l.nbCoches / l.nb * 100 : 0;

    const ligne = i => `
      <li class="item ${i.coche ? 'done' : ''} ${i.enStock ? 'stock' : ''}" ${i.enStock ? '' : `data-swipe="coche" data-id="${i.id}"`}>
        <label class="check">
          <input type="checkbox" data-kind="coche" data-id="${i.id}" ${i.coche ? 'checked' : ''} ${i.enStock ? 'disabled' : ''}/>
          <span class="grow">
            <strong>${esc(i.nom)}</strong> <span class="muted">${i.couvert ? '' : qte(i.qty, i.unite)}</span>
            ${i.reste > 0 ? `<small class="pill good">🥫 ${i.couvert ? 'à la maison' : `${qte(i.reste, i.unite).replace('× ', '')} à la maison`}</small>` : ''}
            ${V.magasin ? '' : `<small class="muted for">${i.repas.map(esc).join(', ')}</small>`}
          </span>
        </label>
        <div class="item-side">
          <small>${i.enStock ? '' : euro(i.cout)}</small>
          ${i.couvert || V.magasin ? '' : `<button class="mini ${i.enStock ? 'on' : ''}" data-action="stock" data-id="${i.id}" data-val="${i.enStock ? 0 : 1}">
            ${i.enStock ? 'À acheter' : 'J’ai'}</button>`}
        </div>
      </li>`;

    const ligneAjout = a => `
      <li class="item ${a.coche ? 'done' : ''}" data-swipe="ajout" data-id="${a.id}">
        <label class="check">
          <input type="checkbox" data-kind="ajout" data-id="${a.id}" ${a.coche ? 'checked' : ''}/>
          <span class="grow"><strong>${esc(a.nom)}</strong></span>
        </label>
        <div class="item-side">
          <small>${a.prix ? euro(a.prix) : ''}</small>
          <button class="icon-btn small" data-action="ajout-del" data-id="${a.id}" aria-label="Retirer">✕</button>
        </div>
      </li>`;

    // Les articles pris descendent en bas de leur rayon
    const trier = items => items.slice().sort((x, y) => (x.coche || x.enStock ? 1 : 0) - (y.coche || y.enStock ? 1 : 0));

    const ligneEss = e => `
      <li class="item ${e.coche ? 'done' : ''}" data-swipe="ess" data-id="${e.ess}">
        <label class="check">
          <input type="checkbox" data-kind="ess" data-id="${e.ess}" ${e.coche ? 'checked' : ''}/>
          <span class="grow"><strong>${e.emoji} ${esc(e.nom)}</strong> ${e.packs > 1 ? `<span class="muted">× ${e.packs}</span>` : ''}</span>
        </label>
        <div class="item-side"><small>${euro(e.cout)}</small></div>
      </li>`;

    const blocLieu = (id, titre, sousTitre) => {
      const L = l.lieux[id];
      const placard = id === 'drive' ? l.placard : [];
      if (!L.rayons.length && !L.ajouts.length && !placard.length && !L.maison.length) return '';
      return `
        <div class="lieu-head"><h2>${titre}</h2><strong>${euro(L.total)}</strong></div>
        ${sousTitre && !V.magasin ? `<small class="muted lieu-sub">${sousTitre}</small>` : ''}
        ${L.rayons.map(r => `
          <h3 class="section-title">${esc(r.rayon)}</h3>
          <ul class="card list">${trier(r.items).map(ligne).join('')}</ul>`).join('')}
        ${placard.length && !V.magasin ? `<h3 class="section-title">À vérifier dans les placards</h3>
          <ul class="card list">${placard.map(ligne).join('')}</ul>` : ''}
        ${L.maison.length ? `<h3 class="section-title">🧻 Maison</h3><ul class="card list">${trier(L.maison).map(ligneEss).join('')}</ul>` : ''}
        ${L.ajouts.length ? `<h3 class="section-title">En plus</h3><ul class="card list">${trier(L.ajouts).map(ligneAjout).join('')}</ul>` : ''}`;
    };

    const vide = App.shopping.LIEUX.every(x => !l.lieux[x].rayons.length && !l.lieux[x].ajouts.length && !l.lieux[x].maison.length) && !l.fourche.length;
    const aVerifier = (state.essentiels || []).filter(e => !(sem.courses.maison || {})[e.id]).length;
    const onglets = `
      <div class="who segment courses-onglets">
        <button class="seg ${V.onglet === 'repas' ? 'on' : ''}" data-action="onglet" data-v="repas">🥕 Repas</button>
        <button class="seg ${V.onglet === 'maison' ? 'on' : ''}" data-action="onglet" data-v="maison">🧻 Maison${aVerifier ? ` <span class="d-badge">${aVerifier}</span>` : ''}</button>
      </div>`;
    if (V.onglet === 'maison') return `${App.commun.weekNav(state.semaineActive)}${onglets}${V.vueMaison(state, sem)}`;
    if (vide) return `
      ${App.commun.weekNav(state.semaineActive)}${onglets}
      ${App.ui.vide('🛒', 'La liste se fait toute seule', 'Préparez le menu de la semaine : les ingrédients arrivent ici, rangés par lieu et par rayon, sans ce que vous avez déjà.',
        '<button class="btn btn-primary" data-action="go-menu">Préparer le menu</button>')}
      ${V.blocAjout()}`;

    return `
      ${App.commun.weekNav(state.semaineActive)}${onglets}
      ${aVerifier ? `<button class="banner" data-action="onglet" data-v="maison">🧻 ${aVerifier} essentiel${aVerifier > 1 ? 's' : ''} de la maison à vérifier (eau, papier toilette…) ›</button>` : ''}
      <section class="card courses-resume">
        <div class="row-between">
          <div><span class="gros">${euro(l.total)}</span><small class="muted"> de courses</small></div>
          <div class="muted"><strong class="txt">${l.nbCoches}</strong>/${l.nb} pris</div>
        </div>
        <div class="bar"><span style="width:${pct.toFixed(1)}%"></span></div>
        <a class="ligne-lien" href="#/budget"><span class="grow small">Budget de la semaine : <strong>${euro(b.total)}</strong> / ${euro(b.plafond)}
          <small class="muted block">avec ${state.settings.fourcheDansBudget ? `La Fourche (${euro(b.fourche)})` : ''}${b.extTotal ? ` et les repas dehors (${euro(b.extTotal)})` : ''}${!state.settings.fourcheDansBudget && !b.extTotal ? 'les courses seulement' : ''}</small></span><span class="chev">›</span></a>
        ${sem.coursesFaitesLe
          ? `<div class="done-banner">✓ Courses faites le ${new Date(sem.coursesFaitesLe).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
               <button class="link-btn tiny" data-action="annuler-faites">Annuler</button></div>` : ''}
        <div class="grid2 courses-btns">
          <button class="btn ${V.magasin ? 'btn-primary' : ''}" data-action="magasin">${V.magasin ? '✓ Mode magasin' : '🏪 Mode magasin'}</button>
          <button class="btn" data-action="go-stock">🥫 Garde-manger${App.stock.aUtiliserVite(state).length ? ' ⏰' : ''}</button>
        </div>
        ${V.magasin ? '<small class="muted">Écran toujours allumé, liste épurée. Glissez une ligne vers la droite pour la cocher.</small>'
          : l.nbDeduits ? `<small class="muted">${l.nbDeduits} produit${l.nbDeduits > 1 ? 's' : ''} déjà à la maison, déduit${l.nbDeduits > 1 ? 's' : ''} de la liste.</small>` : ''}
      </section>

      ${blocLieu('producteur', '🧺 Producteur', 'Fruits et légumes, chez le producteur à côté')}
      ${blocLieu('boucherie', '🥩 Boucherie halal', 'Viande et volaille halal, chez le boucher')}
      ${blocLieu('drive', '🚗 Drive', App.u.esc(state.settings.drive))}
      ${blocLieu('orchestra', '🍼 Orchestra', 'Purées et compotes de bébé achetées')}

      ${l.fourche.length && !V.magasin ? `
        <div class="lieu-head"><h2>🌾 La Fourche</h2><button class="link-btn" data-action="go-fourche">Commande de ${App.u.moisLabel(m).split(' ')[0]} ›</button></div>
        <small class="muted lieu-sub">Déjà prévu dans la commande bio mensuelle. S’il en manque, basculez l’article sur le drive.</small>
        <ul class="card list">${l.fourche.map(i => `
          <li class="item">
            <div class="grow"><strong>${esc(i.nom)}</strong> <span class="muted">${qte(i.qty, i.unite)}</span>
              <small class="muted for">${i.repas.map(esc).join(', ')}</small></div>
            <button class="mini" data-action="au-drive" data-id="${i.id}">Manque → drive</button>
          </li>`).join('')}</ul>` : ''}

      ${V.magasin ? '' : V.blocAjout()}

      ${sem.coursesFaitesLe ? '' : `<div class="sticky-bottom"><button class="btn btn-primary block-btn" data-action="faites">Courses faites ✓ <small>ranger au garde-manger</small></button></div>`}`;
  },

  /** Onglet « Maison » : les essentiels à vérifier une fois par semaine. */
  vueMaison(state, sem) {
    const { esc, euro } = App.u;
    const m = sem.courses.maison || {};
    const liste = state.essentiels || [];
    const faits = liste.filter(e => m[e.id]).length;
    const ess = App.shopping.essentiels(sem, state);
    const litres = state.settings.eauLitresParJour || 0;
    return `
      <section class="card courses-resume">
        <div class="row-between">
          <div><span class="gros">${faits}/${liste.length}</span><small class="muted"> vérifiés</small></div>
          <div class="muted">${ess.length} à acheter · <strong class="txt">${euro(ess.reduce((s, e) => s + e.cout, 0))}</strong></div>
        </div>
        <div class="bar"><span style="width:${liste.length ? (faits / liste.length * 100).toFixed(1) : 0}%"></span></div>
        <small class="muted">Une fois par semaine : « On en a » ou « À acheter ». Ce qui est à acheter s’ajoute à la liste du drive et au budget.</small>
        ${faits < liste.length ? '<button class="btn block" data-action="maison-tout">✓ Tout le reste, on en a</button>' : ''}
      </section>
      <ul class="card list essentiels">${liste.map(e => {
        const v = m[e.id];
        const eau = e.auto === 'eau' ? Math.max(1, Math.ceil(litres * 7 / 9 - 1e-9)) : 0;
        return `
        <li class="item essentiel ${v ? 'fait' : ''}">
          <span class="ess-emoji">${e.emoji}</span>
          <span class="grow"><strong>${esc(e.nom)}</strong>
            ${eau ? `<small class="muted block">${litres} L par jour → ${litres * 7} L par semaine = ${eau} pack${eau > 1 ? 's' : ''}</small>` : ''}
            <small class="muted">${euro((eau || 1) * (e.prix || 0))}</small></span>
          <div class="ess-choix">
            <button class="mini ${v === 'ok' ? 'on' : ''}" data-action="maison" data-id="${e.id}" data-v="ok">On en a</button>
            <button class="mini ${v === 'acheter' ? 'on acheter' : ''}" data-action="maison" data-id="${e.id}" data-v="acheter">À acheter</button>
          </div>
          <button class="icon-btn small" data-action="ess-suppr" data-id="${e.id}" aria-label="Retirer de la liste">✕</button>
        </li>`;
      }).join('')}</ul>
      <h3 class="section-title">Ajouter un essentiel</h3>
      <section class="card">
        <form class="add-form" data-action="ess-ajout">
          <input name="nom" placeholder="Piles, ampoules, croquettes…" autocomplete="off"/>
          <input name="prix" inputmode="decimal" placeholder="€" class="prix"/>
          <select name="lieu" class="lieu-select"><option value="drive">Drive</option><option value="producteur">Producteur</option><option value="boucherie">Boucherie</option><option value="orchestra">Orchestra</option></select>
          <button class="btn btn-primary" type="submit" aria-label="Ajouter">＋</button>
        </form>
        <small class="muted">L’eau se règle dans Réglages (litres bus par jour).</small>
      </section>`;
  },

  blocAjout() {
    const { esc } = App.u;
    return `
      <h3 class="section-title">Ajouter un article</h3>
      <section class="card">
        <form class="add-form" data-action="ajout">
          <input name="nom" placeholder="Article…" autocomplete="off"/>
          <input name="prix" inputmode="decimal" placeholder="€" class="prix"/>
          <select name="lieu" class="lieu-select"><option value="drive">Drive</option><option value="producteur">Producteur</option><option value="boucherie">Boucherie</option><option value="orchestra">Orchestra</option></select>
          <button class="btn btn-primary" type="submit" aria-label="Ajouter">＋</button>
        </form>
        <div class="chips">
          ${App.views.courses.RAPIDES.map((r, i) =>
            `<button class="chip chip-btn" data-action="rapide" data-i="${i}">+ ${esc(r.nom)}</button>`).join('')}
        </div>
      </section>`;
  },

  /** Coche / décoche un article (case ou glissement). */
  basculer(kind, id) {
    App.ui.haptique();
    App.store.update(() => {
      const c = App.store.semaine().courses;
      if (kind === 'coche') { if (c.coches[id]) delete c.coches[id]; else c.coches[id] = true; }
      else if (kind === 'ess') { const k = 'ess-' + id; if (c.coches[k]) delete c.coches[k]; else c.coches[k] = true; }
      else { const a = c.ajouts.find(x => x.id === id); if (a) a.coche = !a.coche; }
    });
  },

  async verrouiller(on) {
    const V = App.views.courses;
    try {
      if (on && 'wakeLock' in navigator) V.verrou = await navigator.wakeLock.request('screen');
      else if (!on && V.verrou) { await V.verrou.release(); V.verrou = null; }
    } catch (e) { /* non disponible */ }
  },

  mount(el) {
    const sem = () => App.store.semaine();
    const V = App.views.courses;
    // Le mode magasin s'arrête quand on quitte l'écran Courses
    if (!V.ecoute) {
      V.ecoute = true;
      window.addEventListener('hashchange', () => {
        if (App.router.current() !== 'courses' && V.magasin) { V.magasin = false; V.verrouiller(false); }
      });
      document.addEventListener('visibilitychange', () => { if (!document.hidden && V.magasin) V.verrouiller(true); });
    }
    el.onchange = e => {
      const t = e.target;
      if (['coche', 'ajout', 'ess'].includes(t.dataset.kind)) V.basculer(t.dataset.kind, t.dataset.id);
    };
    // Glisser une ligne vers la droite pour la cocher (écouteurs posés une seule fois)
    if (!V.glisser) {
      V.glisser = true;
      let sw = null;
      el.addEventListener('touchstart', e => {
        const li = App.router.current() === 'courses' && e.target.closest('[data-swipe]');
        if (!li || e.target.closest('button')) return;
        sw = { li, x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, actif: false };
      }, { passive: true });
      el.addEventListener('touchmove', e => {
        if (!sw) return;
        const dx = e.touches[0].clientX - sw.x, dy = e.touches[0].clientY - sw.y;
        if (!sw.actif && Math.abs(dy) > Math.abs(dx)) { sw = null; return; }
        if (Math.abs(dx) > 8) sw.actif = true;
        if (!sw.actif) return;
        e.preventDefault();
        sw.dx = Math.max(0, Math.min(120, dx));
        sw.li.style.transform = `translateX(${sw.dx}px)`;
        sw.li.classList.toggle('swipe-ok', sw.dx > 70);
      }, { passive: false });
      el.addEventListener('touchend', e => {
        if (!sw) return;
        const { li, dx, actif } = sw; sw = null;
        li.style.transform = ''; li.classList.remove('swipe-ok');
        if (actif && dx > 70) { e.preventDefault(); V.basculer(li.dataset.swipe, li.dataset.id); }
      });
    }
    el.onsubmit = e => {
      e.preventDefault();
      const f = e.target, nom = f.nom.value.trim();
      if (f.dataset.action === 'ess-ajout') {
        if (!nom) return;
        return App.store.update(st => st.essentiels.push({ id: 'ess' + App.u.uid(), nom, emoji: '🛒', prix: App.u.num(f.prix.value) || 0, lieu: f.lieu.value }));
      }
      if (!nom) return;
      App.store.update(() => sem().courses.ajouts.push(
        { id: App.u.uid(), nom, prix: App.u.num(f.prix.value) || 0, lieu: f.lieu.value, coche: false }));
    };
    el.onclick = e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const act = a.dataset.action;
      if (App.commun.handle(act)) return;
      if (act === 'onglet') { V.onglet = a.dataset.v; App.router.render(false); }
      else if (act === 'maison') App.store.update(() => {
        const m = sem().courses.maison = sem().courses.maison || {};
        m[a.dataset.id] = m[a.dataset.id] === a.dataset.v ? undefined : a.dataset.v;
        if (!m[a.dataset.id]) delete m[a.dataset.id];
        App.ui.haptique();
      });
      else if (act === 'maison-tout') App.store.update(st => {
        const m = sem().courses.maison = sem().courses.maison || {};
        st.essentiels.forEach(e => { if (!m[e.id]) m[e.id] = 'ok'; });
      });
      else if (act === 'ess-suppr') {
        const e = App.store.state.essentiels.find(x => x.id === a.dataset.id);
        App.ui.confirmSheet(`Retirer « ${e.nom} » de la liste des essentiels ?`, 'Retirer', () =>
          App.store.update(st => { st.essentiels = st.essentiels.filter(x => x.id !== a.dataset.id); }));
      }
      else if (act === 'go-menu') App.router.go('menu');
      else if (act === 'go-fourche') App.router.go('fourche');
      else if (act === 'magasin') { V.magasin = !V.magasin; V.verrouiller(V.magasin); App.ui.haptique(); App.router.render(false); }
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
        if (V.magasin) { V.magasin = false; V.verrouiller(false); App.router.render(true); }
        App.ui.haptique();
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
        <button class="option" data-action="lieu" data-lieu="boucherie">🥩 <span class="grow">Liste boucherie halal</span></button>
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
