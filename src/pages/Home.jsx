import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, FileCode, Cpu, BookOpen } from 'lucide-react';
import '../App.css';

const Home = () => {
  return (
    <div className="home-container">
      
      {/* Hero Section */}
      <div className="hero-section">
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
            <Cpu size={48} color="#4CAF50" />
            <BookOpen size={48} color="#2196F3" />
        </div>
        <h1>CS Lab 9618</h1>
        <p>The Ultimate A-Level Computer Science Workbench</p>
      </div>

      {/* The Grid of Labs */}
      <div className="lab-grid">
        
        {/* Card 1: Python */}
        <Link to="/python" className="lab-card python">
          <div className="card-header">
            <Terminal size={32} color="#4CAF50" />
            <h2>Python Lab</h2>
          </div>
          <p className="card-desc">
            A full Python 3.10 environment running directly in your browser. 
            Features a <strong>Visual Debugger</strong> to trace variables step-by-step 
            and a virtual file system.
          </p>
          <span className="status-badge" style={{ color: '#81C784' }}>● Online & Ready</span>
        </Link>

        {/* Card 2: Pseudocode */}
        <Link to="/pseudocode" className="lab-card pseudo">
          <div className="card-header">
            <FileCode size={32} color="#2196F3" />
            <h2>Pseudocode Lab</h2>
          </div>
          <p className="card-desc">
            Write and execute Cambridge-style pseudocode. 
            Includes syntax highlighting and instant feedback to help you 
            master the syntax before the exam.
          </p>
          <span className="status-badge" style={{ color: '#64B5F6' }}>● Legacy Support</span>
        </Link>

      </div>

      {/* Footer */}
      <div style={{ marginTop: '50px', color: '#555', fontSize: '0.9rem' }}>
        <p>Built for A-Level 9618 Students.</p>
      </div>
    </div>
  );
};

export default Home;