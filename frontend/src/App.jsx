import { useCallback, useEffect, useState } from "react";
import PostForm from "./components/PostForm";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation
} from "react-router-dom";

import ProfilePage from "./components/ProfilePage";
import HashtagPage from "./pages/HashtagPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";

function getStoredSession() {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, username: "" };
  }

  return {
    isAuthenticated: window.localStorage.getItem("isAuthenticated") === "true",
    username: window.localStorage.getItem("username") ?? ""
  };
}

function RequireAuth({ isAuthenticated }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        state={{ from: location }}
        to="/login"
      />
    );
  }

  return <Outlet />;
}

function AppShell({ currentUser, createPost, navOpen, onLogout, setNavOpen }) {
  return (
    <>
      <header>
        <div>
          <div className="logo">Posts</div>
          <p className="tagline">Signed in as @{currentUser}</p>
        </div>

        <div className="headerActions">
          <button
            className="authButton headerLogout"
            onClick={onLogout}
            type="button"
          >
            Log out
          </button>

          <button
            className="menuButton"
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
          >
            ⿻
          </button>
        </div>
      </header>

      <main className="grid">
        <nav
          className={navOpen ? "nav-open" : ""}
          onClick={() => setNavOpen(false)}
        >
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>

            <li>
              <Link to="/profile/demo">Profile</Link>
            </li>

            <li>
              <Link to="/settings">Settings</Link>
            </li>

            <li>
              <button
                className="logoutButton"
                onClick={onLogout}
                type="button"
              >
                Log out
              </button>
            </li>
          </ul>
        </nav>

        <section className="contentColumn">
          <Outlet />
          <PostForm onSubmit={createPost} />
        </section>
      </main>
    </>
  );
}

function App() {
  const [posts, setPosts] = useState([]);
  const [navOpen, setNavOpen] = useState(false);
  const [session, setSession] = useState(getStoredSession);
  const location = useLocation();

  const isAuthenticated = session.isAuthenticated;
  const currentUser = session.username;

  const loadPosts = useCallback(async (tag = null) => {
    const url = tag
      ? `http://localhost:3000/api/hashtags/${tag}`
      : "http://localhost:3000/api/posts";

    const res = await fetch(url);
    const data = await res.json();

    setPosts(data);
  }, []);

  const createPost = useCallback(async (content) => {
    await fetch("http://localhost:3000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: 1,
        content
      })
    });

    await loadPosts();
  }, [loadPosts]);

  function handleLogin(username) {
    setSession({
      isAuthenticated: true,
      username
    });
    setNavOpen(false);
  }

  function handleLogout() {
    setSession({
      isAuthenticated: false,
      username: ""
    });
    setNavOpen(false);
  }

  useEffect(() => {
    window.localStorage.setItem("isAuthenticated", String(isAuthenticated));

    if (currentUser) {
      window.localStorage.setItem("username", currentUser);
      return;
    }

    window.localStorage.removeItem("username");
  }, [currentUser, isAuthenticated]);

  useEffect(() => {
    let isActive = true;

    async function syncPostsForRoute() {
      const path = location.pathname;

      if (path !== "/" && !path.startsWith("/hashtags/")) {
        return;
      }

      const tag = path.startsWith("/hashtags/") ? path.split("/")[2] : null;
      const url = tag
        ? `http://localhost:3000/api/hashtags/${tag}`
        : "http://localhost:3000/api/posts";

      const res = await fetch(url);
      const data = await res.json();

      if (isActive) {
        setPosts(data);
      }
    }

    void syncPostsForRoute();

    return () => {
      isActive = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") {
        setNavOpen(false);
      }
    }

    document.body.addEventListener("keydown", handleEsc);

    return () => {
      document.body.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate
                replace
                to="/"
              />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />

        <Route element={<RequireAuth isAuthenticated={isAuthenticated} />}>
          <Route
            element={
              <AppShell
                createPost={createPost}
                currentUser={currentUser}
                navOpen={navOpen}
                onLogout={handleLogout}
                setNavOpen={setNavOpen}
              />
            }
          >
            <Route
              index
              element={<HomePage posts={posts} />}
            />

            <Route
              path="hashtags/:tag"
              element={
                <HashtagPage
                  posts={posts}
                  loadPosts={loadPosts}
                />
              }
            />

            <Route
              path="profile/:username"
              element={<ProfilePage />}
            />

            <Route
              path="settings"
              element={
                <SettingsPage
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  replace
                  to="/"
                />
              }
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              replace
              to={isAuthenticated ? "/" : "/login"}
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;