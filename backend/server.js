require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
const authRoutes = require("./routes/auth");
const postsRoutes = require("./routes/posts");
const usersRoutes = require("./routes/users");
const hashtagsRoutes = require("./routes/hashtags");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client")));

app.use("/api", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/hashtags", hashtagsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Periodic cleanup sweep for expired posts
  // Runs every 5 minutes (300000 ms)
  setInterval(() => {
    const result = db.prepare(`DELETE FROM posts WHERE expires_at < CURRENT_TIMESTAMP`).run();
    if (result.changes > 0) {
      console.log(`Cleanup: Deleted ${result.changes} expired posts.`);
    }
  }, 300000);
});