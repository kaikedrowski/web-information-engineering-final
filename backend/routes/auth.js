const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    let { username, display_name, password } = req.body;
    username = username?.trim();
    display_name = display_name?.trim();

    if (!username || !display_name || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: "Username must be 3-20 characters" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: "Username may only contain letters, numbers, and underscores" });
    }
    if (display_name.length > 50) {
      return res.status(400).json({ error: "Display name is too long" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existingUser = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username);
    if (existingUser) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, display_name, password_hash)
      VALUES (?, ?, ?)
    `).run(username, display_name, passwordHash);

    const user = { id: result.lastInsertRowid, username, display_name, profile_picture_url: null };
    const token = jwt.sign({ sub: user.id, username: user.username }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

    res.status(201).json({ token, user });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error: " + error.message, stack: error.stack });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const userRecord = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);

    if (!userRecord) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const validPassword = bcrypt.compareSync(password, userRecord.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = { id: userRecord.id, username: userRecord.username, display_name: userRecord.display_name, profile_picture_url: userRecord.profile_picture_url };
    const token = jwt.sign({ sub: user.id, username: user.username }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

    res.json({ token, user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error: " + error.message, stack: error.stack });
  }
});

router.post("/logout", (req, res) => {
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  const userRecord = db.prepare(`SELECT id, username, display_name, profile_picture_url FROM users WHERE id = ?`).get(req.user.id);
  if (!userRecord) {
    return res.status(401).json({ error: "User not found" });
  }
  res.json({ id: userRecord.id, username: userRecord.username, display_name: userRecord.display_name, profile_picture_url: userRecord.profile_picture_url });
});

module.exports = router;
