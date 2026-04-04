# Collab Editor

A collaborative coding platform with real-time editor rooms, chat, JWT authentication, and password reset support.

## Features

- User registration and login with JWT
- Password reset email flow
- Real-time collaborative editor and chat via Socket.IO
- MongoDB-backed user store with JSON fallback support

## Local development

### Option 1: Run frontend and backend separately

#### Backend

1. Open `server/.env` and set your environment values. Example is in `server/.env.example`.
2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```
3. Start the backend:
   ```bash
   npm run dev
   ```

#### Frontend

1. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```
2. Start the frontend:
   ```bash
   npm start
   ```

### Option 2: Run the full app from the repository root

1. Install everything from the root:
   ```bash
   npm install
   ```
2. Start the server and serve the built frontend:
   ```bash
   npm start
   ```

## Password reset setup

Set these variables in `server/.env`:

- `RESET_PASSWORD_URL` � the frontend reset page URL, e.g. `http://localhost:3000/reset-password`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` � your email provider settings
- `JWT_RESET_SECRET` � a separate secret for reset tokens (optional, falls back to `JWT_SECRET`)

If SMTP is not configured, the backend will log the reset link to the console for local testing.

## Deployment

You can deploy the backend and frontend separately.

### Backend

- Use a service like Railway, Render, or Heroku.
- Point `MONGODB_URI` to your MongoDB instance.
- Configure `JWT_SECRET`, `JWT_RESET_SECRET`, `RESET_PASSWORD_URL`, and SMTP values.
- Set `CORS_ORIGIN` to your frontend URL.
- If you deploy the app as a single service, the backend can also serve the built React app.

### Frontend

- Use Vercel, Netlify, or GitHub Pages for a separate static deploy.
- Build the React app:
  ```bash
  cd client
  npm run build
  ```
- Deploy the generated `client/build` folder.
- Set `REACT_APP_API_BASE` to your backend API base URL if different from `http://localhost:5000/api`.

### One-service deploy (recommended)

- Deploy the repository root to a Node-friendly host such as Heroku or Railway.
- The root `package.json` installs backend and frontend dependencies, builds the frontend, and starts the server.
- In this setup, the backend will serve the `client/build` files automatically when `NODE_ENV=production`.

## Notes

- The backend exposes `/api/auth/forgot-password` to request a reset link and `/api/auth/reset-password` to update a password.
- Use `http://localhost:3000/forgot-password` and `http://localhost:3000/reset-password` for local testing.
