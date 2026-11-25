/* Réglages : tout au même endroit (famille, semaine, bébé, budget, affichage, sauvegarde). */
App.views.reglages = {
  title: 'Réglages',

  render(state) {
    const { esc } = App.u;
    const S = state.settings, b = S.bebe;
    const age = App.suggest.ageBebe(state);
    const groupe = (titre, corps) => `<h3 class="section-title">${titre}</h3><section class="card reglages">${corps}</section>`;
    const inter = (name, on, titre, aide = '') => `
      <label class="interrupteur"><span class="grow">${titre}${aide ? `<small>${aide}</small>` : ''}</span>
        <input type="checkbox" switch name="${name}" ${on ? 'checked' : ''}/></label>`;
    return `
      ${groupe('👨‍👩‍👧 Famille', `
        <div class="row">
          <label class="grow">Prénom 1<input name="nom0" value="${esc(S.noms[0])}"/></label>
          <label class="grow">Prénom 2<input name="nom1" value="${esc(S.noms[1])}"/></label>
        </div>
        <label>Eau bue par jour pour le foyer (litres)<input name="eauLitresParJour" inputmode="decimal" value="${S.eauLitresParJour ?? 4}"/>
          <small class="muted">Sert à calculer les packs d’eau de la semaine (onglet Maison des courses).</small></label>
        <label>Portions par repas<input name="portions" inputmode="decimal" value="${S.portions}"/>
          <small class="muted">2 adultes ; passez à 2,5 si bébé mange une part des plats.</small></label>`)}

      ${groupe('📅 Menu de la semaine', `
        <label>Début du suivi<input type="date" name="debut" value="${S.debut || ''}"/>
          <small class="muted">Les semaines d’avant sont ignorées (menu, courses, budget, bilans).</small></label>
        ${inter('midis', S.midis, 'Planifier aussi les midis')}
        <label>Gâteaux healthy par semaine<input name="douceursParSemaine" inputmode="numeric" value="${S.douceursParSemaine}"/></label>`)}

      ${groupe('👶 Bébé', `
        ${inter('bebe', b.actif, 'Planifier les repas de bébé', 'Midi, goûter et soir dans le menu')}
        <div class="row">
          <label class="grow">Né(e) en<input type="month" name="bebe-naissance" value="${b.naissance || ''}"/></label>
          <label class="grow">Pots Orchestra / semaine<input name="bebe-orch" inputmode="numeric" value="${b.orchestraParSemaine}"/></label>
        </div>
        <small class="muted">${b.naissance ? `${age} mois : ` : 'Âge non indiqué (8 mois par défaut) : '}les purées proposées sont adaptées à son âge.</small>
        <details class="reperes">
          <summary>Repères pour les repas de bébé</summary>
          <ul>
            <li>Ni sel, ni sucre, ni miel avant 1 an.</li>
            <li>1 cuillère à café d’huile de colza dans chaque purée de légumes.</li>
            <li>Viande, poisson ou œuf : environ 10 g par jour vers 6-8 mois, 15-20 g vers 1 an, une seule fois par jour.</li>
            <li>Purées maison : cuisson vapeur, puis congélation en bacs à glaçons (3 mois).</li>
            <li>Pour les pots du commerce, vérifier l’âge indiqué sur l’étiquette.</li>
            <li>Ces repères ne remplacent pas l’avis du pédiatre.</li>
          </ul>
        </details>`)}

      ${groupe('💶 Budget & achats', `
        <label>Budget par semaine (€)<input name="plafond" inputmode="decimal" value="${S.plafond}"/></label>
        ${inter('fourcheDansBudget', S.fourcheDansBudget, 'Compter La Fourche dans la semaine', 'La commande du mois est répartie sur ses semaines')}
        <label>Drive utilisé<select name="drive">${['Leclerc Drive ou Chronodrive', 'Leclerc Drive', 'Chronodrive'].map(d =>
          `<option ${d === S.drive ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
        <a class="ligne-lien" href="#/ingredients"><span class="grow">🏷️ Ingrédients, prix & lieux d’achat</span><span class="chev">›</span></a>`)}

      ${groupe('📊 Affichage', `
        ${inter('calories', S.calories, 'Points nutritionnels', 'Calories, protéines, glucides, lipides et fibres')}
        <button class="ligne-lien" data-action="apparence"><span class="grow">🎨 Couleur, clair ou sombre</span><span class="chev">›</span></button>`)}

      ${groupe('✨ Intelligence artificielle', `
        ${inter('ia', S.ia !== false, 'Utiliser l’IA (Gemini)', 'Photo → recette, phrases libres de l’accueil, idées de recettes')}
        <small class="muted">Gratuit, via votre projet Firebase. Sont envoyés à Google : la photo, le texte ou la question, avec le menu prévu et les noms de vos recettes (jamais vos noms, pesées ou budget) ; avec l’offre gratuite, Google peut s’en servir pour améliorer ses modèles. Toutes les questions sont permises, y compris sur la santé. Nécessite d’être connecté à la synchronisation.</small>
        <small class="muted">Ce site est protégé par reCAPTCHA ; les <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">règles de confidentialité</a> et les <a href="https://policies.google.com/terms" target="_blank" rel="noopener">conditions d’utilisation</a> de Google s’appliquent.</small>`)}

      ${groupe('🔄 Synchronisation', `
        <button class="ligne-lien" data-action="sync"><span class="grow">Nos deux iPhone <small class="sync-statut" data-sync-statut></small></span><span class="chev">›</span></button>`)}

      ${groupe('💾 Sauvegarde', `
        <small class="muted">Une copie de toutes les données dans un fichier, à garder en lieu sûr.</small>
        <div class="grid2">
          <button class="btn" data-action="export">Exporter</button>
          <label class="btn file-btn">Importer<input type="file" accept="application/json,.json" name="import" hidden/></label>
        </div>`)}

      ${groupe('✨ Nouveautés', `
        <button class="ligne-lien" data-action="nouveautes"><span class="grow">Quoi de neuf dans l’app ?</span><span class="chev">›</span></button>`)}

      <button class="btn btn-ghost-danger block" data-action="reset">Tout réinitialiser…</button>`;
  },

  mount(el) {
    setTimeout(() => App.sync.maj());
    el.onchange = async e => {
      const t = e.target;
      const set = fn => App.store.update(s => fn(s.settings));
      const n = v => App.u.num(v);
      if (t.name === 'nom0' || t.name === 'nom1') set(s => { const i = +t.name.slice(-1); s.noms[i] = t.value.trim() || s.noms[i]; });
      if (t.name === 'portions') set(s => { s.portions = n(t.value) || 2; });
      if (t.name === 'eauLitresParJour') set(s => { s.eauLitresParJour = Math.max(0, n(t.value) ?? 0); });
      if (t.name === 'debut') App.store.update(st => {
        st.settings.debut = t.value || null;
        if (st.semaineActive < App.store.debut()) st.semaineActive = App.store.debut();
      });
      if (t.name === 'midis') set(s => { s.midis = t.checked; });
      if (t.name === 'douceursParSemaine') set(s => { s.douceursParSemaine = Math.max(0, Math.round(n(t.value) ?? 2)); });
      if (t.name === 'bebe') set(s => { s.bebe.actif = t.checked; });
      if (t.name === 'bebe-naissance') set(s => { s.bebe.naissance = t.value || null; });
      if (t.name === 'bebe-orch') set(s => { s.bebe.orchestraParSemaine = Math.max(0, Math.round(n(t.value) || 0)); });
      if (t.name === 'plafond') set(s => { s.plafond = n(t.value) || 0; });
      if (t.name === 'fourcheDansBudget') set(s => { s.fourcheDansBudget = t.checked; });
      if (t.name === 'drive') set(s => { s.drive = t.value; });
      if (t.name === 'calories') set(s => { s.calories = t.checked; });
      if (t.name === 'ia') set(s => { s.ia = t.checked; });
      if (t.type === 'checkbox') App.ui.haptique();
      if (t.name === 'import' && t.files[0]) {
        try { App.store.importJSON(await t.files[0].text()); App.ui.toast('Données importées'); }
        catch (err) { App.ui.toast('Fichier non reconnu'); }
      }
    };
    el.onclick = async e => {
      const a = e.target.closest('[data-action]:not(form)');
      if (!a) return;
      const act = a.dataset.action;
      if (act === 'apparence') App.apparence.ouvrir(false);
      else if (act === 'nouveautes') App.drawer.nouveautes();
      else if (act === 'sync') App.sync.ouvrir();
      else if (act === 'export') App.views.reglages.exporter();
      else if (act === 'reset') App.ui.confirmSheet('Effacer toutes les données (menus, repas ajoutés, suivi, réglages) ? Pensez à exporter avant.', 'Tout effacer', () => App.store.reset());
    };
  },

  async exporter() {
    const json = App.store.exportJSON();
    const file = new File([json], `cook-easy-${App.u.key(new Date())}.json`, { type: 'application/json' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'Cook Easy' });
      else {
        const url = URL.createObjectURL(file);
        const link = Object.assign(document.createElement('a'), { href: url, download: file.name });
        link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) { /* annulé */ }
  }
};
