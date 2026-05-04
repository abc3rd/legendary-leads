import React, { useState, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Mail, MessageSquare, Plus, Trash2, GripVertical, ChevronRight, ArrowRight, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const STATUS_LIST = [
  { value: 'new',            label: 'New',           color: '#4acbbf' },
  { value: 'cold_outreach',  label: 'Cold Outreach', color: '#54b0e7' },
  { value: 'contacted',      label: 'Contacted',     color: '#f8d417' },
  { value: 'qualified',      label: 'Qualified',     color: '#f66c25' },
  { value: 'in_negotiation', label: 'In Negotiation',color: '#ea00ea' },
  { value: 'converted',      label: 'Converted',     color: '#2ecc71' },
  { value: 'unresponsive',   label: 'Unresponsive',  color: '#5e6a78' },
];

// Group sequences by their trigger type
function buildFlowGroups(sequences, templates) {
  const statusGroups = {};
  const timeGroups = [];

  STATUS_LIST.forEach(s => { statusGroups[s.value] = []; });

  sequences.forEach(seq => {
    const tpl = templates.find(t => t.id === seq.template_id);
    const enriched = { ...seq, _template: tpl };
    if (seq.trigger_type === 'status_change' && seq.trigger_status) {
      if (!statusGroups[seq.trigger_status]) statusGroups[seq.trigger_status] = [];
      statusGroups[seq.trigger_status].push(enriched);
    } else if (seq.trigger_type === 'time_based') {
      timeGroups.push(enriched);
    }
  });

  return { statusGroups, timeGroups };
}

function SequenceNode({ seq, index, onToggle, onDelete, onEdit }) {
  const tpl = seq._template;
  const isActive = seq.is_active;

  return (
    <Draggable draggableId={seq.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="rounded-lg p-3 mb-2 select-none transition-all"
          style={{
            background: snapshot.isDragging ? 'rgba(234,0,234,0.15)' : 'rgba(10,25,41,0.8)',
            border: `1.5px solid ${isActive ? 'rgba(234,0,234,0.6)' : 'rgba(94,106,120,0.4)'}`,
            boxShadow: snapshot.isDragging ? '0 0 20px rgba(234,0,234,0.4)' : 'none',
            opacity: isActive ? 1 : 0.55,
            cursor: snapshot.isDragging ? 'grabbing' : 'grab',
            ...provided.draggableProps.style,
          }}
        >
          <div className="flex items-start gap-2">
            <div {...provided.dragHandleProps} className="mt-0.5 flex-shrink-0">
              <GripVertical className="h-4 w-4" style={{ color: '#5e6a78' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {seq.trigger_type === 'status_change'
                  ? <Zap className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#f8d417' }} />
                  : <Clock className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#54b0e7' }} />}
                <span className="text-xs font-semibold truncate" style={{ color: '#fff' }}>{seq.name}</span>
              </div>
              {seq.trigger_type === 'time_based' && (
                <p className="text-xs mb-1" style={{ color: '#9ea7b5' }}>
                  After {seq.delay_days || 0}d
                </p>
              )}
              {tpl && (
                <div className="flex items-center gap-1.5 text-xs mt-1 rounded px-2 py-1" style={{
                  background: tpl.channel === 'email' ? 'rgba(84,176,231,0.12)' : 'rgba(74,203,191,0.12)',
                }}>
                  {tpl.channel === 'email'
                    ? <Mail className="h-3 w-3 flex-shrink-0" style={{ color: '#54b0e7' }} />
                    : <MessageSquare className="h-3 w-3 flex-shrink-0" style={{ color: '#4acbbf' }} />}
                  <span className="truncate" style={{ color: '#d7dde5' }}>{tpl.name}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button onClick={() => onToggle(seq)} className="transition-colors">
                {isActive
                  ? <ToggleRight className="h-5 w-5" style={{ color: '#4acbbf' }} />
                  : <ToggleLeft className="h-5 w-5" style={{ color: '#5e6a78' }} />}
              </button>
              <button onClick={() => onDelete(seq.id)}>
                <Trash2 className="h-3.5 w-3.5" style={{ color: '#f66c25' }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function StatusColumn({ status, sequences, templates, onToggle, onDelete, onAddSequence }) {
  const hasActive = sequences.some(s => s.is_active);

  return (
    <div className="flex-shrink-0" style={{ width: 220 }}>
      {/* Status trigger node */}
      <div className="rounded-xl p-3 mb-2 text-center" style={{
        background: `linear-gradient(135deg, rgba(10,25,41,0.95), rgba(13,13,26,0.9))`,
        border: `2px solid ${status.color}`,
        boxShadow: hasActive ? `0 0 16px ${status.color}44` : 'none',
      }}>
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Users className="h-3.5 w-3.5" style={{ color: status.color }} />
          <span className="text-xs font-bold" style={{ color: status.color }}>{status.label}</span>
        </div>
        <div className="text-xs" style={{ color: '#5e6a78' }}>triggerStatusFollowUp</div>
      </div>

      {/* Arrow down */}
      <div className="flex justify-center my-1">
        <ArrowRight className="h-4 w-4 rotate-90" style={{ color: status.color + '88' }} />
      </div>

      {/* Droppable sequences */}
      <Droppable droppableId={`status_${status.value}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="rounded-xl p-2 min-h-[80px] transition-all"
            style={{
              background: snapshot.isDraggingOver ? `${status.color}11` : 'rgba(13,13,26,0.5)',
              border: `1.5px dashed ${snapshot.isDraggingOver ? status.color : 'rgba(94,106,120,0.3)'}`,
            }}
          >
            {sequences.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-center text-xs py-4" style={{ color: '#5e6a78' }}>No sequences</p>
            )}
            {sequences.map((seq, i) => (
              <SequenceNode key={seq.id} seq={seq} index={i} onToggle={onToggle} onDelete={onDelete} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add button */}
      <button
        onClick={() => onAddSequence({ trigger_type: 'status_change', trigger_status: status.value })}
        className="w-full mt-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1"
        style={{ border: `1px dashed ${status.color}66`, color: status.color + 'aa', background: 'transparent' }}
        onMouseEnter={e => { e.currentTarget.style.background = `${status.color}11`; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <Plus className="h-3 w-3" /> Add
      </button>
    </div>
  );
}

function TimeBasedColumn({ sequences, onToggle, onDelete, onAddSequence }) {
  return (
    <div className="flex-shrink-0" style={{ width: 220 }}>
      <div className="rounded-xl p-3 mb-2 text-center" style={{
        background: 'linear-gradient(135deg, rgba(10,25,41,0.95), rgba(13,13,26,0.9))',
        border: '2px solid #54b0e7',
        boxShadow: sequences.some(s => s.is_active) ? '0 0 16px rgba(84,176,231,0.3)' : 'none',
      }}>
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Clock className="h-3.5 w-3.5" style={{ color: '#54b0e7' }} />
          <span className="text-xs font-bold" style={{ color: '#54b0e7' }}>Scheduled</span>
        </div>
        <div className="text-xs" style={{ color: '#5e6a78' }}>scheduledFollowUps</div>
      </div>

      <div className="flex justify-center my-1">
        <ArrowRight className="h-4 w-4 rotate-90" style={{ color: '#54b0e788' }} />
      </div>

      <Droppable droppableId="time_based">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="rounded-xl p-2 min-h-[80px] transition-all"
            style={{
              background: snapshot.isDraggingOver ? 'rgba(84,176,231,0.08)' : 'rgba(13,13,26,0.5)',
              border: `1.5px dashed ${snapshot.isDraggingOver ? '#54b0e7' : 'rgba(94,106,120,0.3)'}`,
            }}
          >
            {sequences.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-center text-xs py-4" style={{ color: '#5e6a78' }}>No sequences</p>
            )}
            {sequences.map((seq, i) => (
              <SequenceNode key={seq.id} seq={seq} index={i} onToggle={onToggle} onDelete={onDelete} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <button
        onClick={() => onAddSequence({ trigger_type: 'time_based' })}
        className="w-full mt-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1"
        style={{ border: '1px dashed rgba(84,176,231,0.4)', color: '#54b0e7aa', background: 'transparent' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(84,176,231,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <Plus className="h-3 w-3" /> Add
      </button>
    </div>
  );
}

export default function FlowCanvas({ sequences, templates, onToggle, onDelete, onAddSequence, onReorder }) {
  const { statusGroups, timeGroups } = buildFlowGroups(sequences, templates);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Determine new trigger_type and trigger_status from destination
    let newTriggerType, newTriggerStatus;
    if (destination.droppableId === 'time_based') {
      newTriggerType = 'time_based';
      newTriggerStatus = null;
    } else {
      newTriggerType = 'status_change';
      newTriggerStatus = destination.droppableId.replace('status_', '');
    }

    try {
      const updates = { trigger_type: newTriggerType };
      if (newTriggerStatus) updates.trigger_status = newTriggerStatus;
      else updates.trigger_status = null;

      await base44.entities.FollowUpSequence.update(draggableId, updates);
      onReorder();
      toast.success('Sequence moved');
    } catch (e) {
      toast.error('Failed to move sequence');
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto pb-4">
        {/* Legend */}
        <div className="flex items-center gap-6 mb-4 px-1">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ background: '#ea00ea' }} />
            <span className="text-xs" style={{ color: '#9ea7b5' }}>Status Trigger</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ background: '#54b0e7' }} />
            <span className="text-xs" style={{ color: '#9ea7b5' }}>Scheduled Trigger</span>
          </div>
          <div className="flex items-center gap-2">
            <GripVertical className="h-3.5 w-3.5" style={{ color: '#5e6a78' }} />
            <span className="text-xs" style={{ color: '#9ea7b5' }}>Drag to reassign trigger</span>
          </div>
        </div>

        {/* Canvas: all columns side by side */}
        <div className="flex gap-4 items-start" style={{ minWidth: 'max-content' }}>
          {/* Status columns */}
          {STATUS_LIST.map(status => (
            <StatusColumn
              key={status.value}
              status={status}
              sequences={statusGroups[status.value] || []}
              templates={templates}
              onToggle={onToggle}
              onDelete={onDelete}
              onAddSequence={onAddSequence}
            />
          ))}

          {/* Divider */}
          <div className="flex-shrink-0 self-stretch flex items-center">
            <div className="w-px self-stretch mx-2" style={{ background: 'rgba(234,0,234,0.2)' }} />
          </div>

          {/* Time-based column */}
          <TimeBasedColumn
            sequences={timeGroups}
            onToggle={onToggle}
            onDelete={onDelete}
            onAddSequence={onAddSequence}
          />
        </div>
      </div>
    </DragDropContext>
  );
}