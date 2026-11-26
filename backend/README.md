# GramShiksha API

Express 5 + PostgreSQL (Neon) REST API for the GramShiksha learning platform.

## Run locally

```bash
cp .env.example .env      # then fill in DATABASE_URL, JWT_ACCESS_SECRET, SEED_PASSWORD
npm install
npm run seed              # applies migrations, creates the 4 demo accounts
npm run dev               # http://localhost:4000, SQL logging on
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start with auto-restart, reads `.env` |
| `npm start` | Production start (Render) |
| `npm run migrate` | Apply new files in `migrations/` |
| `npm run seed` | Migrate, insert demo data if empty, create demo accounts |

## Structure

```
server.js                 entry: validate config, migrate, listen, graceful shutdown
migrations/               numbered SQL files, each applied once (schema_migrations table)
src/
  app.js                  global middleware in order + route mounting
  config/env.js           every setting validated at startup (zod)
  db/pool.js              the single pg Pool, query() with SQL logging, withTransaction()
  db/migrate.js           migration runner
  db/seed.js, seedData.js demo data
  routes/                 URL -> middleware chain -> controller, one file per resource
  controllers/            read the validated request, call a service, send the response
  services/               business rules and SQL
  middleware/             requestContext, auth, validate, rateLimiters, errorHandler
  validators/schemas.js   zod schemas for every body, params and query
  utils/                  AppError, JWT and refresh-token helpers
```

## Endpoints

All under `/api/v1` (`/api` is kept as an alias for PWAs installed before versioning).

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | /auth/register | public, rate-limited | Create a student account, sign in |
| POST | /auth/login | public, rate-limited | Sign in: access token + refresh cookie |
| POST | /auth/refresh | refresh cookie | Rotate refresh token, new access token |
| POST | /auth/logout | refresh cookie | End the session |
| GET | /auth/me | signed in | Current user |
| GET | /lessons | public | All lessons (cached offline by the PWA) |
| POST | /lessons | teacher | Publish a lesson |
| POST | /generate | teacher, 10/min | AI-generated lesson draft |
| POST | /results | public or signed in | Save one quiz result or a batch of up to 50 (idempotent with clientId) |
| GET | /results | teacher, planner | Filter, sort, paginate all results |
| GET | /results/me | signed in | My results |
| GET | /results/:id | owner, teacher, planner | One result |
| GET | /schools | public | All schools |
| GET | /schools/:id | public | One school with its resources |
| GET | /resources | public | Resources with school name, `?schoolId=` |
| PATCH | /resources/:id | planner | `{ "delta": 1 }` atomic, or `{ "stock": n }` / `{ "needed": n }` |
| GET | /analytics | public | Planner dashboard aggregates |
| GET, POST | /connectivity | public | Device speed readings |
| GET | /health, /ping | public | Health check, speed-test payload |

`GET /results` query: `page` (default 1), `limit` (1-100, default 20), `village`, `lessonId`, `minScore`, `sort` (`at`, `-at`, `score`, `-score`, `village`, `-village`; default `-at`).

## Status codes

| Code | When |
| --- | --- |
| 200 / 201 / 204 | OK / created / logged out |
| 400 | Validation failed, bad JSON |
| 401 | No, invalid or expired token; wrong password |
| 403 | Signed in but not allowed (role or ownership), untrusted origin |
| 404 | Unknown route or record |
| 409 | Duplicate (for example email already registered) |
| 413 | Body over 100 KB |
| 422 | Breaks a database rule (for example stock below 0) |
| 429 | Rate limit hit |
| 500 | Bug: generic message only, details in the server log |

Every error has the same shape:

```json
{ "error": "Request validation failed", "code": "VALIDATION_ERROR", "requestId": "…", "details": [ … ] }
```
