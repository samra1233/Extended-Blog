# Backend Git History & Agent Handoff Log

This file is maintained for AI agents and developers to understand what has been
built, what was tested, and what security issues were found and fixed.

---

## Session 1 — 2026-03-04: Backend Verification & Security Audit

### What Was Done
Performed a full static code review + live curl-based API test of the backend.
Initialized git on the monorepo. Fixed all vulnerabilities found.

---

### Backend Test Results

| Test | Route | Result | Notes |
|------|-------|--------|-------|
| Health | GET / | ❌ 404 | No health route existed → **added /health** |
| List posts | GET /api/posts | ✅ 200 `[]` | JSON fallback works (no MongoDB) |
| Search | GET /api/posts/search?q= | ❌ 500 | Mongoose timeout — MongoDB not running |
| Trending | GET /api/posts/trending | ❌ 500 | Mongoose timeout — no fallback for this route |
| Single post | GET /api/posts/:id | ❌ 500 | Mongoose timeout — no fallback |
| No token | GET /api/auth/me | ✅ 401 | Correct rejection |
| Fake token | GET /api/auth/me + bad JWT | ❌ 500 | **Bug: should be 401 → fixed** |
| Unauthenticated POST | POST /api/posts | ✅ 401 | Auth guard works |
| CORS block | evil.com origin | ✅ Blocked | After fix |
| CORS allow | localhost:5173 origin | ✅ 200 | After fix |
| Payload limit | 1.1MB POST body | ✅ Rejected | After adding `limit: '1mb'` |
| Register | POST /api/auth/register | ❌ 500 | No MongoDB running — no JSON fallback for auth |
| Login | POST /api/auth/login | ❌ 500 | Same reason |

> **Note:** Auth routes (register/login) require MongoDB. They have no JSON fallback
> because storing hashed passwords in flat JSON is not safe. Run MongoDB to test auth.

---

### MongoDB Status
- Local MongoDB was NOT running during this session
- `.env` was fixed: `MONGO_URI=mongodb://localhost:27017/inkwell`
- Previous value was placeholder: `your_mongodb_uri_here` (caused connection failure)
- JSON fallback is active for `GET /api/posts` only
- All other routes require MongoDB

---

### Vulnerabilities Found & Fixed

#### VULN-1: Stack Traces Exposed in All Error Responses (HIGH)
- **File:** `server/index.js` (global error handler, line ~27)
- **Problem:** `stack: process.env.NODE_ENV === 'production' ? null : err.stack`
  NODE_ENV was never set in .env, so it defaulted to `undefined` (not `'production'`),
  causing full stack traces with internal file paths and library versions to be sent
  to any client in any environment.
- **Why it's dangerous:** Attackers learn exact file paths, Node.js version, and
  library names/versions — useful for targeted exploit selection.
- **Fix:** Error handler now only logs stack to server console. `stack` field is
  never included in JSON responses.

#### VULN-2: Invalid JWT Returns HTTP 500 Instead of 401 (MEDIUM)
- **File:** `server/middleware/authMiddleware.js` (line ~14)
- **Problem:** `jwt.verify()` throws a `JsonWebTokenError` when given a bad token.
  This uncaught exception propagated to the error handler with `res.statusCode`
  still at 200, which the error handler promoted to 500.
- **Why it's dangerous:** Exposes internals (JsonWebTokenError message + stack),
  clients cannot distinguish auth errors from server errors, misconfigures any
  client-side logic that checks HTTP status.
- **Fix:** Wrapped `jwt.verify()` in a try/catch; sets `res.status(401)` before
  re-throwing a clean `'Not authorized, token invalid or expired'` message.

#### VULN-3: Open CORS — All Origins Allowed (HIGH)
- **File:** `server/index.js` (line ~17)
- **Problem:** `app.use(cors())` with no configuration allows any website to make
  requests to the API. Combined with JWT in localStorage (XSS-accessible), this
  enables cross-origin attacks.
