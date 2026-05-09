import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

export default function LeadNotes({ lead }) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['lead_notes', lead.id],
    queryFn: () => base44.entities.LeadNote.filter({ lead_id: lead.id }, '-created_date', 20),
    enabled: open,
  });

  const postNote = async () => {
    if (!text.trim()) return;
    setPosting(true);
    const user = await base44.auth.me().catch(() => null);
    await base44.entities.LeadNote.create({
      lead_id: lead.id,
      lead_name: lead.name || '',
      lead_username: lead.username || '',
      author_email: user?.email || '',
      author_name: user?.full_name || user?.email || '',
      body: text.trim(),
      activity_type: 'note',
    });
    setText('');
    qc.invalidateQueries({ queryKey: ['lead_notes', lead.id] });
    qc.invalidateQueries({ queryKey: ['lead_notes_feed'] });
    setPosting(false);
  };

  return (
    <div className="mt-3 pt-2 border-t" style={{ borderColor: 'rgba(94,106,120,0.3)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
        style={{ color: '#9ea7b5' }}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {open ? 'Hide notes' : `Notes${notes.length ? ` (${notes.length})` : ''}`}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#4acbbf' }} />
          ) : notes.length === 0 ? (
            <p className="text-xs" style={{ color: '#5e6a78' }}>No notes yet</p>
          ) : (
            notes.map(note => (
              <div key={note.id} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-xs" style={{ color: '#d7dde5' }}>{note.body}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#5e6a78' }}>
                  {note.author_name || note.author_email}
                </p>
              </div>
            ))
          )}

          <div className="flex gap-1.5 mt-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postNote()}
              placeholder="Add a note…"
              className="flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none"
              style={{ background: '#071a2c', border: '1px solid #2a3a4a', color: '#fff' }}
            />
            <button
              onClick={postNote}
              disabled={posting || !text.trim()}
              className="rounded-lg px-2.5 py-1.5 flex items-center justify-center transition-opacity disabled:opacity-40"
              style={{ background: 'rgba(74,203,191,0.2)', color: '#4acbbf' }}
            >
              {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}