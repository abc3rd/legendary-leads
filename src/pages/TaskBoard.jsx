import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Phone, MessageSquare, Mail, Calendar, CheckCircle2, Clock, Loader2, Trash2, ChevronDown, AlertTriangle, User } from 'lucide-react';
import { toast } from 'sonner';
import { format, isPast, isToday, parseISO } from 'date-fns';
import TaskModal from '../components/tasks/TaskModal';

const COLUMNS = [
  { id: 'Pending', label: 'Pending', color: '#54b0e7', icon: Clock },
  { id: 'In Progress', label: 'In Progress', color: '#f8d417', icon: AlertTriangle },
  { id: 'Completed', label: 'Completed', color: '#2ecc71', icon: CheckCircle2 },
];

const TASK_ICONS = {
  'Make Phone Call': Phone,
  'Send Direct Message': MessageSquare,
  'Send Email': Mail,
  'Schedule Meeting': Calendar,
  'Follow Up': Clock,
  'Other': Clock,
};

const PRIORITY_COLORS = {
  Low: '#9ea7b5', Medium: '#54b0e7', High: '#f66c25', Urgent: '#e74c3c',
};

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const Icon = TASK_ICONS[task.task_type] || Clock;
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'Completed';
  const isDueToday = task.due_date && isToday(parseISO(task.due_date));

  return (
    <div
      className="rounded-xl p-3 cursor-pointer group transition-all"
      style={{ background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)', border: `1.5px solid ${isOverdue ? '#e74c3c44' : '#2a3a4a'}` }}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${PRIORITY_COLORS[task.priority] || '#9ea7b5'}22` }}>
            <Icon className="h-3.5 w-3.5" style={{ color: PRIORITY_COLORS[task.priority] || '#9ea7b5' }} />
          </div>
          <p className="text-xs font-semibold truncate" style={{ color: '#fff' }}>{task.title}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(task.id); }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity"
          style={{ color: '#e74c3c' }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {task.lead_name && (
        <div className="flex items-center gap-1 mb-2">
          <User className="h-3 w-3" style={{ color: '#9b59b6' }} />
          <span className="text-[10px]" style={{ color: '#9b59b6' }}>{task.lead_name}</span>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-1">
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
          style={{ background: `${PRIORITY_COLORS[task.priority]}22`, color: PRIORITY_COLORS[task.priority] }}>
          {task.priority}
        </span>
        {task.due_date && (
          <span className="text-[10px] font-medium"
            style={{ color: isOverdue ? '#e74c3c' : isDueToday ? '#f8d417' : '#9ea7b5' }}>
            {isOverdue ? '⚠ ' : ''}{format(parseISO(task.due_date), 'MMM d')}
          </span>
        )}
      </div>

      {task.assigned_to && (
        <p className="text-[10px] mt-1.5 truncate" style={{ color: '#5e6a78' }}>→ {task.assigned_to}</p>
      )}

      {/* Quick status buttons */}
      <div className="flex gap-1 mt-2 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: '#1a2a3a' }}>
        {COLUMNS.filter(c => c.id !== task.status).map(col => (
          <button key={col.id} onClick={e => { e.stopPropagation(); onStatusChange(task, col.id); }}
            className="flex-1 text-[10px] py-1 rounded font-semibold transition-all"
            style={{ background: `${col.color}22`, color: col.color }}>
            → {col.id}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TaskBoard() {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const qc = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads_tasks'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
  });

  const filtered = useMemo(() => {
    if (!searchQuery) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(t =>
      t.title?.toLowerCase().includes(q) ||
      t.lead_name?.toLowerCase().includes(q) ||
      t.assigned_to?.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  const columns = useMemo(() => {
    return COLUMNS.map(col => ({
      ...col,
      tasks: filtered.filter(t => t.status === col.id),
    }));
  }, [filtered]);

  const handleSave = async (data) => {
    if (data.id) {
      await base44.entities.Task.update(data.id, data);
      toast.success('Task updated');
    } else {
      await base44.entities.Task.create(data);
      toast.success('Task created');
    }
    qc.invalidateQueries({ queryKey: ['tasks'] });
    setShowModal(false);
    setEditingTask(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.Task.delete(id);
    qc.invalidateQueries({ queryKey: ['tasks'] });
    toast.success('Task deleted');
  };

  const handleStatusChange = async (task, newStatus) => {
    const update = { status: newStatus };
    if (newStatus === 'Completed') update.completed_at = new Date().toISOString();
    await base44.entities.Task.update(task.id, update);
    qc.invalidateQueries({ queryKey: ['tasks'] });
  };

  const openEdit = (task) => { setEditingTask(task); setShowModal(true); };
  const openNew = () => { setEditingTask(null); setShowModal(true); };

  const totalPending = tasks.filter(t => t.status === 'Pending').length;
  const totalOverdue = tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'Completed').length;

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>Task Board</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9ea7b5' }}>
              {tasks.length} tasks · {totalPending} pending
              {totalOverdue > 0 && <span style={{ color: '#e74c3c' }}> · {totalOverdue} overdue</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks…"
              className="w-48 text-xs"
              style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }}
            />
            <Button onClick={openNew} style={{ background: 'linear-gradient(135deg, #f8d417 0%, #f66c25 100%)', color: '#0a1929' }}>
              <Plus className="h-4 w-4 mr-1" /> New Task
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {COLUMNS.map(col => {
            const count = tasks.filter(t => t.status === col.id).length;
            return (
              <div key={col.id} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${col.color}33` }}>
                <div className="text-xl font-bold" style={{ color: col.color }}>{count}</div>
                <div className="text-xs" style={{ color: '#9ea7b5' }}>{col.id}</div>
              </div>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#f8d417' }} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map(col => {
              const Icon = col.icon;
              return (
                <div key={col.id}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <Icon className="h-4 w-4" style={{ color: col.color }} />
                    <h2 className="text-sm font-bold" style={{ color: col.color }}>{col.label}</h2>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: `${col.color}22`, color: col.color }}>{col.tasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[200px] rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.02)', border: `1px dashed ${col.color}33` }}>
                    {col.tasks.length === 0 ? (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-xs" style={{ color: '#3a4a5a' }}>No tasks</p>
                      </div>
                    ) : (
                      col.tasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      ))
                    )}
                    <button onClick={openNew}
                      className="w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs transition-all"
                      style={{ color: '#3a4a5a', border: '1px dashed #2a3a4a' }}
                      onMouseEnter={e => { e.currentTarget.style.color = col.color; e.currentTarget.style.borderColor = col.color; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#3a4a5a'; e.currentTarget.style.borderColor = '#2a3a4a'; }}>
                      <Plus className="h-3 w-3" /> Add task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          leads={leads}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}