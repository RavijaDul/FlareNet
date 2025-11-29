import { Link } from "react-router-dom";
import bgImage from "../assets/transformer-bg.png"; // ✅ put your image in src/assets

function HomePage() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#fff" }}>
      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 40px",
          backgroundColor: "rgba(0,0,0,0.7)",
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 100,
        }}
      >
        <h2 style={{ margin: 0, fontWeight: "bold", letterSpacing: "2px" }}>
          Flarenet
        </h2>
        <div>
          <Link
            to="/login"
            style={{
              marginRight: "20px",
              color: "white",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Login
          </Link>
          <Link
            to="/register"
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          height: "100vh",
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        ></div>

        {/* Text */}
        <div style={{ textAlign: "center", zIndex: 1 }}>
          <h1 style={{ fontSize: "4rem", marginBottom: "10px" }}>Flarenet</h1>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "300" }}>
            Transformer Management System
          </h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 18 }}>
            <Link
              to="/login"
              style={{
                background: "#1976d2",
                color: "white",
                padding: "12px 28px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "1.05rem",
                boxShadow: "0 6px 18px rgba(25,118,210,0.25)",
                transition: "transform 0.18s ease",
                display: "inline-block",
              }}
              onMouseOver={(e) => { e.target.style.transform = "translateY(-3px)"; }}
              onMouseOut={(e) => { e.target.style.transform = "translateY(0px)"; }}
            >
              Log In
            </Link>

            <Link
              to="/new"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.22)",
                padding: "12px 28px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "1.05rem",
                backdropFilter: "blur(6px)",
                transition: "transform 0.18s ease",
                display: "inline-block",
              }}
              onMouseOver={(e) => { e.target.style.transform = "translateY(-3px)"; }}
              onMouseOut={(e) => { e.target.style.transform = "translateY(0px)"; }}
            >
              Go to Transformers
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        style={{
          padding: "80px 20px",
          backgroundColor: "#f9f9f9",
          color: "#333",
          textAlign: "center",
        }}
      >
        <h2>About the Project</h2>
        <p style={{ maxWidth: "800px", margin: "20px auto", lineHeight: "1.6" }}>
          Power utilities perform routine thermal inspections of distribution
          transformers to detect anomalies like overheating, insulation
          degradation, and load imbalances. Flarenet is designed to digitize and
          automate this workflow — providing anomaly detection, record
          management, and an intuitive user interface for engineers.
        </p>
      </section>

      {/* Features Section */}
      <section
        style={{
          padding: "80px 20px",
          backgroundColor: "#fff",
          color: "#333",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Key Features</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "30px",
            maxWidth: "1000px",
            margin: "40px auto",
          }}
        >
          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              background: "#f5f5f5",
            }}
          >
            <h3>Phase 1</h3>
            <p>Transformer record management & baseline image uploads.</p>
          </div>
          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              background: "#f5f5f5",
            }}
          >
            <h3>Phase 2</h3>
            <p>
              Automated anomaly detection with AI-driven image comparisons and
              visual highlights.
            </p>
          </div>
          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              background: "#f5f5f5",
            }}
          >
            <h3>Phase 3</h3>
            <p>
              Interactive annotation & feedback loop for refining detection
              results.
            </p>
          </div>
          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              background: "#f5f5f5",
            }}
          >
            <h3>Phase 4</h3>
            <p>
              Automatic maintenance record sheet generation with anomaly
              tracking.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
