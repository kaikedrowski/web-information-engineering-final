const express = require("express");
const db = require("../db");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Explore all endpoint
router.get("/", optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : null;
  const posts = db.prepare(`
    SELECT posts.*, users.username, users.display_name, users.profile_picture_url,
      (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as like_count,
      (SELECT COUNT(*) FROM reposts WHERE reposts.post_id = posts.id) as repost_count,
      (SELECT COUNT(*) FROM posts replies WHERE replies.reply_to_id = posts.id) as reply_count,
      EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) as is_liked,
      EXISTS(SELECT 1 FROM reposts WHERE reposts.post_id = posts.id AND reposts.user_id = ?) as is_reposted
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.expires_at > CURRENT_TIMESTAMP
    ORDER BY posts.created_at DESC
  `).all(userId, userId);
  
  res.json(posts.map(p => ({ ...p, is_liked: !!p.is_liked })));
});

// Authenticated following feed endpoint
router.get("/feed", requireAuth, (req, res) => {
  const userId = req.user.id;
  const before = req.query.before;

  let query = `
    SELECT posts.*, users.username, users.display_name, users.profile_picture_url,
      (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as like_count,
      (SELECT COUNT(*) FROM reposts WHERE reposts.post_id = posts.id) as repost_count,
      (SELECT COUNT(*) FROM posts replies WHERE replies.reply_to_id = posts.id) as reply_count,
      EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) as is_liked,
      EXISTS(SELECT 1 FROM reposts WHERE reposts.post_id = posts.id AND reposts.user_id = ?) as is_reposted
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE (posts.user_id = ? OR posts.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?))
      AND posts.expires_at > CURRENT_TIMESTAMP
  `;
  const params = [userId, userId, userId, userId];

  if (before) {
    query += ` AND posts.created_at < ?`;
    params.push(before);
  }

  query += ` ORDER BY posts.created_at DESC LIMIT 50`;

  const posts = db.prepare(query).all(...params);
  res.json(posts.map(p => ({ ...p, is_liked: !!p.is_liked })));
});

router.post("/", requireAuth, (req, res) => {
  const { content, media_url, reply_to_id, duration } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Post cannot be empty" });
  }
  const trimmedContent = content.trim();
  if (trimmedContent.length > 280) {
    return res.status(400).json({ error: "Post cannot exceed 280 characters" });
  }

  const hashtags = [...new Set((trimmedContent.match(/#(\w+)/g) || []).map(tag => tag.slice(1).toLowerCase()))];

  let timeModifier = '+24 hours';
  if (duration === '3d') timeModifier = '+3 days';
  if (duration === '1w') timeModifier = '+7 days';

  const result = db.prepare(`
    INSERT INTO posts (user_id, content, media_url, reply_to_id, expires_at)
    VALUES (?, ?, ?, ?, datetime('now', ?))
  `).run(userId, trimmedContent, media_url || null, reply_to_id || null, timeModifier);

  const postId = result.lastInsertRowid;

  for (const tag of hashtags) {
    db.prepare(`INSERT OR IGNORE INTO hashtags (name) VALUES (?)`).run(tag);
    const hashtag = db.prepare(`SELECT id FROM hashtags WHERE name = ?`).get(tag);
    db.prepare(`INSERT OR IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)`).run(postId, hashtag.id);
  }

  if (reply_to_id) {
    const parentPost = db.prepare(`SELECT user_id FROM posts WHERE id = ?`).get(reply_to_id);
    if (parentPost && parentPost.user_id !== userId) {
      db.prepare(`INSERT INTO notifications (user_id, type, source_user_id, post_id) VALUES (?, 'reply', ?, ?)`).run(parentPost.user_id, userId, postId);
    }
  }

  const post = db.prepare(`
    SELECT posts.*, users.username, users.display_name, users.profile_picture_url,
      0 as like_count,
      0 as repost_count,
      0 as reply_count,
      0 as is_liked,
      0 as is_reposted
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.id = ?
  `).get(postId);

  res.status(201).json({ ...post, is_liked: !!post.is_liked, is_reposted: !!post.is_reposted });
});

router.post("/:id/like", requireAuth, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const post = db.prepare(`SELECT id, user_id FROM posts WHERE id = ?`).get(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const info = db.prepare(`INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)`).run(userId, postId);
  
  if (info.changes > 0 && post.user_id !== userId) {
    db.prepare(`INSERT INTO notifications (user_id, type, source_user_id, post_id) VALUES (?, 'like', ?, ?)`).run(post.user_id, userId, postId);
  }

  res.json({ liked: true });
});

router.delete("/:id/like", requireAuth, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const post = db.prepare(`SELECT id FROM posts WHERE id = ?`).get(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  db.prepare(`DELETE FROM likes WHERE user_id = ? AND post_id = ?`).run(userId, postId);
  // Also remove the notification
  db.prepare(`DELETE FROM notifications WHERE user_id = (SELECT user_id FROM posts WHERE id = ?) AND source_user_id = ? AND type = 'like' AND post_id = ?`).run(postId, userId, postId);

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

router.post("/:id/repost", requireAuth, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const post = db.prepare(`SELECT id, user_id FROM posts WHERE id = ?`).get(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const info = db.prepare(`INSERT OR IGNORE INTO reposts (user_id, post_id) VALUES (?, ?)`).run(userId, postId);
  
  if (info.changes > 0 && post.user_id !== userId) {
    db.prepare(`INSERT INTO notifications (user_id, type, source_user_id, post_id) VALUES (?, 'repost', ?, ?)`).run(post.user_id, userId, postId);
  }

  res.json({ reposted: true });
});

router.delete("/:id/repost", requireAuth, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const post = db.prepare(`SELECT id FROM posts WHERE id = ?`).get(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  db.prepare(`DELETE FROM reposts WHERE user_id = ? AND post_id = ?`).run(userId, postId);
  db.prepare(`DELETE FROM notifications WHERE user_id = (SELECT user_id FROM posts WHERE id = ?) AND source_user_id = ? AND type = 'repost' AND post_id = ?`).run(postId, userId, postId);

  res.json({ reposted: false });
});

module.exports = router;
