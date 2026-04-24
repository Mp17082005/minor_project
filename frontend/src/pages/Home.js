import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);

    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        navigate(`/chat/${response.data.doc_id}`);
      }
    } catch (err) {
      setError('Error uploading file. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Exam Prep Assistant - Upload Documents';
  }, []);

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="gradient-text">Your Exam Preparation Companion</h1>
        <p className="hero-subtitle">
          Upload your notes or presentation and ask any question
          to get a tailored response.
        </p>
        <div className="hero-badges">
          <span className="badge">PDF</span>
          <span className="badge">Word</span>
          <span className="badge">PowerPoint</span>
          <span className="badge">Text</span>
        </div>

        <div className="upload-section glass-card">
          <div className="upload-container">
            <div className="file-input-wrapper">
              <div className="file-name-display">
                {file ? (
                  <div className="selected-file">
                    <span className="file-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                      </svg>
                    </span>
                    <span className="file-name">{file.name}</span>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <span className="upload-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                    </span>
                    <span>Drag & drop or click to browse</span>
                  </div>
                )}
              </div>
              <label className="file-input-label">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="file-input"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                />
              </label>
            </div>
          </div>
          
          <div className="browse-upload-container">
            <label className="browse-btn btn btn-secondary">
              <span className="browse-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </span>
              <span>Browse Files</span>
              <input
                type="file"
                onChange={handleFileChange}
                className="file-input-hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              />
            </label>
            
            <button
              className="btn btn-primary upload-btn"
              onClick={handleUpload}
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span className="upload-icon-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
                    </svg>
                  </span>
                  <span>Upload</span>
                </>
              )}
            </button>
          </div>
          
          <div className="description-container">
            <div className="input-label">Document Description</div>
            <textarea
              className="description-input"
              placeholder="Add details about your document (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
            />
            <div className="input-help">Adding a description helps improve search results</div>
          </div>
        </div>

        {error && <div className="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="error-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </div>}
      </div>

      <div className="features-section">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">Our AI-powered platform helps you prepare for exams by analyzing your documents and providing intelligent responses</p>
        
        <div className="features-grid">
          <div className="feature-card card">
            <div className="feature-icon notes-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <h3 className="gradient-text-alt">Document Chat</h3>
            <p>Search through your uploaded documents for relevant information and get contextual answers</p>
          </div>

          <div className="feature-card card">
            <div className="feature-icon web-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                <path d="M11.5 6.02c1.94 0 3.5 1.56 3.5 3.48S13.44 13 11.5 13 8 11.42 8 9.5 9.56 6.02 11.5 6.02zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14h-7v-1.02c0-1.74-2.63-2.48-4-2.48s-4 .74-4 2.48V18H4V6h16v12z"/>
              </svg>
            </div>
            <h3 className="gradient-text-alt">Web Search</h3>
            <p>Enhance your knowledge with real-time information from trusted web sources</p>
          </div>

          <div className="feature-card card">
            <div className="feature-icon llm-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 8c-1.45 0-2.26 1.44-1.93 2.51l-3.55 3.56c-.3-.09-.74-.09-1.04 0l-2.55-2.55C12.27 10.45 11.46 9 10 9c-1.45 0-2.27 1.44-1.93 2.52l-4.56 4.55C2.44 15.74 1 16.55 1 18c0 1.1.9 2 2 2 1.45 0 2.26-1.44 1.93-2.51l4.55-4.56c.3.09.74.09 1.04 0l2.55 2.55C12.73 16.55 13.54 18 15 18c1.45 0 2.27-1.44 1.93-2.52l3.56-3.55c1.07.33 2.51-.48 2.51-1.93 0-1.1-.9-2-2-2z"/>
                <path d="m15 9 .94-2.07L18 6l-2.06-.93L15 3l-.92 2.07L12 6l2.08.93zM3.5 11 4 9l2-.5L4 8l-.5-2L3 8l-2 .5L3 9z"/>
              </svg>
            </div>
            <h3 className="gradient-text-alt">AI Assistant</h3>
            <p>Get personalized answers to your specific questions using advanced AI technology</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;