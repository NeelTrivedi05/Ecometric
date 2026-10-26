import React from 'react';

const pipelineMetrics = [
  {
    label: 'Capture',
    value: '100%',
    detail: 'BOMs, utility logs, transport manifests, and supporting evidence.',
  },
  {
    label: 'Calculate',
    value: '13',
    detail: 'LCIA indicators across A, B, C, and Module D lifecycle stages.',
  },
  {
    label: 'Publish',
    value: '1',
    detail: 'Audit-ready EPD with publication PDF and ILCD+EPD XML.',
  },
];

export default function TheSolution() {
  return (
    <section className="pipeline-14 reveal-on-scroll" id="solution" aria-labelledby="pipeline-14-title">
      <div className="lp-container">
        <header className="pipeline-14__header">
          <div>
            <h1 id="pipeline-14-title">
              One evidence package.
              <br />
              <span>Every impact accounted for.</span>
            </h1>
          </div>
          <p>
            Upload your product evidence once. EcoMetric maps the data, calculates the impacts,
            and keeps every handoff traceable through verification.
          </p>
        </header>

        <div className="pipeline-14__diagram">
          <video
            className="pipeline-14__video"
            src="/pipeline.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label="EcoMetric pipeline demonstration"
          />
        </div>

        <div className="pipeline-14__metrics" aria-label="EcoMetric pipeline metrics">
          {pipelineMetrics.map((metric) => (
            <article className="pipeline-14__metric" key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>{metric.detail}</span>
            </article>
          ))}
        </div>

        <div className="pipeline-14__footer">
          <span>EN 15804+A2 / ISO 14025 aligned</span>
          <span>Traceability preserved from evidence to EPD</span>
        </div>
      </div>
    </section>
  );
}
