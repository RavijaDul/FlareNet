import { Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage from './Pages/HomePage.jsx'
import NewPage from './Pages/TransformerPage.jsx'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<NewPage />} />
      </Routes>
    </>
  )
}

export default App