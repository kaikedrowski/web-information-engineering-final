import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './LoginPage.css';


function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);

  const destination = location.state?.from?.pathname ?? "/";


  function handleLogin(e) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      return;
    }

    onLogin(username.trim());
    navigate(destination, { replace: true });
  }

  function LoginForm() {
    return (
        <section className="loginCard">
        <p className="eyebrow">Access required</p>
        <h1>Log in</h1>
        <p>
          Sign in to view the feed, profiles, hashtags, and settings.
        </p>
        <p>To make a new account click <a>here</a> </p>

        <form className="authForm" onSubmit={handleLogin}>
          <label>
            Username
            <input
              className="authField"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label>
            Password
            <input
              className="authField"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button
            className="authButton"
            type="submit"
          >
            Enter
          </button>
        </form>
      </section>
    )
  }

  function RegisterForm() {
    return (
        <section className="loginCard">
        <p className="eyebrow">Access required</p>
        <h1>REGISTER</h1>
        <p>
          Sign in to view the feed, profiles, hashtags, and settings.
        </p>
        <p>To make a new account click <a>here</a> </p>

        <form className="authForm" onSubmit={handleLogin}>
          <label>
            Username
            <input
              className="authField"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label>
            Password
            <input
              className="authField"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button
            className="authButton"
            type="submit"
          >
            Enter
          </button>
        </form>
      </section>
    )
  }


return (
  <div className="auth-container">
    <div className={isLogin ? "active" : "hidden"}>
      <LoginForm />
    </div>

    <div className={!isLogin ? "active" : "hidden"}>
      <RegisterForm />
    </div>

     <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Switch to Register" : "Switch to Login"}
      </button>
  </div>
);
}

export default LoginPage;
