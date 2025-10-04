// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage from './Pages/Homepage.jsx'
import MainPage from './Pages/TransformerInfo.jsx'
import TransformerDetails from './Pages/TransformerDetails.jsx';
import Transformer from './Pages/Transformer.jsx';
// import Login from './Pages/Login.jsx';
// import Register from './Pages/Register.jsx';
import Navbar from './components/Navbar.jsx';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> */}
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<MainPage />} />
        <Route path="/transformer/:id" element={<TransformerDetails />} />
        <Route path="/transformer" element={<Transformer />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App