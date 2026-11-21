/* Écran « Importer une recette » : coller un texte, photo (Texte en direct de l'iPhone), lien, découvrir.
   Chaque import passe par la fiche de vérification avant d'entrer dans la bibliothèque. */
App.importUI = {
  onglet: 'coller',
  texte: '',
  lien: '',

  /** Légumes de saison par mois (pour « Découvrir »). */
  SAISON: {
    1: ['poireau', 'carotte', 'pdt', 'butternut', 'chou-fleur', 'pomme', 'poire', 'champignon'],
    2: ['poireau', 'carotte', 'pdt', 'chou-fleur', 'pomme', 'poire', 'navet'],
    3: ['poireau', 'carotte', 'epinards', 'pdt', 'chou-fleur', 'navet'],
    4: ['epinards', 'petits-pois', 'carotte', 'poireau', 'salade'],
    5: ['epinards', 'petits-pois', 'salade', 'concombre', 'carotte'],
    6: ['courgette', 'tomate', 'concombre', 'salade', 'petits-pois', 'haricots-verts'],
    7: ['courgette', 'tomate', 'aubergine', 'poivron', 'concombre', 'haricots-verts'],
    8: ['courgette', 'tomate', 'aubergine', 'poivron', 'haricots-verts', 'mais'],
    9: ['courgette', 'tomate', 'poivron', 'aubergine', 'champignon', 'pomme'],
    10: ['butternut', 'champignon', 'pomme', 'poire', 'poireau', 'patate-douce', 'brocoli'],
    11: ['butternut', 'poireau', 'chou-fleur', 'brocoli', 'carotte', 'pdt', 'champignon', 'pomme', 'poire'],
    12: ['butternut', 'poireau', 'chou-fleur', 'carotte', 'pdt', 'navet', 'pomme', 'poire']
  },

  ouvrir(onglet = 'coller') {
    App.importUI.onglet = onglet;
    const ov = App.ui.sheet(App.importUI.contenu(), (action, target, ov) => App.importUI.action(action, target, ov));
    ov.addEventListener('change', e => { if (e.target.name === 'photo' && e.target.files[0]) App.importUI.photoIA(e.target.files[0], ov); });
    ov.addEventListener('input', e => {
      if (e.target.name === 'texte') App.importUI.texte = e.target.value;
      if (e.target.name === 'lien') App.importUI.lien = e.target.value;
    });
  },

  redessiner(ov) {
    const sh = ov.querySelector('.sheet');
    sh.innerHTML = '<div class="sheet-grip"></div>' + App.importUI.contenu();
  },

  contenu() {
    const { esc } = App.u;
    const o = App.importUI.onglet;
    const onglets = [['coller', '📋', 'Coller'], ['photo', '📷', 'Photo'], ['lien', '🔗', 'Lien'], ['decouvrir', '✨', 'Découvrir']];
    const ia = App.ia.dispo();
    const zoneTexte = (aide) => `
      <textarea name="texte" class="import-texte" rows="9" placeholder="${aide}">${esc(App.importUI.texte)}</textarea>
      <div class="grid2">
        <button class="btn" data-action="coller-presse">📋 Coller</button>
        <button class="btn btn-primary" data-action="analyser">Analyser la recette</button>
      </div>
      ${ia ? '<button class="btn block btn-ia" data-action="ia-texte">✨ Analyser avec l’IA (textes en désordre, Instagram…)</button>' : ''}`;
    const boutonPhoto = ia ? `
      <label class="btn btn-primary block btn-ia photo-ia">📷 Prendre ou choisir une photo — l’IA lit la recette
        <input type="file" name="photo" accept="image/*" hidden/></label>
      <p class="muted small center">ou, sans IA :</p>` : `<p class="muted small">${esc(App.ia.raison())}</p>`;
    let corps = '';
    if (o === 'coller') corps = `
      <p class="muted small">Copiez une recette n’importe où — <strong>Cookidoo</strong> (liste d’ingrédients), légende <strong>Instagram / TikTok</strong>, site, message, note — puis collez-la ici. L’app repère le titre, les ingrédients et les étapes.</p>
      ${zoneTexte('Ex. :&#10;Gratin de courgettes&#10;Pour 4 personnes&#10;3 courgettes&#10;200 ml de crème&#10;50 g de parmesan&#10;1. Préchauffer le four…')}`;
    else if (o === 'photo') corps = `
      ${boutonPhoto}
      <ol class="etapes-aide">
        <li>Prenez la fiche, la page du livre ou la capture en photo.</li>
        <li>Ouvrez la photo dans <strong>Photos</strong>, puis <strong>appuyez longuement sur le texte</strong> (ou touchez l’icône <strong>Texte en direct</strong> en bas à droite).</li>
        <li>Touchez <strong>Tout sélectionner</strong>, puis <strong>Copier</strong>.</li>
        <li>Revenez ici et touchez <strong>📋 Coller</strong>.</li>
      </ol>
      <small class="muted">Marche aussi avec une capture d’écran d’Instagram, de TikTok ou de Cookidoo.</small>
      ${zoneTexte('Collez ici le texte copié depuis la photo…')}`;
    else if (o === 'lien') corps = `
      <p class="muted small">Collez le lien de la recette : il sera gardé dans la fiche pour la retrouver (et l’ouvrir dans Cookidoo s’il vient de Cookidoo). Pour remplir les ingrédients, copiez le texte de la page et collez-le en dessous.</p>
      <input name="lien" type="url" inputmode="url" placeholder="https://…" value="${esc(App.importUI.lien)}"/>
      ${ia ? '<button class="btn btn-primary block btn-ia" data-action="ia-lien">✨ Importer depuis le lien avec l’IA</button><p class="muted small center">ou, sans IA, copiez le texte de la page :</p>' : ''}
      ${App.importUI.lien ? `<a class="link-btn" href="${esc(App.importUI.lien)}" target="_blank" rel="noopener">Ouvrir le lien pour copier la recette ↗</a>` : ''}
      ${zoneTexte('Collez ici le texte de la recette (ingrédients et étapes)…')}`;
    else corps = App.importUI.decouvrir();
    return `
      <h2>Importer une recette</h2>
      <div class="import-onglets">${onglets.map(([id, ic, nom]) =>
        `<button class="${o === id ? 'on' : ''}" data-action="onglet" data-v="${id}"><span>${ic}</span>${nom}</button>`).join('')}</div>
      ${corps}`;
  },

  decouvrir() {
    const st = App.store.state;
    const { esc } = App.u;
    const deja = new Set();
    Object.values(st.semaines).forEach(w => Object.values(w.slots).forEach(s => s && s.repasId && deja.add(s.repasId)));
    const adultes = st.repas.filter(r => r.categorie !== 'Bébé' && r.categorie !== 'Douceurs');
    const melange = a => a.slice().sort(() => Math.random() - 0.5);
    const saison = App.importUI.SAISON[new Date().getMonth() + 1] || [];
    const deSaison = melange(adultes.filter(r => r.ingredients.filter(([id]) => saison.includes(id)).length >= 2)).slice(0, 6);
    const jamais = melange(adultes.filter(r => !deja.has(r.id))).slice(0, 6);
    const obj = App.suggest.objectif(App.store.semaine());
    const conseilles = obj ? melange(adultes.filter(r => App.suggest.conseille(r, obj))).slice(0, 6) : [];
    const bloc = (titre, liste) => liste.length ? `
      <h3>${titre}</h3>
      <div class="decouvrir">${liste.map(r => `
        <button class="decouvrir-carte" data-action="voir" data-id="${r.id}">
          <img src="${window.APP_DATA.imageRepas(r)}" alt="" loading="lazy"/><span>${esc(r.nom)}</span>
        </button>`).join('')}</div>` : '';
    return `
      <p class="muted small">Des idées dans votre bibliothèque. Touchez une recette pour la voir et l’ajouter au menu.</p>
      ${bloc('🥕 De saison', deSaison)}
      ${bloc('🆕 Jamais encore au menu', jamais)}
      ${obj ? bloc(`${obj.emoji} Pour l’objectif « ${esc(obj.nom)} »`, conseilles) : ''}
      <button class="btn block" data-action="melanger">🔄 D’autres idées</button>
      ${App.ia.dispo() ? `<h3>✨ Nouvelles idées avec l’IA</h3>
        <div class="grid2">
          <button class="btn btn-ia" data-action="ia-idees" data-mode="saison">🍂 De saison</button>
          <button class="btn btn-ia" data-action="ia-idees" data-mode="stock">🥫 Avec ce qu’il reste</button>
        </div>` : ''}`;
  },

  async action(action, target, ov) {
    if (action === 'onglet') { App.importUI.onglet = target.dataset.v; return App.importUI.redessiner(ov); }
    if (action === 'melanger') return App.importUI.redessiner(ov);
    if (action === 'voir') return App.views.repas.detail(target.dataset.id);
    if (action === 'coller-presse') {
      try {
        const t = await navigator.clipboard.readText();
        if (t) { App.importUI.texte = t; App.importUI.redessiner(ov); }
      } catch (e) { App.ui.toast('Appuyez longuement dans la zone de texte puis « Coller »'); }
      return;
    }
    if (action === 'analyser') {
      const texte = (ov.querySelector('[name=texte]') || {}).value || App.importUI.texte;
      if (!texte.trim()) return App.ui.toast('Collez d’abord le texte de la recette');
      App.importUI.depuisTexte(texte);
    }
    if (action === 'ia-texte') {
      const texte = (ov.querySelector('[name=texte]') || {}).value || App.importUI.texte;
      if (!texte.trim()) return App.ui.toast('Collez d’abord le texte de la recette');
      await App.importUI.avecIA(ov, () => App.ia.recetteDepuisTexte(texte));
    }
    if (action === 'ia-lien') {
      const lien = ((ov.querySelector('[name=lien]') || {}).value || App.importUI.lien).trim();
      if (!/^https?:\/\//.test(lien)) return App.ui.toast('Collez d’abord le lien de la recette (https://…)');
      App.importUI.lien = lien;
      await App.importUI.avecIA(ov, () => App.ia.recetteDepuisLien(lien));
    }
    if (action === 'ia-idees') { App.ui.closeSheet(true); App.ia.ouvrirIdees(target.dataset.mode); }
  },

  /** Montre « l'IA lit… » pendant l'attente, puis ouvre la fiche de vérification. */
  async avecIA(ov, tache) {
    const sh = ov.querySelector('.sheet');
    const attente = document.createElement('div');
    attente.className = 'ia-attente';
    attente.innerHTML = '<span class="ia-points"></span> L’IA lit la recette… (quelques secondes)';
    sh.appendChild(attente);
    attente.scrollIntoView({ block: 'nearest' });
    try {
      const texte = await tache();
      App.importUI.texte = '';
      App.importUI.depuisTexte(texte, true);
    } catch (e) {
      attente.remove();
      App.ui.toast(e.message || 'L’IA n’a pas pu lire cette recette');
    }
  },

  async photoIA(fichier, ov) {
    await App.importUI.avecIA(ov, async () => App.ia.recetteDepuisPhoto(await App.ia.preparerPhoto(fichier), 'image/jpeg'));
  },

  /** Texte de recette → ingrédients reliés à la liste de courses → fiche de vérification. */
  depuisTexte(texte, parIA = false) {
    const st = App.store.state;
    const a = App.importer.analyser(texte, st);
    if (App.importUI.lien && !a.lien) a.lien = App.importUI.lien;
    if (!a.lignes.length && !a.etapes.length) return App.ui.toast('Aucune recette reconnue dans ce texte');
    const { nouveaux, repas } = App.importer.brouillon(a, st);
    if (nouveaux.length) App.store.update(s => { s.ingredients.push(...nouveaux); });
    App.importUI.texte = ''; App.importUI.lien = '';
    App.views.repas.editer(null, '', repas);
    const n = a.lignes.length, inconnus = nouveaux.length;
    App.ui.toast(`${parIA ? '✨ ' : ''}${n} ingrédient${n > 1 ? 's' : ''} reconnu${n > 1 ? 's' : ''}${inconnus ? `, dont ${inconnus} nouveau${inconnus > 1 ? 'x' : ''} (prix à compléter)` : ''}`);
  }
};
