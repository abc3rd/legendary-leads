import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Compose mailto link as a simple contact method
    const mailto = `mailto:support@legendaryleads.app?subject=Message from ${encodeURIComponent(form.name)}&body=${encodeURIComponent(form.message)}%0A%0AReply to: ${encodeURIComponent(form.email)}`;
    window.open(mailto, '_blank');
    setSubmitted(true);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen p-6 sm:p-10" style={{ background: '#0a1929', color: '#fff' }}>
      <div className="max-w-2xl mx-auto">

        <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif', background: 'linear-gradient(135deg, #f8d417, #ea00ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Contact Us
        </h1>
        <p className="mb-8 text-base leading-relaxed" style={{ color: '#9ea7b5' }}>
          Have a question, feedback, or need support? Reach out — we'd love to hear from you.
        </p>

        {/* Direct contact methods */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <a href="mailto:support@legendaryleads.app"
            className="flex items-center gap-3 px-5 py-4 rounded-xl flex-1 transition-all hover:opacity-90"
            style={{ background: 'rgba(74,203,191,0.1)', border: '1.5px solid rgba(74,203,191,0.35)', color: '#4acbbf' }}>
            <Mail className="h-5 w-5 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#9ea7b5' }}>Email</div>
              <div className="text-sm font-semibold">support@legendaryleads.app</div>
            </div>
          </a>
          <a href="https://twitter.com/legendaryleads" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-4 rounded-xl flex-1 transition-all hover:opacity-90"
            style={{ background: 'rgba(234,0,234,0.1)', border: '1.5px solid rgba(234,0,234,0.35)', color: '#ea00ea' }}>
            <MessageSquare className="h-5 w-5 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#9ea7b5' }}>Social</div>
              <div className="text-sm font-semibold">@legendaryleads</div>
            </div>
          </a>
        </div>

        {/* Contact form */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(234,0,234,0.2)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>Send a Message</h2>

          {submitted ? (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <CheckCircle2 className="h-10 w-10" style={{ color: '#2ecc71' }} />
              <p className="font-semibold" style={{ color: '#fff' }}>Your email client has opened!</p>
              <p className="text-sm" style={{ color: '#9ea7b5' }}>Send the email to complete your message.</p>
              <button onClick={() => setSubmitted(false)} className="text-xs mt-2" style={{ color: '#4acbbf' }}>Send another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs block mb-1 font-semibold" style={{ color: '#9ea7b5' }}>Your Name</label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} required
                  placeholder="Jane Smith"
                  style={{ background: '#071a2c', borderColor: 'rgba(74,203,191,0.3)', color: '#fff' }} />
              </div>
              <div>
                <label className="text-xs block mb-1 font-semibold" style={{ color: '#9ea7b5' }}>Your Email</label>
                <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                  placeholder="you@example.com"
                  style={{ background: '#071a2c', borderColor: 'rgba(74,203,191,0.3)', color: '#fff' }} />
              </div>
              <div>
                <label className="text-xs block mb-1 font-semibold" style={{ color: '#9ea7b5' }}>Message</label>
                <textarea value={form.message} onChange={e => set('message', e.target.value)} required rows={5}
                  placeholder="Tell us how we can help..."
                  className="w-full rounded-md px-3 py-2 text-sm resize-none focus:outline-none"
                  style={{ background: '#071a2c', border: '1px solid rgba(74,203,191,0.3)', color: '#fff' }} />
              </div>
              <Button type="submit" className="w-full font-semibold"
                style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)', color: '#fff' }}>
                <Send className="h-4 w-4 mr-2" /> Send Message
              </Button>
            </form>
          )}
        </div>

        <div className="mt-8">
          <Link to={createPageUrl('About')} className="text-sm" style={{ color: '#4acbbf' }}>
            ← Learn more about Legendary Leads
          </Link>
        </div>
      </div>
    </div>
  );
}