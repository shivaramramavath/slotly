PROJECT: Slotly, an academic timetable platform for schools and colleges.
This is an existing codebase. See docs/ARCHITECTURE.md Section 1 for the current
status of every phase and docs/PROGRESS.md for history. Build on what exists; do not
recreate it. Never assume a phase is finished because its prompt exists: check
docs/PROGRESS.md and the code.

REPOSITORY LAYOUT (pnpm workspace)
slotly/
  client/              Next.js (App Router, TypeScript, Tailwind v4)
  server/              NestJS (TypeScript)
  packages/contracts/  shared zod schemas, DTO types, socket event names, reason codes
  packages/engine/     @slotly/engine: pure constraint engine shared by server and client
  scripts/             codemap generator, env-migrate, audit and verification scripts
  docs/                FEATURES.md, ROUTES.md, BLUEPRINT_RULES.md, ARCHITECTURE.md,
                       CLIENT_UX.md, CLIENT_ROUTES.md, CODEMAP.md (+ codemap/),
                       AUDIT_REPORT.md, AUTH_VERIFICATION.md, PROGRESS.md
  docker-compose.yml   Redis for local development (MongoDB is hosted on Atlas)
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
  detection; every request also checks the Redis session; email OTP; TOTP MFA;
  social login (Google, GitHub); step-up by password, TOTP or email OTP.

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
- Graph layout is strictly VERTICAL (dagre rankdir "TB", handles top/bottom).
  The layout menu provides 3 algorithms: hierarchical, compact, and department-based.

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

CLIENT PERFORMANCE AND UX RULES (mandatory)

LOADING
- Every route segment and every parallel-route slot has loading.tsx, error.tsx
  and (for slots) default.tsx. Skeletons match the final layout exactly (no
  layout shift), come from components/ui/skeletons, use theme tokens, and respect
  prefers-reduced-motion. Show skeletons after ~150 ms, keep them >= ~300 ms.
- Suspense boundaries are as granular as the data; each has an error boundary
  with retry.
- Use placeholderData: keepPreviousData for filters and pagination.

PARALLEL AND INTERCEPTING ROUTES
- Follow docs/CLIENT_ROUTES.md. Use slots for persistent panels that must not
  remount (Blueprint sidebar tabs, Board section picker) and for independently
  streaming dashboard cards.
- Use intercepting routes for create/edit dialogs and drawers, with a full-page
  fallback for hard navigation. Every slot has default.tsx.

RENDERING
- Server components for shells, layouts and static content. Client islands only
  where interaction needs them. next/dynamic (ssr:false with a skeleton) for React
  Flow, dnd-kit, charts and heavy dialogs.
- React Compiler enabled. Manual memo only where React Flow needs stable props.
- Selectors everywhere (zustand useShallow, React Flow useStore, per-cell
  subscriptions in the timetable grid). Split stores by concern (data, selection,
  viewport, UI). Server data lives in TanStack Query, not in stores.
- Batch socket updates per animation frame. useTransition for tab/filter changes,
  useDeferredValue for search. Prefetch on link intent. Avoid barrel imports and
  keep per-route bundles within budget.
- Budgets: LCP < 2.5 s, INP < 200 ms, CLS < 0.05; report Web Vitals.

OPTIMISTIC UPDATES
- Follow the policy table in docs/CLIENT_UX.md. Optimistic: reversible, low-risk
  actions. Pessimistic: publish/approve, roles, project delete, MFA/password/email
  changes, import confirmation.
- Client-generated IDs (validated server-side). Every graph/schedule operation
  carries an opId; ignore own socket echoes by opId. Serialize mutations per
  resource. Rollback with a toast showing the server reason plus Retry/Undo;
  gate rejections show the reasonCode message and a "Go fix" link.
- Implement through a shared createOptimisticMutation helper (Factory) so every
  feature uses the same onMutate/onError/onSettled behaviour, and Command
  objects for graph and schedule operations.

SECRETS AND CONFIGURATION (mandatory)
- Never read, print, log, paste or commit real .env files, tokens, cookies, API
  keys or connection strings. Work from .env.example. If you need a real value,
  ask me.
