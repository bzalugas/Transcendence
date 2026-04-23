# Jaccard Suggestion Algorithm

## Objectif

Suggérer des utilisateurs compatibles sur le réseau social.
Quand un utilisateur ouvre l'onglet "Suggestions", il voit une liste de personnes
avec qui il a le plus de chances de matcher — basée sur leurs centres d'intérêt communs.

Plus le score Jaccard est élevé, plus deux users partagent d'intérêts.

## Flux complet

```
Requête HTTP GET /suggestions/:userId
        ↓
    AppModule        (point d'entrée NestJS)
        ↓
  JaccardModule      (regroupe controller + service)
        ↓
JaccardController    (reçoit et valide la requête)
        ↓
 JaccardService      (calcule les suggestions)
        ↓
    PrismaService    (interroge la DB PostgreSQL)
        ↓
    Réponse JSON     (retournée au frontend)
```

## Endpoint

```
GET /suggestions/:userId?limit=10
```

- `userId` : l'utilisateur pour lequel on calcule les suggestions
- `limit` : nombre de suggestions à retourner (défaut: 10, max: 50)

Exemple de réponse :
```json
[
  {
    "userId": 11,
    "login": "henry",
    "score": 0.69,
    "commonInterests": [
      { "id": 32, "name": "Sport" },
      { "id": 29, "name": "Musique" }
    ]
  }
]
```

Note : `commonInterests` retourne `{ id, name }` pour permettre au frontend d'afficher
directement le nom, tout en gardant l'ID pour aller chercher la couleur/image si besoin.

---

## Structure du projet (fichiers créés/modifiés)

```
src/backend/api/
├── prisma/
│   ├── schema.prisma       (existant, non modifié)
│   └── seed.ts             ← créé — remplit la DB de faux profils
│
└── src/
    ├── prisma/              ← créé
    │   ├── prisma.service.ts
    │   └── prisma.module.ts
    │
    ├── jaccard/             ← créé
    │   ├── jaccard.service.ts
    │   ├── jaccard.controller.ts
    │   ├── jaccard.module.ts
    │   └── README_jaccard.md
    │
    └── app.module.ts        ← modifié — import de PrismaModule + JaccardModule

docker/
└── .env-dev                 ← modifié — ajout POSTGRES_HOST et POSTGRES_PORT

package.json                 ← modifié — ajout de la config "prisma.seed"
```

---

## Fichiers Jaccard

### `jaccard.module.ts`

Déclaration NestJS qui regroupe le controller et le service en un module cohérent.
Permet à `app.module.ts` d'importer l'ensemble d'un coup.

```
@Module({
  controllers: [JaccardController],
  providers: [JaccardService],
})
```

### `jaccard.controller.ts`

Réceptionne les requêtes HTTP et délègue au service.
Ne contient aucune logique métier.

- `@Controller('suggestions')` : toutes les routes commencent par `/suggestions`
- `@Get(':userId')` : écoute `GET /suggestions/:userId`
- `ParseIntPipe` : convertit automatiquement le `userId` de string en number
- `@Query('limit')` : récupère le paramètre optionnel `?limit=N`

### `jaccard.service.ts`

Contient toute la logique métier. Organisé en 3 méthodes :

#### `jaccardScore(a, b)` — calcul pur

Calcule la similarité entre deux listes d'IDs d'intérêts.

```
score = |intersection| / |union|
```

- `intersection` : intérêts présents dans A ET dans B
- `union` : tous les intérêts de A et B confondus (sans doublons)
- Résultat entre 0 (rien en commun) et 1 (intérêts identiques)

Exemple :
```
A = [1, 2, 3]  →  intersection = [2, 3]  →  score = 2/4 = 0.5
B = [2, 3, 4]  →  union        = [1,2,3,4]
```

#### `getAmisIds(userId)` — récupération des amis existants

Retourne les IDs des users déjà amis avec `userId` (FriendRequest acceptée).
Ces users sont exclus des suggestions.

Une amitié peut avoir été initiée dans les deux sens — on vérifie donc `senderId` ET `receiverId`.
On ne retourne que les amitiés avec `status: Accepted` (pas les demandes en attente ou rejetées).

Exemple :
```
userId = 3
FriendRequests : [
  { senderId: 3, receiverId: 7, status: Accepted },
  { senderId: 12, receiverId: 3, status: Accepted },
]
→ retourne [7, 12]  ← IDs exclus des suggestions
```

