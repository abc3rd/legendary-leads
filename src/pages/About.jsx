import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles, Database, Zap, Users, BarChart2, GitBranch, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function About() {
  return (
    <div className="min-h-screen p-6 sm:p-10" style={{ background: '#0a1929' }}>
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)' }}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>
              About Legendary Leads
            </h1>
            <p className="text-xs" style={{ color: '#9ea7b5' }}>AI-powered lead generation & outreach platform</p>
          </div>
        </div>

        <div className="rounded-2xl p-6 sm:p-8 mb-6 space-y-4"
          style={{ background: 'linear-gradient(135deg, #0a1929, #13202e)', border: '1.5px solid rgba(234,0,234,0.2)' }}>
          <p className="text-base leading-relaxed" style={{ color: '#d7dde5' }}>
            <strong style={{ color: '#f8d417' }}>Legendary Leads</strong> is an AI-powered CRM and lead generation platform built for
            social media marketers, agency owners, and sales teams who need a smarter way to find, score, and convert
            high-quality leads from Instagram, TikTok, and other social platforms.
          </p>
          <p className="text-base leading-relaxed" style={{ color: '#d7dde5' }}>
            At its core, Legendary Leads features <strong style={{ color: '#4acbbf' }}>GLYTCH</strong> — an AI butler that lets you
            search and filter your entire lead database using plain English. Simply ask for "fitness coaches with over 10k
            followers who have an email address," and GLYTCH delivers results instantly, no complex filters required.
          </p>
          <p className="text-base leading-relaxed" style={{ color: '#d7dde5' }}>
            The platform includes a full <strong style={{ color: '#4acbbf' }}>LegenDatabase</strong> for storing and querying imported
            leads and PLR content, automated <strong style={{ color: '#f8d417' }}>Follow-Up Sequences</strong> via email and SMS,
            a visual <strong style={{ color: '#f8d417' }}>Workflow Engine</strong> for trigger-based automations, AI-powered
            lead scoring and sentiment analysis, a team collaboration dashboard with round-robin assignment, and
            a built-in analytics suite with Google Analytics 4 integration.
          </p>
          <p className="text-base leading-relaxed" style={{ color: '#d7dde5' }}>
            Legendary Leads is built and maintained by <strong style={{ color: '#ea00ea' }}>Omega UI, LLC</strong> — the creators of
            SynCloud Connect and the Universal Command Protocol (UCP). Our mission is to help businesses reclaim AI
            operational costs and build deterministic, zero-waste intelligence pipelines. Whether you are a solo
            entrepreneur or scaling an agency, Legendary Leads gives you the infrastructure to grow smarter.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { Icon: Database, label: 'Lead Database', color: '#ea00ea' },
            { Icon: Sparkles, label: 'GLYTCH AI Butler', color: '#4acbbf' },
            { Icon: Zap, label: 'Outreach Sequences', color: '#f8d417' },
            { Icon: GitBranch, label: 'Workflow Engine', color: '#54b0e7' },
            { Icon: BarChart2, label: 'Analytics & Insights', color: '#f66c25' },
            { Icon: Users, label: 'Team Collaboration', color: '#a78bfa' },
          ].map(({ Icon, label, color }) => (
            <div key={label} className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
              <Icon className="h-5 w-5 flex-shrink-0" style={{ color: color }} />
              <span className="text-xs font-semibold" style={{ color: '#d7dde5' }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link to={createPageUrl('Dashboard')}>
            <Button style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)', color: '#fff' }}>
              Get Started
            </Button>
          </Link>
          <Link to={createPageUrl('Contact')}>
            <Button variant="ghost" style={{ color: '#9ea7b5', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Mail className="h-4 w-4 mr-1.5" /> Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}