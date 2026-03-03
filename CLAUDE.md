# Homedash

Homelab dashboard — single-page web app displaying service links grouped by categories, with full CRUD editing and YAML-backed config.

## Tech Stack

- Next.js 14+ (App Router) with TypeScript
- Tailwind CSS + shadcn/ui
- js-yaml for config read/write, zod for validation
- Docker + docker-compose for deployment

## Build & Run

```bash
npm install          # install dependencies
npm run dev          # dev server at http://localhost:3000
npm run build        # production build
npm start            # start production server
docker-compose up --build  # run via Docker
```

## Architecture

- **Config file**: `config/config.yaml` — YAML file that stores all dashboard state
- **API**: `GET /api/config` reads YAML, `PUT /api/config` validates with Zod and writes atomically
- **Frontend**: Single page with view/edit modes. Edit mode reveals add/edit/delete controls with explicit Save/Discard
- **No database, no auth** — designed for homelab use behind a reverse proxy

## Key Directories

- `src/lib/` — schema (Zod), config (YAML I/O), icons (Lucide mapping)
- `src/app/api/config/` — API route handlers
- `src/components/dashboard/` — Dashboard, CategorySection, ServiceCard, EditModeToolbar
- `src/components/editors/` — ServiceDialog, CategoryDialog, IconPicker
- `src/hooks/` — useConfig (state + API), useEditMode (toggle)
- `config/` — YAML config file (volume-mounted in Docker)
