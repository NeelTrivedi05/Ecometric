import React, { useEffect, useState } from 'react';
import { CheckIcon } from './Icons';

// Stage labels shown as the bar advances, keyed by task.kind. Kinds without stages get the plain card.
const TASK_STAGES = {
  calculation: [
    'Loading bill of materials & inventory',
    'Matching ecoinvent datasets',
    'Calculating impact indicators',
  ],
};

// Full-screen progress card for long-running tasks. The bar fills over task.durationMs.
export default function ProgressOverlay({ task }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!task) return undefined;
    const tick = () => setElapsed(Date.now() - task.startedAt);
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [task]);

  if (!task) return null;

  const percent = Math.min(100, (elapsed / task.durationMs) * 100);
  const stages = TASK_STAGES[task.kind];
  const progressProps = {
    role: 'progressbar',
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': Math.round(percent),
    'aria-label': task.title,
  };

  if (!stages) {
    return (
      <div
        {...progressProps}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10050,
          display: 'grid',
          placeItems: 'center',
          padding: 20,
          background: 'rgb(13 23 17 / 0.42)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            padding: '24px 24px 20px',
            background: 'var(--bg-card, #FFFFFF)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 12px 36px -4px rgba(0, 0, 0, 0.16)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
            {task.title}
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${percent}%`,
                height: '100%',
                background: 'var(--accent)',
                transition: 'width 0.2s linear',
              }}
            />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-muted)', textAlign: 'right' }}>
            {Math.floor(percent)}%
          </div>
        </div>
      </div>
    );
  }

  const activeStage = Math.min(stages.length - 1, Math.floor((percent / 100) * stages.length));

  return (
    <div className="progress-overlay-backdrop">
      <div className="progress-overlay-card" {...progressProps}>
        <div className="progress-overlay-head">
          <div className="progress-overlay-title">{task.title}</div>
          {task.subtitle && <div className="progress-overlay-subtitle">{task.subtitle}</div>}
        </div>

        <div className="progress-overlay-track">
          <div className="progress-overlay-fill" style={{ width: `${percent}%` }} />
        </div>

        <div className="progress-overlay-percent">{Math.floor(percent)}%</div>

        <ol className="progress-overlay-stages">
          {stages.map((label, i) => {
            const state = i < activeStage ? 'done' : i === activeStage ? 'active' : 'pending';
            return (
              <li key={label} className={`progress-overlay-stage is-${state}`}>
                <span className="progress-overlay-stage-dot">
                  {state === 'done' && <CheckIcon size={11} />}
                </span>
                <span>{label}</span>
              </li>
            );
          })}
        </ol>

        {task.onCancel && (
          <button type="button" className="progress-overlay-cancel" onClick={task.onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
