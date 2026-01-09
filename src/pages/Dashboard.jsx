import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download, Sparkles, Send, Loader2, Menu, X, LogIn } from 'lucide-react';
import VoiceInput from '../components/voice/VoiceInput';
import MessageBubble from '../components/chat/MessageBubble';
import ChatHistory from '../components/chat/ChatHistory';
import AnimatedHorse from '../components/ui/AnimatedHorse';
import LeadCard from '../components/leads/LeadCard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuthStatus } from '@/components/hooks/useAuthStatus';

export default function Dashboard() {
  const { authState, user, signIn } = useAuthStatus();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (authState === 'signed_in' && !initRef.current) {
      initRef.current = true;
      initConversation();
    }
  }, [authState]);

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
      if (error.response?.status === 401) {
        initRef.current = false;
      }
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
    if (authState === 'signed_in') {
      initConversation();
      setShowHistory(false);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || !conversation || isProcessing || authState !== 'signed_in') return;

    setTextInput('');
    setIsProcessing(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: text
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      if (error.response?.status === 401) {
        initRef.current = false;
      }
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

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1929' }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: '#4acbbf' }} />
          <p style={{ color: '#9ea7b5' }}>Checking session...</p>
        </div>
      </div>
    );
  }

  if (authState === 'signed_out') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a1929' }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ 
          background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
          border: '2px solid #4acbbf'
        }}>
          <AnimatedHorse isThinking={false} className="h-24 w-24 mx-auto mb-6 rounded-xl" />
          <h1 className="text-3xl font-bold mb-4" style={{ 
            fontFamily: 'Poppins, sans-serif',
            background: 'linear-gradient(135deg, #f8d417 0%, #4acbbf 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Sign In Required
          </h1>
          <p className="mb-8" style={{ color: '#9ea7b5' }}>
            You must be signed in to start a conversation with GLYTCH.
          </p>
          <Button
            onClick={signIn}
            className="w-full font-semibold py-6"
            style={{
              background: 'linear-gradient(135deg, #f8d417 0%, #4acbbf 100%)',
              color: '#0a1929'
            }}
          >
            <LogIn className="h-5 w-5 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a1929' }}>
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-8">
          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-4">
            <AnimatedHorse isThinking={isProcessing} className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="font-bold truncate" style={{ 
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(1.25rem, 4vw, 2.5rem)',
                background: 'linear-gradient(135deg, #f8d417 0%, #4acbbf 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800
              }}>
                GLYTCH
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm" style={{ color: '#9ea7b5' }}>AI Lead Butler</p>
            </div>
          </div>
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="ghost"
            size="icon"
            className="lg:hidden flex-shrink-0"
            style={{ color: '#4acbbf' }}
          >
            {showHistory ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 relative">
          {/* Mobile History Sidebar */}
          {showHistory && (
            <div className="fixed inset-0 z-50 lg:hidden" style={{ background: 'rgba(10, 25, 41, 0.98)' }}>
              <div className="h-full flex flex-col" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)' }}>
                <div className="p-3 sm:p-4 flex items-center justify-between border-b" style={{ borderColor: '#4acbbf' }}>
                  <h2 className="font-semibold text-sm sm:text-base" style={{ color: '#f8d417' }}>Chat History</h2>
                  <Button onClick={() => setShowHistory(false)} variant="ghost" size="icon">
                    <X className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#4acbbf' }} />
                  </Button>
                </div>
                <ChatHistory 
                  authState={authState}
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
              background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
              border: '2px solid #4acbbf'
            }}>
              <ChatHistory 
                authState={authState}
                currentConversationId={conversation?.id}
                onSelectConversation={loadConversation}
                onNewChat={handleNewChat}
              />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4 md:space-y-6">
          {/* Chat Panel */}
          <div>
            <div className="rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden" style={{ 
              background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
              border: '2px solid #54b0e7'
            }}>
              <div className="p-2.5 sm:p-3 md:p-4" style={{ 
                borderBottom: '2px solid rgba(74, 203, 191, 0.3)',
                background: 'rgba(10, 25, 41, 0.95)'
              }}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <AnimatedHorse 
                    isThinking={isProcessing}
                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="font-bold text-xs sm:text-sm md:text-base truncate" style={{ color: '#f8d417' }}>GLYTCH</h2>
                    <p className="text-xs truncate" style={{ color: '#9ea7b5' }}>AI Lead Butler</p>
                  </div>
                </div>
              </div>

              <div className="h-[350px] sm:h-[400px] md:h-[500px] overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4" style={{ background: '#0a1929' }}>
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

              <div className="p-2.5 sm:p-3 md:p-4" style={{ 
                borderTop: '2px solid rgba(74, 203, 191, 0.3)',
                background: 'rgba(10, 25, 41, 0.95)'
              }}>
                <div className="flex flex-col items-center gap-3 md:gap-4">
                  <VoiceInput 
                    onTranscript={handleVoiceTranscript} 
                    isProcessing={isProcessing}
                    autoRestart={true}
                  />
                  
                  <div className="w-full flex gap-1.5 sm:gap-2">
                    <form onSubmit={handleTextSubmit} className="flex-1 flex gap-1.5 sm:gap-2">
                      <Input
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type your request..."
                        style={{
                          background: '#0a1929',
                          borderColor: '#4acbbf',
                          color: '#ffffff'
                        }}
                        className="placeholder:text-[#9ea7b5] text-xs sm:text-sm"
                        disabled={isProcessing}
                      />
                      <Button 
                        type="submit" 
                        disabled={isProcessing || !textInput.trim()}
                        className="rounded-full transition-all hover:shadow-xl flex-shrink-0"
                        size="icon"
                        style={{
                          background: 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)',
                          color: '#0a1929'
                        }}
                      >
                        <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats - Hidden on mobile */}
          <div className="hidden lg:block space-y-4">
            <div className="rounded-2xl p-4 md:p-6" style={{ 
              background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
              border: '2px solid #f8d417'
            }}>
              <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4" style={{ color: '#f8d417' }}>Quick Actions</h3>
              <div className="space-y-2 md:space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-lg transition-all text-sm hover:border-2"
                  style={{
                    borderColor: '#54b0e7',
                    color: '#ffffff',
                    background: 'rgba(84, 176, 231, 0.1)'
                  }}
                  onClick={() => sendMessage("Show me influencers with over 10k followers")}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2" style={{ color: '#f8d417' }} />
                  <span className="truncate">Top Influencers</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-lg transition-all hover:border-2"
                  style={{
                    borderColor: '#4acbbf',
                    color: '#ffffff',
                    background: 'rgba(74, 203, 191, 0.1)'
                  }}
                  onClick={() => sendMessage("Find leads with email addresses")}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2" style={{ color: '#4acbbf' }} />
                  Leads with Emails
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-lg transition-all hover:border-2"
                  style={{
                    borderColor: '#f66c25',
                    color: '#ffffff',
                    background: 'rgba(246, 108, 37, 0.1)'
                  }}
                  onClick={() => sendMessage("Show me business accounts with websites")}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2" style={{ color: '#f66c25' }} />
                  Business Accounts
                </Button>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ 
              background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
              border: '2px solid #f66c25'
            }}>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#f66c25' }}>Voice Commands</h3>
              <p className="text-sm mb-4" style={{ color: '#9ea7b5' }}>Try saying:</p>
              <ul className="space-y-2 text-xs" style={{ color: '#d7dde5' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#f8d417' }}>•</span>
                  <span>"Find fitness coaches in California"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#4acbbf' }}>•</span>
                  <span>"Show leads with 50k+ followers"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#54b0e7' }}>•</span>
                  <span>"Get me beauty influencers"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#f66c25' }}>•</span>
                  <span>"Leads in the 310 area code"</span>
                </li>
              </ul>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}