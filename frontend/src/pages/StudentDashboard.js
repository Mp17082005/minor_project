import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [studentEmail] = useState(localStorage.getItem('studentEmail') || 'student@example.com');
  const [studentName] = useState(localStorage.getItem('studentName') || 'Student');

  useEffect(() => {
    loadAssignments();
    loadMySubmissions();
    loadMyResults();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/assignments');
      if (response.data.success) {
        setAssignments(response.data.assignments);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadMySubmissions = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/submissions/student/${studentEmail}`);
      if (response.data.success) {
        setMySubmissions(response.data.submissions);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const loadMyResults = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/results/student/${studentEmail}`);
      if (response.data.success) {
        setMyResults(response.data.results);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (assignmentId) => {
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('assignment_id', assignmentId);
    formData.append('student_name', studentName);
    formData.append('student_email', studentEmail);
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/api/submissions/submit', formData);
      if (response.data.success) {
        alert('Assignment submitted successfully!');
        setFile(null);
        setSelectedAssignment(null);
        loadAssignments();
        loadMySubmissions();
      }
    } catch (error) {
      alert(error.response?.data?.detail || 'Error submitting assignment');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;

    if (diff <= 0) return 'Closed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const hasSubmitted = (assignmentId) => {
    return mySubmissions.some(s => s.assignment_id === assignmentId);
  };

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Student Dashboard</h1>
            <p className="student-info">Welcome, {studentName}</p>
          </div>
          <button className="logout-btn" onClick={() => navigate('/auth')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-container">
        <div className="dashboard-sidebar">
          <button 
            className={`sidebar-btn ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
            </svg>
            Assignments
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('submissions')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
            </svg>
            My Submissions
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            Results
          </button>
        </div>

        <div className="dashboard-main">
          {activeTab === 'assignments' && (
            <div className="assignments-section">
              <h2>Available Assignments</h2>
              <p className="section-description">Submit your work before the deadline</p>

              <div className="assignments-grid">
                {assignments.filter(a => a.status !== 'graded').map(assignment => (
                  <div key={assignment.id} className="assignment-card">
                    <div className="assignment-header">
                      <h3>{assignment.title}</h3>
                      <span className={`status-badge ${assignment.status}`}>
                        {assignment.status}
                      </span>
                    </div>

                    <div className="assignment-body">
                      <p className="assignment-question">{assignment.question}</p>
                      
                      <div className="assignment-meta">
                        <div className="meta-item">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                          </svg>
                          <span>{getTimeRemaining(assignment.deadline)}</span>
                        </div>
                        <div className="meta-item">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                          </svg>
                          <span>{new Date(assignment.deadline).toLocaleString()}</span>
                        </div>
                      </div>

                      {hasSubmitted(assignment.id) ? (
                        <div className="submitted-badge">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                          </svg>
                          Submitted
                        </div>
                      ) : assignment.status === 'active' ? (
                        <button 
                          className="submit-btn"
                          onClick={() => setSelectedAssignment(assignment)}
                        >
                          Submit Assignment
                        </button>
                      ) : (
                        <div className="closed-badge">Deadline Passed</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="submissions-section">
              <h2>My Submissions</h2>
              <p className="section-description">Track your submitted assignments</p>

              <div className="submissions-list">
                {mySubmissions.map(submission => (
                  <div key={submission.id} className="submission-item">
                    <div className="submission-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
                      </svg>
                    </div>
                    <div className="submission-details">
                      <h4>{submission.assignment?.title}</h4>
                      <p>Submitted: {new Date(submission.submitted_at).toLocaleString()}</p>
                      <p className="file-name">{submission.file_name}</p>
                    </div>
                    <span className={`status-badge ${submission.status}`}>
                      {submission.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="results-section">
              <h2>My Results</h2>
              <p className="section-description">View your graded assignments</p>

              <div className="results-grid">
                {myResults.map(result => (
                  <div key={result.id} className="result-card">
                    <div className="result-header">
                      <h3>{result.assignment?.title}</h3>
                      <div className="score-badge">{result.score}</div>
                    </div>
                    <div className="result-body">
                      <p className="graded-date">
                        Graded: {new Date(result.graded_at).toLocaleString()}
                      </p>
                      <div className="feedback-preview">
                        {result.feedback.substring(0, 200)}...
                      </div>
                      <button 
                        className="view-details-btn"
                        onClick={() => alert('Full feedback:\n\n' + result.feedback)}
                      >
                        View Full Feedback
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Modal */}
      {selectedAssignment && (
        <div className="modal-overlay" onClick={() => setSelectedAssignment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Assignment</h3>
              <button className="close-btn" onClick={() => setSelectedAssignment(null)}>×</button>
            </div>
            <div className="modal-body">
              <h4>{selectedAssignment.title}</h4>
              <p>{selectedAssignment.question}</p>
              
              <div className="file-upload-section">
                <label className="file-upload-label">
                  {file ? (
                    <div className="file-selected">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
                      </svg>
                      <span>{file.name}</span>
                    </div>
                  ) : (
                    <div className="file-placeholder">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
                      </svg>
                      <span>Click to select file</span>
                    </div>
                  )}
                  <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                </label>
              </div>

              <button 
                className="submit-modal-btn"
                onClick={() => handleSubmit(selectedAssignment.id)}
                disabled={loading || !file}
              >
                {loading ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
