import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ExternalLink, Shield, FileText, QrCode, Cloud, Zap, BookOpen, Database } from 'lucide-react';

const EBOOK_IMG = 'https://media.base44.com/images/public/691ccbe8057765b3fc1fdb65/00f517447_4A7E047C-45C6-4C7E-AD9D-35AAE21425CA.png';
const SYNCLOUD_LOGO = 'https://media.base44.com/images/public/691ccbe8057765b3fc1fdb65/adfa1dae6_3FD59A24-FD4D-4C3A-BC40-C598CFA7D699.png';

const ECOSYSTEM_LINKS = [
  {
    category: 'SynCloud Ecosystem',
    color: '#ea00ea',
    links: [
      { label: 'SynCloud Connect', url: 'https://syncloudconnect.com', icon: Cloud },
      { label: 'Info / Ebook Hub', url: 'https://syncloudconnect.com/info', icon: BookOpen },
      { label: 'PPC Dashboard', url: 'https://ppc.syncloudconnect.com', icon: Zap },
    ],
  },
  {
    category: 'Tools & Apps',
    color: '#4acbbf',
    links: [
      { label: 'LegenDatabase', url: '#', internal: 'LegenDatabase', icon: Database },
      { label: 'Cloud-QR Generator', url: 'https://syncloudconnect.com/info', icon: QrCode },
      { label: 'SynD Protocol', url: 'https://syncloudconnect.com', icon: Cloud },
      { label: 'Tokenization Demo', url: 'https://syncloudconnect.com', icon: Zap },
    ],
  },
  {
    category: 'Legal',
    color: '#54b0e7',
    links: [
      { label: 'Terms & Conditions', url: 'https://syncloudconnect.com', icon: FileText },
      { label: 'Privacy Policy', url: 'https://syncloudconnect.com', icon: Shield },
      { label: 'Cookie Policy', url: 'https://syncloudconnect.com', icon: Shield },
    ],
  },
  {
    category: 'Base44 Apps',
    color: '#f8d417',
    links: [
      { label: 'Legendary Leads CRM', url: '#', internal: 'Dashboard', icon: Zap },
      { label: 'Universal Inbox', url: '#', internal: 'UniversalInbox', icon: Database },
      { label: 'Analytics Hub', url: '#', internal: 'Analytics', icon: Zap },
      { label: 'Workflow Engine', url: '#', internal: 'WorkflowEngine', icon: Zap },
    ],
  },
];

export default function AppFooter() {
  return (
    <footer className="hidden md:block w-full mt-8"
      style={{
        background: 'linear-gradient(180deg, #05090f 0%, #080d16 100%)',
        borderTop: '1px solid rgba(234,0,234,0.25)',
      }}>

      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #ea00ea, #4acbbf, #f8d417, #54b0e7, #ea00ea)' }} />

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">

          {/* Brand + Ebook Column */}
          <div className="md:col-span-1 flex flex-col gap-5">
            {/* SynCloud logo + brand */}
            <div className="flex items-center gap-2.5">
              <img src={SYNCLOUD_LOGO} alt="SynCloud Connect" className="h-9 w-9 object-contain" />
              <div>
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>
                  Omega UI, LLC
                </p>
                <p className="text-[9px] tracking-widest uppercase" style={{ color: '#5e6a78' }}>SynCloud Connect</p>
              </div>
            </div>

            <p className="text-[10px] leading-relaxed" style={{ color: '#5e6a78' }}>
              Interpret Once. Execute Infinitely.
              <br />Universal Command Protocol (UCP) — zero-waste AI infrastructure.
            </p>

            {/* Ebook clickable */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#f8d417' }}>
                📖 Free Ebook
              </p>
              <a href="https://syncloudconnect.com/info" target="_blank" rel="noopener noreferrer"
                className="block group transition-all">
                <div className="relative overflow-hidden rounded-lg"
                  style={{ border: '1.5px solid rgba(234,0,234,0.35)', boxShadow: '0 4px 20px rgba(234,0,234,0.2)' }}>
                  <img
                    src={EBOOK_IMG}
                    alt="Google's Glitch - Free Ebook"
                    className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    style={{ maxHeight: '160px', objectPosition: 'top' }}
                  />
                  <div className="absolute inset-0 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(0deg, rgba(234,0,234,0.7) 0%, transparent 100%)' }}>
                    <div className="flex items-center gap-1 text-white text-[10px] font-bold">
                      <ExternalLink className="h-3 w-3" /> Read Free
                    </div>
                  </div>
                </div>
                <p className="text-[9px] mt-1.5 font-semibold text-center" style={{ color: '#4acbbf' }}>
                  Google's Glitch — Get the Ebook →
                </p>
              </a>
            </div>
          </div>

          {/* Links columns */}
          {ECOSYSTEM_LINKS.map(section => (
            <div key={section.category} className="md:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: section.color }}>
                {section.category}
              </p>
              <ul className="space-y-2">
                {section.links.map(link => {
                  const Icon = link.icon;
                  if (link.internal) {
                    return (
                      <li key={link.label}>
                        <Link to={createPageUrl(link.internal)}
                          className="flex items-center gap-2 text-xs transition-all hover:translate-x-0.5"
                          style={{ color: '#9ea7b5' }}
                          onMouseEnter={e => e.currentTarget.style.color = section.color}
                          onMouseLeave={e => e.currentTarget.style.color = '#9ea7b5'}>
                          <Icon className="h-3 w-3 flex-shrink-0" style={{ color: section.color, opacity: 0.6 }} />
                          {link.label}
                        </Link>
                      </li>
                    );
                  }
                  return (
                    <li key={link.label}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs transition-all hover:translate-x-0.5 group"
                        style={{ color: '#9ea7b5' }}
                        onMouseEnter={e => e.currentTarget.style.color = section.color}
                        onMouseLeave={e => e.currentTarget.style.color = '#9ea7b5'}>
                        <Icon className="h-3 w-3 flex-shrink-0" style={{ color: section.color, opacity: 0.6 }} />
                        {link.label}
                        <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity ml-auto" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <img src={SYNCLOUD_LOGO} alt="Omega UI" className="h-5 w-5 object-contain opacity-60" />
            <p className="text-[10px]" style={{ color: '#3a4a5a' }}>
              © {new Date().getFullYear()} Omega UI, LLC · All rights reserved · Patent Pending
            </p>
          </div>

          <div className="flex items-center gap-4">
            {[
              { label: 'syncloudconnect.com', url: 'https://syncloudconnect.com' },
              { label: 'ppc.syncloudconnect.com', url: 'https://ppc.syncloudconnect.com' },
              { label: 'syncloudconnect.com/info', url: 'https://syncloudconnect.com/info' },
            ].map(l => (
              <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                className="text-[9px] tracking-wide transition-colors"
                style={{ color: '#3a4a5a' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ea00ea'}
                onMouseLeave={e => e.currentTarget.style.color = '#3a4a5a'}>
                {l.label}
              </a>
            ))}
          </div>

          {/* UCP badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: 'rgba(234,0,234,0.08)', border: '1px solid rgba(234,0,234,0.2)' }}>
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#ea00ea' }} />
            <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#ea00ea' }}>
              UCP 2.0 · Zero Token Bleed
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}