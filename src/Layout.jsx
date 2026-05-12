import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Upload, Database, Zap, Settings, BarChart2, Map,
  CheckSquare, Mic, MessageSquare, Globe, Users, Webhook,
  GitBranch, BookOpen, ChevronDown, Menu, X, Home, Search, ArrowLeft
} from 'lucide-react';
import AppFooter from './components/ui/AppFooter';

// ─── Nav structure ────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Home',
    icon: Home,
    single: true,
    path: 'Dashboard',
  },
  {
    label: 'Leads',
    icon: Database,
    color: '#4acbbf',
    items: [
      { name: 'All Leads', path: 'Leads', icon: Database },
      { name: 'Map View', path: 'MapView', icon: Map },
      { name: 'Import CSV', path: 'Import', icon: Upload },
      { name: 'Scraper', path: 'SocialScraper', icon: Globe },
      { name: 'Round Robin', path: 'RoundRobin', icon: Users },
    ],
  },
  {
    label: 'Outreach',
    icon: Zap,
    color: '#f8d417',
    items: [
      { name: 'Sequences', path: 'Sequences', icon: Zap },
      { name: 'Email Campaigns', path: 'EmailCampaigns', icon: MessageSquare },
      { name: 'Templates', path: 'Templates', icon: BookOpen },
      { name: 'Workflows', path: 'WorkflowEngine', icon: GitBranch },
      { name: 'Voice', path: 'VoiceOutreach', icon: Mic },
    ],
  },
  {
    label: 'Collaborate',
    icon: Users,
    color: '#ea00ea',
    items: [
      { name: 'Team', path: 'TeamDashboard', icon: Users },
      { name: 'Tasks', path: 'TaskBoard', icon: CheckSquare },
      { name: 'Messages', path: 'Messaging', icon: MessageSquare },
      { name: 'Scheduler', path: 'SmartScheduler', icon: CheckSquare },
    ],
  },
  {
    label: 'LegenDB',
    icon: Database,
    single: true,
    path: 'LegenDatabase',
    color: '#ea00ea',
  },
  {
    label: 'Insights',
    icon: BarChart2,
    color: '#54b0e7',
    items: [
      { name: 'Analytics', path: 'Analytics', icon: BarChart2 },
      { name: 'Inbox', path: 'UniversalInbox', icon: MessageSquare },
      { name: 'Webhooks', path: 'Webhooks', icon: Webhook },
    ],
  },
  {
    label: 'Client Portal',
    icon: Globe,
    single: true,
    path: 'ClientPortal',
    color: '#a78bfa',
  },
  {
    label: 'Settings',
    icon: Settings,
    single: true,
    path: 'Settings',
    color: '#9ea7b5',
  },
];