- Environment validation reports variable NAMES only, never values.
- Server configuration is read only in src/config through namespaced registerAs
  configs and injected with typed ConfigType (docs/ARCHITECTURE.md Section 9). No
  process.env anywhere else; the ESLint no-process-env rule is enforced and the only
  allowed places are src/config/**, src/main.ts, the index migration script and
  tests. If a decorator argument needs a config value at load time (for example a
  gateway CORS origin), export a small helper from src/config and call it; do not
  read process.env in feature code and do not add eslint-disable.
- Legacy variable names fail startup with a "renamed" message. Use `pnpm env:migrate
  <file>` (it writes <file>.migrated and prints key names only) when variables change.
- Development-only shortcuts (for example a master OTP or automatic context
  resolution) must be off by default, enabled only by an explicit environment flag
  AND only when NODE_ENV is not production, covered by a test proving production
  ignores them, and documented in the README.

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
- The constraint engine lives in packages/engine (@slotly/engine) and is imported by
  both apps. Never copy constraint logic into the server or client.
- Scripts and tooling must run on Windows and Unix (no bash-only commands in
  package.json scripts). Keep the server test script's worker limit.
- When code and docs/ROUTES.md disagree on a route, event, queue or key name, STOP
  and ask which one wins. Never silently pick one. Record the decision in
  docs/PROGRESS.md and fix the loser.
- Dev-only shortcuts (for example the master OTP) must be impossible to enable in
  production (see SECRETS AND CONFIGURATION).

CODE MAP RULES
- docs/CODEMAP.md is the entry point. Before writing ANY new class, service, hook,
  component, repository or utility, search docs/CODEMAP.md and docs/codemap/*.md for
  existing solutions.
- Reuse first. Do NOT duplicate functionality that already exists. If you must create
  something new, say why in the commit message.
- The map can be stale: after finding an entry, open the file and confirm before
  changing it.
- Every source file MUST have a line 1 purpose comment.
- Every exported symbol MUST have a one-line JSDoc.
- Internal / unexported helpers MUST NOT have export keywords. Mark private-but-
  exported items with @internal.
- Run `pnpm codemap` before committing to keep the map in sync. `pnpm codemap:check`
  must pass.
- Never edit the generated parts of the map by hand. Curated sections live between
  <!-- MANUAL:START --> and <!-- MANUAL:END --> markers.
- When you add an extension point (registry, strategy family, gate, exporter,
  metric), add it to the "Extension points" section of docs/CODEMAP.md.

DEFINITION OF DONE (every phase)
1. `build`, `lint` and `typecheck` pass in client, server and contracts.
2. New pure logic has tests.
3. Append to docs/PROGRESS.md: what was built, decisions made, what was skipped.
4. Final report: files created or changed, how to run it, manual test checklist.
5. The branch has been merged into main (see GIT WORKFLOW) with all checks green
   on the merged result.
6. docs are current: docs/ROUTES.md (routes, events, queues, keys), docs/ARCHITECTURE.md
   (status and any changed names), docs/BLUEPRINT_RULES.md (if gates or reason codes
   changed), docs/AUTH_VERIFICATION.md (if auth changed), docs/CODEMAP.md (generated).

Do only the current phase. If something is ambiguous choose the simplest option
and record it in docs/PROGRESS.md under "Decisions". Do not start the next phase.

GIT WORKFLOW (every phase and every task)

BRANCH NAMES
- Phases: phase/<NN>-<slug> (for example phase/10-board-studio).
- Other work: <type>/<slug> with type one of feat, fix, refactor, docs, ux, audit,
  chore (for example refactor/config-namespaces, feat/social-login).
- One branch per phase or task. Never work directly on main. Never reuse a branch
  name that already exists on the remote.

START
1. Run `git status`. The working tree must be clean. If not, stop and tell me.
2. `git fetch --all --prune`, switch to main and update it (`git pull --ff-only`).
   If main cannot fast-forward, stop and tell me.
3. Create the phase or task branch from the updated main.

DURING
4. Commit in small logical commits (Conventional Commits):
   feat(server): ..., feat(client): ..., feat(contracts): ..., test(server): ...,
   fix: ..., refactor: ..., docs: ..., chore: ...
   A typical phase has separate commits for contracts, server, client, tests, docs.
   Run `pnpm codemap` and commit the result before the checks below.
5. After a pass (when a phase has two passes) or at any natural stopping point:
   push the branch (`git push -u origin <branch>`) so work is never only local.
   A finished pass 1 is pushed and reported but NOT merged.

BEFORE THE FINAL COMMIT
6. At the repo root run `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`,
   `pnpm codemap:check`. All must pass. Never skip hooks, never disable or delete
   tests to pass.
7. Safety check: never commit .env files, secrets, tokens, node_modules, build
   output, uploads or logs. Check .gitignore. Review `git diff --cached --stat`
   and scan staged files for secret patterns; abort and tell me if anything looks
   like a secret.
8. Append the phase entry to docs/PROGRESS.md (what was built, decisions, what was
   skipped, manual test checklist, "Merged via <branch>, tag <name>-merged") and
   include it in the last commit.

MERGE GATE (all must be true before merging; otherwise stop and report)
- The phase is COMPLETE: every pass is finished and every DONE WHEN item is
  verified by an automated test or script, with the evidence listed.
- All checks in step 6 pass on the branch.
- No unresolved decision, failing or skipped test, or TODO that blocks the phase.
- The branch is pushed and the tag `<name>-done` exists on its tip.

FINISH: PUSH, MERGE, VERIFY
9. Push the branch and the tag: `git push -u origin <branch>`,
   `git tag -a <name>-done -m "<title>"`, `git push origin <name>-done`.
   (<name> is phase-<NN> for phases, otherwise the branch slug.)
10. Create a safety tag on main before merging: `backup/main-before-<name>`, push it.
11. Bring the branch up to date with main WITHOUT rewriting history: `git fetch`,
    then if main moved, merge main INTO the branch (`git merge origin/main`), resolve
    conflicts (keep both sides' intent; regenerate generated files with `pnpm codemap`
    and the lockfile with `pnpm install`; stop and ask me if a production-logic
    conflict is not obvious), re-run step 6, push the branch. Never rebase or
    force-push a pushed branch.
12. Merge into main with a merge commit so the phase stays visible and revertable:
    `git checkout main`, `git pull --ff-only`,
    `git merge --no-ff <branch> -m "Merge <branch>: <title>"`.
13. Verify the merged result on main: run step 6 again. If anything fails, do NOT
    push: undo the local merge with `git reset --hard ORIG_HEAD` (only if nothing
    else was committed on main since), report the failure, and stop.
14. Push main: `git push origin main`. NEVER force-push. If rejected because main
    moved, `git fetch`, merge origin/main into local main, re-run step 6, push. If
    the push is rejected by branch protection or permissions, stop and tell me; do
    not try workarounds.
15. Tag the merge: `git tag -a <name>-merged -m "<title> merged"` and push the tag.
    If the GitHub CLI is available and a pull request exists or was opened for the
    record, it will show as merged once main contains the branch; do not use admin
    overrides.
16. Do NOT delete the branch (local or remote) or any tag. List cleanup commands in
    the report for me to run.
17. Report: branch, list of commits, merge commit hash, tags, check results before and
    after the merge, and the exact undo command: `git revert -m 1 <merge-commit>`.

START THE NEXT PHASE only from the updated main, on a new branch.

PHASE RUN RULES (every phase)

BEFORE CODING
- Read AGENTS.md, docs/CODEMAP.md (reuse first), docs/ARCHITECTURE.md,
  docs/PROGRESS.md, docs/ROUTES.md, docs/CLIENT_UX.md, docs/CLIENT_ROUTES.md and
  the FEATURES sections named in the phase.
- Prerequisite check: confirm the previous phase's DONE WHEN criteria still pass
  (run its tests) and that it is merged into main. If something is broken or not
  merged, stop and report; do not build on it.
- Write a short plan (docs/PROGRESS.md "in progress" entry): files you will add or
  change, new names for routes/events/queues/keys (add them to docs/ROUTES.md
  first), and any decision you need from me.

TWO PASSES
- Pass 1 is the server (and contracts). Finish it with tests, commit, push the
  branch, then stop and report. Do NOT merge after pass 1.
- Pass 2 is the client, started only when I say so, on the SAME branch. After
  pass 2, when every DONE WHEN item is verified, follow FINISH: PUSH, MERGE, VERIFY.
- If a pass is too large, split it and report where you split. A phase that has a
  single pass merges when it is complete.

QUALITY BAR
- Every new endpoint: zod DTO from packages/contracts, permission guard, audit
  entry (queue), tag-based cache invalidation, revision check where data is
  edited, uniform errors with reason codes.
- Every new screen: loading, empty, error, permission-denied and offline states;
  keyboard and screen-reader support; optimistic updates per the policy in
  docs/CLIENT_UX.md; skeletons that match the layout.
- Pure logic goes in framework-free modules with unit tests. Integration tests use
  real MongoDB (replica set) and Redis.
- No new `any`, `@ts-ignore` or `eslint-disable`. No duplicated helpers (check
  CODEMAP first).

CLOSEOUT
- Verify each DONE WHEN item with an automated test or script and list the
  evidence. Update docs/PROGRESS.md, docs/ROUTES.md, docs/ARCHITECTURE.md (status
  and any changed names) and run `pnpm codemap`. Write a manual test checklist in
  the final report (and in the pull request when one exists).
- Follow the GIT WORKFLOW through the merge into main. The phase is not finished
  until the merge is verified and pushed.