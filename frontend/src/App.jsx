// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage from './Pages/Homepage.jsx'
import MainPage from './Pages/TransformerInfo.jsx'
import TransformerDetails from './Pages/TransformerDetails.jsx';
import Transformer from './Pages/Transformer.jsx';
import Login from './Pages/Login.jsx';
import RequireAuth from './components/RequireAuth'
// import Register from './Pages/Register.jsx';
import Navbar from './components/Navbar.jsx';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<RequireAuth><MainPage /></RequireAuth>} />
        <Route path="/transformer/:id" element={<RequireAuth><TransformerDetails /></RequireAuth>} />
        <Route path="/transformer" element={<RequireAuth><Transformer /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App