/* Intelligence artificielle (Gemini, via Firebase AI Logic, formule gratuite).
   - Photo / texte / lien → recette (puis la fiche de vérification habituelle).
   - Phrase libre de l'accueil → consigne ou envie (seulement si l'app ne l'a pas comprise seule).
   - Idées de recettes avec ce qu'il reste au garde-manger, ou de saison pour l'objectif.
   Confidentialité : on n'envoie que la photo, le texte ou la phrase concernés (jamais noms, e-mails, pesées, budget).
   Réservé aux téléphones connectés à la synchronisation ; sans réseau ou au-delà du quota, l'app continue sans IA. */
App.ia = {
  /** Modèles essayés dans l'ordre (les anciens sont retirés par Google au fil du temps). */
  MODELES_VISION: ['gemini-3-flash-preview', 'gemini-flash-lite-latest'],
  MODELES_RAPIDES: ['gemini-flash-lite-latest', 'gemini-3-flash-preview'],
  DELAI: 45000,
  mod: null, ai: null,

  /** L'IA est-elle utilisable sur ce téléphone ? */
  dispo() {
    return !!(App.sync.fb && App.sync.user && App.store.state.settings.ia !== false && navigator.onLine);
  },
  raison() {
    if (App.store.state.settings.ia === false) return 'L’IA est désactivée dans Réglages.';
    if (!navigator.onLine) return 'Pas de réseau : l’IA a besoin d’Internet.';
    if (!App.sync.user) return 'Connectez-vous d’abord (menu ☰ › Synchronisation) pour utiliser l’IA.';
    return 'L’IA n’est pas encore prête, réessayez dans un instant.';
  },

  async charger() {
    if (App.ia.ai) return;
    App.ia.mod = await import(App.sync.SDK + 'firebase-ai.js');
    App.ia.ai = App.ia.mod.getAI(App.sync.app, { backend: new App.ia.mod.GoogleAIBackend() });
  },

  /** Envoie la demande à Gemini et renvoie le JSON de la réponse. */
  async demander(parts, { vision = false, outils = null } = {}) {
    if (!App.ia.dispo()) throw new Error(App.ia.raison());
    await App.ia.charger();
    const modeles = vision ? App.ia.MODELES_VISION : App.ia.MODELES_RAPIDES;
    let derniere;
    for (const nom of modeles) {
      try {
        const opts = { model: nom };
        if (outils) opts.tools = outils;
        else opts.generationConfig = { responseMimeType: 'application/json', temperature: 0.3 };
        const modele = App.ia.mod.getGenerativeModel(App.ia.ai, opts);
        const rep = await Promise.race([
          modele.generateContent(parts),
          new Promise((_, rej) => setTimeout(() => rej(new Error('délai dépassé')), App.ia.DELAI))
        ]);
        return App.ia.json(rep.response.text());
      } catch (e) {
        derniere = e;
        const msg = String(e.message || e);
        if (/quota|429|RESOURCE_EXHAUSTED/i.test(msg)) throw new Error('Limite gratuite de l’IA atteinte pour aujourd’hui : réessayez demain.');
      }
    }
    throw new Error('L’IA n’a pas pu répondre (' + String(derniere && derniere.message || derniere).replace(/.*\] /, '').slice(0, 80) + ')');
  },

  /** Lit le JSON d'une réponse (même entouré de texte ou de ```). */
  json(t) {
    const s = String(t || '').replace(/```(?:json)?/g, '');
    const i = s.search(/[[{]/), j = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
    if (i < 0 || j < i) throw new Error('Réponse illisible');
    return JSON.parse(s.slice(i, j + 1));
  },

  // ---------- Recettes ----------
  FORMAT_RECETTE: `Réponds uniquement en JSON :
{"titre": "…", "portions": nombre ou null, "ingredients": [{"quantite": nombre ou null, "unite": "g|kg|ml|cl|l|c. à s.|c. à c.|pincée|boîte|gousse|botte|tranche|sachet|" , "nom": "…"}], "etapes": ["…"]}
Règles : tout en français ; noms d'ingrédients simples, sans marque (« courgettes », « crème fraîche », « riz basmati ») ;
quantités en nombres (½ → 0.5) ; unite vide pour les pièces (« 3 courgettes » → quantite 3, unite "") ;
étapes courtes et claires, dans l'ordre. Si ce n'est pas une recette : {"erreur": "explication courte"}.`,

  /** Recette lue → texte au format de l'import habituel (qui relie les ingrédients à la liste de courses). */
  versTexte(r) {
    if (!r || r.erreur) throw new Error(r && r.erreur ? r.erreur : 'Aucune recette trouvée');
    const l = [r.titre || 'Recette', r.portions ? `Pour ${r.portions} personnes` : '', 'Ingrédients'];
    (r.ingredients || []).forEach(i => {
      const q = i.quantite != null && i.quantite !== '' ? String(i.quantite).replace('.', ',') + ' ' : '';
      const u = i.unite ? i.unite + ' ' : '';
      const de = u ? (/^[aeiouyhéè]/i.test(i.nom) ? 'd’' : 'de ') : '';
      l.push(`- ${q}${u}${de}${i.nom}`.replace(/\s+/g, ' '));
    });
    l.push('Préparation');
    (r.etapes || []).forEach((e, n) => l.push(`${n + 1}. ${e}`));
    return l.filter(Boolean).join('\n');
  },

  async recetteDepuisTexte(texte) {
    const r = await App.ia.demander([`Voici un texte qui contient une recette (copiée d'un site, d'un réseau social ou d'un message). Extrais la recette.\n${App.ia.FORMAT_RECETTE}\n\nTEXTE :\n${texte.slice(0, 12000)}`]);
    return App.ia.versTexte(r);
  },

  async recetteDepuisPhoto(base64, mimeType) {
    const r = await App.ia.demander([
      `Cette photo montre une recette (fiche, livre, capture d'écran, écriture à la main). Lis-la et extrais la recette.\n${App.ia.FORMAT_RECETTE}`,
      { inlineData: { data: base64, mimeType } }
    ], { vision: true });
    return App.ia.versTexte(r);
  },

  async recetteDepuisLien(url) {
    const r = await App.ia.demander([`Ouvre cette page et extrais la recette qu'elle contient : ${url}\n${App.ia.FORMAT_RECETTE}`],
      { vision: true, outils: [{ urlContext: {} }] });
    const texte = App.ia.versTexte(r);
    return texte + '\n' + url;
  },

  /** Photo réduite (1600 px max, JPEG) pour aller vite et économiser le quota. */
  async preparerPhoto(fichier) {
    const img = await new Promise((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i); i.onerror = () => ko(new Error('Photo illisible'));
      i.src = URL.createObjectURL(fichier);
    });
    const max = 1600, k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(img.src);
    return c.toDataURL('image/jpeg', 0.85).split(',')[1];
  },

  // ---------- Phrase de l'accueil ----------
  /** Une phrase que l'app n'a pas comprise seule → consigne et/ou plats proposés. */
  async comprendrePhrase(texte, state) {
    const repas = state.repas.filter(r => r.categorie !== 'Bébé' && r.categorie !== 'Douceurs')
      .map(r => `${r.id}|${r.nom}|${r.tags.join(',')}`).join('\n');
    const regimes = App.consignes.REGIMES.map(r => `${r.id} (${r.label})`).join(', ');
    const etats = App.consignes.ETATS.map(e => `${e.id} (${e.label})`).join(', ');
    const tags = Object.keys(window.APP_DATA.tags).filter(t => t !== 'bebe').join(', ');
    const r = await App.ia.demander([`Tu aides une famille (2 adultes, un bébé) à planifier ses repas de la semaine.
Ils ont écrit : « ${texte.slice(0, 500)} »
Transforme cette demande pour l'app. Réponds uniquement en JSON :
{"type": "consigne" | "envie", "regimes": [ids parmi : ${regimes}], "etats": [ids parmi : ${etats}],
 "exclure": ["ingrédients à éviter, en français"], "favoriser_tags": [tags parmi : ${tags}],
 "moments": ["midi","soir"], "jours": ["lun","mar","mer","jeu","ven","sam","dim"] ou null pour toute la semaine,
 "nb_jours": nombre ou null, "recettes": [jusqu'à 4 ids de la liste ci-dessous, du plus adapté au moins adapté],
 "placements": [{"jour": "sam", "moment": "soir", "recette": "id"}] pour chaque repas précis cité (jour + moment), sinon [],
 "resume": "ce que tu as compris, en 8 mots maximum"}
« envie » = un plat ou un type de plat ponctuel (un seul repas) ; « consigne » = une règle sur plusieurs repas, un régime, une contrainte, un état.
Recettes disponibles (id|nom|tags) :
${repas}`]);
    return r;
  },

  /** Réponse de l'IA → consigne au format de l'app (ou null si c'est une envie). */
  versConsigne(r, state) {
    if (!r) return null;
    const jourOk = j => App.JOURS.some(x => x.id === j);
    const placements = (r.placements || []).filter(p => p && jourOk(p.jour) && (p.moment === 'soir' || (p.moment === 'midi' && state.settings.midis)) && App.store.repas(p.recette));
    // Plusieurs repas précis (« samedi soir… dimanche midi… ») : on les place directement
    if (placements.length && (r.type !== 'consigne' || placements.length > 1)) {
      const nomCase = p => `${App.JOURS.find(x => x.id === p.jour).nom.toLowerCase()} ${p.moment}`;
      return {
        etats: [], regimes: [], exclus: [], positifs: [], favoriserTags: [], recettesIA: [], placements,
        moments: [...new Set(placements.map(p => p.moment))], jours: [...new Set(placements.map(p => p.jour))], nbJours: null,
        porteeTexte: placements.map(nomCase).join(', '), resumeIA: r.resume || '', ia: true
      };
    }
    if (r.type !== 'consigne') return null;
    const ids = (liste, ref) => (liste || []).filter(x => ref.some(y => y.id === x));
    const exclus = [];
    (r.exclure || []).forEach(nom => {
      const n = App.u.norm(nom).replace(/s$/, '');
      if (n.length < 3) return;
      state.ingredients.forEach(i => { if (App.u.norm(i.nom).includes(n) && !exclus.includes(i.id)) exclus.push(i.id); });
    });
    const moments = (r.moments || []).filter(m => m === 'midi' || m === 'soir').filter(m => m !== 'midi' || state.settings.midis);
    const jours = Array.isArray(r.jours) ? r.jours.filter(j => App.JOURS.some(x => x.id === j)) : null;
    const nb = Number.isFinite(r.nb_jours) && r.nb_jours > 0 ? Math.min(7, r.nb_jours) : null;
    const quand = jours && jours.length ? jours.map(j => App.JOURS.find(x => x.id === j).nom.toLowerCase()).join(', ')
      : nb ? `${nb} prochains jours` : 'toute la semaine';
    const mm = moments.length ? moments : ['midi', 'soir'].filter(m => m !== 'midi' || state.settings.midis);
    return {
      etats: ids(r.etats, App.consignes.ETATS), regimes: ids(r.regimes, App.consignes.REGIMES), exclus, positifs: [],
      favoriserTags: (r.favoriser_tags || []).filter(t => window.APP_DATA.tags[t]),
      recettesIA: (r.recettes || []).filter(id => App.store.repas(id)),
      moments: mm, jours: jours && jours.length ? jours : null, nbJours: jours && jours.length ? null : nb,
      porteeTexte: (mm.length === 1 ? (mm[0] === 'soir' ? 'les soirs · ' : 'les midis · ') : '') + quand,
      resumeIA: r.resume || '', ia: true
    };
  },

  // ---------- Idées de recettes ----------
  async idees(mode, state) {
    const obj = App.suggest.objectif(App.store.semaine());
    const mois = new Date().toLocaleDateString('fr-FR', { month: 'long' });
    let contexte;
    if (mode === 'stock') {
      const dispo = Object.entries(state.stock).filter(([, e]) => e.qty > 0)
        .map(([id]) => (App.store.ingredient(id) || {}).nom).filter(Boolean);
      if (!dispo.length) throw new Error('Le garde-manger est vide pour l’instant.');
      contexte = `Ingrédients disponibles à la maison : ${dispo.join(', ')}. Propose des recettes qui utilisent surtout ces ingrédients (on peut ajouter des basiques : sel, poivre, huile, épices).`;
    } else {
      contexte = `Propose des recettes de saison pour le mois de ${mois} en France.`;
    }
    const r = await App.ia.demander([`Tu proposes des idées de repas à une famille (2 adultes, un bébé de moins d'un an), cuisine maison simple, souvent au Thermomix.
${contexte}
${obj ? `Objectif de la semaine : ${obj.nom} (${obj.description || ''}).` : 'Repas équilibrés et healthy.'}
Évite : sucre raffiné, farine blanche, friture. Pas de porc ni d'alcool (viande halal).
Réponds uniquement en JSON : {"idees": [3 recettes au format {"titre","portions","ingredients":[{"quantite","unite","nom"}],"etapes":[…],"pourquoi":"une phrase"}]}
${App.ia.FORMAT_RECETTE.split('\n').slice(2).join('\n')}`]);
    return (r.idees || []).slice(0, 3);
  },

  /** Ouvre la feuille d'idées (garde-manger ou saison). */
  async ouvrirIdees(mode) {
    if (!App.ia.dispo()) return App.ui.toast(App.ia.raison());
    const { esc } = App.u;
    const titre = mode === 'stock' ? '✨ Idées avec ce qu’il reste' : '✨ Idées de saison';
    const ov = App.ui.sheet(`<h2>${titre}</h2><div class="ia-attente"><span class="ia-points"></span> Gemini réfléchit…</div>`, () => {});
    let idees;
    try { idees = await App.ia.idees(mode, App.store.state); }
    catch (e) { ov.querySelector('.sheet').innerHTML = `<div class="sheet-grip"></div><h2>${titre}</h2><p class="muted">${esc(e.message)}</p>`; return; }
    const sh = ov.querySelector('.sheet');
    sh.innerHTML = `<div class="sheet-grip"></div><h2>${titre}</h2>
      <p class="muted small">Proposées par l’IA : vérifiez avant de cuisiner. Ajoutez celles qui vous plaisent à vos recettes.</p>
      ${idees.map((r, i) => `
        <section class="card ia-idee">
          <h3>${esc(r.titre || 'Idée')}</h3>
          ${r.pourquoi ? `<p class="muted small">${esc(r.pourquoi)}</p>` : ''}
          <small class="muted">${(r.ingredients || []).map(x => esc(x.nom)).join(', ')}</small>
          <button class="btn block" data-i="${i}">＋ Ajouter à mes recettes</button>
        </section>`).join('') || '<p class="muted">Aucune idée cette fois-ci.</p>'}`;
    sh.onclick = e => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      try { App.importUI.depuisTexte(App.ia.versTexte(idees[+b.dataset.i])); }
      catch (err) { App.ui.toast(err.message); }
    };
  }
};
