// // src/pages/HomePage.jsx
// import { useNavigate } from 'react-router-dom'

// function HomePage() {
//   const navigate = useNavigate()

//   return (
//     <div className="homepage">
//       <h1>Welcome to the App</h1>
//       <p>Select an option to continue:</p>
//       <button
//         onClick={() => navigate('/new')}
//         className="upload-btn"
//       >
//         Transformer Upload
//       </button>
//     </div>
//   )
// }
// export default HomePage 

import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh", background: "#f4f6f8" }}>
      {/* Header */}
      <header style={{
        background: "#004080",
        color: "#fff",
        padding: "1.5rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h1 style={{ margin: 0 }}>Flarenet System</h1>
        <nav>
          <Link to="/" style={{ color: "#fff", marginRight: "1rem", textDecoration: "none" }}>Dashboard</Link>
          <Link to="/transformers" style={{ color: "#fff", marginRight: "1rem", textDecoration: "none" }}>Transformers</Link>
          <Link to="/reports" style={{ color: "#fff", textDecoration: "none" }}>Reports</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ color: "#004080", marginBottom: "1rem" }}>Welcome to Flarenet</h2>
        <p>Quick access to all system functionalities.</p>

        {/* Action Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginTop: "2rem"
        }}>
          <Link to="/new" style={{ textDecoration: "none" }}>
            <div style={{
              background: "#fff",
              padding: "1.5rem",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              textAlign: "center",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              <h3 style={{ color: "#004080" }}>Manage Transformers</h3>
              <p>Add, edit, or delete transformer records</p>
            </div>
          </Link>

          <Link to="/transformer" style={{ textDecoration: "none" }}>
            <div style={{
              background: "#fff",
              padding: "1.5rem",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              textAlign: "center",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              <h3 style={{ color: "#004080" }}>Upload Images</h3>
              <p>Upload baseline or maintenance thermal images</p>
            </div>
          </Link>

          <Link to="/reports" style={{ textDecoration: "none" }}>
            <div style={{
              background: "#fff",
              padding: "1.5rem",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              textAlign: "center",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              <h3 style={{ color: "#004080" }}>View Reports</h3>
              <p>Generate and view maintenance record sheets</p>
            </div>
          </Link>

          <Link to="/settings" style={{ textDecoration: "none" }}>
            <div style={{
              background: "#fff",
              padding: "1.5rem",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              textAlign: "center",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              <h3 style={{ color: "#004080" }}>Settings</h3>
              <p>Manage system settings and user preferences</p>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: "#004080",
        color: "#fff",
        textAlign: "center",
        padding: "1rem",
        marginTop: "2rem"
      }}>
        &copy; 2025 Flarenet
      </footer>
    </div>
  );
};

export default Dashboard;
