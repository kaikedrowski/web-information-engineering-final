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

const BOT_USERS_DATA = [
  { username: "alice", display_name: "Alice Wonderland" },
  { username: "bob", display_name: "Bob Builder" },
  { username: "charlie", display_name: "Charlie Chaplin" },
  { username: "diana", display_name: "Diana Prince" },
  { username: "evan", display_name: "Evan You" }
];
const BOT_USERS = BOT_USERS_DATA.map(u => u.username);

function initializeBots() {
  const bcrypt = require("bcryptjs");
  const passwordHash = bcrypt.hashSync("password123", 6);
  for (const user of BOT_USERS_DATA) {
    db.prepare(`
      INSERT OR IGNORE INTO users (username, display_name, password_hash)
      VALUES (?, ?, ?)
    `).run(user.username, user.display_name, passwordHash);
  }
}

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

  const actionType = getRandomInt(12); // 0-2: Post, 3-5: Reply, 6-8: Like, 9-10: Repost, 11: Follow

  if (actionType < 3) {
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

  } else if (actionType >= 3 && actionType < 6) {
    // REPLY TO POST
    const post = getRandomPost();
    if (post) {
      const content = SENTENCES[getRandomInt(SENTENCES.length)];
      const hashtags = [...new Set((content.match(/#(\w+)/g) || []).map(tag => tag.slice(1).toLowerCase()))];
      
      const result = db.prepare(`
        INSERT INTO posts (user_id, content, reply_to_id, expires_at)
        VALUES (?, ?, ?, datetime('now', '+24 hours'))
      `).run(user.id, content, post.id);
      
      const postId = result.lastInsertRowid;

      for (const tag of hashtags) {
        db.prepare(`INSERT OR IGNORE INTO hashtags (name) VALUES (?)`).run(tag);
        const hashtag = db.prepare(`SELECT id FROM hashtags WHERE name = ?`).get(tag);
        db.prepare(`INSERT OR IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)`).run(postId, hashtag.id);
      }
      
      if (post.user_id !== user.id) {
        db.prepare(`INSERT INTO notifications (user_id, type, source_user_id, post_id) VALUES (?, 'reply', ?, ?)`).run(post.user_id, user.id, postId);
      }
      
      console.log(`[BOT] User ${user.id} replied to post ${post.id}: "${content}"`);
    }

  } else if (actionType >= 6 && actionType < 9) {
    // LIKE POST
    const post = getRandomPost();
    if (post && post.user_id !== user.id) {
      const info = db.prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)").run(user.id, post.id);
      if (info.changes > 0) {
        db.prepare(`INSERT INTO notifications (user_id, type, source_user_id, post_id) VALUES (?, 'like', ?, ?)`).run(post.user_id, user.id, post.id);
        console.log(`[BOT] User ${user.id} liked post ${post.id}`);
      }
    }

  } else if (actionType >= 9 && actionType < 11) {
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
  initializeBots();
  console.log(`[BOT] Starting bot simulator, running every ${intervalMs}ms`);
  setInterval(performRandomAction, intervalMs);
}

module.exports = { startBot };
