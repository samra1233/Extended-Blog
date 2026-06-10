# InkWell — Extended Blog Platform

A full-stack MERN blog platform where users can register, log in, create and manage posts, comment with nested replies, like and bookmark content, and explore an admin dashboard.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS (v3), React Router v6, Axios, Vite
- **Backend**: Node.js, Express.js, Mongoose, JWT, bcryptjs, dotenv, cors, express-async-handler
- **Database**: MongoDB (local or Atlas)

## Features

- User registration and login with role-based access (user / admin)
- Create, edit, and delete blog posts with draft/publish status
- Nested comments with reply support
- Like and bookmark posts
- Search posts by title/content; filter by tag or author
- View counter and trending posts
- Admin dashboard: platform stats, user management, post management
- Seed 5 sample blog posts via admin API or standalone script

## How to Run Locally

### Prerequisites
- Node.js >= 18
- MongoDB running locally or a MongoDB Atlas connection string

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

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_ORIGIN=http://localhost:5173
```

`CLIENT_ORIGIN` is optional and defaults to `http://localhost:5173`. Set it in production to your deployed frontend URL.

### Client (`/client/.env`)

```
VITE_API_URL=http://localhost:5000/api
```

## Admin Setup

There is no admin registration endpoint. To promote the first admin:

1. Connect to MongoDB and run:
   ```js
   db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
   ```
2. After that, the admin can promote/demote other users via the dashboard or directly via:
   ```
   PUT /api/admin/users/:id/role   { "role": "admin" | "user" }
   ```

## Seeding Sample Posts

**Option 1 — Admin API** (requires an admin account):
```
POST /api/admin/seed-posts
Authorization: Bearer <admin_token>
```

**Option 2 — Standalone script**:
```bash
cd server
node seed_posts.js
```

Both methods insert 5 long-form tech blog posts authored by a seed account (`alex.rivera.seed@blogapp.internal`). The operation is idempotent — it skips if 5 or more complete posts already exist.

## API Overview

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user (protected) |
| PUT | /api/auth/me | Update profile (protected) |
| GET | /api/auth/bookmarks | Get bookmarks (protected) |
| PUT | /api/auth/bookmarks/:postId | Toggle bookmark (protected) |
| GET | /api/posts | All published posts |
| GET | /api/posts/search?q= | Search posts |
| GET | /api/posts/trending | Top 10 most viewed |
| GET | /api/posts/mine | Current user's posts (protected) |
| GET | /api/posts/:id | Single post by ID or slug |
| POST | /api/posts | Create post (protected) |
| PUT | /api/posts/:id | Update post (protected) |
| DELETE | /api/posts/:id | Delete post (protected) |
| PUT | /api/posts/:id/like | Toggle like (protected) |
| PUT | /api/posts/:id/bookmark | Toggle bookmark (protected) |
| GET | /api/comments/:postId | Get comment tree |
| POST | /api/comments/:postId | Add comment (protected) |
| DELETE | /api/comments/:id | Delete comment (protected) |
| GET | /api/admin/stats | Platform stats (admin) |
| GET | /api/admin/users | All users (admin) |
| DELETE | /api/admin/users/:id | Delete user + content (admin) |
| PUT | /api/admin/users/:id/role | Set user role (admin) |
| GET | /api/admin/posts | All posts incl. drafts (admin) |
| POST | /api/admin/seed-posts | Seed sample posts (admin) |
| GET | /health | Server health check |

## AI Feature

> To be added in a future phase.

Placeholder route and folder exist at `server/routes/aiRoutes.js` and `server/controllers/aiController.js`. The app architecture is designed to support this without major refactoring.
