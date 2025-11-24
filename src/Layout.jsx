import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles, Upload, Database } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: 'Dashboard', icon: Sparkles },
    { name: 'Import', path: 'Import', icon: Upload },
    { name: 'All Leads', path: 'Leads', icon: Database }
  ];

  const isActive = (pageName) => {
    return currentPageName === pageName;
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a1929' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          color: #ffffff;
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
      `}</style>

      {/* Header */}
      <header className="border-b" style={{ borderColor: 'rgba(74, 203, 191, 0.2)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
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

            <nav className="flex items-center gap-1 sm:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all font-medium text-sm sm:text-base"
                    style={{
                      background: active ? '#54b0e7' : 'transparent',
                      color: active ? '#0a1929' : '#9ea7b5',
                      fontWeight: active ? 600 : 500
                    }}
                  >
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}