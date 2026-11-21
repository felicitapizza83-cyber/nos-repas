/* Éléments partagés entre écrans : sélecteur de semaine, chips, icônes. */
App.commun = {
  weekNav(k) {
    const courante = App.u.isCurrentWeek(k);
    return `
      <div class="weeknav">
        <button class="icon-btn" data-action="week-prev" aria-label="Semaine précédente">‹</button>
        <div class="weeknav-label">
          <strong>${courante ? 'Cette semaine' : 'Semaine'}</strong>
          <span>${App.u.weekLabel(k)}</span>
        </div>
        <button class="icon-btn" data-action="week-next" aria-label="Semaine suivante">›</button>
      </div>
      ${courante ? '' : '<button class="link-btn center" data-action="week-today">Revenir à cette semaine</button>'}`;
  },

  /** Gère les actions communes ; renvoie true si l'action a été traitée. */
  handle(action) {
    const st = App.store.state;
    if (action === 'week-prev') App.store.update(s => { s.semaineActive = App.u.addWeeks(s.semaineActive, -1); });
    else if (action === 'week-next') App.store.update(s => { s.semaineActive = App.u.addWeeks(s.semaineActive, 1); });
    else if (action === 'week-today') App.store.update(s => { s.semaineActive = App.u.mondayOf(); });
    else return false;
    return st;
  },

  tag(t, cls = '') { return `<span class="chip ${cls}">${App.u.esc(window.APP_DATA.tags[t] || t)}</span>`; },

  bar(pct, depasse) {
    return `<div class="bar ${depasse ? 'over' : ''}"><span style="width:${pct.toFixed(1)}%"></span></div>`;
  },

  slotLabel(slotId) {
    const [j, ...reste] = slotId.split('-');
    const m = reste.join('-');
    const jour = App.JOURS.find(x => x.id === j);
    const nom = jour ? jour.nom : j;
    if (m.startsWith('bebe-')) return `${nom} · bébé ${(App.MOMENTS_BEBE.find(x => x.id === m) || { nom: '' }).nom.toLowerCase()}`;
    return `${nom} ${m === 'midi' ? 'midi' : 'soir'}`;
  }
};