// Bottom nav for mobile — flat list
const MOBILE_NAV = [
  { name: 'Home', path: 'Dashboard', icon: Sparkles },
  { name: 'Leads', path: 'Leads', icon: Database },
  { name: 'LegenDB', path: 'LegenDatabase', icon: Search },
  { name: 'Outreach', path: 'Sequences', icon: Zap },
  { name: 'Analytics', path: 'Analytics', icon: BarChart2 },
];

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function NavDropdown({ group, currentPageName, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 rounded-2xl overflow-hidden z-50 min-w-[180px] shadow-2xl"
      style={{
        background: 'rgba(10,18,30,0.97)',
        border: `1px solid ${group.color || '#ea00ea'}44`,
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="px-2 py-2 space-y-0.5">
        {group.items.map((item, i) => {
          const Icon = item.icon;
          const active = currentPageName === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.15 }}
            >
              <Link
                to={createPageUrl(item.path)}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group"
                style={{
                  background: active ? `${group.color || '#ea00ea'}18` : 'transparent',
                  color: active ? (group.color || '#ea00ea') : '#c3c3c3',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = `${group.color || '#ea00ea'}10`;
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#c3c3c3';
                  }
                }}
              >
                <div className="h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: active ? `${group.color || '#ea00ea'}22` : 'rgba(255,255,255,0.05)' }}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {item.name}
                {active && (
                  <motion.div className="ml-auto h-1.5 w-1.5 rounded-full" layoutId="active-dot"
                    style={{ background: group.color || '#ea00ea' }} />
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Desktop group button ─────────────────────────────────────────────────────
function NavGroup({ group, currentPageName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timeoutRef = useRef(null);

  const isGroupActive = group.single
    ? currentPageName === group.path
    : group.items?.some(i => i.path === currentPageName);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    if (!group.single) setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (group.single) {
    const Icon = group.icon;
    return (
      <Link
        to={createPageUrl(group.path)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: isGroupActive ? (group.color || '#ea00ea') + '22' : 'transparent',
          color: isGroupActive ? (group.color || '#ea00ea') : '#9ea7b5',
        }}
        onMouseEnter={e => { if (!isGroupActive) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; } }}
        onMouseLeave={e => { if (!isGroupActive) { e.currentTarget.style.color = '#9ea7b5'; e.currentTarget.style.background = 'transparent'; } }}
      >
        <Icon className="h-4 w-4" />
        {group.label}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all select-none"
        style={{
          background: isGroupActive ? (group.color || '#ea00ea') + '22' : open ? 'rgba(255,255,255,0.06)' : 'transparent',
          color: isGroupActive ? (group.color || '#ea00ea') : open ? '#fff' : '#9ea7b5',
        }}
      >
        <group.icon className="h-4 w-4" />
        {group.label}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <NavDropdown group={group} currentPageName={currentPageName} onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mobile full-screen menu ──────────────────────────────────────────────────
function MobileMenu({ currentPageName, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(8,14,24,0.99)', backdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(234,0,234,0.2)' }}>
        <span className="text-xl font-bold" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>Menu</span>
        <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(234,0,234,0.12)', color: '#ea00ea' }}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {NAV_GROUPS.map((group, gi) => (
          <motion.div key={group.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.06, duration: 0.2 }}>
            {group.single ? (
              <Link to={createPageUrl(group.path)} onClick={onClose}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-semibold"
                style={{
                  background: currentPageName === group.path ? `${group.color || '#ea00ea'}18` : 'rgba(255,255,255,0.04)',
                  color: currentPageName === group.path ? (group.color || '#ea00ea') : '#c3c3c3',
                  border: `1px solid ${currentPageName === group.path ? (group.color || '#ea00ea') + '44' : 'transparent'}`,
                }}>
                <group.icon className="h-5 w-5" />
                {group.label}
              </Link>
            ) : (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: group.color || '#ea00ea' }}>
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item, ii) => {
                    const Icon = item.icon;
                    const active = currentPageName === item.path;
                    return (
                      <motion.div key={item.path} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: gi * 0.06 + ii * 0.04 }}>
                        <Link to={createPageUrl(item.path)} onClick={onClose}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                          style={{
                            background: active ? `${group.color || '#ea00ea'}18` : 'transparent',
                            color: active ? (group.color || '#ea00ea') : '#9ea7b5',
                          }}>
                          <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                            style={{ background: active ? `${group.color || '#ea00ea'}22` : 'rgba(255,255,255,0.06)' }}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          {item.name}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollPositions = useRef({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Optimistic active tab — updates instantly on tap before route change completes
  const [optimisticTab, setOptimisticTab] = useState(null);

  // Determine if we're on a "child" page (not Dashboard/Home)
  const rootPages = ['Dashboard', 'Home'];
  const isChildPage = !rootPages.includes(currentPageName) && location.pathname !== '/';

  // Save scroll position before navigating away
  const saveScroll = useCallback(() => {
    scrollPositions.current[currentPageName] = window.scrollY;
  }, [currentPageName]);

  useEffect(() => {
    window.addEventListener('scroll', saveScroll, { passive: true });
    return () => window.removeEventListener('scroll', saveScroll);
  }, [saveScroll]);

  useEffect(() => {
    // Restore scroll for this page (stack preservation)
    const saved = scrollPositions.current[currentPageName];
    window.scrollTo(0, saved || 0);
    setMobileMenuOpen(false);
    // Clear optimistic tab once real route matches
    setOptimisticTab(null);
  }, [currentPageName]);

  return (
    <div className="min-h-screen" style={{ background: '#0a1929', color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          overscroll-behavior: none;
          overscroll-behavior-y: none;
          -webkit-overflow-scrolling: touch;
          background: #0a1929;
        }
        h1,h2,h3,h4,h5,h6 { font-family: 'Poppins', sans-serif; font-weight: 700; }
        button, a { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        /* Prevent sticky header from being pulled past top on Android */
        header.sticky { transform: translateZ(0); will-change: transform; }
        /* Bottom tab bar: fixed, won't scroll with content, hardware-accelerated */
        .bottom-tab-bar { transform: translateZ(0); will-change: transform; }
        @media (max-width: 767px) {
          .page-content { padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)); }
          /* Block pull-to-refresh on Android Chrome except at top */
          html { overscroll-behavior-y: none; }
        }
        .safe-top { padding-top: env(safe-area-inset-top, 0px); }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
        /* Native-feel select/dropdown on Android */
        select { -webkit-appearance: none; appearance: none; }
      `}</style>

      {/* ── Header ── */}
      <header className="safe-top sticky top-0 z-40"
        style={{ background: 'rgba(8,14,24,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(234,0,234,0.15)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo / Back button */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {/* Mobile: show back button on child pages */}
              {isChildPage && (
                <button
                  onClick={() => navigate(-1)}
                  className="md:hidden flex items-center justify-center h-8 w-8 rounded-xl transition-all"
                  style={{ background: 'rgba(234,0,234,0.12)', color: '#ea00ea' }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <Link to={createPageUrl('Dashboard')} className={`flex items-center gap-2.5 ${isChildPage ? 'hidden md:flex' : 'flex'}`}>
                <motion.img
                  src="https://media.base44.com/images/public/691ccbe8057765b3fc1fdb65/c30aff37b_Gemini_Generated_Image_kupphwkupphwkupp1.png"
                  alt="Legendary Leads"
                  className="h-8 w-8 object-contain"
                  style={{ filter: 'drop-shadow(0 0 8px #ea00ea88)' }}
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                />
                <span className="text-lg font-bold hidden sm:block" style={{ fontFamily: 'Poppins, sans-serif', color: '#ea00ea' }}>
                  Legendary Leads
                </span>
              </Link>
              {/* On child pages mobile: show page title next to back button */}
              {isChildPage && (
                <span className="md:hidden text-sm font-bold truncate max-w-[140px]" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>
                  {currentPageName.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              )}
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_GROUPS.map(group => (
                <NavGroup key={group.label} group={group} currentPageName={currentPageName} />
              ))}
            </nav>

            {/* Mobile burger */}
            <button
              className="md:hidden h-9 w-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: mobileMenuOpen ? 'rgba(234,0,234,0.2)' : 'rgba(255,255,255,0.06)', color: mobileMenuOpen ? '#ea00ea' : '#c3c3c3' }}
              onClick={() => setMobileMenuOpen(o => !o)}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen
                  ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="h-5 w-5" /></motion.span>
                  : <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="h-5 w-5" /></motion.span>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {mobileMenuOpen && <MobileMenu currentPageName={currentPageName} onClose={() => setMobileMenuOpen(false)} />}
      </AnimatePresence>

      {/* Page content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={currentPageName}
          className="page-content"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* Enhanced SynCloud Footer */}
      <AppFooter />

      {/* Mobile bottom tab bar */}
      <nav className="bottom-tab-bar safe-bottom fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{ background: 'rgba(8,14,24,0.97)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(234,0,234,0.15)' }}>
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {MOBILE_NAV.map(item => {
            const Icon = item.icon;
            // Optimistic: show active immediately on tap, before route resolves
            const active = optimisticTab ? optimisticTab === item.path : currentPageName === item.path;
            return (
              <Link
                key={item.path}
                to={createPageUrl(item.path)}
                replace={currentPageName === item.path} // don't push duplicate stack entry
                onClick={() => setOptimisticTab(item.path)}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors"
                style={{ color: active ? '#ea00ea' : '#5e6a78', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                <motion.div
                  className="h-7 w-7 rounded-lg flex items-center justify-center"
                  style={{ background: active ? 'rgba(234,0,234,0.18)' : 'transparent' }}
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Icon className="h-4 w-4" />
                </motion.div>
                <span className="text-[9px] font-semibold">{item.name}</span>
              </Link>
            );
          })}
          {/* More → opens mobile menu */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl"
            style={{ color: '#5e6a78', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center">
              <Menu className="h-4 w-4" />
            </div>
            <span className="text-[9px] font-semibold">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}