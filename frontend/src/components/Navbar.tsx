
import React, { useState } from 'react';
import {
  Zap,
  LayoutDashboard,
  Cpu,
  LineChart,
  Info,
  History,
  Home as HomeIcon,
  Activity,
  Menu,
  X,
  ChevronRight,
  Radio,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  apiOnline: boolean;
}

const navItems = [
  { id: 'home', label: 'Overview', icon: HomeIcon, short: 'Home' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, short: 'Dashboard' },
  { id: 'predict', label: 'AI Prediction', icon: Cpu, short: 'Predict' },
  { id: 'analytics', label: 'Degradation Analytics', icon: LineChart, short: 'Analytics' },
  { id: 'info', label: 'Dataset & Model Card', icon: Info, short: 'Model Info' },
  { id: 'history', label: 'Prediction Log', icon: History, short: 'History' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  apiOnline,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <header className="ev-navbar sticky top-0 z-50 w-full">
      <div className="ev-navbar-glow" />

      <div className="ev-navbar-inner">
        <div className="ev-navbar-main">
          {/* Brand */}
          <button
            type="button"
            onClick={() => navigate('home')}
            className="ev-brand group flex min-w-0 items-center gap-3 text-left"
            aria-label="Go to overview"
          >
            <div className="ev-brand-icon">
              <div className="ev-brand-icon-inner">
                <Zap className="h-6 w-6 text-white transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="ev-brand-title">
                  EV Battery Health
                </span>
                <span className="ev-ai-badge">AI</span>
              </div>
              <p className="ev-brand-subtitle">
                Predict Health. Estimate Life. Drive Smarter.
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav
            className="ev-desktop-nav"
            aria-label="Main navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`ev-nav-item ${isActive ? 'is-active' : ''}`}
                >
                  {isActive && <span className="ev-active-glow" />}

                  <Icon className="relative z-10 h-4 w-4 shrink-0" />

                  <span className="relative z-10">
                    {item.label}
                  </span>

                  {isActive && (
                    <span className="ev-nav-indicator" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* System status and mobile menu */}
          <div className="ev-navbar-actions">
            <div
              className={`ev-system-status ${apiOnline ? 'status-online' : 'status-offline'}`}
              title={apiOnline ? 'Backend health check passed' : 'Backend is not confirmed online'}
              aria-live="polite"
            >
              <span className="ev-status-light">
                <span />
              </span>

              <div className="hidden xl:block">
                <p className="ev-status-label">
                  {apiOnline ? 'SYSTEM ONLINE' : 'CONNECTING'}
                </p>
                <p className="ev-status-value">
                  {apiOnline ? 'ML Engine Ready' : 'ML Engine'}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="ev-mobile-toggle"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`ev-mobile-menu ${mobileOpen ? 'mobile-open' : ''}`}>
          <nav aria-label="Mobile navigation" className="ev-mobile-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`ev-mobile-item ${isActive ? 'is-active' : ''}`}
                >
                  <span className="ev-mobile-item-icon">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive ? (
                    <span className="ev-mobile-active-dot" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile quick navigation */}
      <div className="ev-mobile-quicknav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={`ev-quick-item ${isActive ? 'is-active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{item.short}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .ev-navbar {
          isolation: isolate;
          background: rgba(4, 10, 25, .84);
          border-bottom: 1px solid rgba(103, 232, 249, .17);
          backdrop-filter: blur(26px) saturate(150%);
          -webkit-backdrop-filter: blur(26px) saturate(150%);
        }

        .ev-navbar-glow {
          position: absolute;
          z-index: -1;
          pointer-events: none;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(34, 211, 238, .7),
            rgba(167, 139, 250, .65),
            transparent
          );
          background-size: 200% 100%;
          animation: evNavShimmer 7s linear infinite;
        }

        .ev-navbar-inner {
          max-width: 1800px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .ev-navbar-main {
          min-height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .ev-brand {
          flex-shrink: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .ev-brand-icon {
          width: 46px;
          height: 46px;
          padding: 1px;
          border-radius: 15px;
          background: linear-gradient(145deg, #67e8f9, #0891b2, #8b5cf6);
          box-shadow: 0 0 26px rgba(34, 211, 238, .23);
          transition: box-shadow .4s ease, transform .4s ease;
        }

        .ev-brand:hover .ev-brand-icon {
          transform: translateY(-2px) rotate(-3deg);
          box-shadow: 0 0 35px rgba(34, 211, 238, .45);
        }

        .ev-brand-icon-inner {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: linear-gradient(145deg, #0e7490, #047857);
        }

        .ev-brand-title {
          color: #f8fafc;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -.035em;
          white-space: nowrap;
        }

        .ev-ai-badge {
          padding: 3px 7px;
          border: 1px solid rgba(103, 232, 249, .28);
          border-radius: 7px;
          background: rgba(34, 211, 238, .09);
          color: #67e8f9;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .ev-brand-subtitle {
          margin-top: 4px;
          max-width: 245px;
          color: #94a3b8;
          font-size: 10px;
          line-height: 1.5;
        }

        .ev-desktop-nav {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px;
          border: 1px solid rgba(148, 163, 184, .13);
          border-radius: 18px;
          background: rgba(15, 23, 42, .52);
          box-shadow: inset 0 1px rgba(255, 255, 255, .035);
        }

        .ev-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 42px;
          padding: 0 12px;
          overflow: hidden;
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 650;
          white-space: nowrap;
          cursor: pointer;
          transition:
            color .3s ease,
            border-color .3s ease,
            background .3s ease,
            transform .3s ease;
        }

        .ev-nav-item:hover {
          color: #e0f2fe;
          background: rgba(103, 232, 249, .06);
          border-color: rgba(103, 232, 249, .12);
        }

        .ev-nav-item:active {
          transform: scale(.97);
        }

        .ev-nav-item.is-active {
          color: #a5f3fc;
          border-color: rgba(34, 211, 238, .3);
          background: linear-gradient(
            120deg,
            rgba(8, 145, 178, .19),
            rgba(13, 148, 136, .12),
            rgba(99, 102, 241, .1)
          );
          box-shadow:
            inset 0 1px rgba(255, 255, 255, .06),
            0 0 20px rgba(34, 211, 238, .055);
        }

        .ev-active-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            ellipse at 50% 0%,
            rgba(34, 211, 238, .17),
            transparent 75%
          );
        }

        .ev-nav-indicator {
          position: absolute;
          left: 20%;
          right: 20%;
          bottom: -1px;
          height: 2px;
          border-radius: 100%;
          background: linear-gradient(90deg, #22d3ee, #5eead4);
          box-shadow: 0 0 12px #22d3ee;
        }

        .ev-navbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .ev-system-status {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 43px;
          padding: 8px 12px;
          border: 1px solid rgba(148, 163, 184, .14);
          border-radius: 15px;
          background: rgba(15, 23, 42, .56);
        }

        .ev-status-light {
          position: relative;
          display: flex;
          width: 9px;
          height: 9px;
          flex-shrink: 0;
        }

        .ev-status-light::before {
          content: "";
          position: absolute;
          inset: -4px;
          border: 1px solid currentColor;
          border-radius: 50%;
          opacity: .4;
          animation: evStatusPulse 2.4s ease-out infinite;
        }

        .ev-status-light > span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 12px currentColor;
        }

        .status-online {
          color: #34d399;
          border-color: rgba(52, 211, 153, .2);
        }

        .status-offline {
          color: #fb7185;
          border-color: rgba(251, 113, 133, .2);
        }

        .ev-status-label {
          color: currentColor;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .12em;
        }

        .ev-status-value {
          margin-top: 3px;
          color: #cbd5e1;
          font-family: ui-monospace, monospace;
          font-size: 10px;
        }

        .ev-mobile-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border: 1px solid rgba(103, 232, 249, .2);
          border-radius: 12px;
          background: rgba(34, 211, 238, .07);
          color: #a5f3fc;
          cursor: pointer;
          transition: background .25s ease, transform .25s ease;
        }

        .ev-mobile-toggle:hover {
          background: rgba(34, 211, 238, .15);
        }

        .ev-mobile-menu {
          display: none;
        }

        .ev-mobile-quicknav {
          display: none;
        }

        @keyframes evNavShimmer {
          from { background-position: 0% 0; }
          to { background-position: 200% 0; }
        }

        @keyframes evStatusPulse {
          0% { transform: scale(.7); opacity: .7; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        @media (max-width: 1400px) {
          .ev-navbar-inner {
            padding: 0 14px;
          }

          .ev-navbar-main {
            gap: 12px;
          }

          .ev-nav-item {
            gap: 5px;
            padding: 0 9px;
            font-size: 10px;
          }

          .ev-brand-title {
            font-size: 13px;
          }

          .ev-brand-subtitle {
            max-width: 200px;
            font-size: 9px;
          }

          .ev-brand-icon {
            width: 42px;
            height: 42px;
          }
        }

        @media (max-width: 1050px) {
          .ev-desktop-nav {
            display: none;
          }

          .ev-mobile-toggle {
            display: flex;
          }

          .ev-mobile-menu {
            display: block;
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transition: max-height .4s ease, opacity .3s ease, padding .3s ease;
          }

          .ev-mobile-menu.mobile-open {
            max-height: 460px;
            padding-bottom: 14px;
            opacity: 1;
          }

          .ev-mobile-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            padding-top: 8px;
          }

          .ev-mobile-item {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            padding: 12px;
            border: 1px solid rgba(148, 163, 184, .12);
            border-radius: 13px;
            background: rgba(15, 23, 42, .5);
            color: #94a3b8;
            font-size: 12px;
            text-align: left;
            cursor: pointer;
            transition: background .25s ease, border-color .25s ease, color .25s ease;
          }

          .ev-mobile-item.is-active {
            border-color: rgba(34, 211, 238, .32);
            background: rgba(34, 211, 238, .09);
            color: #a5f3fc;
          }

          .ev-mobile-item-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            flex-shrink: 0;
            border: 1px solid rgba(148, 163, 184, .12);
            border-radius: 9px;
            background: rgba(255, 255, 255, .035);
          }

          .ev-mobile-active-dot {
            width: 7px;
            height: 7px;
            flex-shrink: 0;
            border-radius: 50%;
            background: #67e8f9;
            box-shadow: 0 0 12px #22d3ee;
          }

          .ev-mobile-quicknav {
            display: flex;
            gap: 5px;
            overflow-x: auto;
            padding: 8px 12px;
            border-top: 1px solid rgba(103, 232, 249, .1);
            scrollbar-width: none;
            background: rgba(4, 10, 25, .45);
          }

          .ev-mobile-quicknav::-webkit-scrollbar {
            display: none;
          }

          .ev-quick-item {
            display: flex;
            flex: 1 0 auto;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding: 10px 12px;
            border: 1px solid transparent;
            border-radius: 10px;
            background: transparent;
            color: #94a3b8;
            font-size: 11px;
            white-space: nowrap;
            cursor: pointer;
            transition: background .25s ease, color .25s ease;
          }

          .ev-quick-item.is-active {
            border-color: rgba(34, 211, 238, .24);
            background: rgba(34, 211, 238, .1);
            color: #a5f3fc;
          }
        }

        @media (max-width: 520px) {
          .ev-navbar-inner {
            padding: 0 12px;
          }

          .ev-navbar-main {
            min-height: 72px;
            gap: 8px;
          }

          .ev-brand {
            gap: 9px;
          }

          .ev-brand-icon {
            width: 38px;
            height: 38px;
            border-radius: 12px;
          }

          .ev-brand-icon-inner {
            border-radius: 11px;
          }

          .ev-brand-title {
            font-size: 12px;
          }

          .ev-brand-subtitle {
            max-width: 190px;
            font-size: 9px;
          }

          .ev-ai-badge {
            padding: 2px 5px;
            font-size: 9px;
          }

          .ev-navbar-actions {
            gap: 7px;
          }

          .ev-system-status {
            min-height: 36px;
            padding: 7px;
          }

          .ev-mobile-toggle {
            width: 36px;
            height: 36px;
          }

          .ev-mobile-list {
            grid-template-columns: 1fr;
          }

          .ev-quick-item {
            flex-direction: column;
            gap: 4px;
            padding: 8px 11px;
            font-size: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ev-navbar *,
          .ev-navbar *::before,
          .ev-navbar *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
