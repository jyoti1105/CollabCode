import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useTheme } from "../ThemeContext";

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="app-nav">
      <div className="nav-left">
        <Link to="/" className="nav-brand">
          CollabCode
        </Link>
      </div>

      <nav className="nav-links">
        <Link to="/">Home</Link>
        {isAuthenticated ? (
          <>
            <Link to="/profile">Profile</Link>
            <button className="nav-button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>

      <div className="nav-user">
        {isAuthenticated && <span>{user.username}</span>}
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle color theme"
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
      </div>
    </header>
  );
}
