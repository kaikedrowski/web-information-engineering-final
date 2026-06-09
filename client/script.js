const btn = document.querySelector("button");
const nav = document.querySelector("nav");

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