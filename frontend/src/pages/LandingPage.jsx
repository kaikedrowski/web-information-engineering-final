import { Link } from "react-router-dom";
import { Apple } from "lucide-react";
import "./LandingPage.css";

function LandingPage() {
  return (
    <div className="landing-container">
      <div className="landing-left">
        <Apple size={300} className="landing-logo-huge" />
      </div>
      <div className="landing-right">
        <Apple size={48} className="landing-logo-small" />
        <h1 className="landing-title">Happening now</h1>
        <h2 className="landing-subtitle">Join Apple Tree today.</h2>
        
        <div className="landing-actions">
          <Link to="/login" state={{ isLogin: false }} className="landing-btn-primary">
            Create account
          </Link>
          
          <div className="landing-divider">
            <div className="landing-line"></div>
            <span>or</span>
            <div className="landing-line"></div>
          </div>
          
          <div className="landing-login-prompt">
            <h3>Already have an account?</h3>
            <Link to="/login" state={{ isLogin: true }} className="landing-btn-secondary">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
