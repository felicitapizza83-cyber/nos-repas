# Nos repas — prototype (étape 1)

Application web installable sur iPhone (PWA) pour alléger la charge mentale des repas :
envies de la semaine → objectif naturopathie → menu → liste de courses → budget.

## Tester sur le Mac

```bash
cd ~/Desktop/Personnel/Projet
python3 -m http.server 8765
```
Puis ouvrir http://localhost:8765 (ou double-cliquer sur `index.html`).

## Tester sur l'iPhone (même Wi-Fi)

1. Lancer la commande ci-dessus sur le Mac.
2. Trouver l'adresse IP du Mac (Réglages › Wi-Fi › Détails).
3. Sur l'iPhone, Safari : `http://<IP-du-Mac>:8765`.
4. Partager › **Sur l'écran d'accueil**.

Le mode hors-ligne complet nécessite un hébergement en https (étape suivante : GitHub Pages).

## Organisation des fichiers

| Dossier | Rôle |
|---|---|
| `data/` | Données de départ : ingrédients (rayon, prix, conditionnement), repas validés, objectifs, menus types |
| `js/store.js` | État + sauvegarde (localStorage). Seul fichier à changer pour la synchro entre les 2 iPhone |
| `js/domain/` | Logique : liste de courses, budget, suggestions selon l'objectif et les envies |
| `js/views/` | Écrans : accueil, objectif, repas, menu, courses, budget + suivi, La Fourche, ingrédients & prix |
| `css/` | Styles (clair / sombre, adaptés à l'iPhone) |

## Lieux d'achat

| Lieu | Quoi | Rythme |
|---|---|---|
| 🧺 Producteur | Fruits & légumes | chaque semaine |
| 🚗 Drive (Leclerc ou Chronodrive) | Frais, viande, poisson, surgelés, crèmerie | chaque semaine |
| 🌾 La Fourche | Bio sec : riz, pâtes, légumineuses, conserves, farines d'avoine/amande, épices, huile | chaque mois |

Modifiable produit par produit : Budget › Ingrédients, prix & lieux d'achat.

## Règles de calcul

- Quantités définies pour 2 adultes, ajustables (« Portions par repas » dans Budget).
- Repas **à l'extérieur** : retirés des courses, leur montant compte dans le budget.
- Case « Restes » dans le menu : aucun achat.
- **Pas cuisiné → reporter** : le repas passe à la semaine suivante ; ses ingrédients restent au garde-manger.
- Produits du **placard** (huile, épices…) : listés à part, comptés seulement si on les marque « à acheter ».
- **Garde-manger** (Courses › Garde-manger) : se remplit avec « Courses faites ✓ » et « Commande passée »
  (La Fourche), se vide tout seul le lendemain de chaque repas maison (gâteaux : en fin de semaine).
  Un repas déjà passé changé en « dehors » remet ses ingrédients. La liste de courses déduit le stock ;
  pour une semaine future, on retire d'abord ce qui sera mangé d'ici là.
- **Anti-gaspi** : chaque produit frais a une durée de conservation indicative ; ceux à finir sont
  signalés sur l'accueil et les repas qui les utilisent sont proposés en premier (en début de semaine).
- **La Fourche** : besoins des menus du mois, étendus au mois complet ; la commande est répartie
  dans le budget de chaque semaine (désactivable).
- Budget semaine = producteur + drive (estimation ou ticket) + part La Fourche + repas dehors, comparé à 150 €.
- Vue Année : coût de l'alimentation mois par mois (courses, La Fourche, repas dehors).
- **Gâteaux** : 2 gâteaux healthy différents par semaine (rotation sur 10, sans reprendre ceux des 3 dernières semaines).
- **Suivi** : une pesée par mois, mensurations en option ; rythme doux si allaitement.

## Prochaines étapes

1. Hébergement https + synchronisation partagée entre les deux iPhone.
2. Panier Chronodrive préparé depuis Chrome sur le Mac, à valider.
