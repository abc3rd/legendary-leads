import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Table, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

function exportLeadsCSV(leads, logs) {
  const headers = ['username', 'name', 'bio', 'category', 'website', 'followerCount', 'followingCount', 'email', 'phone', 'tag', 'status', 'assigned_to', 'lead_grade', 'lead_score', 'sentiment', 'created_date'];
  const rows = leads.map(l => headers.map(h => `"${(l[h] ?? '').toString().replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  downloadFile(csv, 'leads-report.csv', 'text/csv');
}

function exportLogsCSV(logs) {
  const headers = ['lead_id', 'lead_username', 'sequence_name', 'channel', 'status', 'subject', 'created_date'];
  const rows = logs.map(l => headers.map(h => `"${(l[h] ?? '').toString().replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  downloadFile(csv, 'system-logs.csv', 'text/csv');
}

function exportLeadsPDF(leads) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(13, 13, 26);
  doc.rect(0, 0, pageW, 40, 'F');
  doc.setTextColor(234, 0, 234);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Legendary Leads', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(158, 167, 181);
  doc.text(`Lead Report  •  ${new Date().toLocaleDateString()}  •  ${leads.length} leads`, 14, 30);

  // Summary KPIs
  const statusCounts = {};
  leads.forEach(l => { statusCounts[l.status] = (statusCounts[l.status] || 0) + 1; });
  const converted = statusCounts['converted'] || 0;
  const convRate = leads.length ? ((converted / leads.length) * 100).toFixed(1) : 0;

  doc.setFillColor(10, 25, 41);
  doc.rect(0, 44, pageW, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const kpis = [
    ['Total Leads', leads.length],
    ['Converted', converted],
    ['Conv. Rate', `${convRate}%`],
    ['With Email', leads.filter(l => l.email).length],
    ['With Phone', leads.filter(l => l.phone).length],
    ['A-Grade', leads.filter(l => l.lead_grade === 'A').length],
  ];
  kpis.forEach(([label, val], i) => {
    const x = 14 + i * 32;
    doc.setTextColor(74, 203, 191);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(val), x, 62);
    doc.setTextColor(158, 167, 181);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x, 70);
  });

  // Table header
  let y = 90;
  doc.setFillColor(26, 35, 50);
  doc.rect(0, y - 6, pageW, 10, 'F');
  doc.setTextColor(234, 0, 234);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const cols = ['Name', 'Username', 'Category', 'Status', 'Grade', 'Followers', 'Email'];
  const colX = [14, 52, 88, 122, 148, 161, 178];
  cols.forEach((c, i) => doc.text(c, colX[i], y));
  y += 8;

  doc.setFont('helvetica', 'normal');
  leads.slice(0, 50).forEach((lead, idx) => {
    if (y > 270) { doc.addPage(); y = 20; }
    if (idx % 2 === 0) {
      doc.setFillColor(10, 25, 41);
      doc.rect(0, y - 5, pageW, 8, 'F');
    }
    doc.setTextColor(215, 221, 229);
    doc.setFontSize(7.5);
    const row = [
      (lead.name || '').slice(0, 18),
      `@${(lead.username || '').slice(0, 16)}`,
      (lead.category || '—').slice(0, 14),
      (lead.status || '').replace(/_/g, ' '),
      lead.lead_grade || '—',
      lead.followerCount ? (lead.followerCount >= 1000 ? `${(lead.followerCount / 1000).toFixed(1)}K` : String(lead.followerCount)) : '—',
      lead.email ? '✓' : '—',
    ];
    row.forEach((val, i) => doc.text(val, colX[i], y));
    y += 8;
  });

  if (leads.length > 50) {
    doc.setTextColor(158, 167, 181);
    doc.setFontSize(8);
    doc.text(`... and ${leads.length - 50} more leads (export CSV for full list)`, 14, y + 6);
  }

  doc.save('leads-report.pdf');
}

