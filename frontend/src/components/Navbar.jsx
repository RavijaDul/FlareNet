import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  const avatarStyle = {
    width: 35,
    height: 35,
    borderRadius: "50%",
    backgroundColor: "#1976d2",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    position: "relative",
  };

  const popupStyle = {
    position: "absolute",
    top: "50px",
    right: "20px",
    background: "#fff",
    color: "#333",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    zIndex: 2000,
    minWidth: "150px",
  };

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        background: "#333",
        color: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Left side */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        
        <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>
          <h2 style={{ margin: 0 }}>Flarenet</h2>
        </Link>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        {user ? (
          <>
            <div
              style={avatarStyle}
              onClick={() => setOpen((prev) => !prev)}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>

            {open && (
              <div style={popupStyle}>
                <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>
                  {user.username}
                </p>
                <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#555" }}>
                  {user.role}
                </p>
                <button
                  onClick={logout}
                  style={{
                    cursor: "pointer",
                    width: "100%",
                    padding: "6px",
                    borderRadius: "5px",
                    border: "none",
                    background: "#1976d2",
                    color: "#fff",
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: "#fff", marginRight: "15px" }}>
              Login
            </Link>
            <Link to="/register" style={{ color: "#fff" }}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
