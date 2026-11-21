/* Suivi mensuel : poids (et mensurations si activées) pour chaque personne. */
App.suivi = {
  MESURES: [
    { id: 'taille', nom: 'Tour de taille' },
    { id: 'hanches', nom: 'Hanches' },
    { id: 'poitrine', nom: 'Poitrine' },
    { id: 'cuisse', nom: 'Cuisse' },
    { id: 'bras', nom: 'Bras' }
  ],

  entrees(state, i) {
    return (state.suivi[i] || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  },

  resume(state, i) {
    const e = App.suivi.entrees(state, i);
    const profil = state.settings.profils[i] || { objectifKg: 0 };
    const premier = e.find(x => x.poids != null);
    const dernier = [...e].reverse().find(x => x.poids != null);
    const perdu = premier && dernier ? premier.poids - dernier.poids : 0;
    const jours = d => (Date.now() - App.u.parseKey(d)) / 864e5;
    const mois = premier && dernier ? Math.max(1, (App.u.parseKey(dernier.date) - App.u.parseKey(premier.date)) / (30.4 * 864e5)) : 1;
    let prochaine = '';
    if (dernier) {
      const d = App.u.parseKey(dernier.date); d.setMonth(d.getMonth() + 1);
      prochaine = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    }
    // Rythme du dernier mois (entre les deux dernières pesées)
    const pesees = e.filter(x => x.poids != null);
    const avantDernier = pesees[pesees.length - 2];
    const dernierEcart = avantDernier && dernier ? avantDernier.poids - dernier.poids : 0;
    return {
      entrees: e, premier, dernier, perdu, objectifKg: profil.objectifKg || 0,
      pct: profil.objectifKg ? Math.max(0, Math.min(100, perdu / profil.objectifKg * 100)) : 0,
      rythme: perdu / mois,
      dernierEcart,
      aFaire: !dernier || jours(dernier.date) >= 28,
      prochaine
    };
  }
};
