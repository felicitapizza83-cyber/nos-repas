/* Écran « Objectif naturopathie » : choisi chaque semaine, modifiable librement. */
App.views.objectif = {
  title: 'Objectif de la semaine',

  render(state) {
    const { esc } = App.u;
    const sem = App.store.semaine();
    const obj = App.suggest.objectif(sem);

    const conseilles = obj
      ? state.repas.filter(r => r.categorie !== 'Douceurs')
          .map(r => ({ r, s: App.suggest.score(r, obj) }))
          .filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 6).map(x => x.r)
      : [];

    const detail = obj ? `
      <section class="card selected-obj">
        <div class="row-between">
          <h2>${obj.emoji} ${esc(obj.nom)}</h2>
          <button class="link-btn" data-action="edit" data-id="${obj.id}">Modifier</button>
        </div>
        <p>${esc(obj.description)}</p>
        ${obj.conseils.length ? `<ul class="conseils">${obj.conseils.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
        <div class="chips">
          ${obj.favoriser.map(t => App.commun.tag(t, 'chip-good')).join('')}
          ${obj.limiter.map(t => App.commun.tag(t, 'chip-bad')).join('')}
        </div>
        <label class="stack">Un mot pour la semaine
          <textarea name="mot" rows="2" placeholder="Ex. je me sens fatiguée, envie de plats chauds…">${esc(sem.motObjectif)}</textarea>
        </label>
        ${conseilles.length ? `<h3>Repas conseillés</h3>
          <div class="chips">${conseilles.map(r =>
            `<button class="chip chip-btn" data-action="repas" data-id="${r.id}">${esc(r.nom)}</button>`).join('')}</div>` : ''}
        <button class="btn btn-primary block" data-action="go-menu">Préparer le menu avec cet objectif →</button>
      </section>` : `
      <section class="card">
        <p><strong>Quel est l’objectif bien-être de la semaine ?</strong></p>
        <p class="muted small">Les repas qui y correspondent seront proposés en priorité dans le menu.</p>
      </section>`;

    return `
      ${App.commun.weekNav(state.semaineActive)}
      ${detail}
      <h3 class="section-title">${obj ? 'Changer d’objectif' : 'Choisir un objectif'}</h3>
      <div class="obj-grid">
        ${state.objectifs.map(o => `
          <button class="obj-card ${obj && obj.id === o.id ? 'on' : ''}" data-action="choisir" data-id="${o.id}">
            <span class="obj-emoji">${o.emoji}</span>
            <strong>${esc(o.nom)}</strong>
            <small>${esc(o.description)}</small>
          </button>`).join('')}
        <button class="obj-card add" data-action="edit">
          <span class="obj-emoji">＋</span><strong>Créer un objectif</strong><small>Le vôtre, avec vos mots</small>
        </button>
      </div>
      ${obj ? '<button class="link-btn center" data-action="aucun">Pas d’objectif cette semaine</button>' : ''}
      <p class="disclaimer">Ces repères bien-être ne remplacent pas l’avis d’un médecin ou d’une sage-femme.</p>`;
  },

  mount(el) {
    el.onclick = e => {
      const a = e.target.closest('[data-action]:not(form)');
      if (!a) return;
      const act = a.dataset.action;
      if (App.commun.handle(act)) return;
      if (act === 'choisir') App.store.update(() => {
        const sem = App.store.semaine(); sem.objectifId = a.dataset.id;
      });
      else if (act === 'aucun') App.store.update(() => { const sem = App.store.semaine(); sem.objectifId = null; sem.objectifPar = null; });
      else if (act === 'edit') App.views.objectif.editer(a.dataset.id);
      else if (act === 'repas') App.views.repas.detail(a.dataset.id);
      else if (act === 'go-menu') App.router.go('menu');
    };
    el.onchange = e => {
      if (e.target.name === 'mot') App.store.update(() => { App.store.semaine().motObjectif = e.target.value; });
    };
  },

  editer(id) {
    const { esc } = App.u;
    const o = id ? App.store.objectif(id) : null;
    const tags = Object.keys(window.APP_DATA.tags);
    const fav = new Set(o ? o.favoriser : []), lim = new Set(o ? o.limiter : []);
    const chips = (set, name) => tags.map(t =>
      `<label class="chip chip-check"><input type="checkbox" name="${name}" value="${t}" ${set.has(t) ? 'checked' : ''}/>${esc(window.APP_DATA.tags[t])}</label>`).join('');

    App.ui.sheet(`
      <h2>${o ? 'Modifier l’objectif' : 'Nouvel objectif'}</h2>
      <form data-action="save" class="stack">
        <div class="row">
          <label style="width:5rem">Emoji<input name="emoji" value="${esc(o ? o.emoji : '🌱')}" maxlength="4"/></label>
          <label class="grow">Nom<input name="nom" required value="${esc(o ? o.nom : '')}"/></label>
        </div>
        <label>Description<input name="description" value="${esc(o ? o.description : '')}"/></label>
        <fieldset><legend>À favoriser</legend><div class="chips">${chips(fav, 'fav')}</div></fieldset>
        <fieldset><legend>À limiter</legend><div class="chips">${chips(lim, 'lim')}</div></fieldset>
        <label>Conseils (un par ligne)<textarea name="conseils" rows="3">${esc(o ? o.conseils.join('\n') : '')}</textarea></label>
        <button class="btn btn-primary" type="submit">Enregistrer</button>
        ${o ? '<button type="button" class="btn btn-ghost-danger" data-action="delete">Supprimer cet objectif</button>' : ''}
      </form>`, (action, target) => {
      if (action === 'delete') {
        App.ui.confirmSheet(`Supprimer « ${o.nom} » ?`, 'Supprimer', () => App.store.update(s => {
          s.objectifs = s.objectifs.filter(x => x.id !== o.id);
          Object.values(s.semaines).forEach(w => { if (w.objectifId === o.id) w.objectifId = null; });
        }));
        return;
      }
      if (action !== 'save') return;
      const f = target;
      const data = {
        emoji: f.emoji.value.trim() || '🌱',
        nom: f.nom.value.trim(),
        description: f.description.value.trim(),
        favoriser: [...f.querySelectorAll('[name=fav]:checked')].map(x => x.value),
        limiter: [...f.querySelectorAll('[name=lim]:checked')].map(x => x.value),
        conseils: f.conseils.value.split('\n').map(x => x.trim()).filter(Boolean)
      };
      App.store.update(s => {
        if (o) Object.assign(s.objectifs.find(x => x.id === o.id), data);
        else {
          const nouveau = { id: App.u.uid(), ...data };
          s.objectifs.push(nouveau);
          const sem = App.store.semaine(); sem.objectifId = nouveau.id;
        }
      });
      App.ui.closeSheet();
    });
  }
};
