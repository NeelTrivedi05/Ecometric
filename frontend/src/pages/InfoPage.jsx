import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { aboutTopics } from '../data/aboutTopics';
import { LeafIcon, ChevronRightIcon, ChevronLeftIcon } from '../components/studio/Icons';
import AboutTimeline from '../components/info/AboutTimeline';
import TopicTimeline from '../components/info/TopicTimeline';
import '../styles/InfoPage.css';

export default function InfoPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  // Find active topic or default to 'more-info'
  const currentTopicId = topicId || 'more-info';
  const activeTopic = aboutTopics.find((t) => t.id === currentTopicId) || aboutTopics[0];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTopicId]);

  const handleSelectTopic = (id) => {
    navigate(`/info/${id}`);
  };

  const handleLaunchApp = () => {
    navigate('/app');
  };

  return (
    <div className="info-page-root">
      {/* Top Sticky Header */}
      <header className="info-header">
        <div className="lp-container info-header-inner">
          <Link to="/" className="info-brand">
            <LeafIcon size={18} style={{ color: 'var(--apple-primary)' }} />
            <span className="info-brand-title">EcoMetric Studio</span>
            <span className="info-brand-badge">Knowledge Base</span>
          </Link>

          <div className="info-header-actions">
            <Link to="/" className="info-nav-back">
              <ChevronLeftIcon size={14} />
              <span>Back to Home</span>
            </Link>

            <button
              type="button"
              onClick={handleLaunchApp}
              className="btn-apple-primary"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              <span>Launch Studio</span>
              <ChevronRightIcon size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="info-main-container lp-container">
        {/* Page Banner Header */}
        <div className="info-hero-banner">
          <div className="apple-section-eyebrow" style={{ color: 'var(--apple-primary)', marginBottom: '8px' }}>
            TECHNICAL KNOWLEDGE BASE
          </div>
          <h1 className="info-hero-title">{activeTopic.title}</h1>
          <p className="info-hero-subtitle">{activeTopic.intro}</p>
        </div>

        {/* Sidebar & Detailed Content Grid */}
        <div className="info-layout-grid">
          {/* Topics Sidebar */}
          <aside className="info-sidebar">
            <div className="info-sidebar-title">Topics & Standards</div>
            <nav className="info-sidebar-nav" aria-label="Knowledge Topics">
              {aboutTopics.map((topic) => {
                const isActive = topic.id === activeTopic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleSelectTopic(topic.id)}
                    className={`info-sidebar-btn ${isActive ? 'active' : ''}`}
                  >
                    <span>{topic.tabLabel}</span>
                    <ChevronRightIcon
                      size={14}
                      className={`info-sidebar-arrow ${isActive ? 'visible' : ''}`}
                    />
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Topic Details Panel */}
          <article key={activeTopic.id} className={`info-content-card ${activeTopic.id === 'more-info' ? 'info-content-card--about' : 'info-content-card--timeline'}`}>
            {activeTopic.id === 'more-info' && <AboutTimeline />}
            {activeTopic.id !== 'more-info' && <TopicTimeline topic={activeTopic} />}
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="info-footer">
        <div className="lp-container info-footer-inner">
          <div>
            Copyright © {new Date().getFullYear()} EcoMetric Systems Inc. All rights reserved.
          </div>
          <div>
            Compliant with ISO 14040/44 LCA Principles and PEF 3.0 Data Quality Rating rules.
          </div>
        </div>
      </footer>
    </div>
  );
}
