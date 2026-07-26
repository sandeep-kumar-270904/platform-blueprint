# Dependencies and Configuration Note

## Frontend Dependencies
- **React & ReactDOM (^18.3.1)**: Core UI framework.
- **Vite (^5.4.19)**: Build tool and development server.
- **Tailwind CSS, PostCSS, Autoprefixer**: Styling utility.
- **Shadcn UI (Radix UI + class-variance-authority)**: Headless and accessible components.
- **React Router DOM**: Client-side routing.
- **Socket.io-client**: Real-time bidirectional event-based communication.
- **Framer Motion**: Animations.
- **Lucide React**: Iconography.
- **Date-fns**: Modern JavaScript date utility library.

## Backend Dependencies
- **Node.js & Express**: Core runtime and framework.
- **Mongoose**: MongoDB object modeling.
- **Socket.io**: Real-time communication server.
- **JSON Web Token (JWT) & bcryptjs**: Authentication and security.
- **@google/generative-ai**: Google Gemini API client for AI features.
- **Cors, dotenv**: Environment and CORS configuration.

## Setup Instructions for README
1. Clone the repository.
2. Ensure you have Node.js and MongoDB installed.
3. In the `backend` folder, run `npm install` to install backend dependencies.
4. Set up the `.env` file in the `backend` folder with `MONGO_URI`, `JWT_SECRET`, and `GEMINI_API_KEY`.
5. Run the backend server with `npm start` (or `node server.js`).
6. In the root frontend directory, run `npm install` to install frontend dependencies.
7. Start the Vite development server with `npm run dev`.
