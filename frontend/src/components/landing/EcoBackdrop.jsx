import React from 'react';

/* Decorative landscape behind the hero and CTA banner. Instead of generic
   scenery it traces a product's life cycle as an EPD sees it:
   raw materials (trees) → manufacturing (factory) → transport (truck) →
   use (building) → end-of-life & recovery (recycling loop), joined by a
   dotted life-cycle path. Purely visual — hidden from assistive technology. */

function Tree({ x, y, r = 14 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-1.4" y={-r * 0.9} width="2.8" height={r * 0.9} fill="currentColor" />
      <circle cy={-r * 1.5} r={r} fill="currentColor" />
    </g>
  );
}

// Manufacturing (A1–A3): saw-tooth roof, chimney, window cut-outs
function Factory({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="currentColor">
      <path
        fillRule="evenodd"
        d="M-34 0 V-30 L-20 -40 V-30 L-6 -40 V-30 L8 -40 V-30 H34 V0 Z
           M-27 -20 h7 v7 h-7 Z M-13 -20 h7 v7 h-7 Z M1 -20 h7 v7 h-7 Z M15 -20 h7 v7 h-7 Z"
      />
      <rect x="20" y="-58" width="8" height="28" />
      <circle cx="26" cy="-66" r="4" opacity="0.55" />
      <circle cx="31" cy="-74" r="3" opacity="0.35" />
    </g>
  );
}

// Transport (A4)
function Truck({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="currentColor">
      <rect x="-28" y="-30" width="33" height="22" rx="2" />
      <path d="M7 -8 V-24 H18 L26 -16 V-8 Z" />
      <circle cx="-17" cy="-5" r="5" />
      <circle cx="16" cy="-5" r="5" />
    </g>
  );
}

// Use stage (B1–B7): building with a window grid
function Building({ x, y, scale = 1 }) {
  const windows = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      windows.push(`M${-13 + col * 9} ${-58 + row * 10} h5 v5 h-5 Z`);
    }
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="currentColor">
      <path fillRule="evenodd" d={`M-18 0 V-66 H18 V0 Z ${windows.join(' ')} M-4 0 v-8 h8 v8 Z`} />
      <path fillRule="evenodd" d="M20 0 V-38 H38 V0 Z M25 -30 h3 v4 h-3 Z M31 -30 h3 v4 h-3 Z M25 -20 h3 v4 h-3 Z M31 -20 h3 v4 h-3 Z" />
    </g>
  );
}

// End-of-life & Module D: three chasing arrows
function RecycleLoop({ x, y, scale = 1 }) {
  const r = 16;
  const cy = -22;
  const pt = (deg) => {
    const a = (deg * Math.PI) / 180;
    return [r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const arcs = [0, 120, 240].map((start) => {
    const [x1, y1] = pt(start + 12);
    const [x2, y2] = pt(start + 96);
    const a = ((start + 108) * Math.PI) / 180;
    const [tx, ty] = pt(start + 108);
    // arrowhead pointing along the direction of travel (clockwise)
    const tan = [-Math.sin(a), Math.cos(a)];
    const nrm = [Math.cos(a), Math.sin(a)];
    const head = [
      [tx + tan[0] * 2, ty + tan[1] * 2],
      [tx - tan[0] * 8 + nrm[0] * 5, ty - tan[1] * 8 + nrm[1] * 5],
      [tx - tan[0] * 8 - nrm[0] * 5, ty - tan[1] * 8 - nrm[1] * 5],
    ];
    return { d: `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`, head: head.map((p) => p.join(' ')).join(' L') };
  });
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {arcs.map((arc, i) => (
        <g key={i}>
          <path d={arc.d} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d={`M${arc.head} Z`} fill="currentColor" />
        </g>
      ))}
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

        <path className="eco-hill-mid" d="M0 360 C 200 320, 380 330, 600 370 C 800 405, 1000 330, 1220 335 C 1330 338, 1400 350, 1440 346 L1440 520 L0 520 Z" />

        <path className="eco-path" d="M20 368 C 120 354, 200 348, 270 350 C 600 362, 1000 352, 1210 348 C 1300 346, 1370 352, 1440 362" />

        <g className="eco-icon">
          <Tree x={58} y={350} r={13} />
          <Tree x={86} y={347} r={9} />
          <Factory x={176} y={339} scale={0.95} />
          <Truck x={1240} y={337} scale={0.95} />
          <Building x={1306} y={339} scale={0.95} />
          <RecycleLoop x={1400} y={347} scale={0.85} />
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

        <path
          className="eco-path"
          d="M150 178 C 220 168, 280 170, 330 176 C 600 205, 900 190, 1120 166 C 1180 160, 1250 160, 1300 166"
        />

        <g className="eco-icon">
          <Tree x={150} y={180} r={11} />
          <Tree x={174} y={178} r={8} />
          <Factory x={250} y={172} scale={0.72} />
          <Truck x={340} y={180} scale={0.7} />
          <Building x={1130} y={166} scale={0.7} />
          <RecycleLoop x={1260} y={164} scale={0.7} />
        </g>

        <path className="eco-hill-near" d="M0 260 C 260 225, 520 240, 760 262 C 1000 284, 1220 236, 1440 246 L1440 320 L0 320 Z" />
      </svg>
    </div>
  );
}
