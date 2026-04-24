import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeacherAssignments.css';

const TeacherAssignments = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');
  const [assignments, setAssignments] = useState([]);
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [gradingRules, setGradingRules] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    loadAssignments();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadAssignments, 10000);
    return () => clearInterval(interval);
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

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    if (!title || !question || !gradingRules || !deadline) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/assignments/create', {
        title,
        question,
        grading_rules: gradingRules,
        deadline,
        teacher_email: 'teacher@example.com'
      });

      if (response.data.success) {
        alert('Assignment created successfully!');
        setTitle('');
        setQuestion('');
        setGradingRules('');
        setDeadline('');
        loadAssignments();
        setActiveTab('manage');
      }
    } catch (error) {
      alert('Error creating assignment');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (assignmentId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/assignments/${assignmentId}/submissions`);
      if (response.data.success) {
        setSubmissions(response.data.submissions);
        setSelectedAssignment(assignments.find(a => a.id === assignmentId));
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleGradeAll = async (assignmentId) => {
    if (!window.confirm('Grade all submissions for this assignment? This may take a few minutes.')) {
      return;
    }

    setGrading(true);

    try {
      const response = await axios.post(`http://localhost:8000/api/grade/assignment/${assignmentId}`);
      if (response.data.success) {
        alert(`Successfully graded ${response.data.total_graded} submissions!`);
        loadSubmissions(assignmentId);
        loadAssignments();
      }
    } catch (error) {
      alert(error.response?.data?.detail || 'Error grading assignments');
    } finally {
      setGrading(false);
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

  return (
    <div className="teacher-assignments">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Assignment Management</h1>
          <button className="back-btn" onClick={() => navigate('/teacher-dashboard')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="dashboard-container">
        <div className="dashboard-sidebar">
          <button 
            className={`sidebar-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Create Assignment
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
            </svg>
            Manage Assignments
          </button>
        </div>

        <div className="dashboard-main">
          {activeTab === 'create' && (
            <div className="create-section">
              <h2>Create New Assignment</h2>
              <p className="section-description">Set up a new assignment with grading criteria and deadline</p>

              <form onSubmit={handleCreateAssignment} className="create-form">
                <div className="form-group">
                  <label>Assignment Title <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g., Photosynthesis Essay"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Assignment Question <span className="required">*</span></label>
                  <textarea
                    placeholder="Enter the question or prompt for students..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Grading Rubric <span className="required">*</span></label>
                  <textarea
                    placeholder="Define grading criteria and point distribution..."
                    value={gradingRules}
                    onChange={(e) => setGradingRules(e.target.value)}
                    rows="8"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Deadline <span className="required">*</span></label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="create-btn" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Assignment'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'manage' && !selectedAssignment && (
            <div className="manage-section">
              <h2>Your Assignments</h2>
              <p className="section-description">View and manage all your assignments</p>

              <div className="assignments-list">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="assignment-item">
                    <div className="assignment-info">
                      <h3>{assignment.title}</h3>
                      <p className="assignment-question">{assignment.question}</p>
                      <div className="assignment-meta">
                        <span className={`status-badge ${assignment.status}`}>
                          {assignment.status}
                        </span>
                        <span className="deadline-info">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                          </svg>
                          {getTimeRemaining(assignment.deadline)}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="view-submissions-btn"
                      onClick={() => loadSubmissions(assignment.id)}
                    >
                      View Submissions
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'manage' && selectedAssignment && (
            <div className="submissions-section">
              <div className="section-header">
                <div>
                  <button className="back-link" onClick={() => setSelectedAssignment(null)}>
                    ← Back to Assignments
                  </button>
                  <h2>{selectedAssignment.title}</h2>
                  <p className="section-description">
                    {submissions.length} submission(s) • Status: {selectedAssignment.status}
                  </p>
                </div>
                {selectedAssignment.status === 'closed' && submissions.length > 0 && (
                  <button 
                    className="grade-all-btn"
                    onClick={() => handleGradeAll(selectedAssignment.id)}
                    disabled={grading}
                  >
                    {grading ? (
                      <>
                        <span className="spinner"></span>
                        Grading...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                        </svg>
                        Grade All Submissions
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="submissions-grid">
                {submissions.map(submission => (
                  <div key={submission.id} className="submission-card">
                    <div className="submission-header">
                      <h4>{submission.student_name}</h4>
                      <span className={`status-badge ${submission.status}`}>
                        {submission.status}
                      </span>
                    </div>
                    <div className="submission-body">
                      <p className="submission-meta">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        {submission.student_email}
                      </p>
                      <p className="submission-meta">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
                        </svg>
                        {submission.file_name}
                      </p>
                      <p className="submission-meta">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                        </svg>
                        {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                      
                      {submission.result && (
                        <div className="result-preview">
                          <div className="score-display">{submission.result.score}</div>
                          <p className="feedback-snippet">
                            {submission.result.feedback.substring(0, 150)}...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignments;
