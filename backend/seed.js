const db = require("./db");
const bcrypt = require("bcryptjs");

console.log("Seeding database...");

// Clear existing data (optional, but good for a fresh start)
db.prepare("DELETE FROM likes").run();
db.prepare("DELETE FROM reposts").run();
db.prepare("DELETE FROM post_hashtags").run();
db.prepare("DELETE FROM hashtags").run();
db.prepare("DELETE FROM notifications").run();
db.prepare("DELETE FROM follows").run();
db.prepare("DELETE FROM posts").run();
db.prepare("DELETE FROM users").run();

// 1. Seed Users
const saltRounds = 6;
const passwordHash = bcrypt.hashSync("password123", saltRounds);

const users = [
  { username: "alice", display_name: "Alice Wonderland" },
  { username: "bob", display_name: "Bob Builder" },
  { username: "charlie", display_name: "Charlie Chaplin" },
  { username: "diana", display_name: "Diana Prince" },
  { username: "evan", display_name: "Evan You" }
];

const insertUser = db.prepare("INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)");
const userIds = {};

for (const user of users) {
  const result = insertUser.run(user.username, user.display_name, passwordHash);
  userIds[user.username] = result.lastInsertRowid;
}

// 2. Seed Follows
const insertFollow = db.prepare("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)");
insertFollow.run(userIds.alice, userIds.bob);
insertFollow.run(userIds.alice, userIds.charlie);
insertFollow.run(userIds.bob, userIds.alice);
insertFollow.run(userIds.charlie, userIds.diana);
insertFollow.run(userIds.evan, userIds.alice);

// 3. Seed Posts & Hashtags
const insertPost = db.prepare("INSERT INTO posts (user_id, content, expires_at) VALUES (?, ?, datetime('now', '+24 hours'))");
const insertHashtag = db.prepare("INSERT OR IGNORE INTO hashtags (name) VALUES (?)");
const getHashtag = db.prepare("SELECT id FROM hashtags WHERE name = ?");
const insertPostHashtag = db.prepare("INSERT INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)");

const postsData = [
  { user: "alice", content: "Just setting up my #appletree account! So excited! #hello", tags: ["appletree", "hello"] },
  { user: "bob", content: "Does anyone know a good #react tutorial? #webdev", tags: ["react", "webdev"] },
  { user: "charlie", content: "Can't believe how fast this new framework is. #react #frontend", tags: ["react", "frontend"] },
  { user: "diana", content: "Nature is healing. #photography", tags: ["photography"] },
  { user: "evan", content: "Testing out the new expiring posts feature. #webdev", tags: ["webdev"] }
];

const postIds = [];

for (const p of postsData) {
  const result = insertPost.run(userIds[p.user], p.content);
  const postId = result.lastInsertRowid;
  postIds.push({ id: postId, tags: p.tags, user: p.user });

  for (const tag of p.tags) {
    insertHashtag.run(tag);
    const hashtagId = getHashtag.get(tag).id;
    insertPostHashtag.run(postId, hashtagId);
  }
}

// 4. Seed Likes
const insertLike = db.prepare("INSERT INTO likes (user_id, post_id) VALUES (?, ?)");
// Alice likes Bob's and Charlie's posts
insertLike.run(userIds.alice, postIds[1].id);
insertLike.run(userIds.alice, postIds[2].id);
// Bob likes Alice's post
insertLike.run(userIds.bob, postIds[0].id);
// Charlie likes Bob's post
insertLike.run(userIds.charlie, postIds[1].id);
// Evan likes Charlie's post
insertLike.run(userIds.evan, postIds[2].id);
insertLike.run(userIds.evan, postIds[1].id); // Bob's post gets 3 likes (trending)

console.log("Database seeded successfully!");
console.log("You can log in using any seeded username (e.g., 'alice') with password 'password123'.");
