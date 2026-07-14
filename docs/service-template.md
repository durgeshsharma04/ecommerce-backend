# Reusable Service Template

This guide defines a consistent baseline for every HTTP service in this repository. Apply it to the existing services first, then copy the structure when adding a new service.

The target is deliberately modest: an independently deployable Express service with one database, validated input, predictable errors, authorization, observability, tests, a Docker image, and CI checks.

## 1. Create the service shape

Use feature modules. Keep HTTP code at the edge and business/database code inside each module.

```text
apps/<service-name>/
  prisma/
    schema.prisma
  src/
    app.ts
    server.ts
    config/env.ts
    db/prisma.ts
    middleware/authenticate.ts
    middleware/authorize.ts
    middleware/error-handler.ts
    middleware/not-found.ts
    middleware/validate.ts
    routes/health.routes.ts
    modules/
      <feature>/
        <feature>.routes.ts
        <feature>.controller.ts
        <feature>.service.ts
        <feature>.schema.ts
        <feature>.repository.ts     # add when queries become non-trivial
  tests/
    health.test.ts
  Dockerfile
  .dockerignore
  package.json
```

Rules:

- A service owns its Prisma schema and database. Other services never query that database directly.
- Routes parse HTTP concerns; controllers call services; services enforce business rules; repositories contain database queries.
- Shared packages may contain generic infrastructure (`AppError`, logging interfaces, validation middleware), but never business entities such as `Product` or `Order`.

## 2. Make shared code real workspace packages

`packages/utils` is currently imported through TypeScript path aliases, but it has no package manifest. Turn it into a normal pnpm workspace package so builds and Docker images resolve it reliably.

Create `packages/utils/package.json`:

```json
{
  "name": "@ecommerce/utils",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

Move or re-export current utilities from `packages/utils/src/index.ts`, then depend on it from each app:

```json
"@ecommerce/utils": "workspace:*"
```

Use package imports (for example `@ecommerce/utils`) rather than reaching across apps. Keep the TypeScript aliases only if they still add value.

## 3. Validate configuration at startup

Every service should have one configuration module. It loads the environment once, validates it once, and exposes typed values. Do not call `dotenv.config()` in feature services and do not use `process.env.X as string` elsewhere.

Install the shared runtime dependencies:

```bash
pnpm add zod dotenv --filter <service-name>
```

Create `src/config/env.ts`:

```ts
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
```

Give each app an `.env.example` containing variable names and safe sample values. Keep `.env` and `.env.local` in `.gitignore`.

## 4. Use one Prisma client per service

Install Prisma as a development dependency and the generated client as a runtime dependency (your services already mostly do this). Create `src/db/prisma.ts`:

```ts
import { PrismaClient } from "../../prisma/generated/prisma";

export const prisma = new PrismaClient();
```

Import this singleton from repositories/services instead of creating `new PrismaClient()` in individual feature files. In `src/server.ts`, add graceful shutdown:

```ts
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./db/prisma";

