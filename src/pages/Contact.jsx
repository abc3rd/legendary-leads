import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Mail, Globe, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Legendary Leads Inquiry from ${form.name}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:support@syncloudconnect.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="min-h-screen p-6 sm:p-10" style={{ background: '#0a1929' }}>
      <div className="max-w-lg mx-auto">
        <Link to={createPageUrl('About')}>
          <Button variant="ghost" className="mb-6" style={{ color: '#9ea7b5' }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to About
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>
          Contact Us
        </h1>
        <p className="text-sm mb-6" style={{ color: '#9ea7b5' }}>
          Have a question about Legendary Leads or Omega UI? We'd love to hear from you.
        </p>

        {/* Direct contact methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <a href="mailto:support@syncloudconnect.com"
            className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-105"
            style={{ background: 'rgba(84,176,231,0.1)', border: '1px solid rgba(84,176,231,0.3)' }}>
            <Mail className="h-5 w-5 flex-shrink-0" style={{ color: '#54b0e7' }} />
            <div>
              <p className="text-xs font-bold" style={{ color: '#54b0e7' }}>Email Support</p>
              <p className="text-[10px]" style={{ color: '#9ea7b5' }}>support@syncloudconnect.com</p>
            </div>
          </a>
          <a href="https://syncloudconnect.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-105"
            style={{ background: 'rgba(234,0,234,0.1)', border: '1px solid rgba(234,0,234,0.3)' }}>
            <Globe className="h-5 w-5 flex-shrink-0" style={{ color: '#ea00ea' }} />
            <div>
              <p className="text-xs font-bold" style={{ color: '#ea00ea' }}>Website</p>
              <p className="text-[10px]" style={{ color: '#9ea7b5' }}>syncloudconnect.com</p>
            </div>
          </a>
        </div>

        {/* Contact form */}
        <div className="rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, #0a1929, #13202e)', border: '1.5px solid rgba(74,203,191,0.25)' }}>
          <h2 className="text-base font-bold mb-4" style={{ color: '#4acbbf' }}>Send a Message</h2>

          {sent ? (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <CheckCircle2 className="h-10 w-10" style={{ color: '#2ecc71' }} />
              <p className="font-semibold" style={{ color: '#fff' }}>Opening your email client…</p>
              <p className="text-sm" style={{ color: '#9ea7b5' }}>If it didn't open, email us directly at support@syncloudconnect.com</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Your Name</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith" required
                  style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Your Email</label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jane@company.com" required
                  style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Message</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us how we can help…" required rows={4}
                  className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
                  style={{ background: '#071a2c', border: '1px solid #2a3a4a', color: '#fff' }} />
              </div>
              <Button type="submit" className="w-full font-semibold"
                style={{ background: 'linear-gradient(135deg, #4acbbf, #54b0e7)', color: '#0a1929' }}>
                <Send className="h-4 w-4 mr-2" /> Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}