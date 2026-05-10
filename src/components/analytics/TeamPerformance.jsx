import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Loader2, Users, Target, Zap, TrendingUp, Award, CheckSquare } from 'lucide-react';

const CARD = {
  background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)',
  border: '1.5px solid rgba(234,0,234,0.2)',
};

const PALETTE = ['#ea00ea', '#4acbbf', '#f8d417', '#54b0e7', '#f66c25', '#a78bfa', '#2ecc71', '#e74c3c'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#0d1b2a', border: '1px solid #ea00ea55', color: '#fff' }}>
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="rounded-xl p-4" style={CARD}>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-xs" style={{ color: '#9ea7b5' }}>{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: '#5e6a78' }}>{sub}</div>}
    </div>
  );
}

// Mini bar showing each member's share
function MemberBar({ name, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs truncate text-right flex-shrink-0" style={{ color: '#9ea7b5' }}>{name}</div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="w-8 text-xs font-bold text-right flex-shrink-0" style={{ color: '#fff' }}>{value}</div>
    </div>
  );
}

export default function TeamPerformance() {
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['team_users_perf'],
    queryFn: () => base44.entities.User.list(),
  });
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['leads_perf'],
    queryFn: () => base44.entities.Lead.list('-created_date', 2000),
  });
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks_perf'],
    queryFn: () => base44.entities.Task.list('-created_date', 2000),
  });
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['follow_up_logs_perf'],
    queryFn: () => base44.entities.FollowUpLog.list('-created_date', 2000),
  });

  const isLoading = usersLoading || leadsLoading || tasksLoading || logsLoading;

  // ── Computed metrics per member ──────────────────────────────────────────────
  const memberStats = useMemo(() => {
    return users.map((u, i) => {
      const assignedLeads = leads.filter(l => l.assigned_to === u.email);
      const converted = assignedLeads.filter(l => l.status === 'converted').length;
      const active = assignedLeads.filter(l => !['converted', 'unresponsive'].includes(l.status)).length;
      const convRate = assignedLeads.length > 0 ? ((converted / assignedLeads.length) * 100).toFixed(1) : '0.0';
      const memberTasks = tasks.filter(t => t.assigned_to === u.email);
      const completedTasks = memberTasks.filter(t => t.status === 'Completed').length;
      const seqTriggered = logs.filter(l => {
        // Match logs to users via lead assignments
        const lead = leads.find(ld => ld.id === l.lead_id);
        return lead && lead.assigned_to === u.email;
      }).length;

      return {
        name: u.full_name || u.email?.split('@')[0] || 'Unknown',
        email: u.email,
        color: PALETTE[i % PALETTE.length],
        totalLeads: assignedLeads.length,
        active,
        converted,
        convRate: parseFloat(convRate),
        tasks: memberTasks.length,
        completedTasks,
        seqTriggered,
      };
    }).filter(m => m.totalLeads > 0 || m.tasks > 0); // only show members with activity
  }, [users, leads, tasks, logs]);

  // ── Aggregate stats ──────────────────────────────────────────────────────────
  const totalAssigned = leads.filter(l => l.assigned_to).length;
  const totalConverted = leads.filter(l => l.status === 'converted').length;
  const overallConvRate = totalAssigned > 0 ? ((totalConverted / totalAssigned) * 100).toFixed(1) : '0.0';
  const totalSeq = logs.length;
  const totalTasksDone = tasks.filter(t => t.status === 'Completed').length;

  // ── Chart data ───────────────────────────────────────────────────────────────
  const leadsBarData = memberStats.map(m => ({
    name: m.name.split(' ')[0],
    Assigned: m.totalLeads,
    Converted: m.converted,
    Active: m.active,
  }));

  const convRatePieData = memberStats
    .filter(m => m.totalLeads > 0)
    .map(m => ({ name: m.name.split(' ')[0], value: m.convRate, color: m.color }));

  const seqBarData = memberStats.map(m => ({
    name: m.name.split(' ')[0],
    Sequences: m.seqTriggered,
    Tasks: m.completedTasks,
  }));

  const maxLeads = Math.max(...memberStats.map(m => m.totalLeads), 1);
  const maxConv = Math.max(...memberStats.map(m => m.converted), 1);
  const maxSeq = Math.max(...memberStats.map(m => m.seqTriggered), 1);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#ea00ea' }} />
      </div>
    );
  }

  if (memberStats.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl" style={{ border: '2px dashed rgba(234,0,234,0.15)' }}>
        <Users className="h-12 w-12 mx-auto mb-3" style={{ color: '#2a3a4a' }} />
        <p className="font-semibold" style={{ color: '#9ea7b5' }}>No team activity yet</p>
        <p className="text-sm mt-1" style={{ color: '#5e6a78' }}>Assign leads to team members to see performance metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Leads Assigned" value={totalAssigned} sub={`of ${leads.length} total`} color="#ea00ea" icon={Users} />
        <StatCard label="Converted" value={totalConverted} sub={`${overallConvRate}% conv. rate`} color="#2ecc71" icon={Target} />
        <StatCard label="Sequences Triggered" value={totalSeq} sub="all-time follow-ups" color="#4acbbf" icon={Zap} />
        <StatCard label="Tasks Completed" value={totalTasksDone} sub={`of ${tasks.length} total`} color="#f8d417" icon={CheckSquare} />
      </div>

      {/* ── Leads per member bar chart ── */}
      <div className="rounded-xl p-5" style={CARD}>
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>
          <Users className="h-4 w-4" /> Leads per Team Member
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={leadsBarData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: '#9ea7b5', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9ea7b5', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Assigned" fill="#ea00ea" radius={[4,4,0,0]} name="Assigned" />
            <Bar dataKey="Active" fill="#54b0e7" radius={[4,4,0,0]} name="Active" />
            <Bar dataKey="Converted" fill="#2ecc71" radius={[4,4,0,0]} name="Converted" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-center">
          {[{color:'#ea00ea',label:'Assigned'},{color:'#54b0e7',label:'Active'},{color:'#2ecc71',label:'Converted'}].map(l => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: '#9ea7b5' }}>
              <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: l.color }} />{l.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Conversion rate + sequences row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversion Rate Pie */}
        <div className="rounded-xl p-5" style={CARD}>
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#2ecc71', fontFamily: 'Poppins, sans-serif' }}>
            <Target className="h-4 w-4" /> Conversion Rate by Member
          </h2>
          {convRatePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={convRatePieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80} paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                  {convRatePieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `${val}%`} contentStyle={{ background: '#0d1b2a', border: '1px solid #ea00ea55', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color: '#5e6a78' }}>No conversions yet</div>
          )}
        </div>

        {/* Follow-up Sequences + Tasks */}
        <div className="rounded-xl p-5" style={CARD}>
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#4acbbf', fontFamily: 'Poppins, sans-serif' }}>
            <Zap className="h-4 w-4" /> Sequences & Tasks per Member
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={seqBarData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: '#9ea7b5', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ea7b5', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Sequences" fill="#4acbbf" radius={[4,4,0,0]} name="Sequences" />
              <Bar dataKey="Tasks" fill="#f8d417" radius={[4,4,0,0]} name="Tasks Done" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Per-member leaderboard ── */}
      <div className="rounded-xl p-5" style={CARD}>
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>
          <Award className="h-4 w-4" /> Member Leaderboard
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Member', 'Leads Assigned', 'Active', 'Converted', 'Conv. Rate', 'Sequences', 'Tasks Done'].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-semibold" style={{ color: '#9ea7b5' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...memberStats].sort((a,b) => b.converted - a.converted).map((m, i) => (
                <tr key={m.email} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ background: m.color, color: '#000' }}>
                        {m.name[0].toUpperCase()}
                      </div>
                      <span className="font-semibold truncate max-w-[100px]" style={{ color: '#fff' }}>{m.name}</span>
                      {i === 0 && <span className="text-[10px]">🏆</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-bold" style={{ color: '#ea00ea' }}>{m.totalLeads}</td>
                  <td className="px-3 py-3" style={{ color: '#54b0e7' }}>{m.active}</td>
                  <td className="px-3 py-3 font-bold" style={{ color: '#2ecc71' }}>{m.converted}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: m.convRate >= 20 ? 'rgba(46,204,113,0.15)' : m.convRate >= 10 ? 'rgba(248,212,23,0.15)' : 'rgba(255,255,255,0.06)',
                        color: m.convRate >= 20 ? '#2ecc71' : m.convRate >= 10 ? '#f8d417' : '#9ea7b5'
                      }}>
                      {m.convRate}%
                    </span>
                  </td>
                  <td className="px-3 py-3" style={{ color: '#4acbbf' }}>{m.seqTriggered}</td>
                  <td className="px-3 py-3" style={{ color: '#f8d417' }}>{m.completedTasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mini bars: leads + conversions breakdown ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={CARD}>
          <h3 className="text-xs font-bold mb-3" style={{ color: '#ea00ea' }}>Leads Assigned Distribution</h3>
          <div className="space-y-2.5">
            {[...memberStats].sort((a,b) => b.totalLeads - a.totalLeads).map(m => (
              <MemberBar key={m.email} name={m.name.split(' ')[0]} value={m.totalLeads} max={maxLeads} color={m.color} />
            ))}
          </div>
        </div>
        <div className="rounded-xl p-5" style={CARD}>
          <h3 className="text-xs font-bold mb-3" style={{ color: '#2ecc71' }}>Conversions Distribution</h3>
          <div className="space-y-2.5">
            {[...memberStats].sort((a,b) => b.converted - a.converted).map(m => (
              <MemberBar key={m.email} name={m.name.split(' ')[0]} value={m.converted} max={maxConv} color="#2ecc71" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}