"use client";

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatBoxProps {
  messages: { sender: 'me' | 'partner'; text: string }[];
  onSendMessage: (text: string) => void;
  onTyping?: (isTyping: boolean) => void;
  isPartnerTyping?: boolean;
  disabled?: boolean;
}

export function ChatBox({ messages, onSendMessage, onTyping, isPartnerTyping, disabled }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input);
      setInput('');
      // Stop typing indicator when message sent
      onTyping?.(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (!onTyping) return;
    // Emit typing start
    onTyping(true);
    // Debounce: stop typing indicator after 1.5s of no keystrokes
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-full flex-col glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-dark-900/50 p-4 border-b border-white/5">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${disabled ? 'bg-slate-500' : 'bg-brand-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${disabled ? 'bg-slate-500' : 'bg-brand-500'}`}></span>
          </span>
          Live Chat
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
            Say hi to stranger! 👋
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.sender === 'me'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-dark-700 text-slate-200 rounded-tl-sm'
                }`}
              >
                <p className="text-sm break-words">{msg.text}</p>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isPartnerTyping && (
          <div className="flex justify-start">
            <div className="bg-dark-700 text-slate-400 rounded-2xl rounded-tl-sm px-4 py-2 flex items-center gap-1.5">
              <span className="text-xs italic">Stranger is typing</span>
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-dark-800/50 border-t border-white/5 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder={disabled ? "Waiting for stranger..." : "Type a message..."}
          className="flex-1 rounded-xl border border-white/10 bg-dark-900/50 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-500 disabled:bg-dark-700 disabled:text-slate-500"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
