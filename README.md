# ResearchBoard

ResearchBoard is a collaborative research workspace for organizing
documents, research sources, notes, citations, and visual connections.

## Features

- User registration and login
- Workspace creation and membership
- Workspace roles: `OWNER`, `EDITOR`, and `VIEWER`
- Rich-text document editing with TipTap
- Research source management
- Linking sources to documents
- Research notes with quotes, locators, and optional source
  associations
- Canvas foundation using React Flow
- Workspace invitation foundation

## Technology Stack

- Next.js `16.3.5`
- React and TypeScript
- Tailwind CSS
- TipTap
- React Flow
- TanStack Query
- Zustand
- Express `5`
- Prisma `7.10.0`
- PostgreSQL
- Node.js `24.20.0`
- pnpm `12.4.1`

## Project Structure

```text
research-board/
├── apps/
│   ├── api/       # Express API and Prisma database layer
│   └── web/       # Next.js frontend
├── packages/      # Shared packages
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

## Installation

```bash
git clone https://github.com/Moksh91119/research-board.git
cd research-board
pnpm install
```

## Environment Variables

Configure the API environment with values similar to:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
CLIENT_URL="http://localhost:3000"
PORT=4000
NODE_ENV="development"
```

Configure the frontend with the API URL expected by the frontend API
client.

Never commit `.env` files or secrets.

## Database Setup

From `apps/api`:

```bash
pnpm prisma generate
pnpm prisma migrate dev
```

For production:

```bash
pnpm prisma migrate deploy
```

## Development

From the repository root:

```bash
pnpm dev
```

Run individual applications:

```bash
pnpm --filter web dev
pnpm --filter api dev
```

## Validation

```bash
pnpm install --frozen-lockfile
pnpm --filter web build
pnpm --filter web typecheck
pnpm --filter api typecheck
```

## Deployment

The intended deployment architecture is:

Component Platform

---

Frontend Vercel
API Render
PostgreSQL Neon
Repository GitHub

### Vercel

Recommended monorepo settings:

```text
Root Directory: ./
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm --filter web build
```

### Render

Recommended API settings:

```text
Root Directory: apps/api
Build Command: pnpm install --frozen-lockfile && pnpm prisma generate && pnpm build
Start Command: pnpm start
```

Set the production database URL, JWT secret, frontend URL, and port in
Render environment variables.

### Neon

Use the Neon PostgreSQL connection string as `DATABASE_URL`, then run:

```bash
pnpm prisma migrate deploy
```

## Security

- Keep database credentials private.
- Use a strong random `JWT_SECRET`.
- Configure CORS with the exact frontend production URL.
- Use HTTPS in production.
- Validate authorization for every workspace operation.

## Repository

https://github.com/Moksh91119/research-board

## Status

ResearchBoard is under active development. Core workspace, document,
source-linking, and research-note functionality is implemented.
Deployment configuration and additional research workflow features are
being refined.
