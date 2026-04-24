import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('grade');
  const [gradingRules, setGradingRules] = useState('');
  const [question, setQuestion] = useState('');
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [showRubricTemplates, setShowRubricTemplates] = useState(false);

  const rubricTemplates = [
    {
      name: 'Essay/Written Assignment',
      template: `Content Accuracy and Understanding (40 points)
- Demonstrates thorough understanding of the topic
- All key concepts are correctly explained
- Factual information is accurate

Organization and Structure (20 points)
- Clear introduction, body, and conclusion
- Logical flow of ideas
- Proper paragraph structure

Critical Thinking and Analysis (20 points)
- Shows original thought and analysis
- Makes connections between concepts
- Provides relevant examples

Grammar, Spelling, and Presentation (20 points)
- Proper grammar and punctuation
- Correct spelling throughout
- Professional formatting and presentation

Total: 100 points`
    },
    {
      name: 'Science/Technical Assignment',
      template: `Scientific Accuracy (35 points)
- Correct scientific concepts and terminology
- Accurate explanations of processes
- Proper use of scientific method

Depth of Explanation (25 points)
- Detailed and comprehensive answers
- Shows understanding of underlying principles
- Addresses all parts of the question

Use of Examples and Evidence (20 points)
- Provides relevant examples
- Uses data or evidence to support claims
- Makes real-world connections

Clarity and Communication (20 points)
- Clear and concise writing
- Well-organized presentation
- Proper grammar and spelling

Total: 100 points`
    },
    {
      name: 'Math/Problem-Solving',
      template: `Correct Solution (40 points)
- Final answer is correct
- All calculations are accurate

Problem-Solving Approach (30 points)
- Shows clear methodology
- Uses appropriate formulas/techniques
- Logical step-by-step process

Work Shown (20 points)
- All steps are clearly shown
- Work is organized and easy to follow
- Proper notation used

Explanation and Reasoning (10 points)
- Explains reasoning behind approach
- Shows understanding of concepts

Total: 100 points`
    }
  ];

  const loadTemplate = (template) => {
    setGradingRules(template);
    setShowRubricTemplates(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name, file.type);
      setAssignmentFile(file);
    }
  };

  const handleGradeAssignment = async () => {
    if (!assignmentFile || !gradingRules || !question) {
      alert('Please fill all required fields: question, grading rules, and assignment file');
      return;
    }

    console.log('Starting grading process...');
    console.log('File:', assignmentFile.name);
    console.log('Question:', question);
    console.log('Rules:', gradingRules);

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', assignmentFile);
    formData.append('grading_rules', gradingRules);
    formData.append('question', question);

    try {
      console.log('Sending request to backend...');
      const response = await axios.post('http://localhost:8000/grade-assignment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Response received:', response.data);

      if (response.data.success) {
        setResult({
          ...response.data,
          studentName: studentName || 'Student',
          assignmentTitle: assignmentTitle || 'Assignment',
          gradedAt: new Date().toLocaleString()
        });
        // Scroll to results
        setTimeout(() => {
          document.querySelector('.result-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        alert('Error: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error grading assignment:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        alert('Error: ' + (error.response.data.detail || error.response.data.error || 'Server error'));
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('Error: No response from server. Make sure backend is running on port 8000.');
      } else {
        console.error('Error message:', error.message);
        alert('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuestion('');
    setGradingRules('');
    setAssignmentFile(null);
    setStudentName('');
    setAssignmentTitle('');
    setResult(null);
  };

  const handleExportResult = () => {
    if (!result) return;
    
    const exportText = `
GRADING REPORT
==============

Student: ${result.studentName}
Assignment: ${result.assignmentTitle}
Graded: ${result.gradedAt}
Score: ${result.score}

${result.feedback}
    `;
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grading-report-${result.studentName}-${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Teacher Dashboard</h1>
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
            className="sidebar-btn"
            onClick={() => navigate('/teacher-assignments')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
            </svg>
            Assignments
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'grade' ? 'active' : ''}`}
            onClick={() => setActiveTab('grade')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
            </svg>
            Quick Grade
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
            </svg>
            History
          </button>
        </div>

        <div className="dashboard-main">
          {activeTab === 'grade' && (
            <div className="grade-section">
              <div className="section-header">
                <div>
                  <h2>Grade Student Assignment</h2>
                  <p className="section-description">
                    Upload a student assignment and define grading criteria. Our AI will analyze and provide detailed feedback.
                  </p>
                </div>
                {result && (
                  <button className="reset-btn" onClick={handleReset}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                    New Assignment
                  </button>
                )}
              </div>

              <div className="form-section">
                <div className="form-row">
                  <div className="form-group half">
                    <label>Student Name <span className="optional">(Optional)</span></label>
                    <input
                      type="text"
                      placeholder="Enter student name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                    />
                  </div>
                  <div className="form-group half">
                    <label>Assignment Title <span className="optional">(Optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g., Photosynthesis Essay"
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Assignment Question / Prompt <span className="required">*</span></label>
                  <textarea
                    placeholder="Enter the question or assignment prompt that students were asked to answer...

Example: Explain the process of photosynthesis, including the inputs, outputs, and its importance to life on Earth."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <div className="label-with-action">
                    <label>Grading Rubric <span className="required">*</span></label>
                    <button 
                      className="template-btn"
                      onClick={() => setShowRubricTemplates(!showRubricTemplates)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                      </svg>
                      Use Template
                    </button>
                  </div>
                  
                  {showRubricTemplates && (
                    <div className="template-dropdown">
                      {rubricTemplates.map((template, idx) => (
                        <button
                          key={idx}
                          className="template-option"
                          onClick={() => loadTemplate(template.template)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                          </svg>
                          {template.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <textarea
                    placeholder="Define your grading criteria and point distribution...

Example:
Content Accuracy (40 points)
- Demonstrates thorough understanding
- All key concepts correctly explained

Organization (20 points)
- Clear structure and flow
- Proper paragraph organization

Critical Thinking (20 points)
- Original analysis and insights
- Relevant examples provided

Grammar & Presentation (20 points)
- Proper grammar and spelling
- Professional formatting

Total: 100 points"
                    value={gradingRules}
                    onChange={(e) => setGradingRules(e.target.value)}
                    rows="12"
                  />
                  <div className="input-help">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    Be specific about criteria and point values. The AI will grade according to your rubric.
                  </div>
                </div>

                <div className="form-group">
                  <label>Upload Student Assignment <span className="required">*</span></label>
                  <div className="file-upload-area">
                    {assignmentFile ? (
                      <div className="file-selected">
                        <div className="file-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                          </svg>
                        </div>
                        <div className="file-info">
                          <span className="file-name">{assignmentFile.name}</span>
                          <span className="file-size">
                            {(assignmentFile.size / 1024).toFixed(2)} KB
                          </span>
                        </div>
                        <button className="remove-file" onClick={() => setAssignmentFile(null)}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="file-upload-label">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
                        </svg>
                        <span className="upload-text">Click to upload or drag and drop</span>
                        <span className="file-types">PDF, DOC, DOCX, JPG, PNG (Max 10MB)</span>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    className="grade-btn"
                    onClick={handleGradeAssignment}
                    disabled={loading || !assignmentFile || !gradingRules || !question}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Analyzing Assignment...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                        </svg>
                        Grade Assignment
                      </>
                    )}
                  </button>
                </div>
              </div>

              {result && (
                <div className="result-section">
                  <div className="result-header-section">
                    <h3>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                      </svg>
                      Grading Complete
                    </h3>
                    <button className="export-btn" onClick={handleExportResult}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>
                      </svg>
                      Export Report
                    </button>
                  </div>

                  <div className="result-card">
                    <div className="result-meta">
                      <div className="meta-item">
                        <span className="meta-label">Student:</span>
                        <span className="meta-value">{result.studentName}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Assignment:</span>
                        <span className="meta-value">{result.assignmentTitle}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Graded:</span>
                        <span className="meta-value">{result.gradedAt}</span>
                      </div>
                    </div>

                    <div className="score-display">
                      <div className="score-circle">
                        <div className="score-number">{result.score}</div>
                        <div className="score-label">Final Score</div>
                      </div>
                    </div>

                    <div className="result-content">
                      <div className="feedback-section">
                        {result.feedback && result.feedback.split('\n\n').map((section, idx) => {
                          const lines = section.split('\n');
                          const header = lines[0];
                          
                          if (header.includes('SCORE:')) {
                            return null; // Skip score line as we show it separately
                          }
                          
                          if (header.includes('FEEDBACK:')) {
                            return (
                              <div key={idx} className="feedback-block">
                                <h4 className="feedback-header">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                                  </svg>
                                  Overall Feedback
                                </h4>
                                <div className="feedback-text">
                                  {lines.slice(1).map((line, i) => line.trim() && <p key={i}>{line}</p>)}
                                </div>
                              </div>
                            );
                          }
                          
                          if (header.includes('DETAILED BREAKDOWN:')) {
                            return (
                              <div key={idx} className="feedback-block">
                                <h4 className="feedback-header">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                  </svg>
                                  Detailed Breakdown
                                </h4>
                                <div className="feedback-text breakdown">
                                  {lines.slice(1).map((line, i) => {
                                    if (line.trim().startsWith('*   **')) {
                                      return <p key={i} className="criterion-header">{line.replace(/\*/g, '')}</p>;
                                    } else if (line.trim().startsWith('*')) {
                                      return <p key={i} className="criterion-point">{line}</p>;
                                    } else if (line.trim()) {
                                      return <p key={i}>{line}</p>;
                                    }
                                    return null;
                                  })}
                                </div>
                              </div>
                            );
                          }
                          
                          if (header.includes('STRENGTHS:')) {
                            return (
                              <div key={idx} className="feedback-block strengths">
                                <h4 className="feedback-header">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                                  </svg>
                                  Strengths
                                </h4>
                                <div className="feedback-text">
                                  {lines.slice(1).map((line, i) => line.trim() && <p key={i}>{line}</p>)}
                                </div>
                              </div>
                            );
                          }
                          
                          if (header.includes('AREAS FOR IMPROVEMENT:')) {
                            return (
                              <div key={idx} className="feedback-block improvements">
                                <h4 className="feedback-header">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                  </svg>
                                  Areas for Improvement
                                </h4>
                                <div className="feedback-text">
                                  {lines.slice(1).map((line, i) => line.trim() && <p key={i}>{line}</p>)}
                                </div>
                              </div>
                            );
                          }
                          
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-section">
              <h2>Grading History</h2>
              <p className="section-description">View previously graded assignments</p>
              
              <div className="history-list">
                <div className="history-item">
                  <div className="history-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
                    </svg>
                  </div>
                  <div className="history-details">
                    <h4>Chemistry Assignment - Student A</h4>
                    <p>Graded on April 4, 2026</p>
                  </div>
                  <div className="history-score">85/100</div>
                </div>

                <div className="history-item">
                  <div className="history-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
                    </svg>
                  </div>
                  <div className="history-details">
                    <h4>Physics Exam - Student B</h4>
                    <p>Graded on April 3, 2026</p>
                  </div>
                  <div className="history-score">92/100</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
