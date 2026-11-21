/* Aide & support : questions fréquentes, et un carnet d'idées / soucis à partager. */
App.views.aide = {
  title: 'Aide & support',
  KEY: 'nos-repas-retours',

  FAQ: [
    ['📲', 'Installer l’app sur l’iPhone', 'Dans Safari, ouvrez l’app, touchez le bouton Partager puis « Sur l’écran d’accueil ». Elle s’ouvre ensuite en plein écran, comme une vraie app, et marche même sans réseau.'],
    ['💭', 'Comment marchent les envies ?', 'Sur l’accueil, écrivez une envie (« un bon poisson », « réconfortant », « chocolat »…). Un plat qui correspond est placé tout de suite dans le menu ; d’autres idées sont proposées en dessous.'],
    ['✨', 'Compléter le menu', 'Dans Menu, « Compléter » remplit les cases vides selon l’objectif, vos favoris et ce qu’il y a au garde-manger, en variant les plats et en restant dans le budget. Touchez une case pour la changer.'],
    ['🛒', 'La liste de courses', 'Elle se fait toute seule à partir du menu, rangée par lieu (producteur, drive, Orchestra) et par rayon. Glissez une ligne vers la droite ou touchez-la pour la cocher. « J’ai » retire un produit déjà à la maison.'],
    ['🥫', 'Le garde-manger', '« Courses faites ✓ » range les achats dans le garde-manger ; il se vide tout seul à mesure que les repas passent. Les prochaines courses en tiennent compte : moins de gaspillage.'],
    ['⤓', 'Importer une recette', 'Menu ☰ › Importer, ou le bouton + dans Recettes. Copiez la liste d’ingrédients (Cookidoo, Instagram, un site…) et collez-la. Pour une photo : « Texte en direct » de l’iPhone, puis Copier.'],
    ['👶', 'Repas de bébé', 'Ligne 👶 sous chaque jour du menu : midi, goûter, soir. Indiquez son mois de naissance dans Réglages pour adapter les purées à son âge.'],
    ['💶', 'Le budget', 'Un seul total : courses + part de La Fourche + repas dehors. Saisissez le montant de vos tickets dans Budget pour un bilan exact. Si la semaine dépasse, « Alléger » remplace les plats les plus chers.'],
    ['⏱', 'Les minuteurs', 'Menu ☰ › Minuteurs, ou depuis le mode cuisine. Ils continuent quand vous changez d’écran et s’affichent en haut. Gardez l’app ouverte pour entendre la sonnerie.'],
    ['🔄', 'Partager entre nos deux iPhone', 'Bientôt : la synchronisation automatique. En attendant, Réglages › Exporter, puis Importer sur l’autre téléphone.'],
    ['↩︎', 'Revenir à l’ancienne version', 'Menu ☰ › Revenir à la version 1. Les données sont les mêmes dans les deux versions.']
  ],

  lire() { try { return JSON.parse(localStorage.getItem(App.views.aide.KEY)) || []; } catch (e) { return []; } },
  ecrire(l) { try { localStorage.setItem(App.views.aide.KEY, JSON.stringify(l)); } catch (e) { /* */ } },

  render() {
    const { esc } = App.u;
    const retours = App.views.aide.lire();
    return `
      <section class="card aide-tete">
        <div class="vide-cercle"><span>💬</span></div>
        <div class="grow"><h3>Une question ?</h3><p class="muted small">Les réponses aux questions les plus fréquentes, et un carnet pour noter vos idées.</p></div>
      </section>

      <h3 class="section-title">Questions fréquentes</h3>
      <section class="card faq">
        ${App.views.aide.FAQ.map(([ic, q, r]) => `
          <details><summary><span>${ic}</span><strong class="grow">${q}</strong></summary><p>${r}</p></details>`).join('')}
      </section>

      <h3 class="section-title">Nous écrire</h3>
      <section class="card">
        <p class="muted small">Une idée, un souci, un plat qui manque ? Notez-le ici, puis partagez la liste pour qu’on améliore l’app.</p>
        <form data-action="retour" class="stack">
          <textarea name="texte" rows="3" placeholder="Ex. : ajouter le poulet basquaise, la liste drive est trop longue…"></textarea>
          <div class="chips">${['💡 Idée', '🐞 Souci', '🍲 Recette'].map((t, i) =>
            `<label class="chip chip-check"><input type="radio" name="type" value="${t}" ${i === 0 ? 'checked' : ''}/>${t}</label>`).join('')}</div>
          <button class="btn btn-primary" type="submit">Noter</button>
        </form>
        ${retours.length ? `
          <ul class="plain retours">${retours.map(x => `
            <li><span class="grow"><small class="muted">${esc(x.type)} · ${new Date(x.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</small>${esc(x.texte)}</span>
              <button class="icon-btn small" data-action="retour-del" data-id="${x.id}" aria-label="Supprimer">✕</button></li>`).join('')}</ul>
          <button class="btn block" data-action="partager">Partager la liste ↗</button>` : ''}
      </section>
      <p class="disclaimer">${App.drawer.VERSION} · <a href="v1/">Version 1</a></p>`;
  },

  mount(el) {
    el.onsubmit = e => {
      e.preventDefault();
      const f = e.target, texte = f.texte.value.trim();
      if (!texte) return;
      const l = App.views.aide.lire();
      l.unshift({ id: App.u.uid(), texte, type: f.type.value, date: Date.now() });
      App.views.aide.ecrire(l);
      App.ui.toast('C’est noté ✓');
      App.router.render(true);
    };
    el.onclick = async e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      if (a.dataset.action === 'retour-del') {
        App.views.aide.ecrire(App.views.aide.lire().filter(x => x.id !== a.dataset.id));
        App.router.render(true);
      }
      if (a.dataset.action === 'partager') {
        const txt = 'Nos repas — idées et soucis\n\n' + App.views.aide.lire().map(x => `${x.type} : ${x.texte}`).join('\n');
        try {
          if (navigator.share) await navigator.share({ title: 'Nos repas — retours', text: txt });
          else { await navigator.clipboard.writeText(txt); App.ui.toast('Liste copiée'); }
        } catch (err) { /* annulé */ }
      }
    };
  }
};
