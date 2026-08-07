'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from 'react';
import { calculateEPD } from '@/lib/epd-calculator';

const FRAME_COUNT = 300;
const PRELOAD_BATCH = 40;
const IDLE_BATCH = 20;

const frameSrc = (i: number) =>
  `/chiller-frames/frame-${String(i + 1).padStart(3, '0')}.jpg`;

interface ComponentLabel {
  name: string;
  subtitle: string;
  description: string;
  side: 'left' | 'right';
  y: number;
  frameStart: number;
  frameEnd: number;
}

const COMPONENT_LABELS: ComponentLabel[] = [
  {
    name: 'Evaporator Coils',
    subtitle: 'Low-Pressure Heat Exchanger',
    description: 'Boils liquid refrigerant at low pressure to absorb thermal energy directly from process return water loops.',
    side: 'left',
    y: 22,
    frameStart: 45,
    frameEnd: 155,
  },
  {
    name: 'Condenser Shell & Tubes',
    subtitle: 'Thermal Rejection Loop',
    description: 'Rejects absorbed heat out to the external cooling tower loop or ambient air, condensing vapor back to liquid.',
    side: 'right',
    y: 22,
    frameStart: 70,
    frameEnd: 180,
  },
  {
    name: 'Twin-Screw Compressor',
    subtitle: 'Refrigerant Pressure Drive',
    description: 'Drives the thermodynamic cycle — elevates vapor pressure and temperature so heat rejection can occur efficiently.',
    side: 'left',
    y: 56,
    frameStart: 110,
    frameEnd: 220,
  },
  {
    name: 'VFD Control Panel & Sensors',
    subtitle: 'Smart Operational Modulation',
    description: 'Variable Frequency Drive modulates compressor motor speed dynamically to match actual cooling load demand.',
    side: 'right',
    y: 56,
    frameStart: 135,
    frameEnd: 235,
  },
];

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function masterFrameMap(progress: number, maxAvailableFrame: number): number {
  let targetFrame = 0;
  if (progress < 0.15) {
    targetFrame = Math.round(lerp(0, 40, progress / 0.15));
  } else if (progress < 0.60) {
    targetFrame = Math.round(lerp(40, 215, (progress - 0.15) / 0.45));
  } else {
    targetFrame = Math.round(lerp(215, 0, (progress - 0.60) / 0.40));
  }
  return clamp(targetFrame, 0, Math.max(0, maxAvailableFrame - 1));
}

function Tag({ children, critical = false }: { children: ReactNode; critical?: boolean }) {
  const border = critical ? 'border-[#81BD01]/40 bg-[#81BD01]/10 text-[#81BD01]' : 'border-[#2A2A2A] bg-[#181818]/90 text-[#F2EFE9]/60';
  return (
    <span className={`font-display inline-flex items-center border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] ${border}`}>
      {children}
    </span>
  );
}

function useVisibleOnce<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

function drawToCanvas(canvas: HTMLCanvasElement, img: HTMLImageElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, rect.width);
  const cssH = Math.max(1, rect.height);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const bw = Math.round(cssW * dpr);
  const bh = Math.round(cssH * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, cssW, cssH);
  const scale = Math.max(cssW / img.naturalWidth, cssH / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (cssW - dw) / 2, (cssH - dh) / 2, dw, dh);
}

