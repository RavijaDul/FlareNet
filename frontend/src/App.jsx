// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage from './Pages/Homepage.jsx'
import NewPage from './Pages/TransformerInfo.jsx'
import TransformerDetails from './Pages/TransformerDetails.jsx';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<NewPage />} />
        <Route path="/transformer/:id" element={<TransformerDetails />} />
        
      </Routes>
    </BrowserRouter>
  )
}

export default App