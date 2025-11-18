import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function VoiceInput({ onTranscript, isProcessing }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const [isSupported, setIsSupported] = useState(true);

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
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!isSupported) {
      alert('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={toggleListening}
        disabled={isProcessing || !isSupported}
        className={cn(
          "h-24 w-24 rounded-full transition-all duration-300 shadow-lg",
          isListening 
            ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-red-500/50" 
            : "bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-purple-500/30"
        )}
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
              className="w-1 bg-purple-500 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 30 + 10}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s'
              }}
            />
          ))}
        </div>
      )}

      {transcript && (
        <p className="text-sm text-gray-400 italic animate-fade-in">
          "{transcript}"
        </p>
      )}

      <p className="text-xs text-gray-500">
        {isListening ? 'Listening... Click to stop' : isProcessing ? 'Processing...' : 'Click to speak with Glytch'}
      </p>

      {!isSupported && (
        <p className="text-xs text-red-400">
          Voice input not supported. Use Chrome or Edge browser.
        </p>
      )}
    </div>
  );
}