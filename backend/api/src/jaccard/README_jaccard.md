# Jaccard Suggestion Algorithm

Suggère des utilisateurs compatibles en comparant leurs centres d'intérêt via le score de Jaccard.

## Endpoint

```
GET /suggestions/:userId?limit=10
```

- `userId` : l'utilisateur pour lequel on calcule les suggestions
- `limit` : nombre de suggestions (défaut: 10, max: 50)

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

## Algorithme

```
score = |intersection| / |union|
```

1. Récupère les intérêts du user courant
2. Exclut ses amis existants (FriendRequest `Accepted`) et lui-même
3. Pré-filtre en DB les candidats ayant au moins 1 intérêt en commun
4. Calcule le score Jaccard pour chaque candidat
5. Retourne les `limit` meilleurs résultats triés par score décroissant

## Évolutions prévues

- **Pondération par `interestLvl`** : donner plus de poids aux intérêts `VeryHigh` partagés
- **Hiérarchie des intérêts** : exploiter `Interest.parentId` pour une comparaison arborescente
