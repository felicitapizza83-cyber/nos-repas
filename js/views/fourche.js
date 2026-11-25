/* Commande bio mensuelle La Fourche (épicerie sèche, conserves, placard). */
App.views.fourche = {
  title: 'La Fourche',
  mois: null,

  render(state) {
    const { esc, euro, qte } = App.u;
    const m = App.views.fourche.mois || App.u.moisDeSemaine(state.semaineActive);
    const F = App.shopping.fourcheMois(m, state);
    const frais = F.items.filter(i => !i.placard);
    const placard = F.items.filter(i => i.placard);

    const ligne = i => `
      <li class="item ${i.coche ? 'done' : ''} ${i.enStock ? 'stock' : ''}">
        <label class="check">
          <input type="checkbox" data-kind="coche" data-id="${i.id}" ${i.coche ? 'checked' : ''} ${i.enStock ? 'disabled' : ''}/>
          <span class="grow">
            <strong>${esc(i.nom)}</strong>
            <span class="muted">${i.placard ? '' : App.shopping.ligneDrive(i).replace(i.nom, '').replace(/^ — /, '')}</span>
            <small class="muted for">${i.seulementMin ? `🥫 Réserve minimum (${qte(i.min, i.unite).replace('× ', '')})` : i.placard ? `Utilisé dans ${i.nbRepas} repas` : `${qte(i.prevue, i.unite)} prévus au menu${F.coef > 1.01 ? ', étendu au mois' : ''}${i.enReserve > 0 ? ` · 🥫 ${qte(i.enReserve, i.unite).replace('× ', '')} déjà en réserve` : ''}`}</small>
          </span>
        </label>
        <div class="item-side">
          <small>${i.enStock ? '' : euro(i.cout)}</small>
          <button class="link-btn tiny" data-action="stock" data-id="${i.id}" data-val="${i.enStock ? 0 : 1}">${i.enStock ? 'À commander' : 'J’en ai encore'}</button>
        </div>
      </li>`;

    return `
      <div class="weeknav">
        <button class="icon-btn" data-action="mois-prev" aria-label="Mois précédent">‹</button>
        <div class="weeknav-label"><strong>Commande de</strong><span>${App.u.moisLabel(m)}</span></div>
        <button class="icon-btn" data-action="mois-next" aria-label="Mois suivant">›</button>
      </div>

      <section class="card budget-main">
        <small class="muted">${F.montant != null ? 'Montant de la commande' : 'Estimation de la commande'}</small>
        <div class="big">${euro(F.cout)}</div>
        <small class="muted">${F.prevues.length
          ? `Calculée sur ${F.prevues.length} semaine${F.prevues.length > 1 ? 's' : ''} de menus sur ${F.semaines.length}${F.coef > 1.01 ? ', puis étendue au mois complet' : ''}.`
          : 'Aucun menu prévu ce mois-ci pour l’instant : préparez un menu pour estimer la commande.'}
          ${state.settings.fourcheDansBudget ? ` Répartie dans le budget : ≈ ${euro(F.cout / (F.semaines.length || 4))} par semaine.` : ''}</small>
        <form class="add-form" data-action="montant">
          <input name="montant" inputmode="decimal" placeholder="Montant réel de la commande (€)" value="${F.montant ?? ''}"/>
          <button class="btn" type="submit">OK</button>
        </form>
        <label class="toggle-line"><input type="checkbox" name="passee" ${F.passee ? 'checked' : ''}/> Commande passée</label>
      </section>

      ${frais.length ? `<h3 class="section-title">À commander</h3><ul class="card list">${frais.map(ligne).join('')}</ul>` : ''}
      ${placard.length ? `<h3 class="section-title">Placard — à vérifier avant de commander</h3><ul class="card list">${placard.map(ligne).join('')}</ul>` : ''}

      <h3 class="section-title">En plus (bio, ménage, bébé…)</h3>
      <ul class="card list">
        ${F.ajouts.map(a => `
          <li class="item"><div class="grow"><strong>${esc(a.nom)}</strong></div>
            <div class="item-side"><small>${a.prix ? euro(a.prix) : ''}</small>
              <button class="icon-btn small" data-action="ajout-del" data-id="${a.id}" aria-label="Retirer">✕</button></div></li>`).join('')}
        <li><form class="add-form" data-action="ajout">
          <input name="nom" placeholder="Ajouter un produit…" autocomplete="off"/>
          <input name="prix" inputmode="decimal" placeholder="€" class="prix"/>
          <button class="btn btn-primary" type="submit">+</button>
        </form></li>
      </ul>

      <div class="toolbar sticky-bottom">
        <button class="btn btn-primary" data-action="partager">Partager la liste</button>
        <button class="btn" data-action="ingredients">Choisir ce qui va chez La Fourche</button>
      </div>`;
  },

  mount(el) {
    const m = () => App.views.fourche.mois || App.u.moisDeSemaine(App.store.state.semaineActive);
    const f = () => App.store.fourche(m());
    el.onclick = async e => {
      const a = e.target.closest('[data-action]:not(form)');
      if (!a) return;
      const act = a.dataset.action;
      if (act === 'mois-prev' || act === 'mois-next') {
        App.views.fourche.mois = App.u.addMois(m(), act === 'mois-prev' ? -1 : 1);
        App.router.render(false);
      }
      else if (act === 'stock') App.store.update(() => { f().stock[a.dataset.id] = a.dataset.val === '1'; });
      else if (act === 'ajout-del') App.store.update(() => { const x = f(); x.ajouts = x.ajouts.filter(y => y.id !== a.dataset.id); });
      else if (act === 'ingredients') App.router.go('ingredients');
      else if (act === 'partager') {
        const txt = App.shopping.texteFourche(m(), App.store.state);
        try {
          if (navigator.share) await navigator.share({ title: 'La Fourche', text: txt });
          else { await navigator.clipboard.writeText(txt); App.ui.toast('Liste copiée'); }
        } catch (err) { /* annulé */ }
      }
    };
    el.onchange = e => {
      const t = e.target;
      if (t.dataset.kind === 'coche') App.store.update(() => {
        const c = f().coches; if (t.checked) c[t.dataset.id] = true; else delete c[t.dataset.id];
      });
      if (t.name === 'passee') App.store.update(s => {
        const x = f();
        if (t.checked && !x.passee) {
          const F = App.shopping.fourcheMois(m(), s);
          x.dispo = F.dispo; x.auStock = {};
          F.items.filter(i => !i.enStock && (i.qty > 0 || i.placard)).forEach(i => { x.auStock[i.id] = i.packs * i.pack; });
          App.stock.ajouter(s, x.auStock);
          x.passee = true;
          App.ui.toast('Commande rangée dans le garde-manger 🥫');
        } else if (!t.checked && x.passee) {
          App.stock.retirer(s, x.auStock || {});
          x.auStock = null; x.dispo = null; x.passee = false;
        }
      });
    };
    el.onsubmit = e => {
      e.preventDefault();
      const form = e.target;
      if (form.dataset.action === 'montant') App.store.update(() => { f().montant = App.u.num(form.montant.value); });
      if (form.dataset.action === 'ajout') {
        const nom = form.nom.value.trim();
        if (nom) App.store.update(() => f().ajouts.push({ id: App.u.uid(), nom, prix: App.u.num(form.prix.value) || 0 }));
      }
    };
  }
};
