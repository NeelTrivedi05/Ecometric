import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../studio/Icons';

export default function TopicTimeline({ topic }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const points = topic.points;
  const activePoint = points[activeIndex];
  const progress = points.length > 1
    ? `${(activeIndex / (points.length - 1)) * 100}%`
    : '100%';

  const move = (direction) => {
    setActiveIndex((current) => Math.min(
      points.length - 1,
      Math.max(0, current + direction)
    ));
  };

  return (
    <section className="about-timeline topic-timeline" aria-labelledby="topic-timeline-title">
      <div className="about-timeline__heading">
        <span className="about-timeline__eyebrow">EcoMetric knowledge base</span>
        <h2 id="topic-timeline-title">{topic.title}</h2>
        <p className="topic-timeline__intro">{topic.intro}</p>
      </div>

      <div className="about-timeline__active">
        <div className="about-timeline__active-copy">
          <span className="about-timeline__active-date">
            {String(activeIndex + 1).padStart(2, '0')} / {String(points.length).padStart(2, '0')}
          </span>
          <div>
            <span className="about-timeline__active-accent">{topic.tabLabel}</span>
            <h3>{activePoint.heading}</h3>
            <p>{activePoint.body}</p>
          </div>
        </div>
        <div className="about-timeline__visual" aria-hidden="true">
          <div className="about-timeline__visual-ring">
            <span />
          </div>
          <span className="about-timeline__visual-label">VERIFIED / TRACEABLE</span>
        </div>
      </div>

      <div className="about-timeline__navigation">
        <div className="about-timeline__labels">
          {points.map((point, index) => (
            <button
              type="button"
              key={point.heading}
              className={index === activeIndex ? 'is-active' : ''}
              onClick={() => setActiveIndex(index)}
            >
              {point.heading}
            </button>
          ))}
        </div>
        <div className="about-timeline__rail">
          <div className="about-timeline__rail-fill" style={{ width: progress }} />
          {points.map((point, index) => (
            <button
              type="button"
              aria-label={`Show ${point.heading}`}
              aria-pressed={index === activeIndex}
              className={index <= activeIndex ? 'is-active' : ''}
              key={point.heading}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
        <div className="about-timeline__dates">
          {points.map((point, index) => (
            <span className={index === activeIndex ? 'is-active' : ''} key={point.heading}>
              Step {String(index + 1).padStart(2, '0')}
            </span>
          ))}
        </div>
      </div>

      <div className="about-timeline__controls">
        <button type="button" onClick={() => move(-1)} disabled={activeIndex === 0} aria-label="Previous topic point">
          <ChevronLeftIcon size={16} />
        </button>
        <button type="button" onClick={() => move(1)} disabled={activeIndex === points.length - 1} aria-label="Next topic point">
          <ChevronRightIcon size={16} />
        </button>
      </div>

      <div className="topic-timeline__footer">
        <div>
          <span>Associated tags</span>
          <div className="topic-timeline__tags">
            {topic.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
        <div className="topic-timeline__sources">
          <span>Reference sources</span>
          {topic.sources.map((source) => (
            <a href={source.url} target="_blank" rel="noopener noreferrer" key={source.title}>
              {source.title}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
