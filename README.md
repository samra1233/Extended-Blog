# InkWell — Extended Blog Platform

A full-stack MERN blog platform where users can register, log in, create and manage posts, comment, and like content.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, React Router v6, Axios, Vite
- **Backend**: Node.js, Express.js, Mongoose, JWT, bcryptjs, dotenv, cors
- **Database**: MongoDB (local or Atlas)

## How to Run Locally

### Prerequisites
- Node.js >= 18
- MongoDB running locally or a MongoDB Atlas connection string

### Server (Backend)

```bash
cd server
npm install
# Create a .env file with the variables listed below
npm run dev
```

Server runs on `http://localhost:5000`

### Client (Frontend)

```bash
cd client
npm install
# Create a .env file with the variables listed below
npm run dev
```

Client runs on `http://localhost:5173`

## Environment Variables

### Server (`/server/.env`)

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### Client (`/client/.env`)

```
VITE_API_URL=http://localhost:5000/api
```

## AI Feature

> To be added in a future phase.

Placeholder route and folder exist at `server/routes/aiRoutes.js` and `server/controllers/aiController.js`. The app architecture is designed to support this without refactoring.
