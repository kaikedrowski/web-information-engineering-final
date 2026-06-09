const express = require("express");
const cors = require("cors");
const path = require("path");

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
  res.json(posts);
});

app.post("/api/posts", (req, res) => {
  const post = {
    id: Date.now(),
    username: req.body.username,
    content: req.body.content
  };

  posts.unshift(post);

  res.json(post);
    
    console.log('created new post');
});