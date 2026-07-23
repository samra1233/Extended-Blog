# InkWell — Extended Blog Platform

A full-stack MERN blog platform where users can register, log in, create and manage posts, comment with nested replies, like and bookmark content, get real-time notifications, and explore an admin dashboard.

**Project status: complete.**

## Tech Stack

- **Frontend**: React 19, Tailwind CSS (v3), React Router v6, Axios, Vite, Socket.io Client, React Markdown
- **Backend**: Node.js, Express 5, Mongoose, JWT (30-day expiry), bcryptjs, Socket.io, Multer, Helmet, express-rate-limit, dotenv, cors, express-async-handler
- **Database**: MongoDB (local or Atlas)
- **AI**: HuggingFace Inference API (BART large CNN) for post summarization

## Features

- User registration and login with role-based access (user / admin)
- Create, edit, and delete blog posts with draft/publish status
- Nested comments with reply support
- Like and bookmark posts
- Search posts by title/content; filter by tag or author
- View counter and trending posts
- **Real-time notifications** — live updates via Socket.io when someone likes your post, comments on it, or follows you, with a 24-hour dedupe window so repeat actions don't spam the same notification; unread count and history backed by MongoDB
- **AI post summarization** — one-click summary of a post's content via HuggingFace's BART large CNN model
- **Image uploads** — authenticated cover-image upload endpoint (Multer), served as static files
- Security hardening: Helmet security headers, rate limiting (strict on auth routes, relaxed on general API), CORS restricted to a known frontend origin
- Admin dashboard: platform stats, user management, post management
- Seed 5 sample blog posts via admin API or standalone script

## How to Run Locally

### Prerequisites

- Node.js >= 18
- MongoDB running locally or a MongoDB Atlas connection string
- (Optional, for AI summarization) A free HuggingFace API token

### Server (Backend)

```bash
cd server
npm install
# Create a .env file (see Environment Variables below)
npm run dev
```

Server runs on `http://localhost:5000`

### Client (Frontend)

```bash
cd client
npm install
# Create a .env file (see Environment Variables below)
npm run dev
```

Client runs on `http://localhost:5173`

## Environment Variables

### Server (`/server/.env`)

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_ORIGIN=http://localhost:5173
HF_API_TOKEN=your_huggingface_api_token
NODE_ENV=development

`CLIENT_ORIGIN` is optional and defaults to `http://localhost:5173`. Set it in production to your deployed frontend URL. `HF_API_TOKEN` is required for the AI summarization feature — without it, the `/api/ai/summarize` endpoint returns a 503.

### Client (`/client/.env`)

VITE_API_URL=http://localhost:5000/api

## Admin Setup

There is no admin registration endpoint. To promote the first admin:

1. Connect to MongoDB and run:

```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } });
```

2. After that, the admin can promote/demote other users via the dashboard or directly via:

PUT /api/admin/users/:id/role { "role": "admin" | "user" }

## Seeding Sample Posts

**Option 1 — Admin API** (requires an admin account):

POST /api/admin/seed-posts
Authorization: Bearer <admin_token>

**Option 2 — Standalone script**:

```bash
cd server
node seed_posts.js
```

Both methods insert 5 long-form tech blog posts authored by a seed account (`alex.rivera.seed@blogapp.internal`). The operation is idempotent — it skips if 5 or more complete posts already exist.

## API Overview

