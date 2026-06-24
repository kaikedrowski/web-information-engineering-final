const express = require("express");
const cors = require("cors");
const path = require("path");
const Database = require("better-sqlite3");
const fs = require("fs");

const db = new Database("database.db");

const schema = fs.readFileSync(
  "db/schema.sql",
  "utf8"
);

db.exec(schema);

//TODO CHG USER DEMO TO REAL USERS
db.prepare(`
  INSERT OR IGNORE INTO users
  (
    id,
    username,
    display_name,
    password_hash
  )
  VALUES
  (
    1,
    'demo',
    'Demo User',
    'temp'
  )
`).run();

const app = express();

app.use(cors());
app.use(express.json());

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
  const { userId, content } = req.body;

  const hashtags = [
    ...new Set(
      (content.match(/#(\w+)/g) || [])
        .map(tag => tag.slice(1).toLowerCase())
    )
  ];

  console.log(hashtags);

  if (!userId) {
    return res.status(400).json({
      error: "Missing userId"
    });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({
      error: "Post cannot be empty"
    });
  }

  if (content.length > 280) {
    return res.status(400).json({
      error: "Post cannot exceed 280 characters"
    });
  }

  const user = db.prepare(`
    SELECT id
    FROM users
    WHERE id = ?
  `).get(userId);

  if (!user) {
    return res.status(404).json({
      error: "User not found"
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
    content.trim()
  );

  const postId = result.lastInsertRowid;

  for (const tag of hashtags) {
    const cleanTag = tag.trim().toLowerCase();

    if (!cleanTag) {
      continue;
    }

    db.prepare(`
      INSERT OR IGNORE INTO hashtags
      (name)
      VALUES (?)
    `).run(cleanTag);

    const hashtag = db.prepare(`
      SELECT id
      FROM hashtags
      WHERE name = ?
    `).get(cleanTag);

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