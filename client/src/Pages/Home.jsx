import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../AuthContext";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      setSuccess("");
      setError("");
    }
  }, [isAuthenticated]);

  const validateInput = (room = null) => {
    if (!user?.username) {
      setError("Please login before joining a room.");
      return false;
    }
    if (room !== null && room.trim().length < 6) {
      setError("Room ID must be at least 6 characters");
      return false;
    }
    return true;
  };

  const createRoom = () => {
    setError("");
    setSuccess("");
    if (!validateInput()) return;

    setIsLoading(true);
    setTimeout(() => {
      const id = uuidv4().slice(0, 8).toLowerCase();
      setSuccess(`✅ Room created! ID: ${id}`);
      setTimeout(() => {
        navigate(`/editor/${id}`);
      }, 500);
    }, 300);
  };

  const joinRoom = () => {
    setError("");
    setSuccess("");
    if (!validateInput(roomId)) return;

    setIsLoading(true);
    setTimeout(() => {
      setSuccess("✅ Joining room...");
      setTimeout(() => {
        navigate(`/editor/${roomId.trim()}`);
      }, 500);
    }, 300);
  };

  const handleKeyPress = (e, action) => {
    if (e.key === "Enter" && !isLoading) {
      action();
    }
  };

  return (
    <div className="home-container">
      <div className="hero-shell">
        <nav className="hero-links">
          <a href="#features">Why</a>
          <a href="#pricing">Pricing</a>
          <a href="#get-started">Get Started</a>
        </nav>

        <section className="hero-section">
          <div className="hero-left">
            <h1>Unleash the Power of Collaborative Coding</h1>
            <p>Join a secure, real-time coding workspace with built-in chat, shared terminals, and peer code sync.</p>

            <div className="hero-actions">
              {!isAuthenticated ? (
                <>
                  <button className="btn btn-primary" onClick={() => navigate("/login")}>Login</button>
                  <button className="btn btn-secondary" onClick={() => navigate("/register")}>Register</button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={createRoom}
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.7 : 1 }}
                  >
                    {isLoading ? "⏳ Loading..." : "🚀 Create Room"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={joinRoom}
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.7 : 1 }}
                  >
                    {isLoading ? "⏳ Loading..." : "➡️ Join Room"}
                  </button>
                </>
              )}
            </div>

            <div id="get-started" className="quick-form">
              {error && <p className="error">❌ {error}</p>}
              {success && <p className="success-message">{success}</p>}
              {isAuthenticated ? (
                <>
                  <div className="info-box">
                    Logged in as <strong>{user.username}</strong> ({user.email})
                  </div>
                  <input
                    className="input"
                    type="text"
                    placeholder="Room ID (for joining)"
                    value={roomId}
                    onChange={(e) => { setRoomId(e.target.value); setError(""); }}
                    onKeyPress={(e) => handleKeyPress(e, joinRoom)}
                    disabled={isLoading}
                  />
                </>
              ) : (
                <p className="info-text">Please login or register to create or join rooms.</p>
              )}
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-code-block">
              <pre>{`const hello = () => {
  console.log('CollabCode onboard');
};

hello();`}</pre>
            </div>
          </div>
        </section>

        <section id="features" className="feature-grid">
          <article className="feature-card">
            <h3>Decentralized Collaboration</h3>
            <p>Instant code sync across all participants with secure sockets and state tracking.</p>
          </article>
          <article className="feature-card">
            <h3>Security + Audit</h3>
            <p>Encrypted room access and real-time user history guard every session.</p>
          </article>
          <article className="feature-card">
            <h3>Transparent Runtime</h3>
            <p>Chat, terminal, and file operations are in full view for effective teamwork.</p>
          </article>
          <article className="feature-card">
            <h3>High Efficiency</h3>
            <p>Minimal latency editor and lightweight state management for real-time speed.</p>
          </article>
        </section>

        <section id="pricing">
          <h2>Pricing Plans</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Starter</h3>
              <p className="price">Free</p>
              <ul>
                <li>1 room, 3 participants</li>
                <li>Basic code sync</li>
                <li>Chat & terminal support</li>
              </ul>
            </div>
            <div className="pricing-card premium">
              <h3>Pro</h3>
              <p className="price">$9.99 / mo</p>
              <ul>
                <li>Unlimited rooms</li>
                <li>10 participants per room</li>
                <li>Advanced file and user controls</li>
              </ul>
            </div>
            <div className="pricing-card enterprise">
              <h3>Enterprise</h3>
              <p className="price">Contact Sales</p>
              <ul>
                <li>Unlimited users & priority support</li>
                <li>Audit logs and team admin</li>
                <li>Custom themes and branding</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}