const server = app.listen(env.PORT, () => {
  console.log(`Service listening on ${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log({ signal }, "Shutting down");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
```

Use a different Postgres database (or at minimum a different schema and credentials) per service. Sharing a Postgres container locally is fine; sharing tables or migrations is not.

## 5. Define request contracts at the route boundary

Put Zod schemas next to their feature and validate all inputs: body, params, and query. Keep types inferred from those schemas instead of hand-writing DTOs.

```ts
// modules/category/category.schema.ts
import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
    description: z.string().max(500).optional()
  })
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>["body"];
```

Use one validation middleware implementation across all services. It should return a standard 400 response and, ideally, assign parsed data back onto the request. Add schemas for updates (partial fields), UUID parameters, pagination, and authentication payloads; do not validate only `POST` requests.

Never expose persistence records directly without review. For example, `register` must return a public user DTO, never a password hash.

## 6. Standardize errors and async controllers

Keep one error response contract throughout the platform:

```json
{
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Category not found",
    "details": []
  },
  "requestId": "..."
}
```

Extend `AppError` with a machine-readable `code` and optional `details`. The error handler should map:

- Zod errors to `400 VALIDATION_ERROR`
- known Prisma uniqueness errors to `409 CONFLICT`
- missing records to `404 NOT_FOUND`
- deliberate business errors to their chosen 4xx status
- unknown errors to `500 INTERNAL_ERROR` without leaking internals

With Express 5, rejected promises from async route handlers are forwarded to the error handler. Still keep controllers thin and throw `AppError` from services. Do not repeat `try/catch` blocks merely to re-wrap every error.

Register middleware in this order in `app.ts`:

1. request ID and logger context
2. security/CORS middleware, if needed
3. `express.json()` with a body-size limit
4. health route
5. feature routes
6. not-found middleware
7. error handler

## 7. Separate authentication from authorization

The gateway may authenticate external requests, but protected services should also verify trusted identity unless they are network-isolated and the gateway attaches signed internal credentials. Never rely solely on a user-controlled forwarding header.

Create two middleware layers:

```ts
// authenticate: validates token and sets req.auth = { userId, role }
// authorize("admin"): checks whether req.auth.role has the permission
```

Use permissions/action policies rather than allowing a broad role list for every endpoint:

```ts
router.post("/categories", authenticate, authorize("catalog:write"), validate(createCategorySchema), createCategory);
router.get("/categories", authenticate, authorize("catalog:read"), listCategories);
```

At the gateway, configure a request timeout and return a stable `503`/`504` error when an upstream is unavailable. Keep public-route policy explicit: registration, login, health, and any public catalog endpoints should be intentionally listed rather than accidentally unprotected.

## 8. Add health and readiness endpoints

Use two endpoints in every service:

- `GET /health/live`: process is running; no dependency calls.
- `GET /health/ready`: service can accept traffic; check the database with `await prisma.$queryRaw\`SELECT 1\``.

Return `200` only when ready. Container orchestrators use liveness to restart stuck processes and readiness to stop routing traffic to unavailable instances.

## 9. Add structured logging and request IDs

Use a JSON logger such as Pino rather than scattered `console.log` calls:

```bash
pnpm add pino pino-http --filter <service-name>
```

Log request ID, method, path, status, duration, service name, and error stack for 5xx responses. Accept an incoming `x-request-id` only after validating it, otherwise generate a UUID; return it in the response. Forward it from the gateway to each service.

Never log authorization headers, passwords, tokens, or raw request bodies by default.

## 10. Add tests before expanding features

Install a test runner and HTTP test helper:

```bash
pnpm add -D vitest supertest @types/supertest --filter <service-name>
```

Export the Express `app` without calling `listen`; this repository already follows that useful pattern. Test it directly with Supertest.

Minimum tests per service:

- liveness and readiness behavior
- valid and invalid request contracts
- unauthenticated, forbidden, and authorized access
- successful feature flow
- not-found, duplicate, and unexpected-error response formats

Use a disposable test database. Apply migrations before tests and clean database state between tests; never point tests at a developer or production database.

Add scripts to every service:

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "prisma:generate": "prisma generate",
    "prisma:migrate:deploy": "prisma migrate deploy"
  }
}
```

## 11. Containerize one service

Build from the repository root so pnpm can resolve workspace packages. A production Dockerfile should have a build stage and a small runtime stage. Its entrypoint should run compiled JavaScript, not `ts-node-dev`.

The runtime sequence is:

1. inject environment variables/secrets
2. run `prisma migrate deploy` as a controlled deployment step (prefer a dedicated migration job in production)
3. start `node dist/apps/<service-name>/src/server.js`
4. expose the service port and configure the `/health/live` probe

Add `.dockerignore` for `node_modules`, `dist`, `.git`, `.env*`, test output, and local Prisma generated artifacts if generation happens in the image. Do not bake secrets into an image.

Extend Compose with one service per app and a distinct `DATABASE_URL` per app. The current single Postgres container can host `users`, `products`, and `orders` databases for local development.

## 12. Add CI with a single quality gate

Create `.github/workflows/ci.yml` after adding tests. The baseline workflow should:

1. run on pull requests and pushes to the default branch
2. check out the repository and install the pinned pnpm version
3. run `pnpm install --frozen-lockfile`
4. generate Prisma clients
5. run `pnpm -r typecheck`
6. run `pnpm -r test`
7. run `pnpm -r build`

For database integration tests, add a Postgres service container and set each test database URL from CI secrets/environment. Run the same commands locally before opening a pull request.

## 13. Rollout order for this repository

Implement the template incrementally to avoid a large risky rewrite:

1. Make `packages/utils` a real package and normalize package scripts/version ranges.
2. Add configuration validation and a database singleton to user and product services.
3. Replace duplicate validation middleware with one shared version; add auth and category/update schemas.
4. Fix public user DTOs and route-level authorization policies.
5. Introduce standard error responses, request IDs, logging, and health endpoints in every service and gateway.
6. Add user/product tests and test databases; make the root test command run them.
7. Add Dockerfiles, Compose services, and CI.
8. Only then build the order domain. Make cross-service effects event-driven and idempotent; an outbox table is a good first step.

## Definition of done for a new service

Before calling a service ready, verify all of the following:

- Startup fails clearly when required configuration is absent.
- It owns migrations and its database boundary.
- Every external input is validated.
- Responses and errors follow platform contracts.
- Authentication and endpoint-specific authorization are tested.
- Liveness/readiness, JSON logs, and request IDs work.
- Unit/integration tests, type checking, and production build pass.
- Its Docker image contains no secrets and starts from compiled code.
- CI runs the same checks automatically.
