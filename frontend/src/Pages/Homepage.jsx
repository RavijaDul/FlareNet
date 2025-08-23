// src/pages/HomePage.jsx
import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="homepage">
      <h1>Welcome to the App</h1>
      <p>Select an option to continue:</p>
      <button
        onClick={() => navigate('/new')}
        className="upload-btn"
      >
        Transformer Upload
      </button>
    </div>
  )
}
export default HomePage 