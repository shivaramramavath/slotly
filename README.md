# Slotly

Academic Timetable Platform for Schools and Colleges.

Slotly generates, validates, edits, versions, and publishes conflict-free academic timetables with constraint-solving engines, graph blueprints, and collaborative editing.

---

## Getting Started

### Prerequisites

- Node.js >= 20.x
- pnpm >= 9.x / 10.x / 12.x
- Docker & Docker Compose (for MongoDB replica set and Redis)

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start database & cache infrastructure
docker compose up -d

# 3. Build shared contracts
pnpm --filter @slotly/contracts build

# 4. Start backend and frontend in development mode
pnpm dev:apps
```

Client: `http://localhost:3000`  
Server: `http://localhost:4000`

---

## Social Login Configuration (Google & GitHub)

Slotly supports OAuth2 social login with Google (Authorization Code + PKCE + nonce) and GitHub.

### 1. View Callback URLs

Run the helper command to inspect the exact callback URLs to register:

```bash
pnpm oauth:urls
```

- **Google Cloud Console** (Authorized redirect URIs):  
  `http://localhost:4000/auth/oauth/google/callback`
- **GitHub Developer Settings** (Authorization callback URL):  
  `http://localhost:4000/auth/oauth/github/callback`

### 2. Configure Environment Variables

Set the following variables in `server/.env`:

```env
# OAuth base URL (public URL of the API)
OAUTH_CALLBACK_BASE_URL=http://localhost:4000

# Google OAuth (leave empty to disable)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (leave empty to disable)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

> **Note:** A provider is enabled only when both its client ID and client secret are set. If only one is set, server startup will fail with a clear configuration error.

---

## Available Commands

- `pnpm build`: Build contracts, server, and client.
- `pnpm lint`: Run ESLint across all workspaces.
- `pnpm typecheck`: Run TypeScript typechecks across all workspaces.
- `pnpm test`: Run test suites across server and contracts.
- `pnpm oauth:urls`: Print OAuth redirect callback URLs.
- `pnpm codemap`: Update the codebase architecture and symbol index.
