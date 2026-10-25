
import React, { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BatteryCharging,
  BrainCircuit,
  ChevronRight,
  Cpu,
  Database,
  Gauge,
  Layers3,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

interface HomeProps {
  setActiveTab: (tab: string) => void;
  datasetSamples: number;
}

const particles = Array.from({ length: 48 }, (_, i) => ({
  left: `${(i * 47.13 + 11) % 100}%`,
  top: `${(i * 29.71 + 7) % 100}%`,
  delay: `${-(i % 13) * 1.7}s`,
  duration: `${8 + (i % 9) * 2}s`,
  size: i % 7 === 0 ? 4 : 2,
}));

const energyLines = Array.from({ length: 13 }, (_, i) => ({
  top: `${8 + i * 7}%`,
  delay: `${-i * 1.4}s`,
  duration: `${7 + (i % 5) * 2}s`,
}));

export const Home: React.FC<HomeProps> = ({
  setActiveTab,
  datasetSamples,
}) => {
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div
      className="cinematic-home relative isolate min-h-screen overflow-hidden text-white"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMouse({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }}
    >
      {/* FULL HOME SCREEN ANIMATED UNIVERSE */}
      <div className="cinematic-universe" aria-hidden="true">
        <div className="universe-base" />
        <div className="universe-grid" />
        <div className="universe-nebula nebula-blue" />
        <div className="universe-nebula nebula-purple" />
        <div className="universe-nebula nebula-teal" />

        <div
          className="mouse-light"
          style={{
            left: `${mouse.x}%`,
            top: `${mouse.y}%`,
          }}
        />

        <div className="energy-lines">
          {energyLines.map((line, i) => (
            <span
              key={i}
              className="energy-line"
              style={{
                top: line.top,
                animationDelay: line.delay,
                animationDuration: line.duration,
              }}
            />
          ))}
        </div>

        <div className="particle-field">
          {particles.map((particle, i) => (
            <span
              key={i}
              className="energy-particle"
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            />
          ))}
        </div>

        <div className="universe-vignette" />
      </div>

      {/* HERO */}
      <section className="relative z-10 mx-auto flex min-h-[740px] max-w-[1440px] items-center px-5 py-16 sm:px-10 lg:min-h-[820px] lg:px-14">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div
            className={`relative z-20 space-y-8 transition-all duration-1000 ${
              visible
                ? "translate-y-0 opacity-100"
                : "translate-y-12 opacity-0"
            }`}
          >
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 backdrop-blur-xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-cyan-300" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-300" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100 sm:text-xs">
                Next Generation Energy Intelligence
              </span>
              <Sparkles className="h-4 w-4 text-cyan-200" />
            </div>

            <div className="space-y-5">
              <h1 className="text-5xl font-black leading-[1.07] tracking-[-0.06em] sm:text-6xl xl:text-[5.4rem]">
                THE FUTURE
                <br />
                OF <span className="text-cyan-300">BATTERY</span>
                <br />
                <span className="cinematic-gradient-text">
                  INTELLIGENCE
                </span>
              </h1>

              <div className="flex items-center gap-3">
                <div className="h-px w-10 bg-cyan-300" />
                <p className="text-base font-semibold tracking-wide text-cyan-100 sm:text-xl">
                  EV Battery Health &amp; Life Prediction AI
                </p>
              </div>

              <p className="max-w-xl text-sm leading-8 text-slate-300 sm:text-base">
                Step into an AI-powered battery research experience.
                Explore State of Health, Remaining Useful Life,
                degradation analytics, and intelligent predictions
                using NASA lithium-ion aging research data.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("predict")}
                className="cinematic-primary group inline-flex items-center gap-3 rounded-2xl px-7 py-4 font-bold text-slate-950"
              >
                <Zap className="h-5 w-5" />
                Launch AI Prediction
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="cinematic-secondary group inline-flex items-center gap-3 rounded-2xl px-7 py-4 font-semibold text-white"
              >
                <Activity className="h-5 w-5 text-cyan-200" />
                Explore Dashboard
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <div className="flex flex-wrap gap-5 pt-4 text-xs text-slate-300">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Academic Research
              </span>
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4 text-cyan-300" />
                NASA Battery Dataset
              </span>
              <span className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-violet-300" />
                ML-Based Prognostics
              </span>
            </div>
          </div>

          {/* HOLOGRAPHIC BATTERY REACTOR */}
          <div className="reactor-scene relative mx-auto flex h-[410px] w-full max-w-[590px] items-center justify-center sm:h-[560px]">
            <div className="reactor-halo" />

            <div className="reactor-ring reactor-ring-one">
              <span className="orbit-node orbit-node-cyan" />
            </div>

            <div className="reactor-ring reactor-ring-two">
              <span className="orbit-node orbit-node-purple" />
            </div>

            <div className="reactor-ring reactor-ring-three" />

            <div className="reactor-scan" />

            <div className="reactor-core">
              <div className="reactor-core-inner">
                <div className="reactor-core-icon">
                  <BatteryCharging className="h-14 w-14 text-cyan-100 sm:h-20 sm:w-20" />
                </div>

                <div className="mt-5 text-center">
                  <div className="text-4xl font-black tracking-tight sm:text-5xl">
                    EV<span className="text-cyan-300">AI</span>
                  </div>
                  <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-100/60">
                    Energy Intelligence
                  </p>
                </div>

                <div className="mt-5 flex items-end gap-1">
                  {Array.from({ length: 17 }, (_, i) => (
                    <span
                      key={i}
                      className="reactor-equalizer"
                      style={{
                        height: `${12 + ((i * 17) % 28)}px`,
                        animationDelay: `${i * 0.09}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="reactor-float reactor-float-top">
              <div className="flex items-center gap-2 text-cyan-100">
                <Radio className="h-4 w-4" />
                <span className="text-[10px] font-bold tracking-wider">
                  ENERGY SIGNAL
                </span>
              </div>
              <div className="mt-3 flex h-9 items-end gap-1">
                {Array.from({ length: 14 }, (_, i) => (
                  <span
                    key={i}
                    className="reactor-equalizer"
                    style={{
                      height: `${20 + ((i * 23) % 75)}%`,
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="reactor-float reactor-float-bottom">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-violet-300" />
                <span className="text-xs font-semibold">
                  AI Prognostics
                </span>
              </div>
              <div className="mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                <div className="reactor-loading h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300" />
              </div>
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.3em] text-cyan-100/40">
              Holographic visualization
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING METRIC PANELS */}
      <section className="relative z-10 mx-auto max-w-[1440px] px-5 pb-24 sm:px-10 lg:px-14">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "SOH Model R²",
              value: "94.1%",
              icon: Gauge,
              color: "cyan",
            },
            {
              label: "NASA Lab Cycles",
              value: String(datasetSamples || 636),
              icon: Database,
              color: "emerald",
            },
            {
              label: "Mean Absolute Error",
              value: "1.48%",
              icon: Activity,
              color: "violet",
            },
            {
              label: "EOL Capacity Threshold",
              value: "1.40 Ah",
              icon: BatteryCharging,
              color: "amber",
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`cinematic-glass cinematic-card-${item.color} group rounded-3xl p-6`}
                style={{ animationDelay: `${index * -1.1}s` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-300">
                      {item.label}
                    </p>
                    <p className="mt-4 text-4xl font-black tracking-tight text-white">
                      {item.value}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-cyan-200 transition duration-300 group-hover:rotate-12">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-6 h-px bg-gradient-to-r from-cyan-300/40 to-transparent" />
                <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Research metric
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PLATFORM CAPABILITIES */}
      <section className="relative z-10 mx-auto max-w-[1440px] px-5 pb-28 sm:px-10 lg:px-14">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
            Discover the system
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            ENGINEERED FOR
            <br />
            <span className="cinematic-gradient-text">
              INTELLIGENT ENERGY
            </span>
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-300">
            A research-focused environment for understanding
            battery degradation and exploring machine-learning
            predictions.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "AI Battery Prediction",
              description:
                "Explore State of Health and Remaining Useful Life predictions using battery measurement inputs.",
              icon: BrainCircuit,
              tab: "predict",
              number: "01",
            },
            {
              title: "Degradation Analytics",
              description:
                "Investigate battery aging trends, benchmark curves, and model evaluation visualizations.",
              icon: Activity,
              tab: "analytics",
              number: "02",
            },
            {
              title: "Research & Model Card",
              description:
                "Explore dataset specifications, model architecture, evaluation methodology, and limitations.",
              icon: Layers3,
              tab: "info",
              number: "03",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.number}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                className="cinematic-glass group relative overflow-hidden rounded-3xl p-8 text-left transition-transform duration-500 hover:-translate-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-4 text-cyan-200">
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="font-mono text-sm text-cyan-200/50">
                    /{item.number}
                  </span>
                </div>

                <h3 className="mt-8 text-xl font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {item.description}
                </p>
                <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-cyan-200">
                  Explore module
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 mx-auto max-w-[1440px] px-5 pb-24 sm:px-10 lg:px-14">
        <div className="cinematic-glass relative overflow-hidden rounded-[2rem] p-8 text-center sm:p-14">
          <div className="cta-energy" />
          <div className="relative">
            <Zap className="mx-auto h-10 w-10 text-cyan-200" />
            <h2 className="mt-5 text-3xl font-black sm:text-5xl">
              READY TO EXPLORE
              <br />
              <span className="cinematic-gradient-text">
                BATTERY INTELLIGENCE?
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-300">
              Enter battery measurements and explore model-based
              prognostic estimates in the AI prediction module.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("predict")}
              className="cinematic-primary mt-8 inline-flex items-center gap-3 rounded-2xl px-8 py-4 font-bold text-slate-950"
            >
              <Zap className="h-5 w-5" />
              Start Prediction
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs leading-6 text-slate-400">
          Academic prototype. Animations are illustrative, not live
          battery telemetry. Predictions are not certified safety
          assessments.
        </p>
      </section>

      <style>{`
        .cinematic-home {
          margin-left: calc(-50vw + 50%);
          margin-right: calc(-50vw + 50%);
          width: 100vw;
          max-width: 100vw;
          background: #030817;
        }

        .cinematic-universe {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: -1;
        }

        .universe-base {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 65% 12%, #083c63 0%, transparent 40%),
            radial-gradient(ellipse at 15% 38%, #191052 0%, transparent 44%),
            radial-gradient(ellipse at 80% 75%, #063d42 0%, transparent 42%),
            #030817;
          animation: universeColor 13s ease-in-out infinite alternate;
        }

        .universe-grid {
          position: absolute;
          inset: -20%;
          background-image:
            linear-gradient(rgba(34,211,238,.11) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,.11) 1px, transparent 1px);
          background-size: 80px 80px;
          transform: perspective(700px) rotateX(40deg) scale(1.2);
          animation: gridTravel 12s linear infinite;
          mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
        }

        .universe-nebula {
          position: absolute;
          width: 75vw;
          height: 75vw;
          min-width: 500px;
          min-height: 500px;
          border-radius: 50%;
          filter: blur(85px);
          opacity: .5;
          mix-blend-mode: screen;
          will-change: transform;
        }

        .nebula-blue {
          top: -18%;
          left: -25%;
          background: radial-gradient(circle, rgba(0,153,255,.5), transparent 65%);
          animation: nebulaMoveOne 13s ease-in-out infinite alternate;
        }

        .nebula-purple {
          top: 16%;
          right: -30%;
          background: radial-gradient(circle, rgba(121,57,255,.45), transparent 65%);
          animation: nebulaMoveTwo 16s ease-in-out infinite alternate;
        }

        .nebula-teal {
          bottom: -15%;
          left: 10%;
          background: radial-gradient(circle, rgba(0,255,204,.3), transparent 65%);
          animation: nebulaMoveThree 18s ease-in-out infinite alternate;
        }

        .mouse-light {
          position: absolute;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34,211,238,.16), transparent 68%);
          transform: translate(-50%, -50%);
          transition: left .25s ease-out, top .25s ease-out;
          filter: blur(15px);
        }

        .energy-lines {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .energy-line {
          position: absolute;
          left: -65%;
          width: 65%;
          height: 2px;
          opacity: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(34,211,238,.05),
            rgba(103,232,249,.95),
            rgba(196,181,253,.75),
            transparent
          );
          box-shadow: 0 0 12px 2px rgba(34,211,238,.4);
          transform: rotate(-13deg);
          animation: energySweep linear infinite;
        }

        .energy-particle {
          position: absolute;
          border-radius: 50%;
          background: #a5f3fc;
          box-shadow: 0 0 10px 2px #22d3ee, 0 0 25px #6366f1;
          animation: particleRise ease-in-out infinite alternate;
        }

        .universe-vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(3,8,23,.05),
            transparent 35%,
            rgba(3,8,23,.18) 80%,
            rgba(3,8,23,.35)
          );
        }

        .cinematic-gradient-text {
          color: #67e8f9;
          background: linear-gradient(
            100deg,
            #67e8f9,
            #a5f3fc,
            #a78bfa,
            #5eead4,
            #67e8f9
          );
          background-size: 300% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textEnergy 6s linear infinite;
        }

        .cinematic-primary {
          background: linear-gradient(110deg, #22d3ee, #5eead4, #a5f3fc, #22d3ee);
          background-size: 250% 100%;
          box-shadow: 0 0 30px rgba(34,211,238,.35);
          transition: transform .35s ease, box-shadow .35s ease;
          animation: primaryGlow 5s linear infinite;
        }

        .cinematic-primary:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 50px rgba(34,211,238,.6);
        }

        .cinematic-secondary {
          border: 1px solid rgba(165,243,252,.25);
          background: rgba(15,23,42,.45);
          backdrop-filter: blur(18px);
          transition: transform .35s ease, background .35s ease;
        }

        .cinematic-secondary:hover {
          transform: translateY(-4px);
          background: rgba(34,211,238,.12);
        }

        .reactor-scene {
          isolation: isolate;
        }

        .reactor-halo {
          position: absolute;
          width: 85%;
          aspect-ratio: 1;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34,211,238,.22), rgba(99,102,241,.10) 35%, transparent 68%);
          filter: blur(25px);
          animation: haloPulse 5s ease-in-out infinite;
        }

        .reactor-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(103,232,249,.3);
          will-change: transform;
        }

        .reactor-ring-one {
          width: 85%;
          aspect-ratio: 1;
          border-top: 3px solid #22d3ee;
          border-bottom: 2px solid #818cf8;
          box-shadow: 0 0 35px rgba(34,211,238,.12);
          animation: ringRotate 12s linear infinite;
        }

        .reactor-ring-two {
          width: 68%;
          aspect-ratio: 1;
          border: 2px dashed rgba(196,181,253,.4);
          animation: ringRotate 18s linear infinite reverse;
        }

        .reactor-ring-three {
          width: 105%;
          aspect-ratio: 1;
          border: 1px solid rgba(34,211,238,.12);
          border-left: 2px solid rgba(94,234,212,.6);
          animation: ringRotate 25s linear infinite;
        }

        .orbit-node {
          position: absolute;
          width: 13px;
          height: 13px;
          border-radius: 50%;
        }

        .orbit-node-cyan {
          top: 10%;
          left: 15%;
          background: #67e8f9;
          box-shadow: 0 0 15px 5px #0891b2;
        }

        .orbit-node-purple {
          right: 12%;
          bottom: 14%;
          background: #c4b5fd;
          box-shadow: 0 0 15px 5px #7c3aed;
        }

        .reactor-scan {
          position: absolute;
          width: 90%;
          height: 90%;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(34,211,238,.13) 25deg,
            transparent 65deg,
            transparent 360deg
          );
          animation: ringRotate 7s linear infinite;
        }

        .reactor-core {
          position: relative;
          z-index: 3;
          width: 55%;
          max-width: 275px;
          aspect-ratio: 1;
          border-radius: 30%;
          padding: 2px;
          background: linear-gradient(135deg, #67e8f9, rgba(255,255,255,.08), #8b5cf6);
          box-shadow:
            0 0 60px rgba(34,211,238,.28),
            0 0 100px rgba(99,102,241,.16);
          animation: reactorFloat 6s ease-in-out infinite;
        }

        .reactor-core-inner {
          display: flex;
          height: 100%;
          width: 100%;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 30%;
          background: linear-gradient(145deg, rgba(12,42,70,.96), rgba(6,10,31,.96));
          backdrop-filter: blur(20px);
        }

        .reactor-core-icon {
          padding: 15px;
          border: 1px solid rgba(103,232,249,.3);
          border-radius: 20px;
          background: rgba(34,211,238,.08);
          box-shadow: 0 0 35px rgba(34,211,238,.2);
        }

        .reactor-equalizer {
          display: block;
          width: 4px;
          border-radius: 5px;
          background: linear-gradient(to top, #0891b2, #5eead4, #a5f3fc);
          animation: equalizer 1.2s ease-in-out infinite alternate;
          transform-origin: bottom;
        }

        .reactor-float {
          position: absolute;
          z-index: 5;
          padding: 17px;
          border: 1px solid rgba(103,232,249,.2);
          border-radius: 20px;
          background: rgba(5,14,34,.7);
          box-shadow: 0 15px 45px rgba(0,0,0,.3);
          backdrop-filter: blur(24px);
          animation: reactorFloat 5s ease-in-out infinite;
        }

        .reactor-float-top {
          right: 0;
          top: 10%;
        }

        .reactor-float-bottom {
          left: 0;
          bottom: 13%;
          animation-delay: -2s;
        }

        .reactor-loading {
          animation: progressEnergy 3s ease-in-out infinite alternate;
        }

        .cinematic-glass {
          border: 1px solid rgba(165,243,252,.18);
          background: linear-gradient(
            145deg,
            rgba(31,61,96,.42),
            rgba(10,16,42,.65) 55%,
            rgba(40,20,77,.32)
          );
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.12),
            0 20px 60px rgba(0,0,0,.25);
          transition: border-color .35s ease, box-shadow .35s ease, transform .35s ease;
        }

        .cinematic-glass:hover {
          border-color: rgba(103,232,249,.5);
          box-shadow: 0 25px 75px rgba(34,211,238,.14);
        }

        .cinematic-card-cyan,
        .cinematic-card-emerald,
        .cinematic-card-violet,
        .cinematic-card-amber {
          animation: cardHover 6s ease-in-out infinite;
        }

        .cta-energy {
          position: absolute;
          inset: -50%;
          background: conic-gradient(
            from 0deg,
            transparent,
            rgba(34,211,238,.12),
            transparent,
            rgba(139,92,246,.13),
            transparent
          );
          animation: ringRotate 18s linear infinite;
        }

        @keyframes universeColor {
          from { filter: hue-rotate(0deg) brightness(1); }
          to { filter: hue-rotate(25deg) brightness(1.2); }
        }

        @keyframes gridTravel {
          from { background-position: 0 0; }
          to { background-position: 0 160px; }
        }

        @keyframes nebulaMoveOne {
          from { transform: translate(-8%, -5%) scale(.9); }
          to { transform: translate(30%, 20%) scale(1.3); }
        }

        @keyframes nebulaMoveTwo {
          from { transform: translate(10%, -10%) scale(.9); }
          to { transform: translate(-35%, 20%) scale(1.2); }
        }

        @keyframes nebulaMoveThree {
          from { transform: translate(-10%, 10%) scale(.8); }
          to { transform: translate(25%, -30%) scale(1.25); }
        }

        @keyframes energySweep {
          0% { transform: translateX(0) rotate(-13deg); opacity: 0; }
          12% { opacity: .85; }
          75% { opacity: .65; }
          100% { transform: translateX(270vw) rotate(-13deg); opacity: 0; }
        }

        @keyframes particleRise {
          0% { transform: translate(0, 20px); opacity: .15; }
          50% { opacity: .9; }
          100% { transform: translate(35px, -100px); opacity: .3; }
        }

        @keyframes textEnergy {
          from { background-position: 0% 50%; }
          to { background-position: 300% 50%; }
        }

        @keyframes primaryGlow {
          from { background-position: 0% 50%; }
          to { background-position: 250% 50%; }
        }

        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes haloPulse {
          0%, 100% { transform: scale(.9); opacity: .6; }
          50% { transform: scale(1.15); opacity: 1; }
        }

        @keyframes reactorFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-17px); }
        }

        @keyframes equalizer {
          from { transform: scaleY(.45); opacity: .6; }
          to { transform: scaleY(1.15); opacity: 1; }
        }

        @keyframes progressEnergy {
          from { width: 25%; }
          to { width: 95%; }
        }

        @keyframes cardHover {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        @media (max-width: 640px) {
          .reactor-ring-three { width: 100%; }
          .reactor-float { padding: 10px; }
          .reactor-float-top { right: -2%; }
          .reactor-float-bottom { left: -2%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cinematic-home *,
          .cinematic-home *::before,
          .cinematic-home *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
