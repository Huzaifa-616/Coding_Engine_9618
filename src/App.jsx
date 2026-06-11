import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import your pages
import Home from './pages/Home';
import PseudoLab from './pages/PseudoLab';
import PythonLab from './pages/PythonLab';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The Landing Page */}
        <Route path="/" element={<Home />} />

        {/* Your Existing Pseudocode IDE */}
        <Route path="/pseudocode" element={<PseudoLab />} />

        {/* The New Python IDE (Coming Soon) */}
        <Route path="/python" element={<PythonLab />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;