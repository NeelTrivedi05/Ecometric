import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { MACHINERY_EPD_DATA } from '../data/epdData';

// Mini 3D Preview Canvas for each Machinery Card
function MachineCardCanvas({ modelKey, isHovered }) {
  const mountRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 200;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x52b788, 0.5);
    dirLight2.position.set(-5, -2, -4);
    scene.add(dirLight2);

    // Subtle ground shadow plate
    const groundGeo = new THREE.CircleGeometry(2.4, 24);
    const groundMat = new THREE.MeshBasicMaterial({ color: 0x1b4332, transparent: true, opacity: 0.08 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.2;
    scene.add(ground);

    // 3. Materials
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.7 });
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.5 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.3, metalness: 0.6 });
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.3, metalness: 0.85 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.2 });

    const group = new THREE.Group();
    const fanBlades = [];
    const wheels = [];

    // 4. Build Model Based on modelKey
    if (modelKey === 'chiller') {
      // Skids
      const skid = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 1.4), darkMat);
      skid.position.y = -1.0;
      group.add(skid);

      // Lower shell (evaporator)
      const shell1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 3.4, 24), bodyMat);
      shell1.rotation.z = Math.PI / 2;
      shell1.position.set(0, -0.4, 0);
      group.add(shell1);

      // Upper shell (condenser)
      const shell2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3.0, 24), bodyMat);
      shell2.rotation.z = Math.PI / 2;
      shell2.position.set(-0.2, 0.5, 0.2);
      group.add(shell2);

      // Compressor dome
      const comp = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.9, 18), darkMat);
      comp.position.set(0.5, 1.1, 0.2);
      group.add(comp);

      // Copper suction pipe
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.1, 12), copperMat);
      pipe.position.set(0.5, 0.4, 0.6);
      pipe.rotation.x = Math.PI / 4;
      group.add(pipe);

      // Control panel
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.2), accentMat);
      panel.position.set(-1.2, 0.2, 0.7);
      group.add(panel);
    } else if (modelKey === 'heat_pump') {
      // Main body
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.0, 1.3), lightMat);
      group.add(body);

      // Dual fan cowls & spinning blades
      [-0.7, 0.7].forEach((xPos) => {
        const cowl = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 12, 24), darkMat);
        cowl.position.set(xPos, 0.15, 0.66);
        group.add(cowl);

        const fanGroup = new THREE.Group();
        fanGroup.position.set(xPos, 0.15, 0.62);
        for (let i = 0; i < 4; i++) {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.02), accentMat);
          const angle = (i * Math.PI) / 2;
          blade.position.set(Math.cos(angle) * 0.28, Math.sin(angle) * 0.28, 0);
          blade.rotation.z = angle + 0.3;
          fanGroup.add(blade);
        }
        group.add(fanGroup);
        fanBlades.push(fanGroup);
      });

      // Rear coil
      const rearCoil = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.7, 0.08), steelMat);
      rearCoil.position.set(0, 0, -0.66);
      group.add(rearCoil);
    } else if (modelKey === 'ahu') {
      // Modular box
      const box = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.6, 1.6), lightMat);
      group.add(box);

      // Frame joints
      [-1.2, 0, 1.2].forEach((x) => {
        const joint = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.65, 1.65), darkMat);
        joint.position.set(x, 0, 0);
        group.add(joint);
      });

      // Spinning rotary heat wheel
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.15, 24), steelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(0, 0, 0);
      group.add(wheel);
      wheels.push(wheel);

      // Circular duct collars
      const duct1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 18), darkMat);
      duct1.rotation.z = Math.PI / 2;
      duct1.position.set(-1.95, 0.3, 0);
      const duct2 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 18), darkMat);
      duct2.rotation.z = Math.PI / 2;
      duct2.position.set(1.95, -0.3, 0);
      group.add(duct1, duct2);
    } else if (modelKey === 'transformer') {
      // Core tank
      const tank = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.5), bodyMat);
      group.add(tank);

      // Radiator cooling fins
      [-1.05, 1.05].forEach((x) => {
        for (let z = -0.5; z <= 0.5; z += 0.2) {
          const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.5, 0.14), steelMat);
          fin.position.set(x, 0, z);
          group.add(fin);
        }
      });

      // Overhead oil conservator cylinder
      const conservator = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.6, 18), darkMat);
      conservator.rotation.z = Math.PI / 2;
      conservator.position.set(0, 1.2, 0.3);
      group.add(conservator);

      // Ceramic bushings
      [-0.5, 0, 0.5].forEach((x) => {
        const bushing = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.8, 12), accentMat);
        bushing.position.set(x, 1.3, -0.3);
        group.add(bushing);
      });
    } else if (modelKey === 'boiler') {
      // Boiler drum
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.8, 24), darkMat);
      drum.rotation.z = Math.PI / 2;
      group.add(drum);

      // Rounded caps
      const capGeo = new THREE.SphereGeometry(0.9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const cap1 = new THREE.Mesh(capGeo, darkMat);
      cap1.rotation.z = -Math.PI / 2;
      cap1.position.set(1.4, 0, 0);
      const cap2 = new THREE.Mesh(capGeo, darkMat);
      cap2.rotation.z = Math.PI / 2;
      cap2.position.set(-1.4, 0, 0);
      group.add(cap1, cap2);

      // Burner
      const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.7, 16), copperMat);
      burner.rotation.z = -Math.PI / 2;
      burner.position.set(1.75, 0, 0);
      group.add(burner);

      // Steam header & flue stack
      const steamHeader = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 12), accentMat);
      steamHeader.position.set(-0.3, 1.2, 0);
      const flue = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.0, 16), steelMat);
      flue.position.set(-1.1, 1.3, 0);
      group.add(steamHeader, flue);
    } else if (modelKey === 'cooling_tower') {
      // Basin
      const basin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 2.4), darkMat);
      basin.position.y = -0.9;
      group.add(basin);

      // Louver fill pack
      for (let y = -0.6; y <= -0.1; y += 0.16) {
        const louver = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 2.2), steelMat);
        louver.position.y = y;
        group.add(louver);
      }

      // Upper casing
      const casing = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.1, 2.1), lightMat);
      casing.position.y = 0.5;
      group.add(casing);

      // Top fan shroud
      const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 0.5, 24, 1, true), darkMat);
      shroud.position.y = 1.25;
      group.add(shroud);

      // Spinning top fan
      const fanGroup = new THREE.Group();
      fanGroup.position.y = 1.25;
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.15), accentMat);
        const angle = (i * Math.PI) / 2;
        blade.position.set(Math.cos(angle) * 0.35, 0, Math.sin(angle) * 0.35);
        blade.rotation.y = angle + 0.4;
        fanGroup.add(blade);
      }
      group.add(fanGroup);
      fanBlades.push(fanGroup);
    }

    scene.add(group);

    // 5. Animation Loop
    let angle = 0;
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);

      // Slow smooth turntable rotation; accelerates on card hover
      angle += isHovered ? 0.014 : 0.005;
      group.rotation.y = angle;

      // Mechanical parts spin
      fanBlades.forEach((f) => {
        f.rotation.z += 0.08;
      });
      wheels.forEach((w) => {
        w.rotation.x += 0.03;
      });

      renderer.render(scene, camera);
    };

    animate();

    // 6. Cleanup
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      renderer.dispose();
    };
  }, [modelKey, isHovered]);

  return <div ref={mountRef} className="machine-canvas-inner" />;
}

