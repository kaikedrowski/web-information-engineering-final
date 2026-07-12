require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const fs = require("fs");
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

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
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

const frontendDistPath = path.join(__dirname, "../frontend/dist");
const frontendStaticPath = fs.existsSync(frontendDistPath) ? frontendDistPath : path.join(__dirname, "../frontend");
app.use(express.static(frontendStaticPath));

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

  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol || "http";
  const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

const PORT = process.env.PORT || 3000;
app.get("/api/test-bcrypt", (req, res) => {
  const bcrypt = require("bcryptjs");
  const start = Date.now();
  const hash = bcrypt.hashSync("password123", 10);
  const time = Date.now() - start;
  res.json({ time_ms: time, hash });
});

app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Not found" });
  }

  res.sendFile(path.join(frontendStaticPath, "index.html"));
});

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
