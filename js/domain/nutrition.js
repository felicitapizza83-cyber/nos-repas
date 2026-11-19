/* Calories estimées par portion (valeurs moyennes, type table Ciqual).
   Ordre de grandeur pour s'orienter, pas un comptage précis. */
App.nutrition = {
  HUILE_PAR_PORTION_ML: 10, // « un peu d'huile » = environ 1 c. à soupe par portion

  kcal(id, q) {
    const ing = App.store.ingredient(id);
    if (!ing || ing.kcal == null || q == null) return 0;
    return ['g', 'ml'].includes(ing.unite) ? q * ing.kcal / 100 : q * ing.kcal;
  },

  /** kcal pour une portion (ou une part de gâteau). */
  parPortion(r) {
    const portions = r.portions || 2;
    let total = 0;
    r.ingredients.forEach(([id, q]) => {
      if (q != null) total += App.nutrition.kcal(id, q);
      else if (id === 'huile-olive') total += App.nutrition.kcal(id, App.nutrition.HUILE_PAR_PORTION_ML * portions);
    });
    return total / portions;
  },

  /** Libellé arrondi à la dizaine : « ≈ 520 kcal ». */
  label(r) {
    const k = App.nutrition.parPortion(r);
    return k > 0 ? `≈ ${Math.round(k / 10) * 10} kcal` : '';
  }
};
