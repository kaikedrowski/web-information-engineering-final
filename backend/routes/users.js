const express = require("express");
const db = require("../db");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/:username", optionalAuth, (req, res) => {
  const { username } = req.params;
  const currentUserId = req.user ? req.user.id : null;

  const user = db.prepare(`
    SELECT id, username, display_name
    FROM users
    WHERE username = ?
  `).get(username);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const posts = db.prepare(`
    SELECT posts.*, users.username, users.display_name,
      (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as like_count,
      EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) as is_liked
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE users.id = ? AND posts.expires_at > CURRENT_TIMESTAMP
    ORDER BY posts.created_at DESC
  `).all(currentUserId, user.id);

  const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM follows WHERE following_id = ?) as follower_count,
      (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count
  `).get(user.id, user.id);

  let is_following = false;
  if (currentUserId) {
    const follow = db.prepare(`
      SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?
    `).get(currentUserId, user.id);
    if (follow) is_following = true;
  }

  user.follower_count = stats.follower_count;
  user.following_count = stats.following_count;
  user.is_following = is_following;

  res.json({ user, posts: posts.map(p => ({ ...p, is_liked: !!p.is_liked })) });
});

router.post("/:username/follow", requireAuth, (req, res) => {
  const { username } = req.params;
  const followerId = req.user.id;

  const userToFollow = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username);
  if (!userToFollow) return res.status(404).json({ error: "User not found" });

  if (followerId === userToFollow.id) {
    return res.status(400).json({ error: "Cannot follow yourself" });
  }

  db.prepare(`
    INSERT OR IGNORE INTO follows (follower_id, following_id) 
    VALUES (?, ?)
  `).run(followerId, userToFollow.id);

  res.json({ following: true });
});

router.delete("/:username/follow", requireAuth, (req, res) => {
  const { username } = req.params;
  const followerId = req.user.id;

  const userToUnfollow = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username);
  if (!userToUnfollow) return res.status(404).json({ error: "User not found" });

  db.prepare(`
    DELETE FROM follows WHERE follower_id = ? AND following_id = ?
  `).run(followerId, userToUnfollow.id);

  res.json({ following: false });
});

module.exports = router;
