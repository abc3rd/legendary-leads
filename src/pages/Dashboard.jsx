import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download, Sparkles, Send, Loader2, Menu, X } from 'lucide-react';
import VoiceInput from '../components/voice/VoiceInput';
import MessageBubble from '../components/chat/MessageBubble';
import ChatHistory from '../components/chat/ChatHistory';
import LeadCard from '../components/leads/LeadCard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Dashboard() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    if (conversation?.id) {
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        const msgs = data?.messages || [];
        setMessages(msgs);
        setIsProcessing(msgs.some(m => 
          m?.tool_calls?.some(tc => ['running', 'in_progress', 'pending'].includes(tc?.status))
        ) || false);
      });

      return () => unsubscribe();
    }
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'glytch',
        metadata: { 
          name: 'Lead Search Session',
          created_date: new Date().toISOString()
        }
      });
      
      setConversation(conv);
      setMessages([]);
      
      await base44.agents.addMessage(conv, {
        role: 'assistant',
        content: "👋 Hey there! I'm **Glytch**, your AI butler for lead generation.\n\nI can help you find leads from your database by:\n- **Keywords** in bios, names, or categories\n- **Follower counts** (e.g., \"influencers over 50k\")\n- **Location** using area codes\n- **Categories** or niches\n- Any combination you need\n\nTry saying something like:\n- *\"Find fitness coaches with over 10k followers\"*\n- *\"Show me leads in the 212 area code with email addresses\"*\n- *\"Get me beauty influencers who have a website\"*\n\nWhat leads are you looking for?"
      });
    } catch (error) {
      console.error('Failed to init conversation:', error);
    }
  };

  const loadConversation = async (convoId) => {
    try {
      const conv = await base44.agents.getConversation(convoId);
      setConversation(conv);
      setMessages(conv.messages || []);
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewChat = () => {
    initConversation();
    setShowHistory(false);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || !conversation || isProcessing) return;

    setTextInput('');
    setIsProcessing(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: text
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsProcessing(false);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    sendMessage(transcript);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    sendMessage(textInput);
  };

  return (
    <div className="min-h-screen" style={{ background: '#020813' }}>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="font-bold truncate" style={{ 
              fontFamily: 'Poppins, sans-serif',
              fontSize: 'clamp(1.5rem, 5vw, 3rem)',
              color: '#ffffff',
              fontWeight: 700
            }}>
              Glytch AI Butler
            </h1>
            <p className="mt-1 text-sm md:text-base" style={{ color: '#9ea7b5' }}>Voice-commanded lead generation</p>
          </div>
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="ghost"
            size="icon"
            className="md:hidden"
          >
            {showHistory ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 relative">
          {/* Mobile History Sidebar */}
          {showHistory && (
            <div className="fixed inset-0 z-50 lg:hidden" style={{ background: 'rgba(2, 8, 19, 0.95)' }}>
              <div className="h-full flex flex-col" style={{ background: '#071a2c' }}>
                <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: '#5e6a78' }}>
                  <h2 className="font-semibold" style={{ color: '#ffffff' }}>Chat History</h2>
                  <Button onClick={() => setShowHistory(false)} variant="ghost" size="icon">
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                <ChatHistory 
                  currentConversationId={conversation?.id}
                  onSelectConversation={loadConversation}
                  onNewChat={handleNewChat}
                />
              </div>
            </div>
          )}

          {/* Desktop History Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="rounded-2xl shadow-2xl overflow-hidden h-[calc(100vh-12rem)] sticky top-6" style={{ 
              background: '#071a2c',
              border: '1px solid #5e6a78'
            }}>
              <ChatHistory 
                currentConversationId={conversation?.id}
                onSelectConversation={loadConversation}
                onNewChat={handleNewChat}
              />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4 md:space-y-6">
          {/* Chat Panel */}
          <div>
            <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ 
              background: '#071a2c',
              border: '1px solid #1f6fc5'
            }}>
              <div className="p-3 md:p-4" style={{ 
                borderBottom: '1px solid rgba(31, 111, 197, 0.2)',
                background: 'rgba(7, 26, 44, 0.8)'
              }}>
                <div className="flex items-center gap-3">
                  <img 
                    src="https://storage.googleapis.com/msgsndr/y4ABqxnk279eDc0f5DqY/media/691cfff141c501118d8faf6e.png" 
                    alt="Glytch"
                    className="h-8 w-8 md:h-10 md:w-10 rounded-lg object-cover"
                  />
                  <div>
                    <h2 className="font-semibold text-sm md:text-base" style={{ color: '#ffffff' }}>Glytch AI Butler</h2>
                    <p className="text-xs" style={{ color: '#9ea7b5' }}>Your lead generation assistant</p>
                  </div>
                </div>
              </div>

              <div className="h-[400px] md:h-[500px] overflow-y-auto p-4 md:p-6 space-y-4" style={{ background: '#020813' }}>
                {messages && messages.length > 0 ? (
                  messages.map((message, idx) => (
                    <MessageBubble key={idx} message={message} />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 md:p-4" style={{ 
                borderTop: '1px solid rgba(31, 111, 197, 0.2)',
                background: 'rgba(7, 26, 44, 0.8)'
              }}>
                <div className="flex flex-col items-center gap-3 md:gap-4">
                  <VoiceInput 
                    onTranscript={handleVoiceTranscript} 
                    isProcessing={isProcessing}
                    autoRestart={true}
                  />
                  
                  <div className="w-full flex gap-2">
                    <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
                      <Input
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Or type your request..."
                        style={{
                          background: '#071a2c',
                          borderColor: '#5e6a78',
                          color: '#ffffff'
                        }}
                        className="placeholder:text-[#9ea7b5] text-sm"
                        disabled={isProcessing}
                      />
                      <Button 
                        type="submit" 
                        disabled={isProcessing || !textInput.trim()}
                        className="rounded-full transition-all hover:shadow-lg"
                        size="icon"
                        style={{
                          background: '#1f6fc5',
                          color: '#ffffff'
                        }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats - Hidden on mobile */}
          <div className="hidden md:block space-y-4">
            <div className="rounded-2xl p-4 md:p-6" style={{ 
              background: '#071a2c',
              border: '1px solid rgba(31, 111, 197, 0.3)'
            }}>
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4" style={{ color: '#ffffff' }}>Quick Actions</h3>
              <div className="space-y-2 md:space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-lg transition-all text-sm"
                  style={{
                    borderColor: '#5e6a78',
                    color: '#d7dde5'
                  }}
                  onClick={() => sendMessage("Show me influencers with over 10k followers")}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-2" style={{ color: '#1f6fc5' }} />
                  <span className="truncate">Find Top Influencers</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-lg transition-all"
                  style={{
                    borderColor: '#5e6a78',
                    color: '#d7dde5'
                  }}
                  onClick={() => sendMessage("Find leads with email addresses")}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2" style={{ color: '#1f6fc5' }} />
                  Leads with Emails
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-lg transition-all"
                  style={{
                    borderColor: '#5e6a78',
                    color: '#d7dde5'
                  }}
                  onClick={() => sendMessage("Show me business accounts with websites")}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2" style={{ color: '#26c485' }} />
                  Business Accounts
                </Button>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ 
              background: '#071a2c',
              border: '1px solid rgba(94, 106, 120, 0.3)'
            }}>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#ffffff' }}>Voice Commands</h3>
              <p className="text-sm mb-4" style={{ color: '#9ea7b5' }}>Try saying:</p>
              <ul className="space-y-2 text-xs" style={{ color: '#9ea7b5' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#1f6fc5' }}>•</span>
                  <span>"Find fitness coaches in California"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#1f6fc5' }}>•</span>
                  <span>"Show leads with 50k+ followers"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#1f6fc5' }}>•</span>
                  <span>"Get me beauty influencers"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#1f6fc5' }}>•</span>
                  <span>"Leads in the 310 area code"</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}