| Method | Route                       | Description                                         |
| ------ | --------------------------- | --------------------------------------------------- |
| POST   | /api/auth/register          | Register                                            |
| POST   | /api/auth/login             | Login                                               |
| GET    | /api/auth/me                | Current user (protected)                            |
| PUT    | /api/auth/me                | Update profile (protected)                          |
| GET    | /api/auth/bookmarks         | Get bookmarks (protected)                           |
| PUT    | /api/auth/bookmarks/:postId | Toggle bookmark (protected)                         |
| GET    | /api/posts                  | All published posts                                 |
| GET    | /api/posts/search?q=        | Search posts                                        |
| GET    | /api/posts/trending         | Top 10 most viewed                                  |
| GET    | /api/posts/mine             | Current user's posts (protected)                    |
| GET    | /api/posts/:id              | Single post by ID or slug                           |
| POST   | /api/posts                  | Create post (protected)                             |
| PUT    | /api/posts/:id              | Update post (protected)                             |
| DELETE | /api/posts/:id              | Delete post (protected)                             |
| PUT    | /api/posts/:id/like         | Toggle like (protected)                             |
| PUT    | /api/posts/:id/bookmark     | Toggle bookmark (protected)                         |
| GET    | /api/comments/:postId       | Get comment tree                                    |
| POST   | /api/comments/:postId       | Add comment (protected)                             |
| DELETE | /api/comments/:id           | Delete comment (protected)                          |
| GET    | /api/notifications          | Latest 20 notifications + unread count (protected)  |
| PUT    | /api/notifications/read-all | Mark all notifications as read (protected)          |
| DELETE | /api/notifications/:id      | Delete a notification (protected)                   |
| POST   | /api/ai/summarize           | Summarize post content via HuggingFace BART         |
| POST   | /api/upload/image           | Upload a cover image, returns `{ url }` (protected) |
| GET    | /api/admin/stats            | Platform stats (admin)                              |
| GET    | /api/admin/users            | All users (admin)                                   |
| DELETE | /api/admin/users/:id        | Delete user + content (admin)                       |
| PUT    | /api/admin/users/:id/role   | Set user role (admin)                               |
| GET    | /api/admin/posts            | All posts incl. drafts (admin)                      |
| POST   | /api/admin/seed-posts       | Seed sample posts (admin)                           |
| GET    | /health                     | Server health check                                 |

## Real-Time Notifications

The server keeps a persistent Socket.io connection per logged-in user (joined to a private room keyed by their user ID, authenticated via JWT on handshake). Three events generate a notification: a like, a comment, or a new follower. Each is deduplicated so the same sender/type/post combination won't create a second notification within 24 hours. Notifications are written to MongoDB and pushed to the client instantly over the socket; the client also fetches the latest 20 plus unread count on load so a fresh session isn't empty.

## AI Post Summarization

`POST /api/ai/summarize` sends a post's content (truncated to ~700 words to fit the model's context window) to HuggingFace's hosted `facebook/bart-large-cnn` model and returns a generated summary. No authentication is required since post content is already public. Requires `HF_API_TOKEN` to be set on the server; the endpoint returns a clear error if the token is missing or if the model is still cold-starting.

## Database Models

### User

- name, email, password (bcrypt-hashed, pre-save hook)
- bio, avatar (default: '')
- role: 'user' | 'admin' (default: 'user')
- bookmarks: [ObjectId ref Post]
- createdAt

### Post

- title, content, author (ref: User)
- slug: unique, sparse, auto-generated from title
- tags: [String], likes: [ObjectId ref User]
- coverImage: String, status: 'draft' | 'published'
- views: Number, createdAt, updatedAt
- Text index on title + content (for search)

### Comment

- content, author (ref: User), post (ref: Post)
- parentId: ObjectId ref Comment (null = top-level)
- createdAt

### Notification

- recipient, sender (ref: User), type: 'like' | 'comment' | 'follow'
- post: ObjectId ref Post (nullable), read: Boolean, createdAt
- Compound index on (recipient, read, createdAt)

## Project Structure

server/
index.js Express + HTTP + Socket.io entry point
seed_posts.js Standalone seed script
config/db.js Mongoose connect
controllers/ auth, post, comment, admin, ai, (upload via middleware)
middleware/ authMiddleware (protect, adminOnly, optionalProtect), upload (multer)
models/ User, Post, Comment, Notification
routes/ auth, post, comment, admin, ai, notification
socket.js Socket.io instance getter/setter shared across controllers
utils/ slugify, generateToken, createNotification

client/src/
App.jsx Routes + provider wrappers
context/ AuthContext, NotificationContext (Socket.io connection)
components/ Navbar, BlogCard, CommentSection, ProtectedRoute, AdminRoute
pages/ Home, Login, Register, PostDetail, CreatePost, EditPost,
Profile, Bookmarks, AdminDashboard

## Frontend Routes

| Path       | Component      | Guard                          |
| ---------- | -------------- | ------------------------------ |
| /          | Home           | public                         |
| /login     | Login          | public                         |
| /register  | Register       | public                         |
| /posts/:id | PostDetail     | public (id = ObjectId or slug) |
| /create    | CreatePost     | protected                      |
| /edit/:id  | EditPost       | protected                      |
| /profile   | Profile        | protected                      |
| /bookmarks | Bookmarks      | protected                      |
| /admin     | AdminDashboard | admin only                     |
