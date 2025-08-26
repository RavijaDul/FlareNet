// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage from './Pages/Homepage.jsx'
import NewPage from './Pages/TransformerInfo.jsx'
import TransformerDetails from './Pages/TransformerDetails.jsx';
import Transformer from './Pages/Transformer.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<HomePage />} /> */}
        <Route path="/" element={<NewPage />} />
        <Route path="/transformer/:id" element={<TransformerDetails />} />
        {/* Add this route for the Transformer page */}
        <Route path="/transformer" element={<Transformer />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App