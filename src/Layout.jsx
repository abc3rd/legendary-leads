import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles, Upload, Database, Zap, Settings, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BOTTOM_NAV = [

  { name: 'Dashboard', path: 'Dashboard', icon: Sparkles },
  { name: 'Leads', path: 'Leads', icon: Database },
  { name: 'Import', path: 'Import', icon: Upload },
  { name: 'Sequences', path: 'Sequences', icon: Zap },
  { name: 'Analytics', path: 'Analytics', icon: BarChart2 },
  { name: 'Settings', path: 'Settings', icon: Settings },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (pageName) => currentPageName === pageName;

  const handleNavClick = (e, path) => {
    if (isActive(path)) {
      e.preventDefault();
      navigate(createPageUrl(path), { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ '--nav-bg': 'rgba(10,25,41,0.97)' }}>
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
          --omega-yellow: #f8d417;
          --omega-teal: #4acbbf;
          --omega-blue: #54b0e7;
          --omega-orange: #f66c25;
          --primary-navy: #0a1929;
          --steel-light: #d7dde5;
          --steel-dark: #5e6a78;
          --background: #0a1929;
          --text-primary: #ffffff;
          --text-muted: #9ea7b5;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --background: #0a1929;
            --text-primary: #ffffff;
          }
        }
        @media (prefers-color-scheme: light) {
          :root {
            --background: #0a1929;
            --text-primary: #ffffff;
          }
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

        /* Add bottom padding to main content on mobile so it's not hidden behind bottom nav */
        @media (max-width: 767px) {
          .page-content {
            padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>

      {/* Header */}
      <header className="safe-header border-b sticky top-0 z-40" style={{
        borderColor: 'rgba(74, 203, 191, 0.2)',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2 sm:gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691ccbe8057765b3fc1fdb65/dd282f7ea_LL-Logo1024x1024.png"
                alt="Legendary Leads"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover"
              />
              <span className="text-lg sm:text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: '#f8d417' }}>
                Legendary Leads
              </span>
            </Link>

            {/* Desktop nav only */}
            <nav className="hidden md:flex items-center gap-2">
              {BOTTOM_NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    onClick={(e) => handleNavClick(e, item.path)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm"
                    style={{
                      background: active ? '#54b0e7' : 'transparent',
                      color: active ? '#0a1929' : '#9ea7b5',
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

      {/* Page content with slide transition */}
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="bottom-nav-bar fixed bottom-0 left-0 right-0 z-50 md:hidden border-t" style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(74, 203, 191, 0.25)'
      }}>
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={createPageUrl(item.path)}
                onClick={(e) => handleNavClick(e, item.path)}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0"
                style={{ color: active ? '#4acbbf' : '#5e6a78' }}
              >
                <div className="rounded-lg p-1.5 transition-all" style={{
                  background: active ? 'rgba(74,203,191,0.15)' : 'transparent'
                }}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}