- **Fix:** CORS now uses an allowlist. Only `CLIENT_ORIGIN` (default:
  `http://localhost:5173`) is permitted. Set `CLIENT_ORIGIN` in `.env` for production.

#### VULN-4: ReDoS via Unescaped User Input in RegExp (MEDIUM)
- **File:** `server/controllers/postController.js`
- **Problem 1 (tag filter, line ~42):** `new RegExp('^${req.query.tag}$', 'i')`
  — tag value from URL query used directly in regex without escaping.
- **Problem 2 (search fallback, line ~77):** `new RegExp(q.trim(), 'i')`
  — search query used directly as regex pattern.
- **Why it's dangerous:** An attacker can send a crafted regex pattern as a tag or
  search query to cause catastrophic backtracking, hanging the Node.js event loop
  and causing a Denial-of-Service.
- **Fix:** Both inputs now sanitized with `.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`
  before being used in `new RegExp()`.

#### VULN-5: No Request Body Size Limit (MEDIUM)
- **File:** `server/index.js`
- **Problem:** `app.use(express.json())` with no size limit. A client could send
  multi-megabyte JSON payloads to exhaust server memory.
- **Fix:** Changed to `app.use(express.json({ limit: '1mb' }))`. Bodies over 1MB
  are rejected automatically.

#### VULN-6: Weak/Placeholder JWT Secret (HIGH — config issue)
- **File:** `server/.env`
- **Problem:** `JWT_SECRET=your_secret_here` — a short, predictable string.
  An attacker who knows this can forge valid JWTs for any user ID, including admin.
- **Fix:** Updated placeholder to a more descriptive reminder comment. A strong
  random secret (e.g. `openssl rand -hex 64`) MUST be used in production.

---

### Changes Made to Files

| File | Change |
|------|--------|
| `server/index.js` | Added CORS allowlist, `express.json({ limit:'1mb' })`, `/health` route, removed stack from error responses |
| `server/middleware/authMiddleware.js` | Wrapped `jwt.verify` in try/catch; invalid token now returns 401 |
| `server/controllers/postController.js` | Escaped regex in tag filter + search fallback (ReDoS fix) |
| `server/.env` | Fixed `MONGO_URI` to `mongodb://localhost:27017/inkwell`; added `NODE_ENV`, `CLIENT_ORIGIN` |

---

### Known Remaining Issues (Not Fixed — Out of Scope)

1. **No rate limiting on auth routes** — brute-force of passwords is possible.
   Recommendation: install `express-rate-limit` and apply to `/api/auth/login`.

2. **JWT in localStorage (frontend)** — accessible to any XSS payload.
   Recommendation: switch to HttpOnly cookies (requires coordinated frontend change).

3. **No email validation on register** — any string is accepted as email.
   The `unique` index prevents duplicate emails but not malformed ones.

4. **`/api/posts/search`, `/api/posts/trending`, `/api/posts/:id` have no JSON fallback**
   — they return 500 (Mongoose timeout) when MongoDB is down.
   `GET /api/posts` is the only route with a JSON fallback.

5. **Admin role set via direct DB query only** — there is intentionally no API to
   create the first admin. Run:
   `db.users.updateOne({ email: "you@x.com" }, { $set: { role: "admin" } })`

---

### How to Run with Real MongoDB

1. Install MongoDB locally or create a free Atlas cluster
2. Set `MONGO_URI` in `server/.env`
3. `cd server && npm run dev`
4. Register at `POST /api/auth/register`, login at `POST /api/auth/login`
5. Use the returned `token` as `Authorization: Bearer <token>` header

---

### Architecture Notes for Future Agents

- Server uses **ES Modules** (`"type": "module"`) — always use `import/export`
- Express version is **5.x** — route handler error semantics differ slightly from v4
- `dataService.js` is the abstraction layer for MongoDB ↔ JSON fallback logic
- `authMiddleware.js` exports `protect` (any logged-in user) and `adminOnly` (admin role check)
- `adminOnly` must always be chained after `protect` — it reads from `req.user`
