import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h2>Loading profile…</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>Your Profile</h2>
        <div className="profile-field">
          <strong>Username</strong>
          <span>{user.username}</span>
        </div>
        <div className="profile-field">
          <strong>Email</strong>
          <span>{user.email}</span>
        </div>
        <div className="profile-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/")}>Home</button>
          <button className="btn btn-primary" onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  );
}