export default function ScrollytellingPage() {
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    Array.from({ length: FRAME_COUNT }, () => null),
  );
  const [loadedCount, setLoadedCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadOne = (i: number) =>
      new Promise<void>(async (resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = frameSrc(i);
        img.onload = async () => {
          try { await img.decode(); } catch {}
          if (!cancelled) {
            imagesRef.current[i] = img;
            setLoadedCount((c) => Math.min(FRAME_COUNT, c + 1));
          }
          resolve();
        };
        img.onerror = () => resolve();
      });

    const loadBatch = async (s: number, e: number) => {
      const tasks: Promise<void>[] = [];
      for (let i = s; i <= e; i++) tasks.push(loadOne(i));
      await Promise.all(tasks);
    };

    const run = async () => {
      await loadBatch(0, Math.min(PRELOAD_BATCH - 1, FRAME_COUNT - 1));
      if (cancelled) return;
      setReady(true);
      for (let s = PRELOAD_BATCH; s < FRAME_COUNT; s += IDLE_BATCH) {
        const e = Math.min(FRAME_COUNT - 1, s + IDLE_BATCH - 1);
        await new Promise<void>((r) => {
          if ('requestIdleCallback' in window) {
            (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => r());
          } else setTimeout(r, 16);
        });
        if (cancelled) return;
        await loadBatch(s, e);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  const loadPct = clamp(loadedCount / FRAME_COUNT, 0, 1);

  return (
    <div className="relative min-h-screen bg-[#111111] text-[#F2EFE9]">
      <SiteNav onOpenCalculator={() => setIsCalculatorOpen(true)} />
      {!ready && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111111]">
          <div className="w-full max-w-xs space-y-3 px-6">
            <div className="flex items-center justify-between font-display text-[0.58rem] font-semibold uppercase tracking-[0.22em]">
              <span className="text-[#F2EFE9]/50">Loading chiller engine</span>
              <span className="text-[#81BD01]">{Math.round(loadPct * 100)}%</span>
            </div>
            <div className="h-px overflow-hidden bg-[#2A2A2A]">
              <div
                className="h-full bg-[#81BD01] transition-[width] duration-300"
                style={{ width: `${Math.max(4, loadPct * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
      <main>
        <SingleChillerTrack
          imagesRef={imagesRef}
          ready={ready}
          loadedCount={loadedCount}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
        />
        <WhyThisMattersSection />
        <CtaFooter onOpenCalculator={() => setIsCalculatorOpen(true)} />
      </main>
      <AnimatePresence>
        {isCalculatorOpen && (
          <EpdCalculatorModal onClose={() => setIsCalculatorOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SiteNav({ onOpenCalculator }: { onOpenCalculator: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#2A2A2A] bg-[#111111]/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-6 lg:px-8">
        <Link href="#home" className="flex items-center gap-2.5">
          <img
            src="/ecometric_name.png"
            alt="EcoMetric"
            className="h-6 w-auto object-contain"
          />
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          <Link href="#home" className="font-display text-[0.72rem] font-semibold uppercase text-[#F2EFE9]/60 hover:text-[#81BD01]">Home</Link>
          <Link href="#how-it-works" className="font-display text-[0.72rem] font-semibold uppercase text-[#F2EFE9]/60 hover:text-[#81BD01]">How It Works</Link>
          <Link href="#docs" className="font-display text-[0.72rem] font-semibold uppercase text-[#F2EFE9]/60 hover:text-[#81BD01]">Docs</Link>
          <button
            type="button"
            onClick={onOpenCalculator}
            className="font-display border border-[#81BD01]/60 px-4 py-2 text-[0.72rem] font-semibold uppercase text-[#81BD01] hover:bg-[#81BD01] hover:text-[#111111]"
          >
            Generate EPD
          </button>
        </div>
      </nav>
    </header>
  );
}

function SingleChillerTrack({
  imagesRef,
  ready,
  loadedCount,
  onOpenCalculator,
}: {
  imagesRef: RefObject<(HTMLImageElement | null)[]>;
  ready: boolean;
  loadedCount: number;
  onOpenCalculator: () => void;
}) {
  const trackRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentFrameRef = useRef(-1);
  const [progress, setProgress] = useState(0);

  const currentFrame = masterFrameMap(progress, loadedCount);

  useEffect(() => {
    if (!ready) return;
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas) return;

    let targetProgress = 0;
    let renderedProgress = 0;
    let rafId = 0;

    const onScroll = () => {
      const rect = track.getBoundingClientRect();
      const range = Math.max(1, track.offsetHeight - window.innerHeight);
      targetProgress = clamp(-rect.top / range, 0, 1);
    };

    const tick = () => {
      renderedProgress += (targetProgress - renderedProgress) * 0.15;
      if (Math.abs(targetProgress - renderedProgress) < 0.0002) {
        renderedProgress = targetProgress;
      }
      const frameIdx = masterFrameMap(renderedProgress, loadedCount);
      setProgress(renderedProgress);
      if (currentFrameRef.current !== frameIdx) {
        const img = imagesRef.current?.[frameIdx];
        if (canvas && img && img.complete) {
          drawToCanvas(canvas, img);
          currentFrameRef.current = frameIdx;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    const onResize = () => {
      const img = imagesRef.current?.[currentFrameRef.current];
      if (canvas && img && img.complete) {
        drawToCanvas(canvas, img);
      }
    };

    onScroll();
    renderedProgress = targetProgress;
    const initFrame = masterFrameMap(targetProgress, loadedCount);
    const initImg = imagesRef.current?.[initFrame];
    if (initImg && initImg.complete) {
      drawToCanvas(canvas, initImg);
      currentFrameRef.current = initFrame;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
    };
  }, [ready, loadedCount, imagesRef]);

  const heroOpacity = clamp(1 - progress / 0.15, 0, 1);
  const pollutantOpacity = clamp((progress - 0.60) / 0.22, 0, 1);

  let canvasX = 0;
  if (progress < 0.15) {
    canvasX = lerp(24, 0, progress / 0.15);
  } else if (progress > 0.60) {
    canvasX = lerp(0, -30, (progress - 0.60) / 0.40);
  }

  let canvasScale = 1.0;
  if (progress < 0.15) {
    canvasScale = lerp(0.85, 1.0, progress / 0.15);
  } else if (progress > 0.60) {
    canvasScale = lerp(1.0, 0.80, (progress - 0.60) / 0.40);
  }

  return (
    <section ref={trackRef} id="home" className="relative bg-[#111111]" style={{ height: '850vh' }}>
      <div id="how-it-works" className="absolute top-[18vh]" />
      <div className="sticky top-0 flex h-screen w-full flex-col justify-center overflow-hidden bg-[#111111] pt-16">
        
        {/* HERO TEXT */}
        <div
          className="absolute left-6 top-[20vh] z-[4] w-full max-w-lg sm:left-12 lg:left-20"
          style={{
            opacity: heroOpacity,
            pointerEvents: heroOpacity > 0.05 ? 'auto' : 'none',
            transform: `translateX(${lerp(0, -30, 1 - heroOpacity)}px)`,
          }}
        >
          <div className="space-y-5">
            <Tag critical>Industrial Explainer</Tag>
            <h1 className="font-display text-[clamp(2.2rem,4.2vw,3.6rem)] font-bold leading-[1.1] tracking-tight text-[#F2EFE9]">
              What is an<br />industrial chiller?
            </h1>
            <p className="max-w-md text-[clamp(0.88rem,1.2vw,0.98rem)] leading-7 text-[#F2EFE9]/65">
              It is a heavy-duty thermal management system engineered to remove heat from industrial machinery, chemical processes, or liquids and move it outside.
            </p>
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-3 text-[0.78rem] text-[#F2EFE9]/55">
                <span className="h-1.5 w-1.5 rounded-full bg-[#81BD01]" />
                <span>Duty capacities ranging from 100 kW to over 10,000 kW</span>
              </div>
              <div className="flex items-center gap-3 text-[0.78rem] text-[#F2EFE9]/55">
                <span className="h-1.5 w-1.5 rounded-full bg-[#81BD01]" />
                <span>Operating 24/7 in manufacturing & data center facilities</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3">
              <div className="h-px w-16 bg-gradient-to-r from-[#81BD01] to-transparent" />
              <span className="font-display text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-[#81BD01]">
                Scroll down to explode & inspect
              </span>
            </div>
          </div>
        </div>

        {/* LIFECYCLE VERDICT CARD */}
        <div
          className="absolute right-6 top-[18vh] z-[4] w-full max-w-md sm:right-10 lg:right-16"
          style={{
            opacity: pollutantOpacity,
            pointerEvents: pollutantOpacity > 0.05 ? 'auto' : 'none',
            transform: `translateX(${lerp(30, 0, pollutantOpacity)}px)`,
          }}
        >
          <div className="space-y-5">
            <Tag critical>Lifecycle Verdict</Tag>
            <h2 className="font-display text-[clamp(1.6rem,3.4vw,2.8rem)] font-bold leading-[1.12] tracking-tight text-[#F2EFE9]">
              Which component is most pollutant?
            </h2>
            <p className="text-[clamp(0.82rem,1.1vw,0.92rem)] leading-6 text-[#F2EFE9]/65">
              As the chiller reassembles to its operating state, it becomes clear that it is not the steel enclosure, copper coils, or compressor motor that dominates its carbon footprint.
            </p>
            <div className="rounded-xl border border-[#2A2A2A] bg-[#181818]/95 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex flex-wrap items-end gap-4">
                <span className="font-display text-[clamp(2.8rem,6vw,4.5rem)] font-extrabold leading-none tracking-tight text-[#81BD01]">
                  200×
                </span>
                <div className="max-w-xs space-y-1 pb-1">
                  <p className="font-display text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#81BD01]">
                    Operational Energy Dominated
                  </p>
                  <p className="text-[0.78rem] leading-5 text-[#F2EFE9]/65">
                    200× greater environmental impact from 15–20 years of operational electricity versus raw material manufacturing.
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-[#2A2A2A] pt-3">
                <button
                  type="button"
                  onClick={onOpenCalculator}
                  className="group inline-flex items-center text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#81BD01] hover:text-[#ffffff]"
                >
                  Calculate Your Chiller&apos;s EPD Ratio
                  <span className="ml-1.5 transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CANVAS CONTAINER */}
        <div className="relative mx-auto flex w-full max-w-7xl items-center justify-center px-4">
          <div
            className="relative z-[2] w-[clamp(300px,58vw,880px)] transition-transform duration-75 ease-out"
            style={{ transform: `translateX(${canvasX}%) scale(${canvasScale})` }}
          >
            <div className="overflow-hidden bg-[#111111]">
              <canvas ref={canvasRef} className="block aspect-video w-full" aria-label="Interactive Industrial Chiller Animation" role="img" />
            </div>
          </div>
        </div>

        {/* DESKTOP FLOATING CALLOUTS */}
        <div className="hidden md:block">
          {COMPONENT_LABELS.map((label) => {
            const visible =
              progress >= 0.15 &&
              progress <= 0.60 &&
              currentFrame >= label.frameStart &&
              currentFrame <= label.frameEnd;
            return (
              <div
                key={label.name}
                className={`absolute z-[5] w-[clamp(13rem,19vw,17rem)] transition-all duration-500 ease-out ${
                  label.side === 'left' ? 'left-4 sm:left-8 lg:left-14' : 'right-4 sm:right-8 lg:right-14'
                } ${visible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-4'}`}
                style={{ top: `${label.y}%` }}
              >
                <div className="rounded-lg border-l-2 border-[#81BD01] bg-[#181818]/95 p-4 shadow-2xl backdrop-blur-md">
                  <div className="font-display text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#81BD01]">{label.name}</div>
                  <div className="font-display text-[0.58rem] uppercase tracking-[0.16em] text-[#F2EFE9]/40 mt-0.5">{label.subtitle}</div>
                  <p className="mt-1.5 text-[0.78rem] leading-5 text-[#F2EFE9]/65">{label.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* MOBILE STICKY DRAWER */}
        <div className="absolute bottom-4 inset-x-4 z-[5] md:hidden">
          {COMPONENT_LABELS.map((label) => {
            const visible =
              progress >= 0.15 &&
              progress <= 0.60 &&
              currentFrame >= label.frameStart &&
              currentFrame <= label.frameEnd;
            if (!visible) return null;
            return (
              <motion.div
                key={label.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="rounded-lg border-l-2 border-[#81BD01] bg-[#181818]/95 p-3.5 shadow-2xl backdrop-blur-md"
              >
                <div className="font-display text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#81BD01]">{label.name}</div>
                <p className="mt-1 text-[0.74rem] leading-5 text-[#F2EFE9]/70">{label.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WhyThisMattersSection() {
  const [ref, visible] = useVisibleOnce<HTMLDivElement>();
  return (
    <section id="docs" ref={ref} className="relative bg-[#111111] py-24 lg:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2A2A2A] to-transparent" />
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mb-12 space-y-3">
          <Tag>EPD Procurement Reality</Tag>
          <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight text-[#F2EFE9]">Why EPD Data Matters for OEMs</h2>
          <p className="max-w-xl text-[0.9rem] leading-7 text-[#F2EFE9]/60">Raw material weights matter, but European buyers evaluate total lifecycle performance under strict EU regulations.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-6">
            <Tag>Lifecycle Scale</Tag>
            <div className="mt-5 grid gap-4 sm:grid-cols-[0.65fr_1.35fr]">
              <div className="rounded-lg border border-[#2A2A2A] bg-[#111111]/70 p-4">
                <div className="font-display text-[0.6rem] font-semibold uppercase text-[#F2EFE9]/40">Operating Lifespan</div>
                <div className="mt-2 font-display text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold text-[#81BD01]">15–20 Years</div>
                <p className="mt-3 text-[0.78rem] text-[#F2EFE9]/50">Emissions compound exponentially during continuous runtime.</p>
              </div>
              <div className="rounded-lg border border-[#2A2A2A] bg-[#111111]/70 p-4">
                <div className="font-display text-[0.6rem] font-semibold uppercase text-[#F2EFE9]/40">Declaration Focus</div>
                <p className="mt-2 text-[0.78rem] text-[#F2EFE9]/50">Manufacturing phase is only A1–A3. Stage B6 (Operational Energy) dominates EU procurement scoring.</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-6">
            <Tag>Emissions Ratios (PCR-Referenced)</Tag>
            <div className="mt-6 space-y-6">
              <ImpactBar label="Manufacturing & Material Extraction (A1–A3)" value="1× Ratio" fill={visible ? 10 : 0} muted />
              <ImpactBar label="Lifetime Operational Electricity (B6)" value="200× Ratio" fill={visible ? 100 : 0} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ImpactBar({ label, value, fill, muted = false }: { label: string; value: string; fill: number; muted?: boolean }) {
  const barBg = muted ? 'bg-[#F2EFE9]/25' : 'bg-[#81BD01]';
  const valColor = muted ? 'text-[#F2EFE9]/40' : 'text-[#81BD01]';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-[0.78rem] text-[#F2EFE9]/60">
        <span>{label}</span>
        <span className={`font-display text-[0.68rem] font-bold uppercase ${valColor}`}>{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#2A2A2A] p-0.5">
        <div className={`h-full rounded-full transition-[width] duration-1000 ease-out ${barBg}`} style={{ width: `${fill}%` }} />
      </div>
    </div>
  );
}

function CtaFooter({ onOpenCalculator }: { onOpenCalculator: () => void }) {
  return (
    <section id="generate" className="bg-[#111111] pb-8 pt-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#2A2A2A] bg-gradient-to-b from-[rgba(129,189,1,0.05)] to-[#181818] p-8 sm:p-10 lg:p-12">
          <div className="max-w-3xl space-y-4">
            <Tag critical>Generate EPD Declaration</Tag>
            <h2 className="font-display text-[clamp(1.8rem,4vw,3.2rem)] font-bold text-[#F2EFE9]">Ready to generate your chiller&apos;s EPD?</h2>
            <p className="max-w-2xl text-[clamp(0.85rem,1.3vw,1rem)] text-[#F2EFE9]/60">Input your unit&apos;s bill of materials, compressor specs, and duty cycle.</p>
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              id="cta-generate-epd"
              onClick={onOpenCalculator}
              className="bg-[#81BD01] px-8 py-3.5 font-display text-[0.75rem] font-bold uppercase tracking-[0.16em] text-[#111111] hover:bg-[#92d402]"
            >
              Generate EPD Now →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function EpdCalculatorModal({ onClose }: { onClose: () => void }) {
  const [capacitykW, setCapacitykW] = useState(500);
  const [refrigerantType, setRefrigerantType] = useState('R134a');
  const [cop, setCop] = useState(5.5);
  const [operatingHours, setOperatingHours] = useState(4500);
  const [result, setResult] = useState<any>(null);

  const handleCalculate = () => {
    const res = calculateEPD({
      capacitykW: Number(capacitykW),
      refrigerantType,
      cop: Number(cop),
      operatingHoursPerYear: Number(operatingHours),
    });
    setResult(res);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111111]/85 p-4 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 shadow-2xl sm:p-8"
      >
        <button type="button" onClick={onClose} className="absolute right-5 top-5 font-mono text-sm text-[#F2EFE9]/40 hover:text-[#F2EFE9]">✕</button>
        <div className="space-y-2">
          <Tag critical>Interactive EPD Scorecard Generator</Tag>
          <h2 className="font-display text-xl font-bold text-[#F2EFE9]">Calculate Industrial Chiller Footprint</h2>
        </div>
        {!result ? (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-display text-[0.65rem] font-semibold uppercase text-[#F2EFE9]/60">Cooling Capacity (kW)</label>
                <input
                  type="number"
                  value={capacitykW}
                  onChange={(e) => setCapacitykW(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3.5 py-2 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                />
              </div>
              <div>
                <label className="block font-display text-[0.65rem] font-semibold uppercase text-[#F2EFE9]/60">Refrigerant Gas</label>
                <select
                  value={refrigerantType}
                  onChange={(e) => setRefrigerantType(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3.5 py-2 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                >
                  <option value="R134a">R134a (GWP 1430)</option>
                  <option value="R1234ze">R1234ze (GWP 7 - Ultra Low)</option>
                  <option value="R410A">R410A (GWP 2088)</option>
                  <option value="R32">R32 (GWP 675)</option>
                </select>
              </div>
              <div>
                <label className="block font-display text-[0.65rem] font-semibold uppercase text-[#F2EFE9]/60">Efficiency Rating (COP)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cop}
                  onChange={(e) => setCop(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3.5 py-2 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                />
              </div>
              <div>
                <label className="block font-display text-[0.65rem] font-semibold uppercase text-[#F2EFE9]/60">Annual Hours (Hrs/Year)</label>
                <input
                  type="number"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3.5 py-2 text-sm text-[#F2EFE9] outline-none focus:border-[#81BD01]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleCalculate}
              className="mt-4 w-full bg-[#81BD01] py-3 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#111111] hover:bg-[#92d402]"
            >
              Generate EPD Scorecard
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-5">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold uppercase text-[#81BD01]">{result.epdReadinessScore}</span>
                <span className="font-mono text-[0.65rem] text-[#F2EFE9]/40">{result.complianceStandard}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#2A2A2A] pt-4">
                <div>
                  <div className="font-display text-[0.6rem] font-semibold uppercase text-[#F2EFE9]/40">Manufacturing (A1-A3)</div>
                  <div className="mt-1 font-display text-lg font-bold text-[#F2EFE9]">{result.stageA1A3EmissionsTons} Tons CO2e</div>
                </div>
                <div>
                  <div className="font-display text-[0.6rem] font-semibold uppercase text-[#F2EFE9]/40">Operational Energy (B6)</div>
                  <div className="mt-1 font-display text-lg font-bold text-[#81BD01]">{result.stageB6EnergyEmissionsTons} Tons CO2e</div>
                </div>
              </div>
              <div className="mt-4 border-t border-[#2A2A2A] pt-3 text-xs text-[#F2EFE9]/60">
                Operational-to-Material Ratio: <strong className="text-[#81BD01]">{result.operationalToMaterialRatio}</strong>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setResult(null)} className="flex-1 border border-[#2A2A2A] py-2.5 font-display text-xs uppercase text-[#F2EFE9]/70 hover:bg-[#222222]">Recalculate</button>
              <button type="button" onClick={onClose} className="flex-1 bg-[#81BD01] py-2.5 font-display text-xs font-bold uppercase text-[#111111]">Done</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
