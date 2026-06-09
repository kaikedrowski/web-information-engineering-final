const btn = document.querySelector(".menuButton");
const nav = document.querySelector("nav");

const currentUser = "demo";

function showNav() {
  nav.style.display = "block";
}

function hideNav() {
  nav.style.display = "none";
}

function hideNavEsc(e) {
  if (e.key === "Escape") {
    nav.style.display = "none";
  }
}

function handleEventListeners() {
  if (matchMedia("(width > 800px)").matches) {
    btn.removeEventListener("click", showNav);
    nav.removeEventListener("click", hideNav);
    document.body.removeEventListener("keydown", hideNavEsc);
    if (nav.style.display === "none") {
      nav.style.display = "block";
    }
  } else {
    btn.addEventListener("click", showNav);
    nav.addEventListener("click", hideNav);
    document.body.addEventListener("keydown", hideNavEsc);
    if (nav.style.display === "block") {
      nav.style.display = "none";
    }
  }
}

handleEventListeners();

window.addEventListener("resize", handleEventListeners);

async function loadPosts() {
  const res = await fetch("/api/posts");
  const posts = await res.json();

  const feed = document.getElementById("feed");

  feed.innerHTML = "";

  posts.forEach(post => {
    feed.innerHTML += `
      <article class="post">
        <header class="post-meta">
          <strong>@${post.username}</strong>
        </header>
        <p>${post.content}</p>
      </article>
    `;
  });
}

loadPosts();

document.getElementById("postButton").addEventListener("click", async () => {

  const content = document.getElementById("postContent").value;

  if (!content.trim()) return;

  await fetch("/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: "demo",
      content
    })
  });

  document.getElementById("postContent").value = "";

  await loadPosts(); // IMPORTANT: await it
});
  
window.addEventListener("DOMContentLoaded", () => {
  loadPosts();
});