import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function VoiceInput({ onTranscript, isProcessing, autoRestart = false }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isActive, setIsActive] = useState(false);
  const recognitionRef = useRef(null);
  const [isSupported, setIsSupported] = useState(true);
  const autoRestartRef = useRef(autoRestart);

  useEffect(() => {
    autoRestartRef.current = autoRestart;
  }, [autoRestart]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);

        if (event.results[current].isFinal) {
          onTranscript(transcriptText);
          setTranscript('');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setIsActive(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  useEffect(() => {
    if (!isProcessing && isActive && !isListening && autoRestartRef.current) {
      const timer = setTimeout(() => {
        if (recognitionRef.current && isActive) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {
            console.error('Failed to restart recognition:', e);
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, isActive, isListening]);

  const toggleListening = () => {
    if (!isSupported) {
      alert('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isActive) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setIsActive(false);
    } else {
      setTranscript('');
      setIsActive(true);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={toggleListening}
        disabled={isProcessing || !isSupported}
        className="h-24 w-24 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
        style={{
          background: isActive ? (isListening ? '#c0392b' : '#1f6fc5') : 'linear-gradient(135deg, #1f6fc5 0%, #26c485 100%)',
          animation: isListening ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
        }}
        size="icon"
      >
        {isProcessing ? (
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        ) : isListening ? (
          <MicOff className="h-10 w-10 text-white" />
        ) : (
          <Mic className="h-10 w-10 text-white" />
        )}
      </Button>

      {isListening && (
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full animate-pulse"
              style={{
                background: '#1f6fc5',
                height: `${Math.random() * 30 + 10}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s'
              }}
            />
          ))}
        </div>
      )}

      {transcript && (
        <p className="text-sm italic animate-fade-in" style={{ color: '#9ea7b5' }}>
          "{transcript}"
        </p>
      )}

      <p className="text-xs" style={{ color: '#9ea7b5' }}>
        {isListening ? 'Listening...' : isProcessing ? 'Glytch is thinking...' : isActive ? 'Hands-free mode active' : 'Tap to start conversation'}
      </p>
      {isActive && (
        <p className="text-xs font-medium" style={{ color: '#26c485' }}>
          🎤 Hands-free mode ON - Tap button to end
        </p>
      )}

      {!isSupported && (
        <p className="text-xs" style={{ color: '#c0392b' }}>
          Voice input not supported. Use Chrome or Edge browser.
        </p>
      )}
    </div>
  );
}