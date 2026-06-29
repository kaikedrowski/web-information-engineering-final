import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./LoginPage.css";

import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";

import { apiClient } from "../lib/api";

function LoginPage({ onLogin, onRegister }) {
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  const destination = location.state?.from?.pathname ?? "/";

  async function handleLogin(username, password) {
    setError("");

    try {
      const response = await apiClient(
        "http://localhost:3000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      onLogin(data);

      navigate(destination, {
        replace: true,
      });
    } catch (err) {
      setError("Unable to connect to server");
    }
  }

  async function handleRegistration(username, password) {
    setError("");

    try {
      const response = await apiClient(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            display_name: username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }

      onRegister(data);

      navigate(destination, {
        replace: true,
      });
    } catch (err) {
      setError("Unable to connect to server");
    }
  }

  return (
    <div className="auth-container">
      {isLogin ? (
        <LoginForm
          onLogin={handleLogin}
          error={error}
        />
      ) : (
        <RegisterForm
          onRegister={handleRegistration}
          error={error}
        />
      )}

      <button
        onClick={() => {
          setError("");
          setIsLogin(!isLogin);
        }}
      >
        {isLogin
          ? "Switch to Register"
          : "Switch to Login"}
      </button>
    </div>
  );
}

export default LoginPage;