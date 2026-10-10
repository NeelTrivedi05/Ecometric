import React, { useState, useRef } from 'react';
import { aboutTopics } from '../../data/aboutTopics';
import { ChevronRightIcon } from '../studio/Icons';

export default function AboutSection() {
  const [activeTopicId, setActiveTopicId] = useState(aboutTopics[0].id);
  const tabRefs = useRef({});

  const activeTopic = aboutTopics.find((t) => t.id === activeTopicId) || aboutTopics[0];

  const handleKeyDown = (e, index) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % aboutTopics.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + aboutTopics.length) % aboutTopics.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = aboutTopics.length - 1;
    }

    if (nextIndex !== index) {
      const nextTopic = aboutTopics[nextIndex];
      setActiveTopicId(nextTopic.id);
      if (tabRefs.current[nextTopic.id]) {
        tabRefs.current[nextTopic.id].focus();
      }
    }
  };

  return (
    <section id="about" className="product-tile-light about-section-root">
      <div className="lp-container">
        {/* Section Header */}
        <div className="apple-section-header" style={{ marginBottom: '44px' }}>
          <div className="apple-section-eyebrow" style={{ color: 'var(--apple-primary)' }}>
            KNOWLEDGE BASE
          </div>
          <h2 className="apple-section-title">
            Everything you need to know about EPDs
          </h2>
          <p className="apple-section-subtitle">
            Comprehensive technical standards, life cycle frameworks, and calculation methodologies powering EcoMetric Studio.
          </p>
        </div>

        {/* Desktop Vertical Tabs & Mobile Horizontal Bar Layout */}
        <div className="about-layout-grid">
          {/* Navigation Tabs */}
          <div
            role="tablist"
            aria-label="EPD Knowledge Base Topics"
            className="about-tabs-container"
          >
            {aboutTopics.map((topic, index) => {
              const isActive = topic.id === activeTopicId;
              return (
                <button
                  key={topic.id}
                  id={`tab-${topic.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${topic.id}`}
                  tabIndex={isActive ? 0 : -1}
                  ref={(el) => (tabRefs.current[topic.id] = el)}
                  onClick={() => setActiveTopicId(topic.id)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`about-tab-btn ${isActive ? 'active' : ''}`}
                >
                  <span>{topic.tabLabel}</span>
                  <ChevronRightIcon
                    size={14}
                    className={`about-tab-arrow ${isActive ? 'visible' : ''}`}
                  />
                </button>
              );
            })}
          </div>

          {/* Active Content Panel */}
          <div
            id={`panel-${activeTopic.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTopic.id}`}
            className="about-panel-card"
          >
            <div className="about-panel-header">
              <h3 className="about-panel-title">{activeTopic.title}</h3>
              <p className="about-panel-intro">{activeTopic.intro}</p>
            </div>

            {/* Key Points Grid */}
            <div className="about-points-grid">
              {activeTopic.points.map((point, idx) => (
                <div key={idx} className="about-point-card">
                  <h4 className="about-point-heading">{point.heading}</h4>
                  <p className="about-point-body">{point.body}</p>
                </div>
              ))}
            </div>

            {/* Tag Chips */}
            <div className="about-tags-row">
              {activeTopic.tags.map((tag, idx) => (
                <span key={idx} className="about-tag-chip">
                  {tag}
                </span>
              ))}
            </div>

            {/* Verified Sources */}
            <div className="about-sources-container">
              <div className="about-sources-label">Verified Sources & References</div>
              <div className="about-sources-list">
                {activeTopic.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-source-link"
                  >
                    <span>{src.title}</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