export default function MachineryGrid({ onOpenWizard }) {
  const [hoveredCardId, setHoveredCardId] = useState(null);

  return (
    <section id="machinery" className="machinery-grid-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header text-center">
          <div className="badge-pill mb-3">
            <span className="badge-dot pulse"></span>
            Interactive 3D Digital Twins • PCR 2019:14 & EN 15804+A2
          </div>
          <h2 className="section-title">
            Industrial Equipment Requiring <span className="text-gradient">Verified EPDs</span>
          </h2>
          <p className="section-subtitle">
            Mandated across commercial HVAC, district energy, and infrastructure tenders.
            Each digital twin highlights certified Product Category Rules (PCRs), life cycle carbon hotspots, and instant declaration generation.
          </p>
        </div>

        {/* 6-Card Modern Responsive Grid */}
        <div className="machinery-cards-grid">
          {MACHINERY_EPD_DATA.map((item, index) => {
            const isHovered = hoveredCardId === item.id;
            return (
              <div
                key={item.id}
                className={`machine-card ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredCardId(item.id)}
                onMouseLeave={() => setHoveredCardId(null)}
              >
                {/* 3D Visual Viewport Header */}
                <div className="machine-card-canvas-wrapper">
                  <div className="machine-card-top-pills">
                    <span className="pcr-badge">{item.pcr.split(' ')[0]} {item.pcr.split(' ')[1] || 'PCR'}</span>
                    <span className="threed-indicator">
                      <span className="indicator-live-pulse"></span>
                      3D MODEL
                    </span>
                  </div>

                  {/* Three.js Live Canvas */}
                  <MachineCardCanvas modelKey={item.modelKey} isHovered={isHovered} />

                  {/* Hotspot Alert Banner */}
                  <div className="machine-hotspot-tag">
                    <span className="hotspot-icon">⚠️</span>
                    <span className="hotspot-text">{item.keyHotspots[0]?.label}: {item.keyHotspots[0]?.value.slice(0, 42)}...</span>
                  </div>
                </div>

                {/* Card Content & Telemetry */}
                <div className="machine-card-body">
                  <div className="machine-category-line">
                    <span className="category-text">{item.category}</span>
                    <span className="index-number">0{index + 1}</span>
                  </div>

                  <h3 className="machine-card-title">{item.name}</h3>
                  <p className="machine-card-tagline">{item.tagline}</p>

                  {/* Technical Specs 3-Column Strip */}
                  <div className="machine-specs-strip">
                    <div className="mini-spec-item">
                      <span className="mini-label">Capacity</span>
                      <span className="mini-value">{item.typicalCapacity.split(' ')[0]} {item.typicalCapacity.split(' ')[1]}</span>
                    </div>
                    <div className="mini-spec-item">
                      <span className="mini-label">Declared Mass</span>
                      <span className="mini-value">{item.typicalMass}</span>
                    </div>
                    <div className="mini-spec-item">
                      <span className="mini-label">Typical GWP</span>
                      <span className="mini-value text-accent-green">{item.gwpTypical.split(' ')[0]}</span>
                    </div>
                  </div>

                  {/* Life Cycle Distribution Mini Bar */}
                  <div className="machine-mini-bar-wrapper">
                    <div className="mini-bar-labels">
                      <span>Embodied A1-A3: {item.gwpEmbodiedPct}%</span>
                      <span>Operation B: {item.gwpOperationalPct}%</span>
                    </div>
                    <div className="mini-bar-track">
                      <div className="mini-bar-fill embodied" style={{ width: `${item.gwpEmbodiedPct}%` }} />
                      <div className="mini-bar-fill operational" style={{ width: `${item.gwpOperationalPct}%` }} />
                      <div className="mini-bar-fill eol" style={{ width: `${item.gwpEndLifePct}%` }} />
                    </div>
                  </div>

                  {/* Regulatory Tender Driver Tags */}
                  <div className="machine-drivers-strip">
                    {item.drivers.slice(0, 3).map((drv, i) => (
                      <span key={i} className="mini-driver-pill">{drv}</span>
                    ))}
                  </div>

                  {/* Card Action Button */}
                  <button
                    type="button"
                    className="machine-cta-btn"
                    onClick={() => onOpenWizard && onOpenWizard(item.id)}
                  >
                    <span>Generate EPD</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
