# CONTEXT.md — InkWell Blog Platform

## Purpose
This file exists to give any AI coding agent (or developer) instant full context of the project so they can continue work without asking questions.

## Project Summary
InkWell is a MERN-stack extended blog platform built as a university project. It is a monorepo with separate client and server folders.

## Monorepo Structure
- /client — React + Tailwind frontend (Vite-based)
- /server — Node.js + Express backend (REST API)

## Tech Stack
- Frontend: React 19, Tailwind CSS (v3), React Router v7, Axios, socket.io-client, react-hot-toast, react-markdown (+ rehype-sanitize), @huggingface/transformers
- Backend: Node.js, Express 5, Mongoose, JWT (30d expiry), bcryptjs, dotenv, cors, helmet, express-rate-limit, multer, socket.io, express-async-handler
- Database: MongoDB (local or Atlas)
- AI Feature: IMPLEMENTED — POST /api/ai/summarize proxies to HuggingFace BART-large-CNN (requires HF_API_TOKEN). Client component: AISummarizer.jsx
- Real-time: Socket.io (JWT-authenticated) powers live notifications

## Authentication
- JWT stored in localStorage under key `token`; full user object also stored under key `user`
- Token attached to requests via Axios (manually set in each page/component using the token from AuthContext)
- Protected routes on both frontend (React Router guards) and backend (middleware)
- Role field on User: 'user' (default) or 'admin'
- JWT expires in 30 days

## Key Features (Current)
1. User Registration & Login (returns role in response)
2. Create, Read, Update, Delete Blog Posts
3. Comment on posts (with nested reply support via parentId)
4. Like posts (toggle)
5. Bookmark posts (toggle, stored in User.bookmarks)
6. User profile page with own posts listing
7. Search posts by title/content (GET /api/posts/search?q=)
8. Filter posts by tag (GET /api/posts?tag=) and by author (GET /api/posts?author=userId)
9. Draft vs Published post status
10. Auto-generated slugs (unique, derived from title; regenerated on title change)
11. View counter on posts (auto-incremented on GET for published posts only)
12. Trending posts endpoint (top 10 most viewed published posts)
13. Admin dashboard (stats, user management, post management)
14. Role-Based Access Control (adminOnly middleware)
15. Post seeding: admin can seed 5 sample blog posts via POST /api/admin/seed-posts or standalone script server/seed_posts.js
16. Optional authentication middleware (optionalProtect) — populates req.user if token present, does not block if absent
17. Health check endpoint: GET /health
18. Follow / unfollow authors (User.following[]) + a personalized following-feed (paginated)
19. Real-time notifications (like / comment / follow) via Socket.io, with unread count, mark-all-read, delete; 24h dedupe
20. Image upload (multer, 5 MB limit, images only) — POST /api/upload/image, served from /uploads
21. AI post summarization — POST /api/ai/summarize via HuggingFace BART-large-CNN
22. Security hardening — helmet headers + express-rate-limit (strict on auth, relaxed on general API)

## AI Feature
- Endpoint: POST /api/ai/summarize  body: { content }  → { summary }
- Proxies to HuggingFace router (facebook/bart-large-cnn); content truncated to ~700 words
- No auth required (post content is public). Returns 503 if HF_API_TOKEN unset or model cold-starting.

## API Base URL
- Development: http://localhost:5000/api

## API Routes

### Auth
- POST   /api/auth/register          — register (returns role)
- POST   /api/auth/login             — login (returns role)
- GET    /api/auth/me                — get current user (protected)
- PUT    /api/auth/me                — update profile name/bio/avatar (protected)
- GET    /api/auth/bookmarks         — get user's bookmarked posts (protected)
- PUT    /api/auth/bookmarks/:postId — toggle bookmark (protected)
- PUT    /api/auth/follow/:userId    — toggle follow; returns { following, followerCount } (protected)
- GET    /api/auth/following-feed    — paginated published posts from followed authors (?page=&limit=) (protected)

### Posts
- GET    /api/posts                  — all published posts (?tag=, ?author=)
- GET    /api/posts/search?q=        — search by title/content (text index with regex fallback)
- GET    /api/posts/trending         — top 10 most viewed
- GET    /api/posts/mine             — authenticated user's own posts, all statuses (protected)
- GET    /api/posts/:id              — single post by ID or slug (increments views; optionalProtect)
- POST   /api/posts                  — create post with slug + status (protected)
- PUT    /api/posts/:id              — update post (author or admin, protected)
- DELETE /api/posts/:id              — delete post (author or admin, protected)
- PUT    /api/posts/:id/like         — toggle like (protected)
- PUT    /api/posts/:id/bookmark     — toggle bookmark (protected)

### Comments
- GET    /api/comments/:postId       — get nested comment tree
- POST   /api/comments/:postId       — add comment (supports parentId for replies) (protected)
- DELETE /api/comments/:id           — delete comment + all direct replies (author or admin, protected)

