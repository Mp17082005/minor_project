import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Chat.css';

const Chat = () => {
  const { docId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('notes'); // 'notes', 'web', or 'llm'
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    // Set document title
    document.title = `Chat - Document ${docId}`;
  }, [docId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
  
    if (!docId) {
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'No document ID found. Please upload a file first.'
      }]);
      return;
    }
  
    const userMessage = input;
    setInput('');
    setLoading(true);
  
    // Add user message to chat
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
  
    try {
      const response = await axios.post('http://localhost:8000/chat', {
        doc_id: docId,   // ✅ safe to send now
        message: userMessage,
        mode: activeMode
      });
  
      if (response.data.success) {
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: response.data.response,
          mode: activeMode,
          reference: activeMode === 'notes' ? 'Chemistry Notes, section 2.1' : ''
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Sorry, there was an error processing your request.'
      }]);
    } finally {
      setLoading(false);
    }
  };
  

  const handleModeChange = (mode) => {
    setActiveMode(mode);
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="notes-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
          </div>
          <h3>Document Chat</h3>
        </div>

        <div className="chat-history">
          <h4>Recent Conversations</h4>
          <div className="chat-search">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ul>
            <li className="active">
              <div className="chat-item-title">Current Session</div>
              <div className="chat-item-date">Just now</div>
            </li>
            <li>
              <div className="chat-item-title">Previous Session</div>
              <div className="chat-item-date">Yesterday</div>
            </li>
            <li>
              <div className="chat-item-title">Chemistry Exam Review</div>
              <div className="chat-item-date">2 days ago</div>
            </li>
          </ul>
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-title">
            <h2>Chat with your document</h2>
            <span className="document-id">{docId}</span>
          </div>
          <div className="chat-header-mode">
            {activeMode === 'notes' && (
              <svg className="notes-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            )}
            {activeMode === 'web' && (
              <svg className="web-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                <path d="M11.5 6.02c1.94 0 3.5 1.56 3.5 3.48S13.44 13 11.5 13 8 11.42 8 9.5 9.56 6.02 11.5 6.02zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14h-7v-1.02c0-1.74-2.63-2.48-4-2.48s-4 .74-4 2.48V18H4V6h16v12z"/>
              </svg>
            )}
            {activeMode === 'llm' && (
              <svg className="llm-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 8c-1.45 0-2.26 1.44-1.93 2.51l-3.55 3.56c-.3-.09-.74-.09-1.04 0l-2.55-2.55C12.27 10.45 11.46 9 10 9c-1.45 0-2.27 1.44-1.93 2.52l-4.56 4.55C2.44 15.74 1 16.55 1 18c0 1.1.9 2 2 2 1.45 0 2.26-1.44 1.93-2.51l4.55-4.56c.3.09.74.09 1.04 0l2.55 2.55C12.73 16.55 13.54 18 15 18c1.45 0 2.27-1.44 1.93-2.52l3.56-3.55c1.07.33 2.51-.48 2.51-1.93 0-1.1-.9-2-2-2z"/>
                <path d="m15 9 .94-2.07L18 6l-2.06-.93L15 3l-.92 2.07L12 6l2.08.93zM3.5 11 4 9l2-.5L4 8l-.5-2L3 8l-2 .5L3 9z"/>
              </svg>
            )}
            <span>{activeMode.charAt(0).toUpperCase() + activeMode.slice(1)} Mode</span>
          </div>
        </div>
        
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-chat">
              <div className="empty-chat-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                  <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
                </svg>
              </div>
              <h3>Start a conversation</h3>
              <p>Ask a question about your document to get started</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-header">
                <div className="message-avatar">
                  {message.type === 'user' ? 'U' : message.type === 'assistant' ? 'A' : '!'}
                </div>
                <span className="message-sender">{message.type === 'user' ? 'You' : message.type === 'assistant' ? 'Assistant' : 'System'}</span>
                <span className="message-time">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                {message.mode && (
                  <span className="message-mode">
                    {message.mode === 'notes' && (
                      <svg className="notes-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                        <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                        <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                      </svg>
                    )}
                    {message.mode === 'web' && (
                      <svg className="web-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                        <path d="M16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                        <path d="M11.5 6.02c1.94 0 3.5 1.56 3.5 3.48S13.44 13 11.5 13 8 11.42 8 9.5 9.56 6.02 11.5 6.02zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14h-7v-1.02c0-1.74-2.63-2.48-4-2.48s-4 .74-4 2.48V18H4V6h16v12z"/>
                      </svg>
                    )}
                    {message.mode === 'llm' && (
                      <svg className="llm-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                        <path d="M21 8c-1.45 0-2.26 1.44-1.93 2.51l-3.55 3.56c-.3-.09-.74-.09-1.04 0l-2.55-2.55C12.27 10.45 11.46 9 10 9c-1.45 0-2.27 1.44-1.93 2.52l-4.56 4.55C2.44 15.74 1 16.55 1 18c0 1.1.9 2 2 2 1.45 0 2.26-1.44 1.93-2.51l4.55-4.56c.3.09.74.09 1.04 0l2.55 2.55C12.73 16.55 13.54 18 15 18c1.45 0 2.27-1.44 1.93-2.52l3.56-3.55c1.07.33 2.51-.48 2.51-1.93 0-1.1-.9-2-2-2z"/>
                        <path d="m15 9 .94-2.07L18 6l-2.06-.93L15 3l-.92 2.07L12 6l2.08.93zM3.5 11 4 9l2-.5L4 8l-.5-2L3 8l-2 .5L3 9z"/>
                      </svg>
                    )}
                  </span>
                )}
              </div>
              <div className="message-content">{message.content}</div>
              {message.reference && (
                <div className="message-reference">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                  <span>Reference: {message.reference}</span>
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="message assistant">
              <div className="message-header">
                <div className="message-avatar">A</div>
                <span className="message-sender">Assistant</span>
                <span className="message-time">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <div className="mode-selector">
            <button
              className={`mode-btn ${activeMode === 'notes' ? 'active' : ''}`}
              onClick={() => handleModeChange('notes')}
            >
              <div className="mode-icon notes-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                  <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <span>Document</span>
            </button>
            <button
              className={`mode-btn ${activeMode === 'web' ? 'active' : ''}`}
              onClick={() => handleModeChange('web')}
            >
              <div className="mode-icon web-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                  <path d="M11.5 6.02c1.94 0 3.5 1.56 3.5 3.48S13.44 13 11.5 13 8 11.42 8 9.5 9.56 6.02 11.5 6.02zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14h-7v-1.02c0-1.74-2.63-2.48-4-2.48s-4 .74-4 2.48V18H4V6h16v12z"/>
                </svg>
              </div>
              <span>Web Search</span>
            </button>
            <button
              className={`mode-btn ${activeMode === 'llm' ? 'active' : ''}`}
              onClick={() => handleModeChange('llm')}
            >
              <div className="mode-icon llm-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 8c-1.45 0-2.26 1.44-1.93 2.51l-3.55 3.56c-.3-.09-.74-.09-1.04 0l-2.55-2.55C12.27 10.45 11.46 9 10 9c-1.45 0-2.27 1.44-1.93 2.52l-4.56 4.55C2.44 15.74 1 16.55 1 18c0 1.1.9 2 2 2 1.45 0 2.26-1.44 1.93-2.51l4.55-4.56c.3.09.74.09 1.04 0l2.55 2.55C12.73 16.55 13.54 18 15 18c1.45 0 2.27-1.44 1.93-2.52l3.56-3.55c1.07.33 2.51-.48 2.51-1.93 0-1.1-.9-2-2-2z"/>
                  <path d="m15 9 .94-2.07L18 6l-2.06-.93L15 3l-.92 2.07L12 6l2.08.93zM3.5 11 4 9l2-.5L4 8l-.5-2L3 8l-2 .5L3 9z"/>
                </svg>
              </div>
              <span>AI Assistant</span>
            </button>
          </div>

          <form onSubmit={handleSendMessage} className="chat-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask a question in ${activeMode} mode...`}
              disabled={loading}
              className="chat-input"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="send-btn"
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;