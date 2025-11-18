import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download, Sparkles, Send } from 'lucide-react';
import VoiceInput from '../components/voice/VoiceInput';
import MessageBubble from '../components/chat/MessageBubble';
import LeadCard from '../components/leads/LeadCard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Dashboard() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filteredLeads, setFilteredLeads] = useState([]);
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
        metadata: { name: 'Lead Search Session' }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Legendary Leads
            </h1>
            <p className="text-gray-400 mt-1">Voice-commanded lead generation powered by Glytch AI</p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl('Import')}>
              <Button variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </Link>
            <Link to={createPageUrl('Leads')}>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Sparkles className="h-4 w-4 mr-2" />
                All Leads
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Panel */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
              <div className="border-b border-gray-800 p-4 bg-gradient-to-r from-gray-900 to-gray-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <span className="text-white font-bold">G</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Glytch AI Butler</h2>
                    <p className="text-xs text-gray-400">Your lead generation assistant</p>
                  </div>
                </div>
              </div>

              <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-900/50 to-gray-950/50">
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

              <div className="border-t border-gray-800 p-4 bg-gray-900/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <VoiceInput 
                    onTranscript={handleVoiceTranscript} 
                    isProcessing={isProcessing}
                  />
                  
                  <div className="w-full flex gap-2">
                    <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
                      <Input
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Or type your request here..."
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                        disabled={isProcessing}
                      />
                      <Button 
                        type="submit" 
                        disabled={isProcessing || !textInput.trim()}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-700 hover:bg-gray-800"
                  onClick={() => sendMessage("Show me influencers with over 10k followers")}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2 text-purple-400" />
                  Find Top Influencers
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-700 hover:bg-gray-800"
                  onClick={() => sendMessage("Find leads with email addresses")}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2 text-blue-400" />
                  Leads with Emails
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-700 hover:bg-gray-800"
                  onClick={() => sendMessage("Show me business accounts with websites")}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2 text-green-400" />
                  Business Accounts
                </Button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-950 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Voice Commands</h3>
              <p className="text-sm text-gray-400 mb-4">Try saying:</p>
              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>"Find fitness coaches in California"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>"Show leads with 50k+ followers"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>"Get me beauty influencers"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
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