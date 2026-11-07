PROJECT: Slotly, an academic timetable platform for schools and colleges.
This is a GREENFIELD build in an empty folder. There is no old code to migrate.

REPOSITORY LAYOUT (pnpm workspace)
slotly/
  client/              Next.js (App Router, TypeScript, Tailwind v4)
  server/              NestJS (TypeScript)
  packages/contracts/  shared zod schemas, DTO types, socket event names, reason codes
  docs/                FEATURES.md, ROUTES.md, BLUEPRINT_RULES.md, ARCHITECTURE.md, PROGRESS.md
  docker-compose.yml   MongoDB + Redis for local development
Read docs/FEATURES.md, docs/ROUTES.md and docs/BLUEPRINT_RULES.md before any
work. Use the route, socket-event, queue, job and Redis-key names exactly as
written in docs/ROUTES.md. Never invent alternate names.

PRODUCT
Slotly generates, validates, edits, versions and publishes academic timetables.
- Roles: SUPER_ADMIN (reserved), ADMIN (institution admin), DESIGNER, FACULTY,
  STUDENT, plus public read-only share links. RBAC plus resource-level checks
  (institution, department, ownership).
- Blueprint graph (VERTICAL by default): Institution -> Department -> Program ->
  AcademicYear -> Semester -> Section -> Batch, with Subject assignments under
  Section and Faculty/Room as resource nodes. All creation follows the
  completion-gating rules in docs/BLUEPRINT_RULES.md (a child can be created only
  after its parent is complete). Server enforces; client mirrors for UX.
- One project = one academic term's timetable. Lifecycle (State pattern): draft ->
  building -> ready -> pending_approval -> published -> archived. Designers build
  and edit; Admin approves publishing. Published versions are immutable; editing
  one creates a new draft revision.
- A CONSTRAINT SOLVER guarantees conflict-free schedules. The LLM interprets
  requirements, recommends preferences, proposes structured operations and
  explains results; it is never responsible for correctness.
- Important actions go to an audit log through a queue.

STACK
client: Next.js App Router, React 19, TypeScript, Tailwind v4, shadcn/ui,
  @xyflow/react + dagre, zustand, @tanstack/react-query, socket.io-client,
  react-hook-form + zod, @dnd-kit/core
server: NestJS, Mongoose (MongoDB), Redis (ioredis), BullMQ (@nestjs/bullmq),
  Socket.IO gateways, zod/class-validator, helmet, rate limiting,
  LangChain/LangGraph with Groq, argon2
Auth: access token in memory (Bearer, short-lived, carries userId + sessionId) +
  refresh token in an httpOnly cookie with rotation, token families and reuse
  detection; every request also checks the Redis session; Google OAuth; email
  OTP; TOTP MFA.

DESIGN RULES
- Strict black and white UI. Tokens as CSS variables, never hardcoded:
  background #000 / #0A0A0A, surface #111, border #232323, text #FAFAFA,
  muted text #8A8A8A.
- Accents are rare (under 5% of any screen): yellow #FACC15 = primary action and
  active/selected; green #22C55E = success/complete/valid; red #EF4444 =
  error/conflict/destructive; blue #3B82F6 only for links/info. Blocked/grey =
  muted text color.
- Monospace for labels and numbers, clean sans-serif for body text. Thin 1px
  borders, no heavy shadows, no gradients (except a faint grid on the landing page).
- Graph layout defaults to VERTICAL (dagre rankdir "TB", handles top/bottom) and
  can be switched to LR, BT, RL by the user.

SOLID (mandatory)
- S: one reason to change per class. Controllers/gateways do I/O only, services
  hold business logic, repositories do DB access, processors do job logic. No
  business logic in controllers, gateways or React components.
- O: extend by adding classes (constraint, node type, completion rule, gate,
  exporter, metric), never by growing if/else or switch blocks.
- L: implementations are swappable (InMemoryCache vs RedisCache, GroqProvider vs
  another LLM).
- I: small focused interfaces.
- D: depend on abstractions. In NestJS inject interfaces through tokens and bind
  implementations in modules. Services never import Mongoose models or Redis
  clients directly.

DESIGN PATTERNS (use and name them in file/class names)
Repository; Decorator (Cached<Entity>Repository, cache-aside); Command + Queue
(write-behind); Strategy (constraints, completion rules, exporters, parsers,
recommenders, metrics, chunking); Factory + Registry (node types, jobs,
exporters); Builder (graph from institution); Chain of Responsibility (creation
gates, graph validation, move validation); State (project and publish
lifecycle); Observer/event bus (domain events); Adapter (LLM, embeddings, email,
OAuth, breached-password check, file parsers); Facade (BuildFacade,
ExportFacade); Command (undo/redo, AI operations with apply/revert, client and
server). Client: container/presentational split, logic in custom hooks, API calls
only in a services layer, one zustand store per feature, no fetch in components.

