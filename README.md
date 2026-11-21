# Cook Easy

Application web installable sur iPhone (PWA) pour alléger la charge mentale des repas :
envies de la semaine → objectif naturopathie → menu → liste de courses → budget.

## Versions

- **V2 (racine)** : accueil « repas du jour », menu ☰ (minuteurs, convertisseur, garde-manger, aide, réglages), 5 onglets, points nutritionnels, budget unique avec « Alléger », courses à glisser et mode magasin.
- **V1 (`v1/`)** : l'ancien design, conservé tel quel. Mêmes données (même stockage), mêmes photos, polices et icônes que la V2.

## Écrans

- iPhone : barre d'onglets flottante en bas, fenêtres qui montent du bas.
- Ordinateur (Mac ou PC) et tablette en paysage : menu latéral, accueil en deux colonnes, menu de la semaine sur 2 ou 3 colonnes, recettes en grande grille, lieux de courses côte à côte, fenêtres centrées.

## Synchronisation des deux iPhone

Firebase (projet `nos-repas-131b1`, compte Google perso, formule gratuite Spark) :
- connexion par lien e-mail, sans mot de passe ;
- base Firestore à Paris ; règles : seules les deux adresses du foyer peuvent lire et écrire ;
- `js/sync.js` envoie seulement les différences à chaque sauvegarde et reçoit en direct celles de l'autre téléphone.
L'app elle-même reste hébergée sur GitHub Pages : les mises à jour se font comme avant.

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
| 🥩 Boucherie halal | Viande et volaille | chaque semaine |
| 🚗 Drive (Leclerc ou Chronodrive) | Frais, poisson, surgelés, crèmerie, essentiels de la maison (eau, papier toilette…) | chaque semaine |
| 🍼 Orchestra | Purées et compotes de bébé | chaque semaine |
| 🌾 La Fourche | Bio sec : riz, pâtes, légumineuses, conserves, farines d'avoine/amande, épices, huile | chaque mois |

Modifiable produit par produit : menu ☰ › Ingrédients & prix.

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
