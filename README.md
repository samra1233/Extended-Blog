# InkWell — Modern Full-Stack Blog Platform

InkWell is a full-stack blogging web application built with React 19, Node.js, Express, and MongoDB. It supports post management, nested comment threads, user authentication with roles, real-time notifications via WebSockets (Socket.io), and AI-assisted content summarization.

---

## ⚡ Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local instance or MongoDB Atlas URI)

### Running Client & Server Together (Single Command)

From the project root (`extended-blog`):

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start Development Servers**:
   ```bash
   npm run dev
   ```

*(Client runs at `http://localhost:5173`, Server runs at `http://localhost:5000`)*

---

## 📁 Project Structure

```text
extended-blog/
├── client/          # Vite + React 19 Frontend
│   ├── src/
│   │   ├── api/     # Axios client configuration
│   │   ├── components/
│   │   ├── context/ # Auth & Socket context
│   │   └── pages/
├── server/          # Node.js + Express 5 Backend API
│   ├── config/      # DB Connection
│   ├── controllers/ # Route logic
│   ├── middleware/  # Auth, file uploads, error handling
│   ├── models/      # Mongoose schemas
│   └── routes/      # API Endpoints
└── package.json     # Orchestration scripts
```

---

## ⚙️ Environment Configuration

### Server (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/extended-blog
JWT_SECRET=your_jwt_secret_key
CLIENT_ORIGIN=http://localhost:5173
HF_API_TOKEN=your_huggingface_token
NODE_ENV=development
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🛠 Features

- **Authentication & Roles**: JWT-based authentication with user & admin role levels.
- **Publishing Workflow**: Draft and published post management, markdown support, tag filtering, and search.
- **Nested Comments**: Multilevel comment replies and moderation capabilities.
- **Live Notifications**: Instant updates via Socket.io when users receive likes, comments, or followers.
- **AI Post Summaries**: Automated short summary generation utilizing HuggingFace BART inference model.

---

## 📄 License
ISC
