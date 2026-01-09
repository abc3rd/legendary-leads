import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Trash2, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import moment from 'moment';

export default function ChatHistory({ authState, currentConversationId, onSelectConversation, onNewChat }) {
  const [conversations, setConversations] = useState([]);
  const [groupedConvos, setGroupedConvos] = useState({});
  const [expandedDates, setExpandedDates] = useState(new Set(['Today']));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authState === 'signed_in') {
      loadConversations();
    } else {
      setIsLoading(false);
    }
  }, [authState]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const convos = await base44.agents.listConversations({
        agent_name: 'glytch'
      });

      const sorted = (convos || []).sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );

      setConversations(sorted);
      groupByDate(sorted);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      if (error.response?.status === 401) {
        setConversations([]);
        setGroupedConvos({});
      }
    } finally {
      setIsLoading(false);
    }
  };

  const groupByDate = (convos) => {
    const groups = {};
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');

    convos.forEach(convo => {
      const date = moment(convo.created_date);
      let label;

      if (date.isSame(today, 'day')) {
        label = 'Today';
      } else if (date.isSame(yesterday, 'day')) {
        label = 'Yesterday';
      } else if (date.isAfter(moment().subtract(7, 'days'))) {
        label = 'Last 7 Days';
      } else if (date.isAfter(moment().subtract(30, 'days'))) {
        label = 'Last 30 Days';
      } else {
        label = date.format('MMMM YYYY');
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(convo);
    });

    setGroupedConvos(groups);
  };

  const toggleDateGroup = (label) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const deleteConversation = async (convoId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;

    try {
      await base44.agents.deleteConversation(convoId);
      await loadConversations();
      if (convoId === currentConversationId) {
        onNewChat();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getPreviewText = (convo) => {
    const firstUserMsg = convo.messages?.find(m => m.role === 'user');
    return firstUserMsg?.content?.substring(0, 40) || 'New conversation';
  };

  if (authState !== 'signed_in') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm" style={{ color: '#9ea7b5' }}>
          Sign in to view chat history
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center" style={{ color: '#9ea7b5' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b" style={{ borderColor: '#5e6a78' }}>
        <Button 
          onClick={onNewChat}
          className="w-full font-semibold"
          style={{
            background: 'linear-gradient(135deg, #f8d417 0%, #4acbbf 100%)',
            color: '#0a1929'
          }}
        >
          + New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedConvos).length === 0 ? (
          <div className="p-4 text-center text-sm" style={{ color: '#9ea7b5' }}>
            No conversations yet
          </div>
        ) : (
          Object.entries(groupedConvos).map(([label, convos]) => (
            <div key={label} className="mb-2">
              <button
                onClick={() => toggleDateGroup(label)}
                className="w-full px-3 sm:px-4 py-2 flex items-center gap-2 hover:bg-opacity-50 transition-all"
                style={{ background: 'rgba(74, 203, 191, 0.1)' }}
              >
                {expandedDates.has(label) ? (
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#4acbbf' }} />
                ) : (
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#4acbbf' }} />
                )}
                <span className="text-xs sm:text-sm font-semibold" style={{ color: '#f8d417' }}>
                  {label} ({convos.length})
                </span>
              </button>

              {expandedDates.has(label) && (
                <div className="space-y-1 px-2">
                  {convos.map(convo => (
                    <button
                      key={convo.id}
                      onClick={() => onSelectConversation(convo.id)}
                      className={cn(
                        "w-full px-2 sm:px-3 py-2 rounded-lg flex items-start gap-2 group transition-all text-left",
                        convo.id === currentConversationId
                          ? "bg-opacity-100"
                          : "hover:bg-opacity-50"
                      )}
                      style={{
                        background: convo.id === currentConversationId 
                          ? 'rgba(84, 176, 231, 0.3)' 
                          : 'rgba(10, 25, 41, 0.2)',
                        borderLeft: convo.id === currentConversationId ? '3px solid #f8d417' : 'none'
                      }}
                    >
                      <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" style={{ color: '#54b0e7' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm truncate" style={{ color: '#d7dde5' }}>
                          {getPreviewText(convo)}
                        </p>
                        <p className="text-xs" style={{ color: '#9ea7b5' }}>
                          {moment(convo.created_date).format('MMM D, h:mm A')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteConversation(convo.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-600/20 rounded flex-shrink-0"
                      >
                        <Trash2 className="h-3 w-3" style={{ color: '#f66c25' }} />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}