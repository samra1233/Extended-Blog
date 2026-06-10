# CLAUDE.md — InkWell Blog Platform

Agent instructions and codebase reference. Read this before making any changes.

## Quick Start

```bash
# Server (port 5000)
cd server && npm run dev   # needs MONGO_URI and JWT_SECRET in server/.env

# Client (port 5173)
cd client && npm run dev   # needs VITE_API_URL in client/.env
```

## Critical Rules

- **Server uses ES Modules** (`"type": "module"` in server/package.json). Always use `import/export`. Never use `require()`.
- **Express 5** is installed — note path-to-regexp v6 route syntax (no bare `*` strings in route paths).
- **Tailwind v3** is installed on the client — not v4. Do not use v4 syntax or the `@import "tailwindcss"` directive.
- **Never add a `dataService.js` or `server/data/*.json` fallback layer** — those files were removed. All data goes through MongoDB.
- **Real-time + uploads are live**: Socket.io (notifications), multer (image upload), helmet + rate limiting are all wired in index.js. Don't reintroduce them.
- Read a file before editing it. Never guess at existing code structure.
- Keep solutions minimal. Don't refactor things that weren't asked about.

## Project Structure

```
/
  client/           React + Vite frontend
  server/           Node/Express backend
  CONTEXT.md        Full feature and API reference (keep in sync with code)
  README.md         User-facing setup guide
  CLAUDE.md         This file (agent instructions)
```

### Server layout
```
server/
  index.js                     Express entry: helmet, CORS, rate limiting, Socket.io, routes, global error handler
  socket.js                    setIO/getIO singleton for the Socket.io instance
  seed_posts.js                Standalone seed script (node seed_posts.js)
  config/db.js                 Mongoose connect (graceful — warns, does not crash)
  controllers/
    authController.js          register, login, getMe, updateProfile, toggleBookmark, getBookmarks, toggleFollow, getFollowingFeed
    postController.js          getAllPosts, searchPosts, getMyPosts, getPostById, getTrendingPosts,
                               createPost, updatePost, deletePost, likePost
    commentController.js       getCommentsByPost, addComment, deleteComment
    adminController.js         getAllUsers, deleteUser, getAdminPosts, getAdminStats, setUserRole, seedPosts
    notificationController.js  getNotifications, markAllRead, deleteNotification
    aiController.js            summarizePost (HuggingFace BART proxy)
  middleware/
    authMiddleware.js          protect, adminOnly, optionalProtect
    upload.js                  multer disk storage (images only, 5MB) -> uploadSingle
  models/
    User.js                    name, email, password(hashed), bio, avatar, role, bookmarks[], following[]
    Post.js                    title, slug, content, author, tags[], likes[], coverImage, status, views
    Comment.js                 content, author, post, parentId (null = top-level)
    Notification.js            recipient, sender, type(like|comment|follow), post, read
  routes/
    authRoutes.js
    postRoutes.js
    commentRoutes.js
    adminRoutes.js
    notificationRoutes.js
    uploadRoutes.js
    aiRoutes.js                POST /summarize
  utils/
    slugify.js                 title -> url-safe slug
    generateToken.js           JWT sign, 30d expiry
    createNotification.js      create + Socket.io-emit a notification (24h dedupe)
    validateId.js              throws 400 on invalid Mongo ObjectId
  public/uploads/              uploaded images (served at /uploads)
```

### Client layout
```
client/src/
  App.jsx                      Routes + AuthProvider wrapper
  context/AuthContext.jsx      useAuth() hook — { user, token, login, logout }
  context/NotificationContext.jsx  Socket.io connection, notifications + unread count
  components/
    Navbar.jsx
    BlogCard.jsx
    CommentSection.jsx         Nested comments with inline reply forms
    ProtectedRoute.jsx         Redirects to /login if no token
    AdminRoute.jsx             Redirects to / if role !== 'admin'
    ErrorBoundary.jsx          Catches render errors
    FollowButton.jsx           Follow/unfollow toggle with follower count
    AISummarizer.jsx           Calls POST /api/ai/summarize
    PostForm.jsx               Shared create/edit form (tags, cover image, image upload)
  pages/
    Home.jsx                   Search bar, tag filter pills, post listing
    Login.jsx / Register.jsx
    PostDetail.jsx             Like/bookmark/edit/delete, view count, draft badge
    CreatePost.jsx / EditPost.jsx   draft/publish radio, tags, cover image
    Profile.jsx                Own posts
    Bookmarks.jsx
    AdminDashboard.jsx         Stats, users, posts tabs
    NotFound.jsx               404 catch-all route
```
Routes are lazy-loaded; App.jsx wraps everything in AuthProvider + NotificationProvider + ErrorBoundary, with a react-hot-toast Toaster.

## Authentication

- JWT stored in `localStorage` under key `token`; full user object stored under key `user`
- `AuthContext` exposes `{ user, token, login, logout }`
- Attach token manually in Axios calls: `headers: { Authorization: 'Bearer ' + token }`
- Backend middleware: `protect` (blocks without token), `optionalProtect` (populates req.user if token present, passes through if absent), `adminOnly` (must follow `protect`)
- JWT expires in 30 days

## Key API Patterns

### Posts
- `GET /api/posts/:id` — accepts both MongoDB ObjectId and slug
- Draft posts: only visible to their author or an admin
- Views: incremented only on published posts, on each GET
- Slug: auto-generated from title on create; regenerated if title changes on update

