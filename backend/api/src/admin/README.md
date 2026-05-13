# Admin Module

Système de permissions avancé : assignation des rôles utilisateurs et routes d'administration.

---

## Rôles

| Rôle | Origine |
|------|---------|
| `GUEST` | Inscription email/mot de passe |
| `USER` | Connexion via l'API 42 (OAuth) |
| `ADMIN` | Membres de la team Transcendance |

L'assignation se fait automatiquement à la création du compte dans `lib/auth.ts`, via le hook `databaseHooks.account.create.after` de better-auth. Priorité :

1. Email dans `ADMIN_EMAILS` → `ADMIN` (peu importe le provider, un admin peut se connecter via 42 OAuth)
2. Provider `42school` → `USER`
3. Sinon → `GUEST`

---

## Fichiers

```
src/admin/
├── admin.controller.ts   routes HTTP
├── admin.service.ts      logique métier
└── admin.module.ts       déclaration NestJS
```

Toutes les routes passent par `getSessionAdmin()` dans `src/auth/session.ts`, qui vérifie la session et le rôle `ADMIN`. Retourne 401 si non connecté, 403 si pas admin.

---

## Routes

### Utilisateurs

```
GET    /admin/users         liste tous les utilisateurs
DELETE /admin/users/:id     supprime un utilisateur
```

### Channels

Un channel est toujours lié à un Interest — les créer/supprimer fait les deux.

```
GET    /admin/channels              liste tous les channels
POST   /admin/channels              crée un channel  { name, color }
DELETE /admin/channels/:id          supprime le channel et son interest
```

### Membres

```
POST   /admin/users/:userId/channels/:channelId    ajoute un user au channel
DELETE /admin/users/:userId/channels/:channelId    retire un user du channel
```

---

## Tests

Testés manuellement avec `curl` sur `http://localhost:3000`.

**Guards**
- Sans session → 401
- Connecté en `USER` → 403
- Connecté en `ADMIN` → accès autorisé

**Channels**
- `GET /admin/channels` → 200, liste avec interest et nombre de membres
- `POST /admin/channels` avec `{ name: "TestChannel", color: "#FF0000" }` → 201
- `DELETE /admin/channels/:id` → 200

  > La suppression du channel doit précéder celle de l'interest (contrainte FK en base).

**Membres**
- `POST /admin/users/:id/channels/3` → 201, entrées créées dans `User_Channel` et `User_Interest`
- `DELETE /admin/users/:id/channels/3` → 200, entrées supprimées
