# Admin Module

Advanced permissions module for user roles, moderation actions, and
administrator-only routes.

---

## Roles

| Role | Source |
| --- | --- |
| `GUEST` | Email/password registration |
| `USER` | 42 OAuth login |
| `ADMIN` | Members of the Transcendence team |

Role assignment is handled automatically when an account is created in
`lib/auth.ts`, through the Better Auth `databaseHooks.account.create.after`
hook. Priority order:

1. Email listed in `ADMIN_EMAILS` -> `ADMIN`, regardless of the provider.
2. Provider `42school` -> `USER`.
3. Otherwise -> `GUEST`.

---

## Files

```text
src/admin/
├── admin.controller.ts   HTTP routes
├── admin.service.ts      business logic
└── admin.module.ts       NestJS module declaration
```

All routes go through `getSessionAdmin()` in `src/auth/session.ts`, which
checks both the active session and the `ADMIN` role. It returns `401` when the
user is not authenticated and `403` when the user is not an administrator.

---

## Routes

### Users

```text
GET    /admin/users                 list all users
GET    /admin/users/:id/posts       list a user's posts and project messages
POST   /admin/users/:id/ban         ban a user
POST   /admin/users/:id/unban       unban a user
DELETE /admin/users/:id             delete a user and related data
```

### Content Moderation

```text
DELETE /admin/posts/:id             delete a channel post
DELETE /admin/project-messages/:id  delete a project message
```

### Projects

```text
GET    /admin/projects              list all projects
POST   /admin/projects              create a project { name, description, color }
DELETE /admin/projects/:id          delete a project
```

### Channels

A channel is always linked to an interest. Creating or deleting a channel also
creates or deletes the related interest.

```text
GET    /admin/channels              list all channels
POST   /admin/channels              create a channel { name, color, description? }
DELETE /admin/channels/:id          delete the channel and its interest
GET    /admin/channels/:id/members  list channel members
```

### Channel Members

```text
POST   /admin/users/:userId/channels/:channelId    add a user to a channel
DELETE /admin/users/:userId/channels/:channelId    remove a user from a channel
```

### Interest Requests

```text
GET    /admin/interest-requests              list pending interest requests
POST   /admin/interest-requests/:id/approve  approve a request and create a channel
POST   /admin/interest-requests/:id/reject   reject a request
```

---

## Manual Checks

The routes were manually tested with `curl` through `https://localhost/api`.

**Guards**

- No session -> `401`.
- Connected as `USER` -> `403`.
- Connected as `ADMIN` -> access granted.

**Channels**

- `GET /admin/channels` -> `200`, with interest data and member counts.
- `POST /admin/channels` with `{ "name": "TestChannel", "color": "#FF0000" }`
  -> `201`.
- `DELETE /admin/channels/:id` -> `200`.

The channel must be deleted before its interest because of the database foreign
key constraint.

**Channel Members**

- `POST /admin/users/:id/channels/3` -> `201`, creates entries in
  `User_Channel` and `User_Interest`.
- `DELETE /admin/users/:id/channels/3` -> `200`, removes those entries.
