# Apple Tree

A microblogging platform where users can post short updates, follow others, and view a feed of expiring posts. 

**Live Demo:** [https://appl-tree.netlify.app/](https://appl-tree.netlify.app/)

## Features
- JWT Authentication
- Posts with `#hashtags`
- Like and unlike posts
- Follow and unfollow users
- Trending hashtags based on likes in the last 24h
- Posts expire after 24 hours and are automatically cleaned up

## Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS)
- npm

### Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables by copying the example file:
   ```bash
   cp .env.example .env
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```
   The backend will run on `http://localhost:3000`. It uses SQLite, so the `apple-tree.db` file will automatically be created.

### Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## Database & Accounts

To populate the database with initial testing data (users, posts, hashtags, follows, and likes), run the seed script from the `backend` directory:

```bash
cd backend
npm run seed
```

This will create several test accounts that you can use to log in immediately:
- **Username**: `alice` / **Password**: `password123`
- **Username**: `bob` / **Password**: `password123`
- **Username**: `charlie` / **Password**: `password123`
- **Username**: `diana` / **Password**: `password123`
- **Username**: `evan` / **Password**: `password123`

To view registered accounts or inspect the database manually, you can use the `sqlite3` CLI from the project root:

```bash
sqlite3 backend/db/apple-tree.db "SELECT id, username, display_name FROM users;"
```