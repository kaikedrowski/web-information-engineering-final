const db = require("./db");

const SENTENCES = [
  "Just had my mind blown by this new tech! #mindblown",
  "Working on a side project this weekend. #webdev #coding",
  "Anyone got recommendations for a good book?",
  "Can't believe how fast time flies. ⏳",
  "Loving the new features on this app! #appletree",
  "Just deployed to production! #success #coding",
  "Who else is studying late tonight? 🙋‍♂️ #studygrind",
  "Need more coffee ☕️ #coffee",
  "React vs Vue, what's your pick? #react #vue",
  "Sunny days are the best days ☀️ #nature"
];

const BOT_USERS = ["alice", "bob", "charlie", "diana", "evan"];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomUser() {
  const placeholders = BOT_USERS.map(() => '?').join(',');
  const userList = db.prepare(`SELECT id FROM users WHERE username IN (${placeholders})`).all(...BOT_USERS);
  if (userList.length === 0) return null;
  return userList[getRandomInt(userList.length)];
}

function getRandomPost() {
  const postList = db.prepare("SELECT id, user_id FROM posts WHERE expires_at > CURRENT_TIMESTAMP").all();
  if (postList.length === 0) return null;
  return postList[getRandomInt(postList.length)];
}

function performRandomAction() {
  const user = getRandomUser();
  if (!user) return;

  const actionType = getRandomInt(10); // 0-3: Post, 4-6: Like, 7-8: Repost, 9: Follow

  if (actionType < 4) {
    // CREATE POST
    const content = SENTENCES[getRandomInt(SENTENCES.length)];
    const hashtags = [...new Set((content.match(/#(\w+)/g) || []).map(tag => tag.slice(1).toLowerCase()))];
    
    const result = db.prepare(`
      INSERT INTO posts (user_id, content, expires_at)
      VALUES (?, ?, datetime('now', '+24 hours'))
    `).run(user.id, content);
    
    const postId = result.lastInsertRowid;

    for (const tag of hashtags) {
      db.prepare(`INSERT OR IGNORE INTO hashtags (name) VALUES (?)`).run(tag);
      const hashtag = db.prepare(`SELECT id FROM hashtags WHERE name = ?`).get(tag);
      db.prepare(`INSERT OR IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)`).run(postId, hashtag.id);
    }
    console.log(`[BOT] User ${user.id} created a post: "${content}"`);

  } else if (actionType >= 4 && actionType < 7) {
    // LIKE POST
    const post = getRandomPost();
    if (post && post.user_id !== user.id) {
      const info = db.prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)").run(user.id, post.id);
      if (info.changes > 0) {
        db.prepare(`INSERT INTO notifications (user_id, type, source_user_id, post_id) VALUES (?, 'like', ?, ?)`).run(post.user_id, user.id, post.id);
        console.log(`[BOT] User ${user.id} liked post ${post.id}`);
      }
    }

  } else if (actionType >= 7 && actionType < 9) {
    // REPOST
    const post = getRandomPost();
    if (post && post.user_id !== user.id) {
      const info = db.prepare("INSERT OR IGNORE INTO reposts (user_id, post_id) VALUES (?, ?)").run(user.id, post.id);
      if (info.changes > 0) {
        db.prepare(`INSERT INTO notifications (user_id, type, source_user_id, post_id) VALUES (?, 'repost', ?, ?)`).run(post.user_id, user.id, post.id);
        console.log(`[BOT] User ${user.id} reposted post ${post.id}`);
      }
    }
  } else {
    // FOLLOW
    const targetUser = getRandomUser();
    if (targetUser && targetUser.id !== user.id) {
      const info = db.prepare("INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)").run(user.id, targetUser.id);
      if (info.changes > 0) {
        db.prepare(`INSERT INTO notifications (user_id, type, source_user_id) VALUES (?, 'follow', ?)`).run(targetUser.id, user.id);
        console.log(`[BOT] User ${user.id} followed user ${targetUser.id}`);
      }
    }
  }
}

function startBot(intervalMs = 10000) {
  console.log(`[BOT] Starting bot simulator, running every ${intervalMs}ms`);
  setInterval(performRandomAction, intervalMs);
}

module.exports = { startBot };
