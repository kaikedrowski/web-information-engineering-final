require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
const authRoutes = require("./routes/auth");
const postsRoutes = require("./routes/posts");
const usersRoutes = require("./routes/users");
const hashtagsRoutes = require("./routes/hashtags");
const searchRoutes = require("./routes/search");
const notificationsRoutes = require("./routes/notifications");
const { startBot } = require("./bot");
const multer = require("multer");

const app = express();

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

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
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post("/api/upload", upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }
  const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start the automated bot
  startBot(15000); // perform an action every 15 seconds

  // Periodic cleanup sweep for expired posts
  // Runs every 5 minutes (300000 ms)
  setInterval(() => {
    const result = db.prepare(`DELETE FROM posts WHERE expires_at < CURRENT_TIMESTAMP`).run();
    if (result.changes > 0) {
      console.log(`Cleanup: Deleted ${result.changes} expired posts.`);
    }
  }, 300000);
});