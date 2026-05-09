import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const PLACEHOLDER_DOCS = [
  { key: '{{lead.name}}', desc: 'Full name' },
  { key: '{{lead.username}}', desc: 'Instagram handle' },
  { key: '{{lead.category}}', desc: 'Niche / category' },
  { key: '{{lead.email}}', desc: 'Email address' },
  { key: '{{lead.followerCount}}', desc: 'Follower count' },
];

const TEMPLATE_LIBRARY = [
  {
    group: 'Cold Outreach',
    color: '#54b0e7',
    templates: [
      {
        name: 'First Touch – Email',
        channel: 'email',
        subject: 'Collab opportunity for {{lead.name}} 🚀',
        body: `Hi {{lead.name}},

I came across your profile in the {{lead.category}} space and was blown away by your content. With {{lead.followerCount}} followers, I think there's a real opportunity here.

I'd love to explore a collaboration — would you be open to a quick chat?

Best,
[Your Name]`,
      },
      {
        name: 'First Touch – DM/SMS',
        channel: 'sms',
        body: `Hey {{lead.name}}! Huge fan of your {{lead.category}} content. I have an exciting collab opportunity that would be perfect for your audience. Interested? 🔥`,
      },
    ]
  },
  {
    group: 'Follow-Up',
    color: '#f8d417',
    templates: [
      {
        name: 'Follow-Up #1 (3 days)',
        channel: 'email',
        subject: 'Following up — {{lead.name}}',
        body: `Hi {{lead.name}},

Just following up on my last message. I know you're busy creating amazing {{lead.category}} content, so I'll keep this short.

We've helped creators like you significantly grow their revenue. Would love 15 minutes of your time.

[Your Name]`,
      },
      {
        name: 'Re-Engagement SMS',
        channel: 'sms',
        body: `Hey {{lead.name}}, checking back in! Our offer for {{lead.category}} creators is still on the table. Let me know if you'd like details 📲`,
      },
    ]
  },
  {
    group: 'Conversion Push',
    color: '#2ecc71',
    templates: [
      {
        name: 'Final Offer',
        channel: 'email',
        subject: '⏰ Last chance — exclusive offer for {{lead.name}}',
        body: `Hi {{lead.name}},

I wanted to reach out one last time with an exclusive offer tailored specifically for {{lead.category}} creators at your level.

This offer expires soon. Reply to this email or call us to lock in your spot.

[Your Name]`,
      },
    ]
  },
  {
    group: 'At-Risk / Churn Recovery',
    color: '#e74c3c',
    templates: [
      {
        name: 'Win-Back Email',
        channel: 'email',
        subject: 'We miss you, {{lead.name}} 💔',
        body: `Hi {{lead.name}},

It's been a while since we connected! I know the {{lead.category}} space keeps you busy.

We've just launched some new features I think you'd love. Would you be open to reconnecting for 10 minutes?

[Your Name]`,
      },
      {
        name: 'Win-Back SMS',
        channel: 'sms',
        body: `Hey {{lead.name}}! We haven't chatted in a while. New opportunities for {{lead.category}} creators just opened up — interested? 👀`,
      },
    ]
  }
];

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard');
}

function TemplateCard({ template }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(10,25,41,0.6)', border: '1px solid #2a3a4a' }}>
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: template.channel === 'email' ? 'rgba(84,176,231,0.15)' : 'rgba(46,204,113,0.15)',
                     color: template.channel === 'email' ? '#54b0e7' : '#2ecc71' }}>
            {template.channel === 'email' ? '✉ Email' : '💬 SMS'}
          </span>
          <span className="text-sm font-medium" style={{ color: '#d7dde5' }}>{template.name}</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5" style={{ color: '#9ea7b5' }} /> : <ChevronDown className="h-3.5 w-3.5" style={{ color: '#9ea7b5' }} />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: '#1a2a3a' }}>
          {template.subject && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#9ea7b5' }}>Subject</span>
                <button onClick={() => copyToClipboard(template.subject)} style={{ color: '#9ea7b5' }}>
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs px-2 py-1.5 rounded" style={{ background: '#071a2c', color: '#d7dde5' }}>{template.subject}</p>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#9ea7b5' }}>Body</span>
              <button onClick={() => copyToClipboard(template.body)} style={{ color: '#9ea7b5' }}>
                <Copy className="h-3 w-3" />
              </button>
            </div>
            <pre className="text-xs px-2 py-1.5 rounded whitespace-pre-wrap font-sans" style={{ background: '#071a2c', color: '#d7dde5' }}>
              {template.body}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TemplateLibrary() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden mb-4" style={{ background: 'rgba(10,25,41,0.8)', border: '2px solid rgba(248,212,23,0.3)' }}>
      <button
        className="w-full flex items-center justify-between px-4 py-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: '#f8d417' }} />
          <span className="font-semibold text-sm" style={{ color: '#f8d417' }}>Template Library</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(248,212,23,0.15)', color: '#f8d417' }}>
            {TEMPLATE_LIBRARY.reduce((s, g) => s + g.templates.length, 0)} templates
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4" style={{ color: '#9ea7b5' }} /> : <ChevronDown className="h-4 w-4" style={{ color: '#9ea7b5' }} />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t space-y-4" style={{ borderColor: 'rgba(248,212,23,0.2)' }}>
          {/* Placeholder reference */}
          <div className="mt-3 flex flex-wrap gap-2">
            {PLACEHOLDER_DOCS.map(p => (
              <button
                key={p.key}
                onClick={() => copyToClipboard(p.key)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all hover:opacity-80"
                style={{ background: 'rgba(234,0,234,0.1)', color: '#ea00ea', border: '1px solid rgba(234,0,234,0.25)' }}
                title={p.desc}
              >
                <Copy className="h-2.5 w-2.5" />
                {p.key}
              </button>
            ))}
          </div>

          {TEMPLATE_LIBRARY.map(group => (
            <div key={group.group}>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: group.color }} />
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: group.color }}>{group.group}</span>
              </div>
              <div className="space-y-2">
                {group.templates.map(t => <TemplateCard key={t.name} template={t} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}