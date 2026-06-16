const express = require("express");
const cors = require("cors");
const path = require("path");
const Database = require("better-sqlite3");
const db = new Database("database.db");

const fs = require("fs");

const schema = fs.readFileSync(
  "db/schema.sql",
  "utf8"
);
db.exec(schema);

const app = express();
let posts = [];

app.use(cors());
app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, "../client")
  )
);

app.listen(3000, () => {
  console.log(`Server running`);
});

app.get("/api/posts", (req, res) => {
  const posts = db.prepare(`
    SELECT *
    FROM posts
    ORDER BY created_at DESC
  `).all();

  res.json(posts);
});

app.post("/api/posts", (req, res) => {
  const { username, content } = req.body;

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

  const result = db.prepare(`
    INSERT INTO posts
    (username, content)
    VALUES (?, ?)
  `).run(
    username,
    content
  );

  const post = db.prepare(`
    SELECT *
    FROM posts
    WHERE id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(post);

  console.log("New post created:", post);
});