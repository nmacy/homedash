# Homedash

A minimalist homelab dashboard — a single-page web app that displays your self-hosted service links grouped into categories, with full in-browser CRUD editing, drag-and-drop reordering, a multi-source icon picker, and a YAML-backed config with an automatic backup system.

Designed to be dropped into a homelab behind a reverse proxy. No database, no authentication, no external services required at runtime.

## Features

### View Mode
- Services grouped into category panels in a responsive grid
- Each service card shows an icon, name, optional description, and is a direct clickable link
- Time-aware greeting header ("Good morning / afternoon / evening / night") with the current date
- Light / Dark / System theme toggle, persisted across sessions

### Edit Mode
- Activated by clicking the gear icon in the bottom-left corner
- Sticky toolbar with Save, Discard, Backup, and Exit controls
- Unsaved changes tracked in memory; Save writes atomically to disk; Discard reverts
- Toast notifications for all success / failure events

### Category & Service Management
- Add, edit, and delete categories and services via modal dialogs
- Drag-and-drop reorder categories and services (dnd-kit with pointer + keyboard support)

### Icon Support (4 sources)

| Tab | Source | Format in YAML |
|-----|--------|----------------|
| Lucide | 1,400+ bundled vector icons | `server`, `play`, `heart-pulse` |
| MDI | Material Design Icons (bundled) | `mdi:home-assistant`, `mdi:docker` |
| Simple Icons | Brand icons from CDN | `si:portainer`, `si:grafana` |
| Dashboard Icons | Community homelab icons from CDN | `dash:jellyfin`, `dash:plex` |

Lucide and MDI are bundled (offline-capable). Simple Icons and Dashboard Icons are fetched lazily with debounced search and session-level caching.

### Backup System
- **Create** — snapshot config with optional label (`2025-01-15T14-32-00_before-upgrade.yaml`)
- **Restore** — overwrite live config from any backup
- **Download / Upload** — export and import `.yaml` files
- **Delete** — remove individual backups
- Auto-pruned to a maximum of 100 backups

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS v4, shadcn/ui |
| Forms | react-hook-form + Zod v4 |
| Icons | lucide-react, @mdi/js, Simple Icons (CDN), Dashboard Icons (CDN) |
| Drag & Drop | @dnd-kit |
| Config | js-yaml (read/write), Zod (validation) |
| Theme | next-themes |
| Container | Docker (multi-stage, node:20-alpine) |

## Quick Start

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The config file is auto-created at `config/config.yaml` on first run.

### Production

```bash
npm run build
npm start
```

### Docker (recommended)

```bash
docker-compose up --build
```

The `config/` directory is bind-mounted so data persists across container rebuilds.

## Docker Details

Three-stage build: deps → builder → runner. Runs as non-root `nextjs` user (UID 1001).

```yaml
# docker-compose.yml
services:
  homedash:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./config:/app/config
    restart: unless-stopped
```

To use a named volume instead:

```yaml
volumes:
  - homedash_config:/app/config

volumes:
  homedash_config:
```

## Configuration

All dashboard state lives in `config/config.yaml`.

### Schema

```
title:       string             (default: "My Homelab", max 200 chars)
theme:       "dark" | "light" | "system"  (default: "system")
categories:  Category[]         (max 50)

Category:
  name:      string             (required, max 100)
  icon:      string?            (optional icon slug)
  services:  Service[]          (max 200)

Service:
  name:        string           (required, max 100)
  url:         string           (required, http/https only, max 2048)
  icon:        string?          (optional icon slug)
  description: string?          (optional, max 500)
```

### Example

```yaml
title: My Homelab
theme: system
categories:
  - name: Infrastructure
    icon: server
    services:
      - name: Proxmox
        url: https://proxmox.local:8006
        icon: mdi:server
      - name: Portainer
        url: https://portainer.local:9000
        icon: si:portainer
  - name: Media
    icon: play
    services:
      - name: Plex
        url: https://plex.local:32400
        icon: si:plex
      - name: Jellyfin
        url: https://jellyfin.local:8096
        icon: dash:jellyfin
```

## API Reference

All mutating endpoints require the `X-Requested-With: XMLHttpRequest` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/config` | Read current config |
| `PUT` | `/api/config` | Validate and write new config |
| `GET` | `/api/backups` | List all backups |
| `POST` | `/api/backups` | Create a backup |
| `PUT` | `/api/backups` | Import a `.yaml` file |
| `GET` | `/api/backups/:name` | Download a backup |
| `POST` | `/api/backups/:name` | Restore a backup |
| `DELETE` | `/api/backups/:name` | Delete a backup |
| `GET` | `/api/icons?q=<query>&set=<si\|dash>` | Search remote icon indexes |

## Project Structure

```
homedash/
├── config/
│   ├── config.yaml              # Live config (auto-created on first run)
│   ├── config.example.yaml      # Example config
│   └── backups/                 # Timestamped YAML snapshots
├── src/
│   ├── app/
│   │   ├── page.tsx             # Entry point — reads config, renders Dashboard
│   │   └── api/                 # Route handlers (config, backups, icons)
│   ├── components/
│   │   ├── DynamicIcon.tsx      # Renders Lucide / MDI / remote icons
│   │   ├── dashboard/           # Dashboard, CategorySection, ServiceCard, EditModeToolbar
│   │   └── editors/             # ServiceDialog, CategoryDialog, IconPicker, BackupDialog
│   ├── hooks/                   # useConfig (state + CRUD), useEditMode
│   ├── lib/
│   │   ├── schema.ts            # Zod schemas (single source of truth)
│   │   ├── config.ts            # YAML I/O, backup CRUD, path-traversal guards
│   │   ├── icons.ts             # Icon resolver (Lucide, MDI, remote)
│   │   └── remote-icons.ts      # CDN index fetch/cache, search, URL resolution
│   └── middleware.ts            # CSRF guard on mutating API calls
├── Dockerfile                   # Multi-stage build (non-root runner)
├── docker-compose.yml
└── next.config.ts               # Standalone output, security headers
```

## Security

- **Atomic writes** — config written to random `.tmp` file then renamed over the original
- **File permissions** — config files created with mode `0o600`
- **CSRF protection** — mutating API routes require `X-Requested-With` header
- **Path traversal guards** — backup paths validated with `path.resolve` containment checks
- **Input validation** — URLs restricted to `http:`/`https:`, icon slugs validated against strict regex, all strings length-capped
- **Security headers** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **No authentication** — designed to run behind a reverse proxy that handles auth

## Deployment Notes

- **No environment variables required.** The app is fully self-contained.
- The `config/` directory is the only stateful location — back it up or mount as a persistent volume.
- For SSL and auth, place a reverse proxy in front (Caddy, Nginx, Traefik, etc.).
- Uses `output: "standalone"` — the Docker image ships only the minimal Node.js server.
- Runs on port `3000` by default; set `PORT` env var to change.
