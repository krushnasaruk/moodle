'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import { useAuth } from '@/context/AuthContext';

// Simple formatter for AI responses (bolding and headers)
const formatMarkdown = (text) => {
  return text.split('\n').map((line, i) => {
    // Headers
    if (line.startsWith('### ')) {
      return <h3 key={i}>{line.substring(4)}</h3>;
    }
    if (line.startsWith('## ')) {
      return <h3 key={i} style={{fontSize: '1.2rem'}}>{line.substring(3)}</h3>;
    }
    
    // Bold text (**text**)
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={i} style={{ display: 'block', minHeight: line.trim() === '' ? '12px' : 'auto' }}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*')) {
             return <em key={j}>{part.slice(1, -1)}</em>;
          }
          return part;
        })}
      </span>
    );
  });
};

export default function AssistantPage() {
  const { user } = useAuth();
  const ADMIN_EMAILS = ['sutraverse11@gmail.com'];
  const isAdmin = user && (ADMIN_EMAILS.includes(user.email) || user.isAdmin);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.chatWindow} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <div className={styles.avatar} style={{ width: 80, height: 80, fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 className={styles.emptyTitle}>Sign in Required</h2>
          <p className={styles.emptySubtitle} style={{ marginTop: '1rem' }}>
            Please log in to access the Sutras AI Assistant.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.chatWindow} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <div className={styles.avatar} style={{ width: 80, height: 80, fontSize: '3rem', marginBottom: '1rem', background: 'var(--bg-input)' }}>🚧</div>
          <h2 className={styles.emptyTitle}>Maintenance Mode</h2>
          <p className={styles.emptySubtitle} style={{ marginTop: '1rem' }}>
            Sutras AI is currently undergoing scheduled upgrades and maintenance. It will be back online soon!
          </p>
        </div>
      </div>
    );
  }

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim()) return;

    // Add user message to UI immediately
    const userMsg = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch response');
      }

      setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: `**Error:** ${err.message}. Please check your API key or internet connection.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text) => {
    handleSend(text);
  };

  return (
    <div className={styles.container}>
      <div className={styles.chatWindow}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleBox}>
            <div className={styles.avatar}>🧠</div>
            <div>
              <h1 className={styles.title}>Sutras AI</h1>
              <div className={styles.status}>
                <span className={styles.statusDot}></span>
                Online and ready
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className={styles.chatArea}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.avatar} style={{ width: 80, height: 80, fontSize: '3rem', margin: '0 auto' }}>🤖</div>
              <h2 className={styles.emptyTitle}>How can I help you study?</h2>
              <p className={styles.emptySubtitle}>
                Ask me to explain concepts, plan a study schedule, or summarize topics for your upcoming exams.
              </p>
              <div className={styles.suggestions}>
                <button className={styles.suggestionPill} onClick={() => handleSuggestionClick("Explain Dijkstra's algorithm simply")}>
                  Explain Dijkstra's algorithm
                </button>
                <button className={styles.suggestionPill} onClick={() => handleSuggestionClick("Create a 3-day study plan for Operating Systems")}>
                  Study plan for OS
                </button>
                <button className={styles.suggestionPill} onClick={() => handleSuggestionClick("What are the key differences between SQL and NoSQL?")}>
                  SQL vs NoSQL
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : styles.modelRow}`}>
                <div className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.modelMessage}`}>
                  {msg.role === 'user' ? msg.content : formatMarkdown(msg.content)}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className={`${styles.messageRow} ${styles.modelRow}`}>
              <div className={styles.typingIndicator}>
                <span className={styles.typingDot}></span>
                <span className={styles.typingDot}></span>
                <span className={styles.typingDot}></span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className={styles.inputArea}>
          <form 
            className={styles.inputForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sutras AI a question..."
              className={styles.inputField}
              disabled={isLoading}
            />
            <button type="submit" className={styles.sendBtn} disabled={!input.trim() || isLoading}>
              ↑
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
