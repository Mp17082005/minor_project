import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Auth from './pages/Auth';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherAssignments from './pages/TeacherAssignments';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher-assignments" element={<TeacherAssignments />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/" element={<><Navbar /><Home /></>} />
        <Route path="/chat/:docId" element={<><Navbar /><Chat /></>} />
      </Routes>
    </div>
  );
}

export default App;