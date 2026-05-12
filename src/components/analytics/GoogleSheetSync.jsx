import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table2, Loader2, CheckCircle2, ExternalLink, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleSheetSync({ leads }) {
  const [spreadsheetId, setSpreadsheetId] = useState(() => localStorage.getItem('ll_sheet_id') || '');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(() => localStorage.getItem('ll_sheet_last_sync') || null);
  const [syncResult, setSyncResult] = useState(null);

  const saveSheetId = (val) => {
    setSpreadsheetId(val);
    localStorage.setItem('ll_sheet_id', val);
  };

  const runSync = async () => {
    if (!spreadsheetId.trim()) {
      toast.error('Please enter your Google Sheet ID');
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    const res = await base44.functions.invoke('syncLeadsToSheet', {
      spreadsheetId: spreadsheetId.trim(),
    });
    const data = res.data;
    if (data.success) {
      const now = new Date().toLocaleString();
      setLastSync(now);
      localStorage.setItem('ll_sheet_last_sync', now);
      setSyncResult({ success: true, updated: data.updated, total: data.total });
      toast.success(`Synced ${data.updated} lead status updates to Google Sheets!`);
    } else {
      setSyncResult({ success: false, error: data.error });
      toast.error(data.error || 'Sync failed');
    }
    setSyncing(false);
  };

  const extractIdFromUrl = (input) => {
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) saveSheetId(match[1]);
    else saveSheetId(input);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(46,204,113,0.25)' }}>
      {/* Header */}
      <div className="p-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(46,204,113,0.15)', background: 'rgba(46,204,113,0.04)' }}>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2ecc71, #4acbbf)', boxShadow: '0 0 14px rgba(46,204,113,0.35)' }}>
          <Table2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold" style={{ color: '#2ecc71', fontFamily: 'Poppins, sans-serif' }}>Google Sheets Live Sync</h3>
          <p className="text-xs" style={{ color: '#9ea7b5' }}>Real-time lead status reporting dashboard</p>
        </div>
        {lastSync && (
          <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: '#5e6a78' }}>
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#2ecc71' }} />
            Last sync: {lastSync}
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Info */}
        <div className="rounded-lg p-3 flex gap-2.5" style={{ background: 'rgba(84,176,231,0.07)', border: '1px solid rgba(84,176,231,0.2)' }}>
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#54b0e7' }} />
          <div className="text-xs" style={{ color: '#9ea7b5' }}>
            <p>Paste your Google Sheets URL or ID below. The sync will write a <strong style={{ color: '#54b0e7' }}>Lead Status Report</strong> sheet with username, name, status, lead score, grade, assigned to, and last updated columns.</p>
            <p className="mt-1">Make sure you have shared the sheet with your Google account used to authorize this app.</p>
          </div>
        </div>

        {/* Sheet ID input */}
        <div>
          <label className="text-xs block mb-1.5" style={{ color: '#9ea7b5' }}>Google Sheet URL or ID</label>
          <div className="flex gap-2">
            <Input
              value={spreadsheetId}
              onChange={e => extractIdFromUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/... or just the ID"
              style={{ background: '#071a2c', borderColor: 'rgba(46,204,113,0.3)', color: '#fff' }}
              className="flex-1 text-sm placeholder:text-gray-600"
            />
            {spreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                style={{ background: 'rgba(46,204,113,0.15)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.3)' }}>
                <ExternalLink className="h-3.5 w-3.5" /> Open
              </a>
            )}
          </div>
        </div>

        {/* Stats & actions */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xl font-bold" style={{ color: '#2ecc71' }}>{leads.length}</div>
            <div className="text-[10px]" style={{ color: '#9ea7b5' }}>Total Leads</div>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xl font-bold" style={{ color: '#f8d417' }}>{leads.filter(l => l.status === 'converted').length}</div>
            <div className="text-[10px]" style={{ color: '#9ea7b5' }}>Converted</div>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xl font-bold" style={{ color: '#54b0e7' }}>{leads.filter(l => l.lead_grade === 'A').length}</div>
            <div className="text-[10px]" style={{ color: '#9ea7b5' }}>Grade A Leads</div>
          </div>
        </div>

        {/* Auto-sync info */}
        <div className="rounded-lg p-3" style={{ background: 'rgba(46,204,113,0.05)', border: '1px solid rgba(46,204,113,0.15)' }}>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#2ecc71' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#fff' }}>Auto-Sync Active</p>
              <p className="text-xs mt-0.5" style={{ color: '#9ea7b5' }}>
                A background automation runs on every lead status change and appends a row to the <strong style={{ color: '#2ecc71' }}>Status Change Log</strong> sheet.
                To enable it, set <code className="px-1 rounded" style={{ background: 'rgba(46,204,113,0.15)', color: '#4acbbf' }}>GOOGLE_SHEET_ID</code> in your app's Environment Variables (Settings → Environment Variables).
              </p>
            </div>
          </div>
        </div>

        {/* Sync result */}
        {syncResult && (
          <div className="rounded-lg p-3 flex items-center gap-2"
            style={{
              background: syncResult.success ? 'rgba(46,204,113,0.1)' : 'rgba(246,108,37,0.1)',
              border: `1px solid ${syncResult.success ? 'rgba(46,204,113,0.3)' : 'rgba(246,108,37,0.3)'}`,
            }}>
            {syncResult.success
              ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#2ecc71' }} />
              : <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#f66c25' }} />
            }
            <span className="text-sm" style={{ color: syncResult.success ? '#2ecc71' : '#f66c25' }}>
              {syncResult.success
                ? `✅ Synced ${syncResult.updated} rows to Google Sheets (${syncResult.total} total leads)`
                : `Error: ${syncResult.error}`
              }
            </span>
          </div>
        )}

        {/* Sync button */}
        <Button
          onClick={runSync}
          disabled={syncing || !spreadsheetId.trim()}
          className="w-full font-semibold"
          style={{ background: syncing ? 'rgba(46,204,113,0.3)' : 'linear-gradient(135deg, #2ecc71, #4acbbf)', color: '#0a1929' }}>
          {syncing
            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Syncing {leads.length} leads…</>
            : <><RefreshCw className="h-4 w-4 mr-2" />Sync Now to Google Sheets</>
          }
        </Button>
      </div>
    </div>
  );
}