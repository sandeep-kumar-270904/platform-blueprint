# MongoDB Connection & Fallback Note

## What NOT To Do 🚫
1. **Do NOT block local development on remote MongoDB Atlas IP Whitelists**:
   - Avoid hardcoding remote Atlas connection strings (`mongodb+srv://...` or `mongodb://...atlas...`) in local development if your dynamic IP is not whitelisted in MongoDB Atlas Network Access.
   - Do not remove or disable the connection timeout limits (`serverSelectionTimeoutMS: 5000`), as doing so will cause the server to hang indefinitely when network access is restricted.

2. **Do NOT commit credentials or sensitive cluster URIs**:
   - Never push production or staging `.env` files containing live MongoDB passwords or connection strings to public GitHub repositories.

---

## How The Database System Works ⚙️
To prevent development bottlenecks and network-related server crashes, the backend (`backend/db.js`) implements an automatic failover and seeding mechanism:

### 1. Primary Connection Attempt (Atlas / External URI)
- When the server boots (`node server.js`), it attempts to connect to `process.env.MONGO_URI` using Mongoose with a **5000ms selection timeout**.
- If the URI is valid and accessible (e.g., local instance or whitelisted Atlas cluster), it connects normally.

### 2. Automatic Failover to In-Memory MongoDB
- If the connection attempt fails or times out (e.g., due to IP whitelist restrictions, network connectivity issues, or firewall blocking port `27017`):
  ```
  Failed to connect to Atlas (Server selection timed out after 5000 ms). Falling back to in-memory MongoDB...
  ```
- The backend automatically initializes `mongodb-memory-server` (an isolated, local in-memory MongoDB instance).
- It binds Mongoose to this in-memory instance: `MongoDB (In-Memory) Connected: 127.0.0.1`.

### 3. Automated Local Seeding
- Immediately after connecting to the in-memory fallback, the server invokes `seedLocalFallback()` (`backend/scripts/seedLocalFallback.js`).
- This seeds default admin accounts, DSA problems, mock interview professionals, quizzes, and test users so that the UI and API endpoints work out-of-the-box without requiring manual database setup or internet connectivity.

---

## Best Practices for Developers 💡
- **Local Development**: You can either use a local MongoDB daemon (`mongodb://127.0.0.1:27017/student-hub`), or simply let the fallback mechanism run seamlessly in-memory.
- **Testing**: When running automated unit or integration tests, the in-memory database guarantees clean, predictable state across test runs.
- **Production / Staging**: Ensure proper environment variables (`MONGO_URI`) are injected via your hosting provider (e.g., Vercel, Render, AWS, Heroku) and that the hosting provider's IP ranges are whitelisted in your MongoDB Atlas cluster security rules.
