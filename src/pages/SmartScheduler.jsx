import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar, Plus, Loader2, ChevronLeft, ChevronRight,
  Clock, Users, CheckCircle2, AlertCircle, Zap, Star,
  Target, TrendingUp, Phone, Mail, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO, startOfWeek, endOfWeek } from 'date-fns';

const TASK_COLORS = {
  'Make Phone Call': '#2ecc71',
  'Send Direct Message': '#ea00ea',
  'Send Email': '#54b0e7',
  'Schedule Meeting': '#f8d417',
  'Follow Up': '#4acbbf',
  'Other': '#9ea7b5',
};

const TASK_ICONS = {
  'Make Phone Call': Phone,
  'Send Direct Message': MessageSquare,
  'Send Email': Mail,
  'Schedule Meeting': Calendar,
  'Follow Up': Zap,
  'Other': Star,
};

const CARD = { background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(234,0,234,0.18)' };

// ─── Task Modal ───────────────────────────────────────────────────────────────
function TaskModal({ task, leads, onClose, onSaved }) {
  const defaults = {
    title: '', description: '', task_type: 'Follow Up', status: 'Pending',
    priority: 'Medium', assigned_to: '', lead_id: '', lead_name: '',
    lead_username: '', due_date: format(new Date(), 'yyyy-MM-dd'), notes: ''
  };
  const [form, setForm] = useState(task || defaults);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    if (form.lead_id) {
      const lead = leads.find(l => l.id === form.lead_id);
      if (lead) { set('lead_name', lead.name || ''); set('lead_username', lead.username || ''); }
    }
    const payload = { ...form };
    if (form.lead_id) {
      const lead = leads.find(l => l.id === form.lead_id);
      if (lead) { payload.lead_name = lead.name || ''; payload.lead_username = lead.username || ''; }
    }
    if (form.id) await base44.entities.Task.update(form.id, payload);
    else await base44.entities.Task.create(payload);
    toast.success(form.id ? 'Task updated' : 'Task created');
    onSaved();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: '#0d1b2a', border: '2px solid #ea00ea' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>
          {form.id ? 'Edit Task' : 'Schedule New Task'}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Title *</label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title"
              style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Type</label>
              <select value={form.task_type} onChange={e => set('task_type', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
                {Object.keys(TASK_COLORS).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
                {['Low','Medium','High','Urgent'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Due Date</label>
            <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
              style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Link to Lead (optional)</label>
            <select value={form.lead_id} onChange={e => set('lead_id', e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
              <option value="">No lead</option>
              {leads.slice(0, 100).map(l => <option key={l.id} value={l.id}>@{l.username || l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Assign To (email)</label>
            <Input value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}
              placeholder="team@company.com" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Notes</label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
              style={{ background: '#071a2c', border: '1px solid #2a3a4a', color: '#fff' }} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button onClick={onClose} variant="ghost" className="flex-1" style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 font-semibold"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)', color: '#fff' }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Task'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────
function CalendarGrid({ currentMonth, tasks, onDayClick, onTaskClick }) {
  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });

  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!t.due_date) return;
      const key = t.due_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold py-2" style={{ color: '#5e6a78' }}>{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDay[key] || [];
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const today = isToday(day);
          return (
            <div key={key}
              onClick={() => onDayClick(day)}
              className="min-h-[80px] p-1.5 rounded-lg cursor-pointer transition-all hover:bg-white/5"
              style={{
                background: today ? 'rgba(234,0,234,0.1)' : 'rgba(255,255,255,0.02)',
                border: today ? '1.5px solid rgba(234,0,234,0.4)' : '1px solid rgba(255,255,255,0.05)',
                opacity: isCurrentMonth ? 1 : 0.35,
              }}>
              <div className="text-xs font-bold mb-1 flex items-center justify-between">
                <span style={{ color: today ? '#ea00ea' : '#9ea7b5' }}>{format(day, 'd')}</span>
                {dayTasks.length > 0 && (
                  <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(234,0,234,0.2)', color: '#ea00ea' }}>{dayTasks.length}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((t, i) => {
                  const color = TASK_COLORS[t.task_type] || '#9ea7b5';
                  return (
                    <div key={i} onClick={e => { e.stopPropagation(); onTaskClick(t); }}
                      className="text-[9px] px-1.5 py-0.5 rounded truncate cursor-pointer"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                      {t.title}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && <div className="text-[9px]" style={{ color: '#5e6a78' }}>+{dayTasks.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pipeline Board ───────────────────────────────────────────────────────────
function PipelineBoard({ leads }) {
  const stages = ['new','cold_outreach','contacted','qualified','in_negotiation','converted'];
  const STAGE_COLORS = { new: '#9ea7b5', cold_outreach: '#54b0e7', contacted: '#4acbbf', qualified: '#f8d417', in_negotiation: '#f66c25', converted: '#2ecc71' };
  const byStage = useMemo(() => {
    const map = {};
    stages.forEach(s => map[s] = []);
    leads.forEach(l => { if (map[l.status]) map[l.status].push(l); });
    return map;
  }, [leads]);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-2">
        {stages.map(stage => {
          const color = STAGE_COLORS[stage];
          const stageLeads = byStage[stage] || [];
          const totalValue = stageLeads.reduce((acc, l) => acc + (l.followerCount || 0), 0);
          return (
            <div key={stage} className="w-48 flex-shrink-0">
              <div className="flex items-center justify-between px-2 py-2 mb-2 rounded-lg"
                style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
                <span className="text-xs font-bold capitalize" style={{ color }}>{stage.replace(/_/g,' ')}</span>
                <span className="text-xs font-bold" style={{ color }}>{stageLeads.length}</span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {stageLeads.slice(0, 15).map(lead => (
                  <div key={lead.id} className="rounded-lg p-2.5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}20` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                        style={{ background: `${color}25`, color }}>
                        {(lead.name || lead.username || '?')[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold truncate" style={{ color: '#fff' }}>{lead.name || lead.username}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {lead.lead_grade && <span className="text-[9px] px-1 rounded font-bold"
                        style={{ background: lead.lead_grade === 'A' ? 'rgba(46,204,113,0.15)' : 'rgba(248,212,23,0.12)', color: lead.lead_grade === 'A' ? '#2ecc71' : '#f8d417' }}>{lead.lead_grade}</span>}
                      {lead.category && <span className="text-[9px]" style={{ color: '#5e6a78' }}>{lead.category}</span>}
                    </div>
                    {lead.followerCount > 0 && <p className="text-[9px] mt-1" style={{ color: '#5e6a78' }}>{(lead.followerCount/1000).toFixed(0)}K followers</p>}
                  </div>
                ))}
                {stageLeads.length === 0 && <p className="text-[10px] text-center py-4" style={{ color: '#2a3a4a' }}>Empty</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SmartScheduler() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [preselectedDate, setPreselectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const qc = useQueryClient();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['scheduler_tasks'],
    queryFn: () => base44.entities.Task.list('-due_date', 500),
  });
  const { data: leads = [] } = useQuery({
    queryKey: ['scheduler_leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 1000),
  });

  const refetch = () => qc.invalidateQueries({ queryKey: ['scheduler_tasks'] });

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayTasks = tasks.filter(t => t.due_date?.slice(0, 10) === todayStr && t.status !== 'Completed');
  const overdue = tasks.filter(t => t.due_date && t.due_date.slice(0, 10) < todayStr && t.status !== 'Completed' && t.status !== 'Cancelled');
  const upcoming = tasks.filter(t => t.due_date && t.due_date.slice(0, 10) > todayStr && t.status === 'Pending');

  const handleDayClick = (day) => {
    setPreselectedDate(format(day, 'yyyy-MM-dd'));
    setEditing(null);
    setShowModal(true);
  };

  const handleTaskClick = (task) => {
    setEditing(task);
    setPreselectedDate(null);
    setShowModal(true);
  };

  const completeTask = async (task) => {
    await base44.entities.Task.update(task.id, { status: 'Completed', completed_at: new Date().toISOString() });
    toast.success('Task completed!');
    refetch();
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4acbbf, #54b0e7)' }}>
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#4acbbf', fontFamily: 'Poppins, sans-serif' }}>Smart Scheduler</h1>
              <p className="text-xs" style={{ color: '#9ea7b5' }}>Calendar · Pipeline · Task management</p>
            </div>
          </div>
          <Button onClick={() => { setEditing(null); setPreselectedDate(null); setShowModal(true); }}
            style={{ background: 'linear-gradient(135deg, #4acbbf, #54b0e7)', color: '#0a1929' }}>
            <Plus className="h-4 w-4 mr-1.5" /> New Task
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Today's Tasks", value: todayTasks.length, color: '#4acbbf', icon: CheckCircle2 },
            { label: 'Overdue', value: overdue.length, color: overdue.length > 0 ? '#f66c25' : '#5e6a78', icon: AlertCircle },
            { label: 'Upcoming (7d)', value: upcoming.filter(t => t.due_date > todayStr && t.due_date <= format(new Date(Date.now() + 7*86400000), 'yyyy-MM-dd')).length, color: '#f8d417', icon: Clock },
            { label: 'Pipeline Leads', value: leads.length, color: '#ea00ea', icon: Target },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-xl p-4" style={CARD}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4" style={{ color }} />
                <span className="text-xs" style={{ color: '#9ea7b5' }}>{label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {[
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'today', label: "Today's Tasks", icon: CheckCircle2 },
            { id: 'pipeline', label: 'Lead Pipeline', icon: TrendingUp },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: activeTab === t.id ? 'linear-gradient(135deg, #4acbbf22, #54b0e722)' : 'transparent', color: activeTab === t.id ? '#4acbbf' : '#9ea7b5', border: activeTab === t.id ? '1px solid rgba(74,203,191,0.3)' : '1px solid transparent' }}>
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="rounded-2xl p-5" style={CARD}>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10" style={{ color: '#9ea7b5' }}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold" style={{ color: '#fff', fontFamily: 'Poppins, sans-serif' }}>
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10" style={{ color: '#9ea7b5' }}>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            {tasksLoading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin" style={{ color: '#4acbbf' }} /></div>
              : <CalendarGrid currentMonth={currentMonth} tasks={tasks} onDayClick={handleDayClick} onTaskClick={handleTaskClick} />}
            <p className="text-[10px] mt-3 text-center" style={{ color: '#3a4a5a' }}>Click any day to schedule a task · Click a task to edit it</p>
          </div>
        )}

        {/* Today's Tasks Tab */}
        {activeTab === 'today' && (
          <div className="space-y-3">
            {overdue.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-2 flex items-center gap-2" style={{ color: '#f66c25' }}>
                  <AlertCircle className="h-3.5 w-3.5" /> Overdue ({overdue.length})
                </p>
                <div className="space-y-2">
                  {overdue.map(t => {
                    const color = TASK_COLORS[t.task_type] || '#9ea7b5';
                    const Icon = TASK_ICONS[t.task_type] || Zap;
                    return (
                      <div key={t.id} className="rounded-xl p-3 flex items-center gap-3"
                        style={{ background: 'rgba(246,108,37,0.07)', border: '1px solid rgba(246,108,37,0.3)' }}>
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                          <Icon className="h-4 w-4" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#fff' }}>{t.title}</p>
                          <p className="text-xs" style={{ color: '#f66c25' }}>Due {t.due_date} · {t.priority}</p>
                          {t.lead_name && <p className="text-xs" style={{ color: '#9ea7b5' }}>@{t.lead_username || t.lead_name}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleTaskClick(t)} variant="ghost" style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>Edit</Button>
                          <Button size="sm" onClick={() => completeTask(t)} style={{ background: 'rgba(46,204,113,0.2)', color: '#2ecc71' }}>✓</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {todayTasks.length > 0 ? (
              <div>
                <p className="text-xs font-bold mb-2 flex items-center gap-2" style={{ color: '#4acbbf' }}>
                  <Calendar className="h-3.5 w-3.5" /> Today ({todayTasks.length})
                </p>
                <div className="space-y-2">
                  {todayTasks.map(t => {
                    const color = TASK_COLORS[t.task_type] || '#9ea7b5';
                    const Icon = TASK_ICONS[t.task_type] || Zap;
                    return (
                      <div key={t.id} className="rounded-xl p-3 flex items-center gap-3" style={CARD}>
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                          <Icon className="h-4 w-4" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#fff' }}>{t.title}</p>
                          <p className="text-xs" style={{ color }}>{t.task_type} · {t.priority}</p>
                          {t.lead_name && <p className="text-xs" style={{ color: '#9ea7b5' }}>@{t.lead_username || t.lead_name}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleTaskClick(t)} variant="ghost" style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>Edit</Button>
                          <Button size="sm" onClick={() => completeTask(t)} style={{ background: 'rgba(46,204,113,0.2)', color: '#2ecc71' }}>✓</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 rounded-2xl" style={{ border: '2px dashed rgba(74,203,191,0.2)' }}>
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: '#2a3a4a' }} />
                <p className="font-semibold" style={{ color: '#9ea7b5' }}>All clear for today!</p>
                <p className="text-sm mt-1" style={{ color: '#5e6a78' }}>No pending tasks due today</p>
              </div>
            )}
          </div>
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div>
            <p className="text-sm mb-4" style={{ color: '#9ea7b5' }}>Visual lead pipeline — {leads.length} total leads across all stages</p>
            <div className="rounded-2xl p-5" style={CARD}>
              <PipelineBoard leads={leads} />
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editing ? editing : (preselectedDate ? { ...{ title: '', task_type: 'Follow Up', status: 'Pending', priority: 'Medium', assigned_to: '', lead_id: '', lead_name: '', lead_username: '', notes: '' }, due_date: preselectedDate } : null)}
          leads={leads}
          onClose={() => { setShowModal(false); setEditing(null); setPreselectedDate(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); setPreselectedDate(null); refetch(); }}
        />
      )}
    </div>
  );
}