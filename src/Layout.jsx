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
    <div className="min-h-screen" style={{ background: '#020813' }}>
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
          --primary-navy: #071a2c;
          --steel-light: #d7dde5;
          --steel-dark: #5e6a78;
          --accent-blue: #1f6fc5;
          --accent-green: #26c485;
          --error-red: #c0392b;
          --background: #020813;
          --text-primary: #ffffff;
          --text-muted: #9ea7b5;
        }
      `}</style>

      {/* Header */}
      <header className="border-b" style={{ borderColor: '#071a2c' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
              <img 
                src="https://storage.googleapis.com/msgsndr/y4ABqxnk279eDc0f5DqY/media/691cfff141c501118d8faf6e.png" 
                alt="Legendary Leads"
                className="h-10 w-10 rounded-lg object-cover"
              />
              <span className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: '#ffffff' }}>
                Legendary Leads
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium"
                    style={{
                      background: active ? '#1f6fc5' : 'transparent',
                      color: active ? '#ffffff' : '#9ea7b5',
                      fontWeight: 500
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

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}