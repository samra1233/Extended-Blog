# CONTEXT.md — InkWell Blog Platform

## Purpose
This file exists to give any AI coding agent (or developer) instant full context of the project so they can continue work without asking questions.

## Project Summary
InkWell is a MERN-stack extended blog platform built as a university project. It is a monorepo with separate client and server folders.

## Monorepo Structure
- /client → React + Tailwind frontend (Vite-based)
- /server → Node.js + Express backend (REST API)

## Tech Stack
- Frontend: React, Tailwind CSS, React Router v6, Axios
- Backend: Node.js, Express.js, Mongoose, JWT, bcryptjs, dotenv, cors
- Database: MongoDB (local or Atlas)
- AI Feature: NOT YET ADDED — placeholder route and folder exist at server/routes/aiRoutes.js and server/controllers/aiController.js

## Authentication
- JWT stored in localStorage
- Protected routes on both frontend (React Router guards) and backend (middleware)
- Role field on User: 'user' (default) or 'admin'

## Key Features (Current)
1. User Registration & Login (with role in response)
2. Create, Read, Update, Delete Blog Posts
3. Comment on posts (with nested reply support via parentId)
4. Like posts (toggle)
5. Bookmark posts (toggle, stored in User.bookmarks)
6. User profile page
7. Search posts by title/content (GET /api/posts/search?q=)
8. Filter posts by tag (GET /api/posts?tag=)
9. Draft vs Published post status
10. Auto-generated slugs (unique, derived from title)
11. View counter on posts (auto-incremented on GET)
12. Trending posts endpoint (most viewed)
13. Admin dashboard (stats, user management, post management)
14. Role-Based Access Control (adminOnly middleware)
15. JSON data fallback layer (server/services/dataService.js, server/data/)

## Planned Features
- AI feature (TBD) — the app is structured to support adding one. See server/routes/aiRoutes.js.

## API Base URL
- Development: http://localhost:5000/api

## API Routes

### Auth
- POST   /api/auth/register          → register (returns role)
- POST   /api/auth/login             → login (returns role)
- GET    /api/auth/me                → get current user (protected)
- PUT    /api/auth/me                → update profile name/bio/avatar (protected)
- GET    /api/auth/bookmarks         → get user's bookmarked posts (protected)
- PUT    /api/auth/bookmarks/:postId → toggle bookmark (protected)

### Posts
- GET    /api/posts                  → all published posts (?tag=, ?author=)
- GET    /api/posts/search?q=        → search by title/content
- GET    /api/posts/trending         → top 10 most viewed
- GET    /api/posts/:id              → single post by ID or slug (increments views)
- POST   /api/posts                  → create post with slug + status (protected)
- PUT    /api/posts/:id              → update post (author or admin)
- DELETE /api/posts/:id              → delete post (author or admin)
- PUT    /api/posts/:id/like         → toggle like (protected)
- PUT    /api/posts/:id/bookmark     → toggle bookmark (protected)

### Comments
- GET    /api/comments/:postId       → get nested comment tree
- POST   /api/comments/:postId       → add comment (supports parentId for replies) (protected)
- DELETE /api/comments/:id           → delete comment + replies (author or admin)

### Admin (require: authenticated + role=admin)
- GET    /api/admin/stats            → user/post/comment counts + top posts
- GET    /api/admin/users            → list all users
- DELETE /api/admin/users/:id        → delete user and their content
- PUT    /api/admin/users/:id/role   → promote/demote to admin/user
- GET    /api/admin/posts            → all posts including drafts

### AI (placeholder)
- /api/ai/* → not yet implemented

## Environment Variables Needed
### Server (/server/.env)
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

### Client (/client/.env)
VITE_API_URL=http://localhost:5000/api

## Database Models

### User
- name, email, password (hashed), avatar, bio
- role: 'user' | 'admin' (default: 'user')
- bookmarks: [ObjectId ref Post]
- createdAt

### Post
- title, content, author (ref: User)
- slug: unique, auto-generated from title
- tags: [String]
- likes: [ObjectId ref User]
- coverImage
- status: 'draft' | 'published' (default: 'published')
- views: Number (default: 0)
- createdAt, updatedAt

### Comment
- content, author (ref: User), post (ref: Post)
- parentId: ObjectId ref Comment (null = top-level)
- createdAt

## New Files Added (Extended Phase)
### Server
- server/utils/slugify.js          — slug generation utility
- server/controllers/adminController.js — admin operations
- server/routes/adminRoutes.js     — admin API routes
- server/services/dataService.js   — JSON fallback data service abstraction
- server/data/posts.json           — empty JSON seed for dev without MongoDB
- server/data/users.json           — empty JSON seed
- server/data/comments.json        — empty JSON seed

### Client
- client/src/pages/AdminDashboard.jsx — admin UI (stats, users, posts tabs)
- client/src/pages/Bookmarks.jsx   — bookmarked posts page

## File Naming Convention
- React components: PascalCase (e.g., BlogCard.jsx)
- Utility files: camelCase (e.g., authHelper.js)
- Route files: camelCase (e.g., postRoutes.js)

## Admin Account Setup
There is no admin registration endpoint. To promote the first admin, connect to MongoDB and run:
  db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
After that, the admin can promote/demote other users via PUT /api/admin/users/:id/role.

## Current Status
- [x] Project scaffolded
- [x] Backend: Auth routes (register, login, getMe, updateProfile, bookmarks)
- [x] Backend: Post routes (CRUD + like + bookmark + search + trending + slug + status + views)
- [x] Backend: Comment routes (add with parentId, nested tree response, delete with cascade)
- [x] Backend: Admin routes (stats, user management, all posts)
- [x] Backend: RBAC (adminOnly middleware, admin override on delete/update)
- [x] Backend: JSON fallback service layer (dataService.js)
- [x] Backend: Graceful MongoDB connection (won't crash if DB is unavailable)
- [x] Frontend: Auth pages (Login, Register with error handling)
- [x] Frontend: Blog listing (Home with search bar and tag filter pills)
- [x] Frontend: Single post page (PostDetail with like/bookmark/delete/edit buttons, view count, draft badge)
- [x] Frontend: Create/Edit post (draft/publish radio, tags, cover image)
- [x] Frontend: User profile (Profile page showing own posts)
- [x] Frontend: Bookmarks page
- [x] Frontend: Admin dashboard (stats, user management with role toggle, post management)
- [x] Frontend: Nested comment section with reply support
- [ ] AI feature: NOT YET STARTED
