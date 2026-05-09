import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Database, Zap, Users, BarChart2, Shield, Mail } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen p-6 sm:p-10" style={{ background: '#0a1929', color: '#fff' }}>
      <div className="max-w-3xl mx-auto">

        <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ fontFamily: 'Poppins, sans-serif', background: 'linear-gradient(135deg, #f8d417, #4acbbf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          About Legendary Leads
        </h1>

        <p className="text-lg mb-6 leading-relaxed" style={{ color: '#d7dde5' }}>
          <strong style={{ color: '#4acbbf' }}>Legendary Leads</strong> is an AI-powered CRM and lead generation platform built for modern sales teams, digital marketers, influencer outreach specialists, and growth-focused entrepreneurs. Whether you are managing hundreds of Instagram influencer profiles, running email and SMS follow-up campaigns, or orchestrating complex sales workflows, Legendary Leads gives you a single command center to do it all — intelligently and at scale.
        </p>

        <p className="text-base mb-6 leading-relaxed" style={{ color: '#9ea7b5' }}>
          At its core, Legendary Leads is built around <strong style={{ color: '#f8d417' }}>GLYTCH</strong>, an advanced AI butler that understands natural language. Ask GLYTCH to find fitness coaches with over 10,000 followers, surface leads with email addresses in a specific area code, or identify your highest-scoring unresponsive prospects — and it delivers results instantly, without needing complex filters or SQL queries.
        </p>

        <p className="text-base mb-6 leading-relaxed" style={{ color: '#9ea7b5' }}>
          The platform includes a powerful <strong style={{ color: '#ea00ea' }}>LegenDatabase</strong> module — a unified search hub for leads, PLR content, ebooks, and original articles — all searchable with AI precision. On top of that, the <strong style={{ color: '#4acbbf' }}>Workflow Engine</strong> automates your outreach by triggering follow-up sequences, auto-assigning team members, and tagging leads the moment key status changes or score thresholds are met.
        </p>

        <p className="text-base mb-8 leading-relaxed" style={{ color: '#9ea7b5' }}>
          Legendary Leads is designed for teams that move fast. With round-robin lead assignment, team collaboration tools, real-time activity feeds, voice outreach support, and deep analytics, every member of your team stays aligned and every lead gets the attention it deserves. The platform was built by developers passionate about combining beautiful design with enterprise-grade functionality — making powerful CRM tools accessible to businesses of every size.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Database, label: 'Lead Management', color: '#4acbbf' },
            { icon: Zap, label: 'AI Outreach', color: '#f8d417' },
            { icon: Users, label: 'Team Collaboration', color: '#ea00ea' },
            { icon: BarChart2, label: 'Deep Analytics', color: '#54b0e7' },
            { icon: Shield, label: 'Workflow Automation', color: '#f66c25' },
            { icon: Mail, label: 'Email & SMS', color: '#2ecc71' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="rounded-xl p-4 flex flex-col items-center gap-2 text-center"
              style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
              <Icon className="h-6 w-6" style={{ color }} />
              <span className="text-xs font-semibold" style={{ color: '#d7dde5' }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <Link to={createPageUrl('Contact')}
            className="px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)', color: '#fff' }}>
            Contact Us
          </Link>
          <Link to={createPageUrl('Dashboard')}
            className="px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#d7dde5', border: '1px solid rgba(255,255,255,0.15)' }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}