REDIS CACHING
- Cache-aside for reads: blueprint graph and computed completion status,
  institution tree, library lists, project settings, schedule versions, viewer
  timetables, analytics, user profile. Keys: slotly:{entity}:{id}[:part].
- Every entry has a TTL and tag-based invalidation on write.
- CacheService: get, set, del, remember(key, ttl, loader), invalidateTag(tag),
  with single-flight protection against stampedes.
- Redis is disposable: if it is down, fall back to MongoDB and log a warning.

QUEUES: BACKGROUND DB UPDATES
- CRITICAL (synchronous MongoDB write, then respond): auth, creating a project,
  roles/permissions, enqueueing a build, accepting AI changes, saving a Studio
  slot move (validated first), publish/approve, structural graph changes
  (add/delete node or edge) that pass the gate chain.
- NON-CRITICAL (Redis first, DB write queued): node position drags, node config
  autosave, chat history, audit/activity log, last-opened time, notifications,
  analytics counters, emails, search indexing.
- Write-behind: Redis first so reads see the change immediately, then a BullMQ
  job persists to MongoDB. Coalesce rapid edits with jobId = `${entity}:${id}`
  carrying the latest payload. Jobs are idempotent with retries, exponential
  backoff and a dead-letter queue.
- Consistency barrier: before a Build job runs it must flush or await pending
  write-behind jobs for that project.
- Graceful shutdown drains in-flight jobs. One queue per concern, each with its
  own concurrency.

ENGINEERING RULES
- Server: one NestJS module per feature (controller, service, repository, schema,
  dto). Shared code in common/. Env validated with @nestjs/config.
- Client: src/features/<name>/{components,hooks,services,store,types}. Files in
  src/app are thin and import from features.
- Shared types, zod schemas, socket event names and reason codes live in
  packages/contracts and are imported by both apps.
- Validate input on both sides. No `any`. No secrets in code. Small files.
- RBAC is data-driven (permission registry), never scattered if statements.
- Optimistic concurrency: blueprint and schedule writes carry a revision; a stale
  revision returns 409 with the current state.
- Unit tests for all pure logic (gates, completion rules, validators, engine,
  factories, cache, state machines).

CODE MAP RULES
- Before writing ANY new class, service, hook, component, repository or utility,
  search docs/CODEMAP.md and docs/codemap/*.md for existing solutions.
- Reuse first. Do NOT duplicate functionality that already exists.
- Every source file MUST have a line 1 purpose comment.
- Every exported symbol MUST have a one-line JSDoc.
- Internal / unexported helpers MUST NOT have export keywords.
- Run `pnpm codemap` before committing to keep the map in sync.

DEFINITION OF DONE (every phase)
1. `build`, `lint` and `typecheck` pass in client, server and contracts.
2. New pure logic has tests.
3. Append to docs/PROGRESS.md: what was built, decisions made, what was skipped.
4. Final report: files created or changed, how to run it, manual test checklist.

Do only the current phase. If something is ambiguous choose the simplest option
and record it in docs/PROGRESS.md under "Decisions". Do not start the next phase.

GIT WORKFLOW (every phase)

START
1. Run `git status`. The working tree must be clean. If not, stop and tell me.
2. Make sure you are on main and up to date (`git pull --ff-only` if a remote
   named origin exists).
3. Create a branch: phase/<NN>-<slug> (for example phase/10-board-studio).

DURING
4. Commit in small logical commits (Conventional Commits):
   feat(server): ..., feat(client): ..., feat(contracts): ..., test(server): ...,
   fix: ..., refactor: ..., docs: ..., chore: ...
   A typical phase has separate commits for contracts, server, client, tests, docs.
   Before step 5 run `pnpm codemap` and commit the result.

BEFORE THE FINAL COMMIT
5. At the repo root run `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.
   All must pass. Never skip hooks, never disable or delete tests to pass.
6. Safety check: never commit .env files, secrets, tokens, node_modules, build
   output, uploads or logs. Check .gitignore. Review `git diff --cached --stat`
   and scan staged files for secret patterns; abort and tell me if anything looks
   like a secret.
7. Append the phase entry to docs/PROGRESS.md (what was built, decisions, what was
   skipped, manual test checklist) and include it in the last commit.

FINISH
8. Push: `git push -u origin <branch>`. If rejected, `git pull --rebase origin
   <branch>` and push again. NEVER force-push. If there is no remote, stop and
   tell me.
9. Tag: `git tag -a phase-<NN>-done -m "Phase <NN>: <title>"` and `git push origin
   phase-<NN>-done`.
10. If the GitHub CLI is available, open a pull request into main titled
    "Phase <NN>: <title>" with the PROGRESS entry and the manual test checklist
    as the body. Do NOT merge it.
11. Report: branch name, list of commits, tag, PR link, test results.