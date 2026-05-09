import React, { useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles, Upload, Database, Zap, Settings, BarChart2, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BOTTOM_NAV = [
  { name: 'Dashboard', path: 'Dashboard', icon: Sparkles },
  { name: 'Leads', path: 'Leads', icon: Database },
  { name: 'Map', path: 'MapView', icon: Map },
  { name: 'Import', path: 'Import', icon: Upload },
  { name: 'Sequences', path: 'Sequences', icon: Zap },
  { name: 'Analytics', path: 'Analytics', icon: BarChart2 },
  { name: 'Settings', path: 'Settings', icon: Settings },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollPositions = useRef({});

  const saveScroll = () => {
    scrollPositions.current[currentPageName] = window.scrollY;
  };

  useEffect(() => {
    const saved = scrollPositions.current[currentPageName];
    window.scrollTo(0, saved || 0);
  }, [currentPageName]);

  const isActive = (pageName) => currentPageName === pageName;

  const handleNavClick = (e, path) => {
    saveScroll();
    if (isActive(path)) {
      e.preventDefault();
      navigate(createPageUrl(path), { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ '--nav-bg': 'rgba(13,13,26,0.97)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Inter:wght@400;500;600&display=swap');

        body {
          font-family: 'Inter', sans-serif;
          color: #ffffff;
          overscroll-behavior: none;
          -webkit-overflow-scrolling: touch;
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
        }

        :root {
          --omega-magenta: #ea00ea;
          --omega-silver: #c3c3c3;
          --omega-yellow: #f5d800;
          --omega-teal: #00c2e0;
          --omega-blue: #0057ff;
          --omega-green: #00e676;
          --omega-orange: #ea00ea;
          --primary-navy: #0d0d1a;
          --steel-light: #c3c3c3;
          --steel-dark: #7a7a8c;
          --background: #0d0d1a;
          --text-primary: #ffffff;
          --text-muted: #a0a0b8;
        }

        @media (prefers-color-scheme: dark) {
          :root { --background: #0d0d1a; --text-primary: #ffffff; }
        }
        @media (prefers-color-scheme: light) {
          :root { --background: #0d0d1a; --text-primary: #ffffff; }
        }

        button, a {
          -webkit-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .bottom-nav-bar {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .safe-header {
          padding-top: env(safe-area-inset-top, 0px);
        }

        @media (max-width: 767px) {
          .page-content {
            padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>

      {/* Header */}
      <header className="safe-header border-b sticky top-0 z-40" style={{
        borderColor: 'rgba(234,0,234,0.3)',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentPageName !== 'Dashboard' && (
                <button
                  onClick={() => { saveScroll(); navigate(-1); }}
                  className="flex items-center justify-center h-8 w-8 rounded-lg transition-all md:hidden"
                  style={{ background: 'rgba(234,0,234,0.15)', color: '#ea00ea' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
              )}
              <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2 sm:gap-3">
                <img
                  src="https://media.base44.com/images/public/691ccbe8057765b3fc1fdb65/c30aff37b_Gemini_Generated_Image_kupphwkupphwkupp1.png"
                  alt="Legendary Leads"
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                  style={{ filter: 'drop-shadow(0 0 6px #ea00ea88)' }}
                />
                <span className="text-lg sm:text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: '#ea00ea' }}>
                  Legendary Leads
                </span>
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 flex-wrap justify-end">
              {BOTTOM_NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    onClick={(e) => handleNavClick(e, item.path)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all font-medium text-sm"
                    style={{
                      background: active ? '#ea00ea' : 'transparent',
                      color: active ? '#ffffff' : '#c3c3c3',
                      fontWeight: active ? 600 : 500
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Page content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={currentPageName}
          className="page-content"
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -24, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav-bar fixed bottom-0 left-0 right-0 z-50 md:hidden border-t" style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(234,0,234,0.3)'
      }}>
        <div className="flex items-center justify-around px-1 pt-2 pb-1">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={createPageUrl(item.path)}
                onClick={(e) => handleNavClick(e, item.path)}
                className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-xl transition-all min-w-0"
                style={{ color: active ? '#ea00ea' : '#7a7a8c' }}
              >
                <div className="rounded-lg p-1.5 transition-all" style={{
                  background: active ? 'rgba(234,0,234,0.15)' : 'transparent'
                }}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-medium truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}