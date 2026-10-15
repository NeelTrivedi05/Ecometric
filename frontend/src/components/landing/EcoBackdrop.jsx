import React from 'react';

/* Decorative landscape behind the hero: rolling hills, a small grove of trees
   and wind turbines. Purely visual — hidden from assistive technology. */

function Turbine({ x, y, scale = 1, delay = '0s' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-2.2 0 L-0.9 -92 L0.9 -92 L2.2 0 Z" fill="currentColor" />
      <g transform="translate(0 -92)">
        <g className="eco-turbine-rotor" style={{ animationDelay: delay }}>
          <path d="M0 0 C 3 -14, 2 -34, 0 -46 C -2 -34, -3 -14, 0 0 Z" fill="currentColor" />
          <path d="M0 0 C 3 -14, 2 -34, 0 -46 C -2 -34, -3 -14, 0 0 Z" fill="currentColor" transform="rotate(120)" />
          <path d="M0 0 C 3 -14, 2 -34, 0 -46 C -2 -34, -3 -14, 0 0 Z" fill="currentColor" transform="rotate(240)" />
          <circle r="3.2" fill="currentColor" />
        </g>
      </g>
    </g>
  );
}

function Tree({ x, y, r = 14 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-1.4" y={-r * 0.9} width="2.8" height={r * 0.9} fill="currentColor" />
      <circle cy={-r * 1.5} r={r} fill="currentColor" />
    </g>
  );
}

function Leaf({ x, y, size = 120, rotate = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size / 100})`}>
      <path d="M0 0 C 20 -40, 70 -55, 100 -50 C 95 -20, 70 20, 0 0 Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M0 0 C 30 -18, 60 -32, 100 -50" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M32 -16 L40 -36 M52 -26 L64 -44 M30 -15 L46 -6 M52 -26 L70 -16" fill="none" stroke="currentColor" strokeWidth="1" />
    </g>
  );
}

export function HeroBackdrop() {
  return (
    <div className="eco-backdrop" aria-hidden="true">
      <div className="eco-sun" />

      <svg className="eco-leaves" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMin slice">
        <g className="eco-leaf-line">
          <Leaf x={70} y={250} size={150} rotate={-28} />
          <Leaf x={150} y={420} size={90} rotate={-58} />
          <Leaf x={1370} y={180} size={140} rotate={208} />
          <Leaf x={1300} y={360} size={86} rotate={236} />
        </g>
      </svg>

      <svg className="eco-hills" viewBox="0 0 1440 520" preserveAspectRatio="xMidYMax slice">
        <path className="eco-hill-far" d="M0 300 C 180 240, 360 250, 540 285 C 720 320, 900 230, 1100 240 C 1260 248, 1360 270, 1440 262 L1440 520 L0 520 Z" />

        <g className="eco-turbine">
          <Turbine x={150} y={262} scale={0.9} />
          <Turbine x={250} y={256} scale={0.7} delay="-2s" />
          <Turbine x={1210} y={252} scale={0.95} delay="-1s" />
          <Turbine x={1320} y={262} scale={0.72} delay="-3s" />
        </g>

        <path className="eco-hill-mid" d="M0 360 C 200 320, 380 330, 600 370 C 800 405, 1000 330, 1220 335 C 1330 338, 1400 350, 1440 346 L1440 520 L0 520 Z" />

        <g className="eco-tree">
          <Tree x={60} y={352} r={15} />
          <Tree x={92} y={350} r={11} />
          <Tree x={330} y={340} r={13} />
          <Tree x={1110} y={338} r={14} />
          <Tree x={1140} y={337} r={10} />
          <Tree x={1390} y={348} r={13} />
        </g>

        <path className="eco-hill-near" d="M0 430 C 240 395, 480 410, 720 435 C 960 460, 1200 400, 1440 412 L1440 520 L0 520 Z" />
      </svg>
    </div>
  );
}

export function BannerBackdrop() {
  return (
    <div className="eco-backdrop eco-backdrop-banner" aria-hidden="true">
      <svg className="eco-hills" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice">
        <path className="eco-hill-far" d="M0 200 C 220 150, 420 160, 640 190 C 860 220, 1060 150, 1260 158 C 1350 162, 1410 172, 1440 170 L1440 320 L0 320 Z" />
        <g className="eco-turbine">
          <Turbine x={1180} y={160} scale={0.75} />
          <Turbine x={1270} y={164} scale={0.58} delay="-2s" />
          <Turbine x={180} y={170} scale={0.62} delay="-1s" />
        </g>
        <path className="eco-hill-near" d="M0 260 C 260 225, 520 240, 760 262 C 1000 284, 1220 236, 1440 246 L1440 320 L0 320 Z" />
      </svg>
    </div>
  );
}
