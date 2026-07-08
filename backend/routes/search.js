const express = require("express");
const db = require("../db");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", optionalAuth, (req, res) => {
  const q = req.query.q;
  if (!q) return res.json({ users: [], hashtags: [], posts: [] });

  const userId = req.user ? req.user.id : null;

  const queryLike = `%${q}%`;
  const queryTag = q.replace(/^#/, '');

  const users = db.prepare(`
    SELECT id, username, display_name
    FROM users
    WHERE username LIKE ? OR display_name LIKE ?
    LIMIT 10
  `).all(queryLike, queryLike);

  const hashtags = db.prepare(`
    SELECT name
    FROM hashtags
    WHERE name LIKE ?
    LIMIT 10
  `).all(`%${queryTag}%`);

  const posts = db.prepare(`
    SELECT posts.*, users.username, users.display_name, users.profile_picture_url,
      (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as like_count,
      (SELECT COUNT(*) FROM reposts WHERE reposts.post_id = posts.id) as repost_count,
      (SELECT COUNT(*) FROM posts replies WHERE replies.reply_to_id = posts.id) as reply_count,
      EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) as is_liked,
      EXISTS(SELECT 1 FROM reposts WHERE reposts.post_id = posts.id AND reposts.user_id = ?) as is_reposted
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.content LIKE ? AND posts.expires_at > CURRENT_TIMESTAMP
    ORDER BY posts.created_at DESC
    LIMIT 20
  `).all(userId, userId, queryLike);

  const formattedPosts = posts.map(p => ({ ...p, is_liked: !!p.is_liked, is_reposted: !!p.is_reposted }));

  res.json({ users, hashtags, posts: formattedPosts });
});

module.exports = router;
