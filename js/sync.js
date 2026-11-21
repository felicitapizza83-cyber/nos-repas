/* Synchronisation des deux iPhone (Firebase : connexion par lien e-mail + base Firestore).
   - Les données restent d'abord sur le téléphone (l'app marche sans réseau, comme avant).
   - À chaque sauvegarde, seules les différences partent en ligne (petits morceaux) :
     on peut cocher les courses en même temps sans s'écraser.
   - Les changements de l'autre téléphone arrivent en direct.
   Restent propres à chaque téléphone : la semaine affichée, « qui utilise ce téléphone », l'apparence.
   Rangement en ligne :
     foyer/general      réglages, objectifs, menus types, collections, suivi, garde-manger, La Fourche
     foyer/repas        la bibliothèque de recettes (texte JSON)
     foyer/ingredients  les ingrédients et prix (texte JSON)
     semaines/{lundi}   une semaine (menu, courses, envies, dépenses) */
App.sync = {
  CONFIG: {
    apiKey: 'AIzaSyAgPYGrdIaJwl4mt1snPyOY-uyLShc2BVY',
    authDomain: 'nos-repas-131b1.firebaseapp.com',
    projectId: 'nos-repas-131b1',
    storageBucket: 'nos-repas-131b1.firebasestorage.app',
    messagingSenderId: '888273839387',
    appId: '1:888273839387:web:3f3e572ce47efba034dfbe'
  },
  SDK: 'https://www.gstatic.com/firebasejs/12.6.0/',
  /** Clé de site reCAPTCHA (Fraud Defense, publique) : sert à App Check, obligatoire pour l’IA depuis novembre 2026. */
  RECAPTCHA: '6LdysisuAAAAAOkOCgRfsI6c11D-tYNDe0QAONXu',
  K_BASE: 'nos-repas-sync-base',   // état tel qu'il était à la dernière synchro (pour calculer les différences)
  K_EMAIL: 'nos-repas-sync-email', // adresse en attente du lien
  K_DERNIERE: 'nos-repas-sync-date',

  fb: null, auth: null, db: null,
  user: null,
  etat: 'deconnecte',  // deconnecte | connexion | pret | hors-ligne | erreur | refuse
  message: '',
  base: null,
  pret: false,
  desabonner: [],
  DEL: { __supprimer: true },

  // ---------- Démarrage ----------
  async init() {
    try {
      const [app, auth, fs] = await Promise.all([
        import(App.sync.SDK + 'firebase-app.js'),
        import(App.sync.SDK + 'firebase-auth.js'),
        import(App.sync.SDK + 'firebase-firestore.js')
      ]);
      App.sync.fb = { ...app, ...auth, ...fs };
    } catch (e) {
      App.sync.etat = navigator.onLine ? 'erreur' : 'hors-ligne';
      App.sync.message = 'Synchronisation indisponible pour l’instant (pas de réseau ?)';
      return;
    }
    const F = App.sync.fb;
    const app = F.initializeApp(App.sync.CONFIG);
    App.sync.app = app;
    // App Check : prouve que les demandes à l’IA viennent bien de Cook Easy (reCAPTCHA Fraud Defense, invisible)
    try {
      const ac = await import(App.sync.SDK + 'firebase-app-check.js');
      App.sync.appCheck = ac.initializeAppCheck(app, { provider: new ac.ReCaptchaEnterpriseProvider(App.sync.RECAPTCHA), isTokenAutoRefreshEnabled: true });
    } catch (e) { console.warn('App Check indisponible', e); }
    App.sync.auth = F.getAuth(app);
    App.sync.db = F.getFirestore(app);
    try { App.sync.base = JSON.parse(localStorage.getItem(App.sync.K_BASE)); } catch (e) { App.sync.base = null; }

    // Arrivée par le lien reçu par e-mail
    if (F.isSignInWithEmailLink(App.sync.auth, location.href)) {
      await App.sync.terminerConnexion(location.href);
      history.replaceState(null, '', location.pathname + '#/accueil');
    }
    F.onAuthStateChanged(App.sync.auth, user => {
      App.sync.user = user;
      if (user) App.sync.demarrer();
      else { App.sync.arreter(); App.sync.etat = 'deconnecte'; App.sync.maj(); }
    });
    window.addEventListener('online', () => App.sync.maj());
    window.addEventListener('offline', () => App.sync.maj());
  },

  // ---------- Connexion par lien e-mail ----------
  async envoyerLien(email) {
    const F = App.sync.fb;
    if (!F) throw new Error('Synchronisation indisponible (réseau ?)');
    localStorage.setItem(App.sync.K_EMAIL, email);
    await F.sendSignInLinkToEmail(App.sync.auth, email, {
      url: location.origin + location.pathname,
      handleCodeInApp: true
    });
  },

  async terminerConnexion(lien, email) {
    const F = App.sync.fb;
    email = email || localStorage.getItem(App.sync.K_EMAIL);
    if (!email) { App.sync.demanderEmail(lien); return false; }
    try {
      await F.signInWithEmailLink(App.sync.auth, email, lien.trim());
      localStorage.removeItem(App.sync.K_EMAIL);
      App.ui.toast('Connecté ✓ Synchronisation en cours…');
      return true;
    } catch (e) {
      App.ui.toast(e.code === 'auth/invalid-action-code' || e.code === 'auth/expired-action-code'
        ? 'Ce lien a expiré ou a déjà servi : demandez-en un nouveau'
        : e.code === 'auth/invalid-email' ? 'Cette adresse ne correspond pas au lien' : 'Connexion impossible : ' + (e.code || e.message));
      return false;
    }
  },

  // ---------- Connexion par mot de passe (aucun e-mail à chaque connexion) ----------
  async connexionMotDePasse(email, mdp) {
    try {
      await App.sync.fb.signInWithEmailAndPassword(App.sync.auth, email, mdp);
      App.ui.toast('Connecté ✓ Synchronisation en cours…');
      return true;
    } catch (e) {
      App.ui.toast(['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'].includes(e.code)
        ? 'Mot de passe incorrect, ou pas encore créé : touchez « Créer ou changer mon mot de passe »'
        : e.code === 'auth/too-many-requests' ? 'Trop d’essais : patientez quelques minutes' : 'Connexion impossible : ' + (e.code || e.message));
      return false;
    }
  },

  /** E-mail pour choisir (ou changer) son mot de passe : une seule fois, ensuite plus besoin d'e-mail. */
  async emailMotDePasse(email) {
    try {
      await App.sync.fb.sendPasswordResetEmail(App.sync.auth, email, { url: location.origin + location.pathname });
      App.ui.toast('📬 E-mail envoyé : choisissez votre mot de passe, puis revenez ici');
      return true;
    } catch (e) {
      App.ui.toast(e.code === 'auth/quota-exceeded' ? 'Limite d’e-mails atteinte pour aujourd’hui : réessayez demain' : 'Envoi impossible : ' + (e.code || e.message));
      return false;
    }
  },

  async deconnecter() {
    App.sync.arreter();
    await App.sync.fb.signOut(App.sync.auth);
    App.ui.toast('Déconnecté : les données restent sur ce téléphone');
  },

  // ---------- Synchronisation ----------
  refs() {
    const F = App.sync.fb, db = App.sync.db;
    return {
      general: F.doc(db, 'foyer', 'general'),
      repas: F.doc(db, 'foyer', 'repas'),
      ingredients: F.doc(db, 'foyer', 'ingredients'),
      semaines: F.collection(db, 'semaines'),
      semaine: k => F.doc(db, 'semaines', k)
    };
  },

  /** Ce qui se synchronise : tout l'état sauf ce qui est propre au téléphone. */
  partage(state) {
    const s = JSON.parse(JSON.stringify(state));
    delete s.semaineActive;
    if (s.settings) delete s.settings.moi;
    return s;
  },

  async demarrer() {
    const F = App.sync.fb, R = App.sync.refs();
    App.sync.etat = 'connexion'; App.sync.maj();
    try {
      const [g, rp, ig, sm] = await Promise.all([F.getDoc(R.general), F.getDoc(R.repas), F.getDoc(R.ingredients), F.getDocs(R.semaines)]);
      const local = App.sync.partage(App.store.state);
      if (!g.exists()) {
        // Premier téléphone connecté : il envoie ses données au foyer
        await App.sync.envoyerTout(local);
      } else {
        const distant = App.sync.lireDistant(g, rp, ig, sm);
        if (!App.sync.base) {
          // Ce téléphone ne s'est jamais synchronisé : demander lequel garder s'il a déjà des données
          const aDesDonnees = Object.values(local.semaines || {}).some(w => Object.keys(w.slots || {}).length || (w.envies || []).length);
          const choix = aDesDonnees ? await App.sync.demanderChoix() : 'foyer';
          if (choix === 'telephone') await App.sync.envoyerTout(local);
          else App.sync.remplacerLocal(distant);
        } else {
          // Reprendre les changements faits hors ligne par-dessus la version en ligne
          const patch = App.sync.diff(App.sync.base, local);
          App.sync.remplacerLocal(distant);
          if (patch) {
            App.store.appliquerDistant(st => App.sync.appliquerPatch(st, patch));
            await App.sync.ecrire(patch);
          }
        }
      }
      App.sync.base = App.sync.partage(App.store.state);
      App.sync.sauverBase();
      App.sync.pret = true;
      App.sync.ecouter();
      App.sync.etat = 'pret'; App.sync.maj();
    } catch (e) {
      console.error(e);
      App.sync.etat = e.code === 'permission-denied' ? 'refuse' : 'erreur';
      App.sync.message = e.code === 'permission-denied'
        ? `L’adresse ${App.sync.user.email} n’est pas autorisée pour ce foyer.`
        : 'La synchronisation a échoué : ' + (e.code || e.message);
      App.sync.maj();
    }
  },

  arreter() {
    App.sync.desabonner.forEach(f => f());
    App.sync.desabonner = [];
    App.sync.pret = false;
  },

  lireDistant(g, rp, ig, sm) {
    const d = App.sync.decoder(g.data());
    if (rp.exists()) d.repas = JSON.parse(rp.data().json);
    if (ig.exists()) d.ingredients = JSON.parse(ig.data().json);
    d.semaines = {};
    sm.forEach(x => { d.semaines[x.id] = App.sync.decoder(x.data()); });
    return d;
  },

  /** Remplace les données de ce téléphone par celles du foyer (sans toucher à ce qui lui est propre). */
  remplacerLocal(distant) {
    App.store.appliquerDistant(st => {
      const moi = st.settings ? st.settings.moi : 0;
      Object.keys(distant).forEach(k => { st[k] = distant[k]; });
      st.settings.moi = moi;
    });
  },

  async envoyerTout(local) {
    const F = App.sync.fb, R = App.sync.refs();
    const { semaines, repas, ingredients, ...general } = local;
    const b = F.writeBatch(App.sync.db);
    b.set(R.general, App.sync.encoder(general));
    b.set(R.repas, { json: JSON.stringify(repas) });
    b.set(R.ingredients, { json: JSON.stringify(ingredients) });
    Object.entries(semaines || {}).forEach(([k, w]) => b.set(R.semaine(k), App.sync.encoder(w)));
    await b.commit();
    App.sync.noterDate();
  },

  /** Appelé après chaque sauvegarde locale : envoie seulement ce qui a changé. */
  local(state) {
    if (!App.sync.pret) return;
    const actuel = App.sync.partage(state);
    const patch = App.sync.diff(App.sync.base, actuel);
    if (!patch) return;
    App.sync.base = actuel;
    App.sync.sauverBase();
    App.sync.ecrire(patch).catch(e => {
      console.error(e);
      App.sync.etat = 'erreur'; App.sync.message = 'Envoi impossible : ' + (e.code || e.message); App.sync.maj();
    });
  },

  async ecrire(patch) {
    const F = App.sync.fb, R = App.sync.refs();
    const b = F.writeBatch(App.sync.db);
    let n = 0;
    const general = {};
    Object.entries(patch).forEach(([k, v]) => {
      if (k === 'semaines') {
        Object.entries(v).forEach(([sk, sv]) => {
          if (sv === App.sync.DEL) b.delete(R.semaine(sk));
          else b.set(R.semaine(sk), App.sync.encoder(sv), { merge: true });
          n++;
        });
      } else if (k === 'repas' || k === 'ingredients') {
        b.set(R[k], { json: JSON.stringify(App.store.state[k]) }); n++;
      } else general[k] = v;
    });
    if (Object.keys(general).length) { b.set(R.general, App.sync.encoder(general), { merge: true }); n++; }
    if (!n) return;
    // Hors ligne : Firestore garde l'envoi et le fera au retour du réseau
    const p = b.commit();
    if (navigator.onLine) await p; else p.catch(() => {});
    App.sync.noterDate();
  },

  /** Écoute en direct les changements faits sur l'autre téléphone. */
  ecouter() {
    const F = App.sync.fb, R = App.sync.refs();
    const recu = () => {
      App.sync.base = App.sync.partage(App.store.state);
      App.sync.sauverBase(); App.sync.noterDate();
      const maintenant = Date.now();
      if (maintenant - (App.sync.dernierToast || 0) > 8000) {
        App.sync.dernierToast = maintenant;
        App.ui.toast('🔄 Mis à jour depuis l’autre téléphone');
      }
    };
    const erreur = e => {
      App.sync.etat = e.code === 'permission-denied' ? 'refuse' : 'erreur';
      App.sync.message = e.code || e.message; App.sync.maj();
    };
    App.sync.desabonner.push(F.onSnapshot(R.general, snap => {
      if (snap.metadata.hasPendingWrites || !snap.exists()) return;
      const d = App.sync.decoder(snap.data());
      const actuel = App.sync.partage(App.store.state);
      if (!Object.keys(d).some(k => App.sync.stable(d[k]) !== App.sync.stable(actuel[k]))) return;
      App.store.appliquerDistant(st => {
        const moi = st.settings.moi;
        Object.keys(d).forEach(k => { st[k] = d[k]; });
        st.settings.moi = moi;
      });
      recu();
    }, erreur));
    ['repas', 'ingredients'].forEach(k => App.sync.desabonner.push(F.onSnapshot(R[k], snap => {
      if (snap.metadata.hasPendingWrites || !snap.exists()) return;
      const liste = JSON.parse(snap.data().json);
      if (App.sync.stable(liste) === App.sync.stable(App.store.state[k])) return;
      App.store.appliquerDistant(st => { st[k] = liste; });
      recu();
    }, erreur)));
    App.sync.desabonner.push(F.onSnapshot(R.semaines, snap => {
      const changes = snap.docChanges().filter(c => !c.doc.metadata.hasPendingWrites);
      let change = false;
      changes.forEach(c => {
        const actuel = App.store.state.semaines[c.doc.id];
        if (c.type === 'removed') { if (actuel) change = true; return; }
        if (App.sync.stable(App.sync.decoder(c.doc.data())) !== App.sync.stable(actuel)) change = true;
      });
      if (!change) return;
      App.store.appliquerDistant(st => {
        changes.forEach(c => {
          if (c.type === 'removed') delete st.semaines[c.doc.id];
          else st.semaines[c.doc.id] = App.sync.decoder(c.doc.data());
        });
      });
      recu();
    }, erreur));
  },

  /** Texte stable d'une valeur (clés triées) : deux objets égaux donnent le même texte. */
  stable(v) {
    if (Array.isArray(v)) return '[' + v.map(App.sync.stable).join(',') + ']';
    if (App.sync.objet(v)) return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + App.sync.stable(v[k])).join(',') + '}';
    return v === undefined ? 'undefined' : JSON.stringify(v);
  },

  // ---------- Différences ----------
  objet(v) { return v && typeof v === 'object' && !Array.isArray(v); },

  /** Ce qui a changé de a vers b (undefined si rien). Les tableaux sont remplacés en entier. */
  diff(a, b) {
    const O = App.sync.objet;
    if (O(a) && O(b)) {
      const p = {};
      Object.keys(b).forEach(k => { const d = App.sync.diff(a[k], b[k]); if (d !== undefined) p[k] = d; });
      Object.keys(a).forEach(k => { if (!(k in b)) p[k] = App.sync.DEL; });
      return Object.keys(p).length ? p : undefined;
    }
    return App.sync.stable(a) === App.sync.stable(b) ? undefined : (b === undefined ? App.sync.DEL : b);
  },

  appliquerPatch(obj, patch) {
    const O = App.sync.objet;
    Object.entries(patch).forEach(([k, v]) => {
      if (v === App.sync.DEL) delete obj[k];
      else if (O(v) && O(obj[k])) App.sync.appliquerPatch(obj[k], v);
      else obj[k] = JSON.parse(JSON.stringify(v));
    });
  },

  // ---------- Format Firestore (pas de tableau dans un tableau, suppressions) ----------
  encoder(v) {
    if (v === App.sync.DEL) return App.sync.fb.deleteField();
    if (Array.isArray(v)) return v.some(Array.isArray) ? { _j: JSON.stringify(v) } : v.map(App.sync.encoder);
    if (App.sync.objet(v)) { const o = {}; Object.entries(v).forEach(([k, x]) => { o[k] = App.sync.encoder(x); }); return o; }
    return v;
  },
  decoder(v) {
    if (Array.isArray(v)) return v.map(App.sync.decoder);
    if (App.sync.objet(v)) {
      const cles = Object.keys(v);
      if (cles.length === 1 && cles[0] === '_j') return JSON.parse(v._j);
      const o = {}; cles.forEach(k => { o[k] = App.sync.decoder(v[k]); }); return o;
    }
    return v;
  },

  sauverBase() { try { localStorage.setItem(App.sync.K_BASE, JSON.stringify(App.sync.base)); } catch (e) { /* */ } },
  noterDate() { try { localStorage.setItem(App.sync.K_DERNIERE, String(Date.now())); } catch (e) { /* */ } },

  // ---------- Affichage ----------
  statut() {
    const S = App.sync;
    if (!navigator.onLine && S.user) return { ic: '☁️', txt: 'Hors ligne : envoi au retour du réseau', cls: 'attente' };
    if (S.etat === 'pret') {
      const d = +localStorage.getItem(S.K_DERNIERE);
      return { ic: '✅', txt: `Synchronisé${d ? ` · ${new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}`, cls: 'ok' };
    }
    if (S.etat === 'connexion') return { ic: '🔄', txt: 'Synchronisation…', cls: 'attente' };
    if (S.etat === 'refuse' || S.etat === 'erreur') return { ic: '⚠️', txt: S.message || 'Problème de synchronisation', cls: 'erreur' };
    return { ic: '🔄', txt: 'Pas encore connecté', cls: '' };
  },

  maj() {
    document.querySelectorAll('[data-sync-statut]').forEach(el => {
      const s = App.sync.statut();
      el.innerHTML = `${s.ic} ${App.u.esc(s.txt)}`;
      el.className = 'sync-statut ' + s.cls;
    });
  },

  /** Feuille « Synchronisation » : se connecter, ou voir l'état. */
  ouvrir() {
    const S = App.sync, { esc } = App.u;
    const enAttente = localStorage.getItem(S.K_EMAIL);
    const contenu = () => S.user ? `
      <h2>🔄 Synchronisation</h2>
      <p class="sync-statut" data-sync-statut></p>
      <div class="card sync-carte">
        <small class="muted">Connecté sur ce téléphone</small>
        <strong>${esc(S.user.email)}</strong>
      </div>
      <p class="muted small">Menus, courses, envies, recettes, garde-manger, budget et suivi sont partagés entre vos deux iPhone, en direct. La couleur et le mode clair/sombre restent propres à chaque téléphone.</p>
      <button class="btn block" data-action="relancer">Synchroniser maintenant</button>
      <button class="btn block" data-action="mdp-moi">🔑 Créer ou changer mon mot de passe</button>
      <small class="muted">Avec un mot de passe, plus besoin d’e-mail pour se reconnecter (nouveau téléphone, app réinstallée…).</small>
      <button class="btn btn-ghost-danger block" data-action="deconnecter">Se déconnecter</button>` : `
      <h2>🔄 Synchroniser nos deux iPhone</h2>
      <p class="muted small">Une seule fois sur chaque téléphone, au choix : un lien reçu par e-mail, ou votre mot de passe (plus besoin d’e-mail ensuite).</p>
      <form data-action="envoyer" class="stack">
        <input name="email" type="email" inputmode="email" autocomplete="email" placeholder="votre.adresse@gmail.com" value="${esc(enAttente || '')}" required/>
        <button class="btn btn-primary" type="submit">Recevoir le lien de connexion</button>
      </form>
      ${enAttente ? `
        <div class="card sync-carte">
          <strong>📬 Lien envoyé à ${esc(enAttente)}</strong>
          <ol class="etapes-aide small">
            <li>Ouvrez l’e-mail « Sign in to nos-repas » (regardez aussi dans les spams).</li>
            <li><strong>Appui long sur le lien</strong>, puis « Copier le lien ».</li>
            <li>Revenez ici et touchez « Coller le lien ».</li>
          </ol>
          <form data-action="coller-lien" class="stack">
            <input name="lien" placeholder="Lien reçu par e-mail" autocomplete="off"/>
            <div class="grid2">
              <button class="btn" type="button" data-action="presse">📋 Coller</button>
              <button class="btn btn-primary" type="submit">Se connecter</button>
            </div>
          </form>
          <small class="muted">Sur l’iPhone, l’app installée sur l’écran d’accueil ne s’ouvre pas toute seule depuis l’e-mail : c’est pour ça qu’on colle le lien.</small>
        </div>` : ''}
      <h3>🔑 Ou avec un mot de passe</h3>
      <form data-action="mdp" class="stack">
        <input name="email" type="email" inputmode="email" autocomplete="username" placeholder="votre.adresse@gmail.com" value="${esc(enAttente || '')}" required/>
        <input name="mdp" type="password" autocomplete="current-password" placeholder="Mot de passe" required/>
        <button class="btn btn-primary" type="submit">Se connecter</button>
      </form>
      <button class="link-btn" data-action="mdp-creer">Créer ou changer mon mot de passe (un e-mail, une seule fois)</button>`;
    const ov = App.ui.sheet(contenu(), async (action, target) => {
      const redessiner = () => { ov.querySelector('.sheet').innerHTML = '<div class="sheet-grip"></div>' + contenu(); S.maj(); };
      if (action === 'envoyer') {
        const email = target.email.value.trim().toLowerCase();
        if (!email) return;
        try { await S.envoyerLien(email); App.ui.toast('📬 Lien envoyé : ouvrez vos e-mails'); redessiner(); }
        catch (e) {
          App.ui.toast(e.code === 'auth/quota-exceeded'
            ? 'Trop de liens envoyés aujourd’hui (limite gratuite) : utilisez le mot de passe ci-dessous, ou réessayez demain'
            : 'Envoi impossible : ' + (e.code || e.message));
        }
      }
      if (action === 'presse') {
        try { const t = await navigator.clipboard.readText(); ov.querySelector('[name=lien]').value = t; }
        catch (e) { App.ui.toast('Appuyez longuement dans le champ puis « Coller »'); }
      }
      if (action === 'coller-lien') {
        const lien = target.lien.value.trim();
        if (!lien) return App.ui.toast('Collez d’abord le lien reçu');
        if (await S.terminerConnexion(lien)) App.ui.closeSheet();
      }
      if (action === 'mdp') {
        if (await S.connexionMotDePasse(target.email.value.trim().toLowerCase(), target.mdp.value)) App.ui.closeSheet();
      }
      if (action === 'mdp-creer') {
        const champ = ov.querySelector('form[data-action=mdp] [name=email]');
        const email = (champ && champ.value.trim().toLowerCase()) || '';
        if (!email) return App.ui.toast('Écrivez d’abord votre adresse e-mail juste au-dessus');
        await S.emailMotDePasse(email);
      }
      if (action === 'mdp-moi') await S.emailMotDePasse(S.user.email);
      if (action === 'relancer') { S.arreter(); await S.demarrer(); redessiner(); }
      if (action === 'deconnecter') { await S.deconnecter(); App.ui.closeSheet(); }
    });
    S.maj();
  },

  /** Si l'adresse n'est pas connue (lien ouvert dans un autre navigateur). */
  demanderEmail(lien) {
    App.ui.sheet(`
      <h2>Confirmer votre adresse</h2>
      <p class="muted small">Pour terminer la connexion, retapez l’adresse e-mail qui a reçu le lien.</p>
      <form data-action="ok" class="stack">
        <input name="email" type="email" inputmode="email" autocomplete="email" required/>
        <button class="btn btn-primary" type="submit">Se connecter</button>
      </form>`, async (action, target) => {
      if (action !== 'ok') return;
      if (await App.sync.terminerConnexion(lien, target.email.value.trim().toLowerCase())) App.ui.closeSheet();
    });
  },

  /** Premier branchement d'un téléphone qui a déjà ses propres données. */
  demanderChoix() {
    return new Promise(resolve => {
      App.ui.sheet(`
        <h2>Quelles données garder ?</h2>
        <p class="muted small">Le foyer a déjà des données en ligne (envoyées par l’autre téléphone), et ce téléphone a aussi les siennes.</p>
        <div class="list-select">
          <button class="option col" data-action="foyer"><strong>☁️ Celles du foyer (conseillé)</strong><small class="muted">Ce téléphone reprend les menus, courses et recettes de l’autre.</small></button>
          <button class="option col" data-action="telephone"><strong>📱 Celles de ce téléphone</strong><small class="muted">Elles remplacent les données en ligne, pour les deux téléphones.</small></button>
        </div>`, action => {
        if (action !== 'foyer' && action !== 'telephone') return;
        App.ui.closeSheet();
        resolve(action);
      });
    });
  }
};
