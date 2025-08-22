import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import NewPage from './pages/TransformerPage'

function App() {
  const [count, setCount] = useState(0)
  const navigate = useNavigate() // <-- hook to programmatically navigate
  
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <div>
                <a href="https://vite.dev" target="_blank">
                  <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                  <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
              </div>
              <h1>Vite + React</h1>
              <div className="card">
                <button
                  onClick={() => {
                    setCount((count) => count + 1)
                    navigate('/new') // <-- navigate to new page
                  }}
                >
                  count is {count}
                </button>
                <p>
                  Edit <code>src/App.jsx</code> and save to test HMR
                </p>
              </div>
              <p className="read-the-docs">
                Click on the Vite and React logos to learn more
              </p>
            </div>
          }
        />
        <Route path="/new" element={<NewPage />} />
      </Routes>
    </>
  )
}

export default App