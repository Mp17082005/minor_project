import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Auth = () => {
  const [userType, setUserType] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (type) => {
    if (type === 'student') {
      // Store student info in localStorage
      const email = document.querySelector('input[type="email"]').value;
      const name = email.split('@')[0]; // Simple name extraction
      localStorage.setItem('studentEmail', email);
      localStorage.setItem('studentName', name);
      navigate('/student-dashboard');
    } else if (type === 'teacher') {
      navigate('/teacher-dashboard');
    }
  };

  if (!userType) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Welcome to Exam Prep Assistant</h1>
          <p className="auth-subtitle">Choose your role to continue</p>
          
          <div className="role-selection">
            <button 
              className="role-card student-card"
              onClick={() => setUserType('student')}
            >
              <div className="role-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                </svg>
              </div>
              <h2>Student</h2>
              <p>Upload documents and get AI-powered study assistance</p>
            </button>

            <button 
              className="role-card teacher-card"
              onClick={() => setUserType('teacher')}
            >
              <div className="role-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
                </svg>
              </div>
              <h2>Teacher</h2>
              <p>Grade assignments with custom rubrics and AI assistance</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="login-card">
        <button className="back-btn" onClick={() => setUserType(null)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back
        </button>

        <div className="login-header">
          <div className="login-icon">
            {userType === 'student' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )}
          </div>
          <h2>{userType === 'student' ? 'Student Login' : 'Teacher Login'}</h2>
        </div>

        <form className="login-form" onSubmit={(e) => { e.preventDefault(); handleLogin(userType); }}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-btn">
            Login as {userType === 'student' ? 'Student' : 'Teacher'}
          </button>
        </form>

        <div className="login-footer">
          <a href="#forgot">Forgot password?</a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
