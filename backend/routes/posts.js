const express = require("express");
const db = require("../db");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Explore all endpoint
router.get("/", optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : null;
  const posts = db.prepare(`
    SELECT posts.*, users.username, users.display_name,
      (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as like_count,
      EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) as is_liked
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.expires_at > CURRENT_TIMESTAMP
    ORDER BY posts.created_at DESC
  `).all(userId);
  
  res.json(posts.map(p => ({ ...p, is_liked: !!p.is_liked })));
});

// Authenticated feed endpoint
router.get("/feed", requireAuth, (req, res) => {
  const userId = req.user.id;
  const before = req.query.before;

  let query = `
    SELECT posts.*, users.username, users.display_name,
      (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as like_count,
      EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) as is_liked
    FROM posts
    JOIN users ON posts.user_id = users.id
    JOIN follows ON posts.user_id = follows.following_id
    WHERE follows.follower_id = ? AND posts.expires_at > CURRENT_TIMESTAMP
  `;
  const params = [userId, userId];

  if (before) {
    query += ` AND posts.created_at < ?`;
    params.push(before);
  }

  query += ` ORDER BY posts.created_at DESC LIMIT 50`;

  const posts = db.prepare(query).all(...params);
  res.json(posts.map(p => ({ ...p, is_liked: !!p.is_liked })));
});

router.post("/", requireAuth, (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Post cannot be empty" });
  }
  const trimmedContent = content.trim();
  if (trimmedContent.length > 280) {
    return res.status(400).json({ error: "Post cannot exceed 280 characters" });
  }

  const hashtags = [...new Set((trimmedContent.match(/#(\w+)/g) || []).map(tag => tag.slice(1).toLowerCase()))];

  const result = db.prepare(`
    INSERT INTO posts (user_id, content, expires_at)
    VALUES (?, ?, datetime('now', '+24 hours'))
  `).run(userId, trimmedContent);

  const postId = result.lastInsertRowid;

  for (const tag of hashtags) {
    db.prepare(`INSERT OR IGNORE INTO hashtags (name) VALUES (?)`).run(tag);
    const hashtag = db.prepare(`SELECT id FROM hashtags WHERE name = ?`).get(tag);
    db.prepare(`INSERT OR IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)`).run(postId, hashtag.id);
  }

  const post = db.prepare(`
    SELECT posts.*, users.username, users.display_name,
      0 as like_count,
      0 as is_liked
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.id = ?
  `).get(postId);

  res.status(201).json({ ...post, is_liked: !!post.is_liked });
});

router.post("/:id/like", requireAuth, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const post = db.prepare(`SELECT id FROM posts WHERE id = ?`).get(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  db.prepare(`INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)`).run(userId, postId);

  res.json({ liked: true });
});

router.delete("/:id/like", requireAuth, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const post = db.prepare(`SELECT id FROM posts WHERE id = ?`).get(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  db.prepare(`DELETE FROM likes WHERE user_id = ? AND post_id = ?`).run(userId, postId);

  res.json({ liked: false });
});

router.delete("/:id", requireAuth, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const post = db.prepare(`SELECT user_id FROM posts WHERE id = ?`).get(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  if (post.user_id !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  db.prepare(`DELETE FROM posts WHERE id = ?`).run(postId);

  res.json({ deleted: true });
});

module.exports = router;
