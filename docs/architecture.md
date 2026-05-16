# Project Architecture

The project is split into a frontend, an API, a PostgreSQL database, and a Caddy reverse proxy.

In production, the browser should only talk to Caddy. Caddy exposes HTTP/HTTPS, routes frontend pages to the `front` container, and routes every `/api/*` request to the `api` container. The API is the only service that talks directly to PostgreSQL.

## Runtime Topology

```mermaid
flowchart LR
  Browser(["Browser<br/>single public origin"])
  FortyTwo["42 API<br/>OAuth + profile data"]

  subgraph Runtime["Docker Compose runtime"]
    direction LR

    Proxy["Caddy<br/>reverse proxy<br/>ports 80 / 443"]

    subgraph Web["Web tier"]
      direction TB
      Front["front<br/>Next.js<br/>port 8080"]
      Api["api<br/>NestJS<br/>port 3000"]
    end

    subgraph Persistence["Persistence"]
      direction TB
      Db[("db<br/>PostgreSQL<br/>port 5432")]
      DbVolume[("transcendence-db-data")]
    end

    CaddyState[("caddy-data<br/>caddy-config")]
  end

  Browser -->|"HTTPS /"| Proxy
  Browser -->|"frontend runtime<br/>calls /api/*"| Proxy

  Proxy -->|"non-/api routes"| Front
  Proxy -->|"/api/*"| Api
  Front -. "client-side code calls /api/* on same origin" .-> Proxy

  Api -->|"Prisma<br/>DATABASE_URL"| Db
  Api -->|"OAuth flow<br/>/api/auth/*"| FortyTwo

  Db ---|"persists data"| DbVolume
  Proxy ---|"certificates<br/>proxy state"| CaddyState

  classDef client fill:#eef6ff,stroke:#4f7ead,color:#111827,stroke-width:1px
  classDef proxy fill:#ecfdf5,stroke:#3f8f62,color:#111827,stroke-width:2px
  classDef app fill:#fff7ed,stroke:#b56a28,color:#111827,stroke-width:1px
  classDef data fill:#f5f3ff,stroke:#7c65b7,color:#111827,stroke-width:1px
  classDef volume fill:#f8fafc,stroke:#64748b,color:#111827,stroke-width:1px
  classDef external fill:#fef2f2,stroke:#b45454,color:#111827,stroke-width:1px

  class Browser client
  class Proxy proxy
  class Front,Api app
  class Db data
  class DbVolume,CaddyState volume
  class FortyTwo external

  style Runtime fill:#f8fafc,stroke:#94a3b8,color:#0f172a
  style Web fill:#ffffff,stroke:#cbd5e1,color:#334155
  style Persistence fill:#ffffff,stroke:#cbd5e1,color:#334155
```

## Request Flow

```mermaid
sequenceDiagram
  participant B as Browser
  participant P as Caddy proxy
  participant F as Frontend
  participant A as API
  participant D as PostgreSQL
  participant O as 42 API

  B->>P: GET /
  P->>F: reverse_proxy front:8080
  F-->>P: Next.js page/assets
  P-->>B: HTML/CSS/JS

  B->>P: GET /api/...
  P->>A: reverse_proxy api:3000
  A->>D: Prisma query/mutation
  D-->>A: data
  A-->>P: JSON response
  P-->>B: JSON response

  B->>P: GET /api/auth/...
  P->>A: Better Auth route
  A->>O: OAuth/token/profile request
  O-->>A: 42 user data
  A->>D: session/account/profile update
  A-->>B: auth cookie/session response
```

## Services

| Service | Role | Internal port | Public access |
| --- | --- | --- | --- |
| `proxy` | Caddy reverse proxy, HTTPS entrypoint, routes traffic | `80`, `443` | yes |
| `front` | Next.js application served by Bun | `8080` | through `proxy` in production |
| `api` | NestJS API, Better Auth, Prisma access | `3000` | through `proxy` at `/api/*` |
| `db` | PostgreSQL database | `5432` | no in production |
| `adminer` | Database UI for development only | `8080` in container, `8081` on host | dev only |

## Production vs Development

Production uses `docker/compose.yaml`.

- `proxy` exposes ports `80` and `443`.
- `front`, `api`, and `db` are intended to be reached through Docker networking.
- the API entrypoint waits for PostgreSQL, then runs `prisma migrate deploy`.

Development overlays `docker/compose-dev.yaml`.

- `front` is also exposed on host port `8080`.
- `api` is also exposed on host port `3000`.
- `db` is exposed on host port `5433`.
- `adminer` is exposed on host port `8081`.
- source folders are bind-mounted for live development.