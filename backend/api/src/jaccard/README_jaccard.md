# Jaccard Suggestion Algorithm

Suggère des utilisateurs compatibles en comparant leurs centres d'intérêt via le score de Jaccard.

## Endpoint

```
GET /suggestions/me?limit=12
```

- session better-auth : l'utilisateur courant pour lequel on calcule les suggestions
- `limit` : nombre de suggestions (défaut: 12, max: 12)

```json
[
  {
    "name": "henry",
    "initials": "he",
    "avatarUrl": "https://example.com/avatar.png",
    "level": 8.42,
    "online": false,
    "score": 0.69,
    "sharedTags": ["Sport", "Musique"],
    "otherTags": ["Gaming"]
  }
]
```

## Algorithme

```
score = |intersection| / |union|
```

1. Récupère les intérêts du user courant
2. Exclut ses amis existants (FriendRequest `Accepted`), ses demandes en attente (`Pending`) et lui-même
3. Pré-filtre en DB les candidats ayant au moins 1 intérêt en commun
4. Calcule le score Jaccard pour chaque candidat
5. Retourne les `limit` meilleurs résultats triés par score décroissant

## Évolutions prévues

- **Pondération par `interestLvl`** : donner plus de poids aux intérêts `VeryHigh` partagés
- **Hiérarchie des intérêts** : exploiter `Interest.parentId` pour une comparaison arborescente
