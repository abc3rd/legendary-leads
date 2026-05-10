import React, { useMemo } from 'react';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getColor(value, max) {
  if (max === 0 || value === 0) return 'rgba(255,255,255,0.04)';
  const intensity = value / max;
  if (intensity < 0.25) return 'rgba(74,203,191,0.2)';
  if (intensity < 0.5) return 'rgba(74,203,191,0.45)';
  if (intensity < 0.75) return 'rgba(234,0,234,0.55)';
  return 'rgba(234,0,234,0.9)';
}

export default function InteractionHeatMap({ notes }) {
  const { grid, maxVal, totalInteractions } = useMemo(() => {
    const g = {};
    DAYS.forEach((d, di) => {
      g[di] = {};
      HOURS.forEach(h => { g[di][h] = 0; });
    });

    notes.forEach(note => {
      if (!note.created_date) return;
      const dt = new Date(note.created_date);
      const day = dt.getDay();
      const hour = dt.getHours();
      g[day][hour]++;
    });

    let max = 0;
    let total = 0;
    DAYS.forEach((_, di) => {
      HOURS.forEach(h => {
        if (g[di][h] > max) max = g[di][h];
        total += g[di][h];
      });
    });

    return { grid: g, maxVal: max, totalInteractions: total };
  }, [notes]);

  // Find top time slots
  const topSlots = useMemo(() => {
    const slots = [];
    DAYS.forEach((day, di) => {
      HOURS.forEach(h => {
        if (grid[di][h] > 0) slots.push({ day, hour: h, count: grid[di][h] });
      });
    });
    return slots.sort((a, b) => b.count - a.count).slice(0, 3);
  }, [grid]);

  return (
    <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(248,212,23,0.2)' }}>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#f8d417' }}>Lead Responsiveness Heat Map</h3>
          <p className="text-xs mt-0.5" style={{ color: '#9ea7b5' }}>Best times to reach leads based on {totalInteractions} interaction logs</p>
        </div>
        {topSlots.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {topSlots.map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-full font-semibold"
                style={{ background: 'rgba(248,212,23,0.15)', color: '#f8d417', border: '1px solid rgba(248,212,23,0.3)' }}>
                🔥 {s.day} {s.hour}:00 ({s.count})
              </span>
            ))}
          </div>
        )}
      </div>

      {totalInteractions === 0 ? (
        <div className="text-center py-10" style={{ color: '#5e6a78' }}>
          <p className="text-sm">No interaction data yet</p>
          <p className="text-xs mt-1">Heat map will populate as leads are contacted</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex mb-1 pl-10">
              {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
                <div key={h} className="flex-1 text-center text-[9px]" style={{ color: '#5e6a78' }}>
                  {h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                </div>
              ))}
            </div>
            {/* Grid */}
            {DAYS.map((day, di) => (
              <div key={day} className="flex items-center gap-1 mb-0.5">
                <div className="w-9 text-right text-[10px] pr-1 flex-shrink-0" style={{ color: '#9ea7b5' }}>{day}</div>
                <div className="flex flex-1 gap-0.5">
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="flex-1 h-5 rounded-sm cursor-default transition-all hover:scale-110"
                      style={{ background: getColor(grid[di][h], maxVal), minWidth: 8 }}
                      title={`${day} ${h}:00 — ${grid[di][h]} interactions`}
                    />
                  ))}
                </div>
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[10px]" style={{ color: '#5e6a78' }}>Low</span>
              {['rgba(74,203,191,0.2)', 'rgba(74,203,191,0.45)', 'rgba(234,0,234,0.55)', 'rgba(234,0,234,0.9)'].map((c, i) => (
                <div key={i} className="h-3 w-5 rounded-sm" style={{ background: c }} />
              ))}
              <span className="text-[10px]" style={{ color: '#5e6a78' }}>High</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}