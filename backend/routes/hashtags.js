const express = require("express");
const db = require("../db");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/trending", (req, res) => {
  const hashtags = db.prepare(`
    SELECT hashtags.name, COUNT(post_hashtags.post_id) as count
    FROM hashtags
    JOIN post_hashtags ON hashtags.id = post_hashtags.hashtag_id
    JOIN posts ON post_hashtags.post_id = posts.id
    WHERE posts.expires_at > CURRENT_TIMESTAMP
    GROUP BY hashtags.id
    ORDER BY count DESC
    LIMIT 10
  `).all();
  
  res.json(hashtags);
});

router.get("/:tag", optionalAuth, (req, res) => {
  const tag = req.params.tag.toLowerCase();
  const userId = req.user ? req.user.id : null;

  const posts = db.prepare(`
    SELECT posts.*, users.username, users.display_name,
      (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as like_count,
      EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) as is_liked
    FROM posts
    JOIN users ON posts.user_id = users.id
    JOIN post_hashtags ON posts.id = post_hashtags.post_id
    JOIN hashtags ON hashtags.id = post_hashtags.hashtag_id
    WHERE hashtags.name = ? AND posts.expires_at > CURRENT_TIMESTAMP
    ORDER BY posts.created_at DESC
  `).all(userId, tag);

  res.json(posts.map(p => ({ ...p, is_liked: !!p.is_liked })));
});

module.exports = router;
