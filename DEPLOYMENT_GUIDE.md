# Deployment Guide

This project consists of a React (Vite) frontend and a Node.js (Express) backend that uses WebSockets (`socket.io`) and internal Cron Jobs. Because Vercel's serverless functions **do not support WebSockets** or long-running processes, the standard production architecture is to decouple the frontend and backend hosting.

We have added a `vercel.json` to the root directory to properly configure the frontend for Vercel's SPA routing. 

## 1. Deploying the Frontend (Vercel)

Vercel is perfect for the Vite frontend. 

1. **Push to GitHub**: Make sure your latest code (including the new `vercel.json`) is pushed to your GitHub repository.
2. **Import on Vercel**: Go to your Vercel dashboard and click "Add New... > Project", then import your GitHub repository.
3. **Configure the Build Settings**:
   - **Framework Preset**: Vite (Vercel should auto-detect this)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - Add a new environment variable `VITE_API_URL` pointing to where you will host your backend (e.g., `https://studenthub-api.onrender.com/api`).
5. **Deploy!**

## 2. Deploying the Backend (Render, Railway, or Heroku)

Because the backend relies heavily on `socket.io` for live chats, collaborative whiteboards, and real-time notifications, it must be deployed on a platform that supports persistent server environments.

**Recommended Platform: Render.com (Web Service)**
1. Connect your GitHub repository to Render and create a new **Web Service**.
2. **Root Directory**: `backend` (Important! Tell Render to look inside the backend folder).
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Environment Variables**: You will need to add all the secrets from your local `.env` file to the Render dashboard. Most importantly:
   - `MONGO_URI` (Your MongoDB Atlas connection string)
   - `JWT_SECRET`
   - `FRONTEND_URL` (Set this to your newly generated Vercel URL so CORS works: `https://your-vercel-app.vercel.app`)
   - All your AI and Auth provider keys (Gemini, Google OAuth, etc.)

## Post-Deployment Checklist

- [ ] Ensure `VITE_API_URL` on Vercel perfectly matches your Render backend URL.
- [ ] Ensure `FRONTEND_URL` on Render perfectly matches your Vercel frontend URL.
- [ ] Verify that MongoDB Atlas Network Access (IP Whitelist) allows connections from anywhere (`0.0.0.0/0`), so Render can connect to your database.
