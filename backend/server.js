const express = require("express");
const cors = require("cors");
const path = require("path");
const Database = require("better-sqlite3");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");

const db = new Database("database.db");

const schema = fs.readFileSync(
  "db/schema.sql",
  "utf8"
);

db.exec(schema);

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 864000000
  }
}));
app.use(
  express.static(
    path.join(__dirname, "../client")
  )
);

app.listen(3000, () => {
  console.log("Server running");
});

app.get("/api/posts", (req, res) => {
  const posts = db.prepare(`
    SELECT
      posts.*,
      users.username,
      users.display_name
    FROM posts
    JOIN users
      ON posts.user_id = users.id
    WHERE posts.expires_at > CURRENT_TIMESTAMP
    ORDER BY posts.created_at DESC
  `).all();

  res.json(posts);
});

app.post("/api/posts", (req, res) => {
  const { content } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({
      error: "Not logged in"
    });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({
      error: "Post cannot be empty"
    });
  }

  const trimmedContent = content.trim();

  if (trimmedContent.length > 280) {
    return res.status(400).json({
      error: "Post cannot exceed 280 characters"
    });
  }

  const hashtags = [
    ...new Set(
      (trimmedContent.match(/#(\w+)/g) || [])
        .map(tag => tag.slice(1).toLowerCase())
    )
  ];

  const user = db.prepare(`
    SELECT id, username, display_name
    FROM users
    WHERE id = ?
  `).get(userId);

  if (!user) {
    req.session.destroy(() => {});

    return res.status(401).json({
      error: "User session is invalid"
    });
  }

  const result = db.prepare(`
    INSERT INTO posts
    (
      user_id,
      content,
      expires_at
    )
    VALUES
    (
      ?,
      ?,
      datetime('now', '+24 hours')
    )
  `).run(
    userId,
    trimmedContent
  );

  const postId = result.lastInsertRowid;

  for (const tag of hashtags) {
    db.prepare(`
      INSERT OR IGNORE INTO hashtags
      (name)
      VALUES (?)
    `).run(tag);

    const hashtag = db.prepare(`
      SELECT id
      FROM hashtags
      WHERE name = ?
    `).get(tag);

    db.prepare(`
      INSERT OR IGNORE INTO post_hashtags
      (
        post_id,
        hashtag_id
      )
      VALUES (?, ?)
    `).run(
      postId,
      hashtag.id
    );
  }

  const post = db.prepare(`
    SELECT
      posts.*,
      users.username,
      users.display_name
    FROM posts
    JOIN users
      ON posts.user_id = users.id
    WHERE posts.id = ?
  `).get(postId);

  console.log("New post created:", post);

  res.status(201).json(post);
});

app.get("/api/hashtags/:tag", (req, res) => {
  const tag = req.params.tag.toLowerCase();

  const posts = db.prepare(`
    SELECT
      posts.*,
      users.username,
      users.display_name
    FROM posts
    JOIN users
      ON posts.user_id = users.id
    JOIN post_hashtags
      ON posts.id = post_hashtags.post_id
    JOIN hashtags
      ON hashtags.id = post_hashtags.hashtag_id
    WHERE hashtags.name = ?
      AND posts.expires_at > CURRENT_TIMESTAMP
    ORDER BY posts.created_at DESC
  `).all(tag);

  res.json(posts);
});

app.get("/api/users/:username", (req, res) => {
  const { username } = req.params;

  const user = db.prepare(`
    SELECT id, username, display_name
    FROM users
    WHERE username = ?
  `).get(username);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const posts = db.prepare(`
    SELECT
      posts.*,
      users.username,
      users.display_name
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE users.id = ?
      AND posts.expires_at > CURRENT_TIMESTAMP
    ORDER BY posts.created_at DESC
  `).all(user.id);

  res.json({ user, posts });
});

app.post("/api/register", async (req, res) => {
  let {
    username,
    display_name,
    password
  } = req.body;

  username = username?.trim();
  display_name = display_name?.trim();

  if (!username || !display_name || !password) {
    return res.status(400).json({
      error: "Missing required fields"
    });
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({
      error: "Username must be 3-20 characters"
    });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({
      error: "Username may only contain letters, numbers, and underscores"
    });
  }

  if (display_name.length > 50) {
    return res.status(400).json({
      error: "Display name is too long"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: "Password must be at least 6 characters"
    });
  }

  const existingUser = db.prepare(`
    SELECT id
    FROM users
    WHERE username = ?
  `).get(username);

  if (existingUser) {
    return res.status(409).json({
      error: "Username already taken"
    });
  }

  const passwordHash = await bcrypt.hash(
    password,
    10
  );

  const result = db.prepare(`
    INSERT INTO users
    (
      username,
      display_name,
      password_hash
    )
    VALUES (?, ?, ?)
  `).run(
    username,
    display_name,
    passwordHash
  );

  req.session.userId = result.lastInsertRowid;

  res.status(201).json({
    success: true,
    user: {
      id: result.lastInsertRowid,
      username,
      display_name
    }
  });
});

app.post("/api/login", async (req, res) => {
  const {
    username,
    password
  } = req.body;

  const user = db.prepare(`
    SELECT *
    FROM users
    WHERE username = ?
  `).get(username);

  if (!user) {
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  const validPassword =
    await bcrypt.compare(
      password,
      user.password_hash
    );

  if (!validPassword) {
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  req.session.userId = user.id;

  res.json({
    success: true
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({
      success: true
    });
  });
});

app.get("/api/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      error: "Not logged in"
    });
  }

  if (!user) {
    req.session.destroy(() => {});
    
    return res.status(401).json({
      error: "Not logged in"
    });
  }
});