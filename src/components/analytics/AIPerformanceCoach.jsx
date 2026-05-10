import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Brain, Loader2, RefreshCw, TrendingDown, MessageSquare, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AIPerformanceCoach({ leads, logs, sequences, notes }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  const runAnalysis = async () => {
    setLoading(true);
    setAnalysis(null);

    // Build a compact context summary
    const totalLeads = leads.length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const convRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0;

    // Sequence performance summary
    const seqPerf = {};
    logs.forEach(log => {
      if (!seqPerf[log.sequence_name]) seqPerf[log.sequence_name] = { sent: 0, failed: 0 };
      if (log.status === 'sent') seqPerf[log.sequence_name].sent++;
      if (log.status === 'failed') seqPerf[log.sequence_name].failed++;
    });

    const underperforming = Object.entries(seqPerf)
      .filter(([, v]) => v.failed > v.sent * 0.3)
      .map(([name, v]) => `${name} (${v.failed} failures / ${v.sent + v.failed} total)`);

    // Recent inbox notes for context
    const recentNotes = notes.slice(0, 20).map(n => ({
      type: n.activity_type,
      body: n.body?.slice(0, 100),
      date: n.created_date,
    }));

    // Status distribution
    const statusDist = {};
    leads.forEach(l => { statusDist[l.status || 'new'] = (statusDist[l.status || 'new'] || 0) + 1; });

    const prompt = `You are an expert CRM performance coach for a social media lead generation platform called Legendary Leads.

Analyze this CRM performance data and provide 3-5 actionable coaching insights:

**Lead Overview:**
- Total leads: ${totalLeads}
- Conversion rate: ${convRate}%
- Status breakdown: ${JSON.stringify(statusDist)}

**Underperforming sequences (high failure rate):**
${underperforming.length > 0 ? underperforming.join('\n') : 'None identified'}

**Sequence activity summary:**
${JSON.stringify(seqPerf).slice(0, 500)}

**Recent interaction samples from Universal Inbox:**
${JSON.stringify(recentNotes).slice(0, 800)}

Please provide:
1. **Script Suggestions** - 2-3 improved follow-up script ideas based on the interaction patterns
2. **Underperforming Sequences** - Which sequences need fixing and why, with specific recommendations
3. **Timing Insights** - Best outreach timing based on the data
4. **Quick Wins** - 2-3 immediate actions that could boost conversions

Format each section with a clear header. Be specific, actionable, and concise.`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAnalysis(res);
    setLoading(false);
  };

  const sections = analysis ? analysis.split(/\n(?=\d\.|##|\*\*)/).filter(s => s.trim()) : [];

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(167,139,250,0.3)' }}>
      {/* Header */}
      <div className="p-5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: '1px solid rgba(167,139,250,0.15)', background: 'rgba(167,139,250,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #ea00ea)', boxShadow: '0 0 16px rgba(167,139,250,0.4)' }}>
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold" style={{ color: '#a78bfa', fontFamily: 'Poppins, sans-serif' }}>AI Performance Coach</h3>
            <p className="text-xs" style={{ color: '#9ea7b5' }}>Analyzes inbox history + workflow logs to suggest improvements</p>
          </div>
        </div>
        <Button onClick={runAnalysis} disabled={loading}
          style={{ background: loading ? 'rgba(167,139,250,0.3)' : 'linear-gradient(135deg, #a78bfa, #ea00ea)', color: '#fff', flexShrink: 0 }}>
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyzing…</>
            : <><Brain className="h-4 w-4 mr-2" />Run Analysis</>
          }
        </Button>
      </div>

      {/* Body */}
      <div className="p-5">
        {!analysis && !loading && (
          <div className="text-center py-10">
            <div className="flex justify-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>
                <MessageSquare className="h-3.5 w-3.5" /> Universal Inbox history
              </div>
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(234,0,234,0.1)', color: '#ea00ea', border: '1px solid rgba(234,0,234,0.2)' }}>
                <Zap className="h-3.5 w-3.5" /> Workflow Engine logs
              </div>
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(74,203,191,0.1)', color: '#4acbbf', border: '1px solid rgba(74,203,191,0.2)' }}>
                <TrendingDown className="h-3.5 w-3.5" /> Underperforming sequences
              </div>
            </div>
            <p className="text-sm" style={{ color: '#9ea7b5' }}>Click "Run Analysis" to get AI-powered coaching insights</p>
            <p className="text-xs mt-1" style={{ color: '#5e6a78' }}>Analyzes {leads.length} leads, {logs.length} logs, and {notes.length} interactions</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" style={{ color: '#a78bfa' }} />
            <p className="text-sm" style={{ color: '#a78bfa' }}>Analyzing CRM performance data…</p>
            <p className="text-xs mt-1" style={{ color: '#5e6a78' }}>This may take 10-20 seconds</p>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: '#a78bfa' }}>Analysis complete</span>
              <button onClick={runAnalysis} className="flex items-center gap-1.5 text-xs" style={{ color: '#9ea7b5' }}>
                <RefreshCw className="h-3 w-3" /> Re-run
              </button>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)' }}>
              <ReactMarkdown
                className="text-sm prose prose-invert prose-sm max-w-none"
                components={{
                  h2: ({ children }) => <h2 className="text-base font-bold mt-4 mb-2" style={{ color: '#a78bfa' }}>{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mt-3 mb-1" style={{ color: '#f8d417' }}>{children}</h3>,
                  strong: ({ children }) => <strong style={{ color: '#4acbbf' }}>{children}</strong>,
                  p: ({ children }) => <p className="my-1.5 leading-relaxed" style={{ color: '#d7dde5' }}>{children}</p>,
                  ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
                  li: ({ children }) => <li style={{ color: '#c3c3c3' }}>{children}</li>,
                  ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
                }}
              >
                {analysis}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}