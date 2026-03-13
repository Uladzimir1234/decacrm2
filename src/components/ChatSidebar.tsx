import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { getChatHistory, sendChatMessage } from '../services/chat';
import type { ChatMessage } from '../types';
import { cn } from '../lib/utils';

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatSidebar({ open, onClose }: ChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      getChatHistory().then(setMessages);
    }
  }, [open]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const reply = await sendChatMessage(text);
    if (reply) {
      setMessages((prev) => [...prev, reply]);
    }
    setLoading(false);
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-96 bg-navy-900 border-l border-navy-700/50 z-50 transition-transform duration-300 flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center gap-2 px-4 h-14 border-b border-navy-700/50 flex-shrink-0">
          <Bot size={18} className="text-accent-light" />
          <span className="font-semibold text-sm text-gray-100">
            Klawdiy AI
          </span>
          <span className="text-xs text-gray-500 ml-1">Assistant</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && !loading && (
            <div className="text-center py-12">
              <Bot size={32} className="mx-auto text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">
                Ask me about deals, sellers, or pipeline status.
              </p>
              <div className="mt-4 space-y-2">
                {[
                  "What's going on with Johnson's deal?",
                  "Show me Paul's worst deals",
                  'Tell Eric to follow up with Smith',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="block w-full text-left text-xs text-gray-400 hover:text-gray-200 bg-navy-800 hover:bg-navy-700 px-3 py-2 rounded-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={12} className="text-accent-light" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-accent text-white rounded-br-sm'
                    : 'bg-navy-800 text-gray-200 rounded-bl-sm'
                )}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-navy-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={12} className="text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Bot size={12} className="text-accent-light" />
              </div>
              <div className="bg-navy-800 px-3 py-2 rounded-xl rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        <div className="p-3 border-t border-navy-700/50 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Klawdiy..."
              className="input-dark flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn-primary px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
