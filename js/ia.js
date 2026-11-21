/* Intelligence artificielle (Gemini, via Firebase AI Logic, formule gratuite).
   - Photo / texte / lien → recette (puis la fiche de vérification habituelle).
   - Phrase libre de l'accueil → vraie discussion : l'IA répond à tout, puis propose (menu, recette, consigne) ; rien ne change sans accord.
   - Idées de recettes avec ce qu'il reste au garde-manger, ou de saison pour l'objectif.
   Confidentialité : on envoie la question, le menu prévu et les noms des recettes (jamais noms, e-mails, pesées, budget).
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
  async demander(parts, { vision = false, outils = null, temperature = 0.3 } = {}) {
    if (!App.ia.dispo()) throw new Error(App.ia.raison());
    await App.ia.charger();
    const modeles = vision ? App.ia.MODELES_VISION : App.ia.MODELES_RAPIDES;
    let derniere;
    for (const nom of modeles) {
      try {
        const opts = { model: nom };
        if (outils) opts.tools = outils;
        else opts.generationConfig = { responseMimeType: 'application/json', temperature };
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

  // ---------- Discussion libre (phrase de l'accueil) ----------
  /** Le menu des deux semaines à venir, en clair, pour que l'IA sache ce qui est déjà prévu. */
  contexteMenu(state) {
    const lignes = [];
    const k0 = App.store.semaineDuJour();
    [k0, App.u.addWeeks(k0, 1)].forEach(k => {
      const sem = state.semaines[k];
      App.JOURS.forEach((j, i) => {
        const d = App.u.parseKey(k); d.setDate(d.getDate() + i);
        ['midi', 'soir'].forEach(m => {
          if (m === 'midi' && !state.settings.midis) return;
          const s = sem && sem.slots[`${j.id}-${m}`];
          const r = s && s.repasId && App.store.repas(s.repasId);
          const txt = !s ? 'libre' : s.type === 'ext' ? 'repas dehors' : s.type === 'restes' ? 'restes'
            : r ? r.nom + (s.personnes ? ` (${s.personnes} pers.)` : '') : 'à choisir';
          lignes.push(`${App.u.key(d)} ${j.nom.toLowerCase()} ${m} : ${txt}`);
        });
      });
    });
    return lignes.join('\n');
  },

  /** Conversation → { reponse, propositions } (l'IA répond librement puis propose, sans rien changer elle-même). */
  async discuter(messages, state) {
    const repas = state.repas.filter(r => r.categorie !== 'Bébé').map(r => `${r.id}|${r.nom}`).join('\n');
    const regimes = App.consignes.REGIMES.map(r => r.id).join(', ');
    const etats = App.consignes.ETATS.map(e => e.id).join(', ');
    const tags = Object.keys(window.APP_DATA.tags).filter(t => t !== 'bebe').join(', ');
    const auj = new Date();
    const conv = messages.slice(-10).map(m => `${m.role === 'user' ? 'FAMILLE' : 'TOI'} : ${m.texte}`).join('\n');
    return App.ia.demander([`Tu es l'assistant de « Cook Easy », l'application de repas d'une famille : ${state.settings.portions || 2} adultes et un bébé.
Tu réponds comme un véritable assistant IA, chaleureux, précis et utile, à TOUTES les questions : cuisine, recettes, quantités pour des invités, organisation d'une soirée, nutrition, santé, grossesse, bébé, courses, budget, ou même sans rapport avec les repas.
Réponds d'abord vraiment à la question posée, avec des détails concrets (quantités, astuces, étapes). Ne ramène pas la conversation vers les recettes de la famille si ce n'est pas demandé.
Santé : donne des conseils généraux utiles ; si cela semble sérieux, conseille de consulter un médecin.
La famille mange halal (pas de porc, pas d'alcool dans les plats).
Aujourd'hui : ${auj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} (${App.u.key(auj)}).

Menu déjà prévu (date jour moment : plat) :
${App.ia.contexteMenu(state)}

Recettes enregistrées par la famille (id|nom) :
${repas}

Conversation :
${conv}

Réponds uniquement en JSON :
{"reponse": "ta réponse en français ; tirets et retours à la ligne autorisés ; **gras** possible",
 "propositions": [0 à 3 actions facultatives, seulement si elles aident vraiment ; la famille choisira de les accepter ou non]}
Formes possibles d'une action :
- {"type":"placer","libelle":"texte du bouton, ex. Mettre la raclette au menu samedi soir (10 pers.)","date":"AAAA-MM-JJ","moment":"midi"|"soir","recette":"id de la liste" ou null,"nouvelle":RECETTE ou null,"personnes":nombre ou null}
- {"type":"recette","libelle":"Ajouter … à mes recettes","nouvelle":RECETTE}
- {"type":"consigne","libelle":"…","regimes":[parmi ${regimes}],"etats":[parmi ${etats}],"exclure":["ingrédients à éviter"],"favoriser_tags":[parmi ${tags}],"moments":["midi","soir"],"jours":["lun","mar","mer","jeu","ven","sam","dim"] ou null,"nb_jours":nombre ou null,"recettes":[ids de la liste],"resume":"8 mots maximum"}
RECETTE = {"titre":"…","portions":nombre,"ingredients":[{"quantite":nombre ou null,"unite":"g|kg|ml|cl|l|c. à s.|c. à c.|pincée|boîte|gousse|botte|tranche|sachet|","nom":"…"}],"etapes":["…"]}, quantités pour ce nombre de portions.
Règles des actions : tu ne modifies jamais le menu toi-même. « placer » : utilise une recette de la liste seulement si c'est vraiment le même plat, sinon donne « nouvelle ». « personnes » : nombre total de convives si ce n'est pas la famille seule. La date doit être aujourd'hui ou plus tard (« samedi » = le prochain samedi). « consigne » : seulement pour une règle sur plusieurs repas (régime, état de santé, aliment à éviter…).`],
    { vision: true, temperature: 0.6 });
  },

  /** Crée une recette proposée par l'IA (ingrédients reliés à la liste de courses) et renvoie son id. */
  creerRecette(nouvelle) {
    const st = App.store.state;
    const a = App.importer.analyser(App.ia.versTexte(nouvelle), st);
    if (!a.lignes.length) throw new Error('Recette incomplète');
    const { nouveaux, repas } = App.importer.brouillon(a, st);
    const id = App.u.uid();
    App.store.update(s => {
      s.ingredients.push(...nouveaux);
      s.repas.push({ id, favori: false, avis: null, commentaire: '', ...repas, ia: true });
    });
    return id;
  },

  /** Accepte une proposition de l'IA. Renvoie un court compte rendu. */
  accepter(p) {
    const st = App.store.state;
    if (p.type === 'recette') {
      App.importUI.depuisTexte(App.ia.versTexte(p.nouvelle), true);
      return 'Recette ouverte pour vérification';
    }
    if (p.type === 'consigne') {
      const c = App.ia.versConsigne({ ...p, type: 'consigne', placements: [] }, st);
      if (!c) throw new Error('Consigne incomprise');
      let bilan = null;
      App.store.update(s => {
        const sem = App.store.semaine();
        const e = { id: App.u.uid(), texte: p.resume || p.libelle || 'Consigne de l’IA', date: Date.now(), consigne: c };
        sem.envies.push(e);
        App.consignes.casesFixes(s, e);
        bilan = App.consignes.appliquer(s, sem, e);
      });
      return `Consigne appliquée : ${bilan.changes.length} repas changé${bilan.changes.length > 1 ? 's' : ''}`;
    }
    if (p.type === 'placer') {
      const d = /^\d{4}-\d{2}-\d{2}$/.test(p.date || '') ? App.u.parseKey(p.date) : new Date();
      const k = App.u.mondayOf(d);
      if (k < App.store.debut()) throw new Error('Cette date est avant le début du suivi');
      const jour = App.JOURS[(d.getDay() + 6) % 7];
      const moment = p.moment === 'midi' && st.settings.midis ? 'midi' : 'soir';
      let id = p.recette && App.store.repas(p.recette) ? p.recette : null;
      if (!id && p.nouvelle) id = App.ia.creerRecette(p.nouvelle);
      if (!id) throw new Error('Recette introuvable');
      const pers = Math.round(+p.personnes || 0);
      App.store.update(s => {
        const sem = App.store.semaine(k);
        const slotId = `${jour.id}-${moment}`;
        App.stock.annulerConso(s, sem.slots[slotId]);
        sem.slots[slotId] = { type: 'maison', repasId: id, source: 'manuel', ...(pers > 0 && pers !== s.settings.portions ? { personnes: pers } : {}) };
      });
      return `Au menu ${jour.nom.toLowerCase()} ${d.getDate()} ${moment}${pers > 0 ? ` · ${pers} pers.` : ''} (courses mises à jour)`;
    }
    throw new Error('Action inconnue');
  },

  /** Petite mise en forme du texte de l'IA (sans HTML venant de l'IA). */
  formater(t) {
    return App.u.esc(String(t || '')).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  },

  /** Ouvre la discussion avec une première question. */
  ouvrirDiscussion(texte) {
    const conv = [{ role: 'user', texte }];
    const ov = App.ui.sheet(`<h2>✨ Assistant</h2>
      <div class="ia-fil"></div>
      <form class="envie-form ia-suite" data-action="suite">
        <input name="q" placeholder="Poser une autre question…" autocomplete="off" enterkeyhint="send"/>
        <button class="btn btn-primary" type="submit" aria-label="Envoyer">➤</button>
      </form>`, async (action, el) => {
      if (action === 'suite') {
        const q = el.q.value.trim();
        if (!q || ov.dataset.attente) return;
        el.q.value = '';
        conv.push({ role: 'user', texte: q });
        await tour();
      }
      if (action === 'prop') {
        const m = conv[+el.dataset.m], p = m && m.props[+el.dataset.p];
        if (!p || m.faits[el.dataset.p]) return;
        try {
          const msg = App.ia.accepter(p);
          m.faits[el.dataset.p] = msg;
          if (p.type === 'recette') return;   // la fiche de vérification a pris la place
          App.ui.haptique && App.ui.haptique();
          dessiner();
        } catch (err) { App.ui.toast(err.message); }
      }
    });
    const fil = ov.querySelector('.ia-fil');
    const dessiner = () => {
      fil.innerHTML = conv.map((m, i) => m.role === 'user'
        ? `<div class="ia-bulle moi">${App.u.esc(m.texte)}</div>`
        : `<div class="ia-bulle ia">${App.ia.formater(m.texte)}
            ${(m.props || []).length ? `<div class="ia-props">${m.props.map((p, j) => m.faits[j]
              ? `<div class="ia-fait">✓ ${App.u.esc(m.faits[j])}</div>`
              : `<button class="btn ${j === 0 ? 'btn-primary' : ''} block" data-action="prop" data-m="${i}" data-p="${j}">${App.u.esc(p.libelle || 'Accepter')}</button>`).join('')}
              <small class="muted">Rien n’est changé tant que vous ne touchez pas un bouton.</small></div>` : ''}
          </div>`).join('') + (ov.dataset.attente ? '<div class="ia-attente"><span class="ia-points"></span> Gemini réfléchit…</div>' : '');
      fil.lastElementChild && fil.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    const tour = async () => {
      ov.dataset.attente = '1'; dessiner();
      try {
        const r = await App.ia.discuter(conv, App.store.state);
        const props = (r.propositions || []).filter(p => p && ['placer', 'recette', 'consigne'].includes(p.type)
          && (p.type !== 'recette' || p.nouvelle) && (p.type !== 'placer' || p.recette || p.nouvelle)).slice(0, 3);
        conv.push({ role: 'ia', texte: r.reponse || '…', props, faits: {} });
      } catch (e) {
        conv.push({ role: 'ia', texte: e.message, props: [], faits: {} });
      }
      delete ov.dataset.attente; dessiner();
    };
    tour();
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
