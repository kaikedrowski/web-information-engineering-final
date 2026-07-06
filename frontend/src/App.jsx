import { useCallback, useEffect, useState } from "react";
import { Home, Hash, User, Settings, LogOut, Menu, X, Apple, Bell, Search, SlidersHorizontal } from "lucide-react";
import PostForm from "./components/PostForm";
import TrendingWidget from "./components/TrendingWidget";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";

import ProfilePage from "./components/ProfilePage";
import HashtagPage from "./pages/HashtagPage";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import NotificationsPage from "./pages/NotificationsPage";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import SettingsPage from "./pages/SettingsPage";
import { apiClient } from "./lib/api";

function getStoredSession() {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, user: null };
  }

  const token = window.sessionStorage.getItem("apple_tree_token");
  const user = window.sessionStorage.getItem("apple_tree_user");
  return {
    isAuthenticated: !!token,
    user: user ? JSON.parse(user) : null
  };
}

function RequireAuth({ isAuthenticated }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        state={{ from: location }}
        to="/welcome"
      />
    );
  }

  return <Outlet />;
}

function AppShell({ currentUser, createPost, navOpen, onLogout, setNavOpen }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="layoutContainer">
      {/* Mobile Header */}
      <header className="mobileHeader">
        <button
          className="menuButton"
          onClick={() => setNavOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div className="mobileLogo">
          <Apple className="logoIcon" size={28} />
        </div>
      </header>

      <main className="grid">
        {/* Left Sidebar */}
        <nav
          className={navOpen ? "navSidebar nav-open" : "navSidebar"}
        >
          <div className="navContent">
            <div className="navHeader">
              <Apple className="logoIcon desktopLogo" size={36} />
              {navOpen && (
                <button className="closeMenuButton" onClick={() => setNavOpen(false)}>
                  <X size={24} />
                </button>
              )}
            </div>

            <ul>
              <li>
                <Link to="/" onClick={() => setNavOpen(false)}>
                  <Home size={26} />
                  <span>Home</span>
                </Link>
              </li>

              <li>
                <Link to="/explore" onClick={() => setNavOpen(false)}>
                  <Hash size={26} />
                  <span>Explore</span>
                </Link>
              </li>

              <li>
                <Link to="/notifications" onClick={() => setNavOpen(false)}>
                  <Bell size={26} />
                  <span>Notifications</span>
                </Link>
              </li>

              <li>
                <Link to={`/profile/${currentUser?.username}`} onClick={() => setNavOpen(false)}>
                  <User size={26} />
                  <span>Profile</span>
                </Link>
              </li>

              <li>
                <Link to="/settings" onClick={() => setNavOpen(false)}>
                  <Settings size={26} />
                  <span>Settings</span>
                </Link>
              </li>
            </ul>

            <div className="navFooter">
              <div className="userInfo">
                <div 
                  className="userAvatar"
                  style={currentUser?.profile_picture_url ? { backgroundImage: `url(http://localhost:3000${currentUser.profile_picture_url})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}}
                >
                  {currentUser?.username?.[0]?.toUpperCase()}
                </div>
                <div className="userDetails">
                  <div className="userDisplayName">{currentUser?.display_name || currentUser?.username}</div>
                  <div className="userHandle">@{currentUser?.username}</div>
                </div>
              </div>
              <button
                className="logoutButton"
                onClick={onLogout}
                type="button"
                title="Log out"
              >
                <LogOut size={20} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Overlay for mobile */}
        {navOpen && <div className="navOverlay" onClick={() => setNavOpen(false)}></div>}

        <section className="feedColumn">
          <Outlet context={{ createPost, currentUser }} />
        </section>

        {/* Right Sidebar (Optional placeholder for Twitter-like UI) */}
        <aside className="rightSidebar">
          <div className="searchBox">
            <Search className="searchIcon" size={20} />
            <input 
              type="text" 
              placeholder="Search Apple Tree" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            />
            <div className="searchActions">
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="searchActionBtn" 
                  title="Clear search"
                >
                  <X size={18} />
                </button>
              )}
              <button 
                className="searchActionBtn" 
                title="Filters"
              >
                <SlidersHorizontal size={18} />
              </button>
            </div>
          </div>
          <TrendingWidget />
        </aside>
      </main>
    </div>
  );
}

function App() {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [session, setSession] = useState(getStoredSession);
  const location = useLocation();

  const isAuthenticated = session.isAuthenticated;
  const currentUser = session.user;

  const loadPosts = useCallback(async (tag = null, tab = "foryou") => {
    let url;
    if (tag) {
      url = `http://localhost:3000/api/hashtags/${tag}`;
    } else {
      url = tab === "following" ? "http://localhost:3000/api/posts/feed" : "http://localhost:3000/api/posts";
    }

    try {
      setLoadingPosts(true);
      setPostsError(null);
      const res = await apiClient(url);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        const data = await res.json();
        setPostsError(data.error || "Failed to load posts");
        setPosts([]);
      }
    } catch (err) {
      console.error(err);
      setPostsError("A network error occurred");
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const createPost = useCallback(async (content, mediaUrl = "", duration = "24h", replyToId = null) => {
    await apiClient("http://localhost:3000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content,
        media_url: mediaUrl,
        duration,
        reply_to_id: replyToId
      })
    });

    await loadPosts();
  }, [loadPosts]);

  const deletePost = useCallback(async (postId) => {
    await apiClient(`http://localhost:3000/api/posts/${postId}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  function handleLogin(data) {
    window.sessionStorage.setItem("apple_tree_token", data.token);
    window.sessionStorage.setItem("apple_tree_user", JSON.stringify(data.user));
    setSession({
      isAuthenticated: true,
      user: data.user
    });
    setNavOpen(false);
  }

  function handleRegister(data) {
    window.sessionStorage.setItem("apple_tree_token", data.token);
    window.sessionStorage.setItem("apple_tree_user", JSON.stringify(data.user));
    setSession({
      isAuthenticated: true,
      user: data.user
    });
    setNavOpen(false);
  }

  function handleLogout() {
    window.sessionStorage.removeItem("apple_tree_token");
    window.sessionStorage.removeItem("apple_tree_user");
    setSession({
      isAuthenticated: false,
      user: null
    });
    setNavOpen(false);
  }

  function handleProfileUpdate(updatedUser) {
    const newUser = { ...session.user, ...updatedUser };
    window.sessionStorage.setItem("apple_tree_user", JSON.stringify(newUser));
    setSession(prev => ({ ...prev, user: newUser }));
  }

  useEffect(() => {
    function handleUnauthorized() {
      handleLogout();
    }
    window.addEventListener("unauthorized", handleUnauthorized);
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function syncPostsForRoute() {
      const path = location.pathname;

      if (path !== "/" && !path.startsWith("/hashtags/")) {
        return;
      }

      const searchParams = new URLSearchParams(location.search);
      const tab = searchParams.get("tab") || "foryou";
      const tag = path.startsWith("/hashtags/") ? path.split("/")[2] : null;
      
      let url;
      if (tag) {
        url = `http://localhost:3000/api/hashtags/${tag}`;
      } else {
        url = tab === "following" ? "http://localhost:3000/api/posts/feed" : "http://localhost:3000/api/posts";
      }

      try {
        setLoadingPosts(true);
        setPostsError(null);
        const res = await apiClient(url);
        
        if (res.ok) {
          const data = await res.json();
          if (isActive) {
            setPosts(data);
          }
        } else {
          const data = await res.json();
          if (isActive) {
            setPostsError(data.error || "Failed to load posts");
            setPosts([]);
          }
        }
      } catch (err) {
        console.error(err);
        if (isActive) {
          setPostsError("A network error occurred");
          setPosts([]);
        }
      } finally {
        if (isActive) setLoadingPosts(false);
      }
    }

    void syncPostsForRoute();

    return () => {
      isActive = false;
    };
  }, [location.pathname, location.search]);

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

  useEffect(() => {
    function handlePopState() {
      const currentSession = getStoredSession();
      if (session.isAuthenticated !== currentSession.isAuthenticated) {
        setSession(currentSession);
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [session.isAuthenticated]);

  useEffect(() => {
    let blackoutTimer = null;

    function handleKeyDown(e) {
      // Mac: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      const isMacScreenshot = e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5');
      // Windows: Win+Shift+S or PrintScreen
      const isWinScreenshot = (e.metaKey && e.shiftKey && (e.key === 's' || e.key === 'S')) || e.key === 'PrintScreen';

      if (isMacScreenshot || isWinScreenshot) {
        setIsBlackout(true);
        if (blackoutTimer) clearTimeout(blackoutTimer);
        blackoutTimer = setTimeout(() => {
          setIsBlackout(false);
        }, 3000);
      }
    }

    // Capture phase listener
    window.addEventListener("keydown", handleKeyDown, true);
    
    // Also listen to keyup for PrintScreen on some systems
    window.addEventListener("keyup", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyDown, true);
      if (blackoutTimer) clearTimeout(blackoutTimer);
    };
  }, []);

  return (
    <>
      {isBlackout && (
        <div className="blackout-overlay">
          Screenshots are not allowed
        </div>
      )}
      <Routes>
        <Route
          path="/welcome"
          element={
            isAuthenticated ? (
              <Navigate
                replace
                to="/"
              />
            ) : (
              <LandingPage />
            )
          }
        />

        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate
                replace
                to="/"
              />
            ) : (
              <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
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
              element={<HomePage posts={posts} loading={loadingPosts} error={postsError} onDeletePost={deletePost} />}
            />

            <Route
              path="hashtags/:tag"
              element={
                <HashtagPage
                  posts={posts}
                  loading={loadingPosts}
                  error={postsError}
                  loadPosts={loadPosts}
                  onDeletePost={deletePost}
                />
              }
            />

            <Route
              path="explore"
              element={<ExplorePage />}
            />

            <Route
              path="notifications"
              element={<NotificationsPage />}
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
                  onProfileUpdate={handleProfileUpdate}
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
              to={isAuthenticated ? "/" : "/welcome"}
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;