function exportSummaryPDF(leads, logs) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(13, 13, 26);
  doc.rect(0, 0, pageW, 36, 'F');
  doc.setTextColor(234, 0, 234);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Analytics Summary Report', 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(158, 167, 181);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 28);

  let y = 48;
  const section = (title, color = [74, 203, 191]) => {
    doc.setFillColor(...color, 0.1);
    doc.setDrawColor(...color);
    doc.setTextColor(...color);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, y);
    doc.line(14, y + 2, pageW - 14, y + 2);
    y += 12;
  };
  const row = (label, value) => {
    doc.setTextColor(215, 221, 229);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 14, y);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), 120, y);
    y += 8;
  };

  // Lead stats
  section('Lead Performance', [74, 203, 191]);
  const statuses = ['new', 'cold_outreach', 'contacted', 'qualified', 'in_negotiation', 'converted', 'unresponsive'];
  row('Total Leads', leads.length);
  statuses.forEach(s => row(s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), leads.filter(l => l.status === s).length));
  y += 4;

  section('Lead Quality', [84, 176, 231]);
  ['A', 'B', 'C', 'D', 'F'].forEach(g => row(`Grade ${g}`, leads.filter(l => l.lead_grade === g).length));
  row('With Email', leads.filter(l => l.email).length);
  row('With Phone', leads.filter(l => l.phone).length);
  row('With Website', leads.filter(l => l.website).length);
  y += 4;

  section('Follow-Up Activity', [234, 0, 234]);
  row('Total Messages Sent', logs.length);
  row('Email Sent', logs.filter(l => l.channel === 'email' && l.status === 'sent').length);
  row('SMS Sent', logs.filter(l => l.channel === 'sms' && l.status === 'sent').length);
  row('Failed', logs.filter(l => l.status === 'failed').length);

  doc.save('analytics-summary.pdf');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const EXPORTS = [
  { id: 'leads_csv', label: 'Leads — CSV', desc: 'All lead records with contact & score data', icon: Table, color: '#4acbbf', format: 'CSV' },
  { id: 'logs_csv', label: 'System Logs — CSV', desc: 'Full follow-up activity log export', icon: Table, color: '#54b0e7', format: 'CSV' },
  { id: 'leads_pdf', label: 'Leads Report — PDF', desc: 'Formatted report (top 50 leads)', icon: FileText, color: '#f8d417', format: 'PDF' },
  { id: 'summary_pdf', label: 'Analytics Summary — PDF', desc: 'KPIs, funnel & follow-up stats', icon: FileText, color: '#ea00ea', format: 'PDF' },
];

export default function ExportPanel({ leads = [], logs = [] }) {
  const [loading, setLoading] = useState('');
  const [done, setDone] = useState('');

  const handleExport = async (id) => {
    setLoading(id);
    setDone('');
    await new Promise(r => setTimeout(r, 200));
    if (id === 'leads_csv') exportLeadsCSV(leads, logs);
    else if (id === 'logs_csv') exportLogsCSV(logs);
    else if (id === 'leads_pdf') exportLeadsPDF(leads);
    else if (id === 'summary_pdf') exportSummaryPDF(leads, logs);
    toast.success('Export downloaded!');
    setLoading('');
    setDone(id);
    setTimeout(() => setDone(''), 3000);
  };

  return (
    <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(234,0,234,0.2)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Download className="h-4 w-4" style={{ color: '#ea00ea' }} />
        <h2 className="text-sm font-bold" style={{ color: '#ea00ea' }}>Export Reports</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EXPORTS.map(ex => {
          const Icon = ex.icon;
          const isLoading = loading === ex.id;
          const isDone = done === ex.id;
          return (
            <button key={ex.id} onClick={() => handleExport(ex.id)} disabled={!!loading}
              className="flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:opacity-90 active:scale-95"
              style={{ background: `${ex.color}10`, border: `1px solid ${ex.color}30` }}>
              <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${ex.color}20` }}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: ex.color }} />
                  : isDone ? <CheckCircle2 className="h-4 w-4" style={{ color: '#2ecc71' }} />
                  : <Icon className="h-4 w-4" style={{ color: ex.color }} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: '#fff' }}>{ex.label}</p>
                <p className="text-[10px]" style={{ color: '#5e6a78' }}>{ex.desc}</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold ml-auto flex-shrink-0"
                style={{ background: `${ex.color}20`, color: ex.color }}>{ex.format}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}