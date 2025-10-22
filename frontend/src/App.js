import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Chat from './pages/Chat';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat/:docId" element={<Chat />} />
      </Routes>
    </div>
  );
}

export default App;