### Admin (require: authenticated + role=admin)
- GET    /api/admin/stats            — user/post/comment counts + top 5 viewed + top 5 liked posts
- GET    /api/admin/users            — list all users
- DELETE /api/admin/users/:id        — delete user and all their posts/comments
- PUT    /api/admin/users/:id/role   — promote/demote to admin/user
- GET    /api/admin/posts            — all posts including drafts
- POST   /api/admin/seed-posts       — seed 5 sample blog posts (idempotent; skips if already seeded)

### Notifications (protected)
- GET    /api/notifications          — latest 20 notifications + unread count for current user
- PUT    /api/notifications/read-all — mark all as read
- DELETE /api/notifications/:id      — delete a single notification

### Upload (protected)
- POST   /api/upload/image           — multipart field `image`; returns { url } (5 MB limit, images only)

### AI
- POST   /api/ai/summarize           — body { content } → { summary } (HuggingFace BART; no auth)

### Utility
- GET    /health                     — server health check (returns status + timestamp)

### Rate limiting
- /api/auth/login, /api/auth/register — 15 requests / 15 min per IP
- /api/* (general)                    — 100 requests / min per IP

## Environment Variables

### Server (/server/.env)
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_ORIGIN=http://localhost:5173   # optional; defaults to http://localhost:5173
NODE_ENV=development                  # optional; controls error-stack logging
HF_API_TOKEN=your_huggingface_token   # optional; required only for AI summarization
```

### Client (/client/.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Database Models

### User
- name, email, password (bcrypt-hashed, pre-save hook)
- bio: String (default: '')
- avatar: String (default: '')
- role: 'user' | 'admin' (default: 'user')
- bookmarks: [ObjectId ref Post]
- following: [ObjectId ref User]
- createdAt: Date
- Methods: matchPassword(enteredPassword)

### Post
- title, content, author (ref: User)
- slug: unique, sparse, auto-generated from title (via server/utils/slugify.js)
- tags: [String] (default: [])
- likes: [ObjectId ref User]
- coverImage: String (default: '')
- status: 'draft' | 'published' (default: 'published')
- views: Number (default: 0)
- createdAt, updatedAt
- Index: text index on title + content (for $text search)

### Comment
- content, author (ref: User), post (ref: Post)
- parentId: ObjectId ref Comment (null = top-level)
- createdAt

### Notification
- recipient (ref: User), sender (ref: User)
- type: 'like' | 'comment' | 'follow'
- post: ObjectId ref Post (default: null)
- read: Boolean (default: false)
- createdAt
- Index: { recipient, read, createdAt }
- Created via utils/createNotification.js (dedupes same sender+type+post within 24h, emits over Socket.io)

## Server File Structure (non-node_modules)
```
server/
  index.js                    — Express app entry (helmet, CORS, rate limiting, Socket.io, routes, global error handler)
  socket.js                   — setIO/getIO singleton for the Socket.io instance
  seed_posts.js               — Standalone seed script: node seed_posts.js
  config/
    db.js                     — Mongoose connect (graceful; warns on failure, does not crash)
  controllers/
    authController.js         — register, login, getMe, updateProfile, toggleBookmark, getBookmarks, toggleFollow, getFollowingFeed
    postController.js         — getAllPosts, searchPosts, getMyPosts, getPostById, getTrendingPosts,
                                 createPost, updatePost, deletePost, likePost
    commentController.js      — getCommentsByPost, addComment, deleteComment
    adminController.js        — getAllUsers, deleteUser, getAdminPosts, getAdminStats, setUserRole, seedPosts
    notificationController.js — getNotifications, markAllRead, deleteNotification
    aiController.js           — summarizePost (HuggingFace BART proxy)
  middleware/
    authMiddleware.js         — protect, adminOnly, optionalProtect
    upload.js                 — multer disk storage (images only, 5 MB), exports uploadSingle
  models/
    User.js
    Post.js
    Comment.js
    Notification.js
  routes/
    authRoutes.js
    postRoutes.js
    commentRoutes.js
    adminRoutes.js
    notificationRoutes.js
    uploadRoutes.js
    aiRoutes.js
  utils/
    slugify.js                — converts title to URL slug
    generateToken.js          — signs JWT with 30d expiry
    createNotification.js     — create + Socket.io-emit a notification (24h dedupe)
    validateId.js             — throws 400 on invalid Mongo ObjectId
  public/uploads/             — uploaded images (served at /uploads)
```

## Client File Structure
```
client/src/
  main.jsx
  App.jsx                     — lazy-loaded routes, AuthProvider + NotificationProvider, ErrorBoundary, react-hot-toast Toaster
  context/
    AuthContext.jsx           — useAuth hook, login/logout, token+user in localStorage
    NotificationContext.jsx   — Socket.io connection, notifications + unread count
  components/
    Navbar.jsx
    BlogCard.jsx
    CommentSection.jsx        — nested comments with reply forms
    ProtectedRoute.jsx        — redirects to /login if no token
    AdminRoute.jsx            — redirects to / if not admin
    ErrorBoundary.jsx         — catches render errors
    FollowButton.jsx          — follow/unfollow toggle with follower count
    AISummarizer.jsx          — calls POST /api/ai/summarize
    PostForm.jsx              — shared create/edit form (tags, cover image, image upload)
  pages/
    Home.jsx                  — search bar, tag filter pills, post listing
    Login.jsx
    Register.jsx
    PostDetail.jsx            — view count, like/bookmark/edit/delete, draft badge
    CreatePost.jsx            — draft/publish radio, tags, cover image
    EditPost.jsx
    Profile.jsx               — shows own posts
    Bookmarks.jsx
    AdminDashboard.jsx        — stats, users, posts tabs
    NotFound.jsx              — 404 catch-all route
```

## Frontend Routes
- /             — Home (public)
- /login        — Login
- /register     — Register
- /posts/:id    — PostDetail (public; id can be MongoDB ObjectId or slug)
- /create       — CreatePost (protected)
- /edit/:id     — EditPost (protected)
- /profile      — Profile (protected)
- /bookmarks    — Bookmarks (protected)
- /admin        — AdminDashboard (admin only)
- *             — NotFound (404 catch-all)

## Important Behaviors
- **Slug lookup**: GET /api/posts/:id accepts both MongoDB ObjectId and slug
- **Draft access**: Draft posts are only visible to the author or admin
- **View increment**: Only incremented on published posts
- **Comment cascade delete**: Deleting a comment also deletes all its direct replies
- **Admin user delete**: Cascades — deletes all posts and comments by that user
- **Bookmark toggle**: Same logic in both /api/auth/bookmarks/:postId and /api/posts/:id/bookmark (shares toggleBookmark function from authController)
- **CORS**: Restricted to CLIENT_ORIGIN (default localhost:5173); allows requests with no origin (Postman, mobile)
- **JSON body limit**: 1mb
- **Security headers**: helmet() applied globally
- **Rate limiting**: auth routes 15/15min, general /api 100/min (per IP)
- **Socket.io auth**: handshake must carry a valid JWT (`auth.token`); each user joins a private room keyed by their user id
- **Notification dedupe**: same sender+type+post within 24h does not create a duplicate; users never notified about their own actions
- **Uploads**: stored under server/public/uploads, served statically at /uploads; images only, 5 MB max
- **ES Modules**: Server uses `"type": "module"` — always use `import/export`, never `require()`

## File Naming Convention
- React components: PascalCase (e.g., BlogCard.jsx)
- Utility files: camelCase (e.g., slugify.js)
- Route files: camelCase (e.g., postRoutes.js)

## Admin Account Setup
There is no admin registration endpoint. To promote the first admin, connect to MongoDB and run:
  db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
After that, the admin can promote/demote other users via PUT /api/admin/users/:id/role.

## Seeding Sample Data
Option 1 — API (requires admin account):
  POST /api/admin/seed-posts  (Authorization: Bearer <admin_token>)

Option 2 — Standalone script:
  cd server && node seed_posts.js
  (requires MONGO_URI in server/.env)

Both methods create a seed author (alex.rivera.seed@blogapp.internal) and insert 5 long-form tech articles. Idempotent: skips if 5+ complete posts already exist.

## Current Status
- [x] Project scaffolded
- [x] Backend: Auth routes (register, login, getMe, updateProfile, bookmarks)
- [x] Backend: Post routes (CRUD + like + bookmark + search + trending + slug + status + views + mine)
- [x] Backend: Comment routes (add with parentId, nested tree response, delete with cascade)
- [x] Backend: Admin routes (stats, user management, all posts, seed)
- [x] Backend: RBAC (adminOnly middleware, admin override on delete/update)
- [x] Backend: optionalProtect middleware for public routes that benefit from knowing user identity
- [x] Backend: Graceful MongoDB connection (warns on failure, does not crash)
- [x] Frontend: Auth pages (Login, Register with error handling)
- [x] Frontend: Blog listing (Home with search bar and tag filter pills)
- [x] Frontend: Single post page (PostDetail with like/bookmark/delete/edit buttons, view count, draft badge)
- [x] Frontend: Create/Edit post (draft/publish radio, tags, cover image)
- [x] Frontend: User profile (Profile page showing own posts)
- [x] Frontend: Bookmarks page
- [x] Frontend: Admin dashboard (stats, user management with role toggle, post management)
- [x] Frontend: Nested comment section with reply support
- [x] Backend: Follow/unfollow + following-feed (paginated)
- [x] Backend: Real-time notifications (Socket.io) — like/comment/follow, unread count, mark-all-read, delete, 24h dedupe
- [x] Backend: Image upload (multer) — POST /api/upload/image, served at /uploads
- [x] Backend: Security — helmet + express-rate-limit
- [x] Backend: AI summarization — POST /api/ai/summarize (HuggingFace BART-large-CNN)
- [x] Frontend: NotificationContext + live notifications, FollowButton, AISummarizer, ErrorBoundary, NotFound, lazy-loaded routes, toast notifications