### Bookmarks
- Two equivalent endpoints (same controller function): `PUT /api/auth/bookmarks/:postId` and `PUT /api/posts/:id/bookmark`

### Admin
- All `/api/admin/*` routes require `protect` + `adminOnly`
- `DELETE /api/admin/users/:id` cascades: deletes user's posts and all comments on those posts
- `POST /api/admin/seed-posts` is idempotent — skips if 5+ complete posts already exist

### Comments
- GET returns a nested tree (server builds it from flat DB result)
- DELETE cascades to direct replies only (one level deep)

### Follow
- `PUT /api/auth/follow/:userId` toggles follow; returns `{ following, followerCount }`. Can't follow yourself.
- `GET /api/auth/following-feed?page=&limit=` — paginated published posts from followed authors

### Notifications (Socket.io)
- Created via `utils/createNotification.js` on like / comment / follow — never for your own actions; dedupes same sender+type+post within 24h
- Emitted live to the recipient's private room (room name = their user id) over Socket.io
- Socket handshake requires a valid JWT in `auth.token`
- REST: `GET /api/notifications` (latest 20 + unread count), `PUT /api/notifications/read-all`, `DELETE /api/notifications/:id` — all `protect`

### Upload
- `POST /api/upload/image` (protected) — multipart field `image`, returns `{ url }`. Images only, 5 MB max. Saved to `server/public/uploads`, served at `/uploads`.

### AI
- `POST /api/ai/summarize` — body `{ content }` → `{ summary }`. No auth. Proxies to HuggingFace BART-large-CNN; needs `HF_API_TOKEN`. Returns 503 if token unset or model cold-starting.

## Environment Variables

### server/.env
```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
CLIENT_ORIGIN=http://localhost:5173   # optional, defaults to localhost:5173
NODE_ENV=development                  # optional, controls error-stack logging
HF_API_TOKEN=your_huggingface_token   # optional, required only for AI summarization
```

### client/.env
```
VITE_API_URL=http://localhost:5000/api
```

## Database Models — Quick Reference

**User**: `name, email, password, bio, avatar, role('user'|'admin'), bookmarks[ref:Post], following[ref:User], createdAt`
Pre-save hook hashes password. Instance method: `matchPassword(plain)`

**Post**: `title, slug(unique,sparse), content, author(ref:User), tags[], coverImage, likes[ref:User], status('draft'|'published'), views, createdAt, updatedAt`
Text index on `title + content` for $text search (regex fallback if index not built); plus compound indexes on status/createdAt, author/status, status/views.

**Comment**: `content, author(ref:User), post(ref:Post), parentId(ref:Comment|null), createdAt`

**Notification**: `recipient(ref:User), sender(ref:User), type('like'|'comment'|'follow'), post(ref:Post|null), read(bool), createdAt`
Index on `{ recipient, read, createdAt }`.

## Frontend Routes

| Path | Component | Guard |
|------|-----------|-------|
| / | Home | public |
| /login | Login | public |
| /register | Register | public |
| /posts/:id | PostDetail | public (id = ObjectId or slug) |
| /create | CreatePost | protected |
| /edit/:id | EditPost | protected |
| /profile | Profile | protected |
| /bookmarks | Bookmarks | protected |
| /admin | AdminDashboard | admin only |
| * | NotFound | public (404 catch-all) |

## Seeding Data

```bash
# Standalone (fastest)
cd server && node seed_posts.js

# Via API (admin token required)
POST /api/admin/seed-posts
Authorization: Bearer <token>
```

Creates author `alex.rivera.seed@blogapp.internal` and inserts 5 long-form tech articles. Idempotent.

## First Admin Setup

No admin registration endpoint exists. Promote manually in MongoDB:
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

Then use `PUT /api/admin/users/:id/role` to manage others.

## Common Gotchas

1. **Route order in postRoutes.js matters** — `/search`, `/trending`, `/mine` are defined before `/:id` to prevent them being caught by the param route.
2. **optionalProtect on GET /api/posts/:id** — this allows draft visibility check for logged-in users without blocking public access.
3. **Server won't crash on MongoDB failure** — db.js catches the connection error and warns. Routes will simply fail at query time if DB is down.
4. **Slug sparse index** — allows multiple posts with no slug (legacy), but enforces uniqueness when slug is set.
5. **CORS** — restricted to `CLIENT_ORIGIN`; requests with no `Origin` header (Postman, curl) are allowed through.
6. **Rate limiting** — auth routes (login/register) capped at 15 req/15 min; general `/api` at 100 req/min per IP. Expect 429s during heavy testing.
7. **Socket.io auth** — connections without a valid JWT in `auth.token` are rejected; each user joins a room named by their user id, which is how notifications are targeted.
8. **Notifications fire-and-forget** — `createNotification(...)` is called with `.catch(() => {})` from controllers so a notification failure never breaks the main request.
9. **Uploads are local disk** — files land in `server/public/uploads` (not in .gitignore, so uploaded images can get committed; the dir must exist for multer to write). Consider ignoring it before committing real uploads.

## Docs to Keep in Sync

When making significant changes to API routes, models, or features, update:
- `CONTEXT.md` — API routes, models, file structure, status checklist
- `README.md` — API table, environment variables, feature list
- `CLAUDE.md` (this file) — any pattern or gotcha changes
