import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./LoginPage.css";

import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";

import { apiClient, parseJsonResponse } from "../lib/api";

function LoginPage({ onLogin, onRegister }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(
    location.state?.isLogin !== undefined ? location.state.isLogin : true
  );

  const destination = location.state?.from?.pathname ?? "/";

  async function handleLogin(username, password) {
    setError("");

    try {
      const response = await apiClient(
        "/api/login",
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

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        setError(data?.error ?? "Login failed");
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
        "/api/register",
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

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        setError(data?.error ?? "Registration failed");
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
    <div className="loginScreen">
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
        className="switchAuthButton"
        onClick={() => {
          setError("");
          setIsLogin(!isLogin);
        }}
      >
        {isLogin
          ? "Don't have an account? Register here."
          : "Already have an account? Log in here."}
      </button>
    </div>
  );
}

export default LoginPage;