#### `getSuggestions(userId, limit)` — orchestration

Chef d'orchestre qui appelle les autres fonctions et retourne la réponse finale.

1. Récupère les `interestId[]` du user courant (avec les noms via `include` nested)
2. Construit une `Map<id, name>` pour éviter de requêter deux fois les mêmes intérêts
3. Récupère les IDs des amis à exclure via `getAmisIds()`
4. Trouve via Prisma les users ayant au moins 1 intérêt en commun (pré-filtrage — évite de calculer des scores à 0)
5. Exclut le user courant lui-même et ses amis (`notIn: [...amisIds, userId]`)
6. Calcule le score Jaccard pour chaque candidat
7. Retourne `commonInterests` sous forme `{ id, name }[]`
8. Trie par score décroissant
9. Retourne les `limit` premiers résultats (défaut: 10, max: 50 via `Math.min`)

---

## Fichiers Prisma

### `src/prisma/prisma.service.ts`

Wrapper NestJS autour de `PrismaClient`. Se connecte à la DB au démarrage du module.

```
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() { await this.$connect(); }
}
```

### `src/prisma/prisma.module.ts`

Module `@Global()` qui rend `PrismaService` disponible dans tous les modules de l'app
sans avoir à l'importer partout. Pratique pour un service central partagé.

### `prisma/seed.ts`

Script de remplissage automatique de la DB avec de faux profils pour les tests :

- Nettoie les tables (ordre respecté pour les foreign keys)
- Crée 15 intérêts (Sport, Musique, Cuisine, Cinéma, etc.)
- Crée 10 users avec chacun 10 à 13 intérêts choisis aléatoirement
- Crée 2 amitiés pour tester l'exclusion

Lancement :
```
docker exec transcendence_api npx prisma db seed
```

---

## Concepts NestJS utilisés

**Module** : boîte organisationnelle qui regroupe un controller et un service liés.

**Controller** : réceptionne les requêtes HTTP et délègue au service. Ne contient pas de logique.

**Service** : contient la logique métier. Marqué `@Injectable()` pour que NestJS puisse l'injecter automatiquement.

**Injection de dépendances** : NestJS crée et fournit automatiquement les services là où ils sont nécessaires. On ne fait jamais `new JaccardService()` manuellement.

**PrismaService** : wrapper NestJS autour de Prisma Client. Permet d'interroger la base de données PostgreSQL depuis n'importe quel service.

**`@Global()`** : rend un module disponible dans toute l'app sans avoir à l'importer explicitement dans chaque module qui l'utilise.

---

## Procédure de test complète

```bash
# 1. Lancer l'infra Docker
make dev

# 2. Synchroniser le schéma avec la DB (si première installation)
docker exec transcendence_api npx prisma db push --accept-data-loss

# 3. Remplir la DB avec de faux profils
docker exec transcendence_api npx prisma db seed

# 4. Tester l'endpoint (remplacer 9 par l'id affiché pour alice)
curl http://localhost:3000/suggestions/9
curl http://localhost:3000/suggestions/9?limit=3
curl http://localhost:3000/suggestions/9?limit=100  # clampé à 50
```

Commande Truncate agit directement dans la DB qui tourne dans le container transcendance db. 
docker exec transcendence_db psql -U postgres -d transcendence_db -c 'TRUNCATE TABLE "User_Interest", "FriendRequest", "User", "Interest" RESTART IDENTITY CASCADE;'

## Résultats de test validés

Avec 10 users et 15 intérêts, pour alice (ayant bob et carol comme amis) :
- Les 7 autres users sont retournés, triés par score décroissant
- bob et carol sont bien exclus (amis)
- Le paramètre `limit` limite correctement le nombre de résultats
- La limite haute à 50 évite les abus (`?limit=100` → 50 max)

---

## Évolutions prévues

- **Pondération par `interestLvl`** : dans le schéma, chaque `User_Interest` a un niveau
  (`Moderate`, `High`, `VeryHigh`). Actuellement ignoré — on pourra pondérer le calcul
  Jaccard pour donner plus de poids aux intérêts forts partagés.
- **Hiérarchie des intérêts** : `Interest.parentId` permet une structure arborescente
  (ex: "Rock" enfant de "Musique"). Actuellement la comparaison est à plat.
