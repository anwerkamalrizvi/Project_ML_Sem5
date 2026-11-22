import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, TripPlan, AppPage } from '../types';
import { streamChatResponse } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface ChatPageProps {
  tripPlan: TripPlan | null;
  onNavigate: (page: AppPage) => void;
}

const QUICK_QUESTIONS = [
  '🌦️ What is the weather like during my trip?',
  '💡 What are the top hidden gems to visit?',
  '🚌 How do I get around using public transport?',
  '💱 What is the current exchange rate and tipping culture?',
  '🍜 What local dishes must I try?',
  '📵 Do I need a local SIM card or eSIM?',
  '🛡️ How safe is it for solo travelers?',
  '🧳 What should I know about customs and etiquette?',
];

export default function ChatPage({ tripPlan, onNavigate }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: tripPlan
        ? `👋 Hello! I'm your **Traveler AI** assistant, ready to help with your trip to **${tripPlan.destination}**!\n\nI have full context of your personalized travel plan. Ask me anything about:\n- 🗺️ Itinerary adjustments and recommendations\n- 💰 Budget tips and cost-saving strategies\n- ⚠️ Safety advice and local precautions\n- 🍜 Food, culture, and local etiquette\n- 🚗 Transportation and getting around\n- 📋 Visa, health, and travel requirements\n\nWhat would you like to know?`
        : `👋 Hello! I'm your **Traveler AI** assistant!\n\nI'm here to help you plan amazing trips anywhere in the world. You can ask me about:\n- 🌍 Any destination in the world\n- 💰 Budget planning and cost estimates\n- 📋 Visa and travel requirements\n- ⚠️ Safety information\n- 🗺️ Itinerary suggestions\n- 🍜 Local food and culture\n\n**Pro tip:** [Plan a specific trip](/) first for a fully personalized experience!\n\nWhat would you like to know?`,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef(false);

  // BUG-10 fix: use a ref for messages so the streaming closure always reads
  // the latest value without needing messages in its dependency array.
  const messagesRef = useRef<ChatMessage[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    // Use functional update so we don't capture stale messages
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    setError('');
    abortRef.current = false;

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, assistantMsg]);

    try {
      // BUG-10 fix: use messagesRef to get up-to-date history, then append
      // the new user message for the API call.
      const history = messagesRef.current
        .filter(m => m.role === 'user' || (m.role === 'assistant' && m.content))
        .concat(userMsg);

      let fullResponse = '';

      for await (const chunk of streamChatResponse(history, tripPlan || undefined)) {
        if (abortRef.current) break;
        fullResponse += chunk;
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: fullResponse } : m)
        );
      }

      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m)
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to get response';
      setError(errMsg);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `⚠️ Error: ${errMsg}`, isStreaming: false }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isStreaming, tripPlan]); // BUG-10 fix: 'messages' removed from deps

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pt-16">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <h1 className="font-bold text-white">
                Traveler AI {tripPlan ? `— ${tripPlan.destination}` : '— Global Assistant'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Powered by Gemini 2.5 Flash · Streaming
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tripPlan && (
              <button
                onClick={() => onNavigate('results')}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700 transition-colors border border-slate-700"
              >
                📋 View Plan
              </button>
            )}
            <button
              onClick={() => onNavigate('planner')}
              className="px-3 py-1.5 bg-sky-500/10 text-sky-400 rounded-lg text-xs hover:bg-sky-500/20 transition-colors border border-sky-500/20"
            >
              ✈️ Plan Trip
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
                  : 'bg-gradient-to-br from-sky-400 to-blue-600'
              }`}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-5 py-4 rounded-2xl leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-tr-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-sky-400">
                      <ReactMarkdown>{msg.content || (msg.isStreaming ? '' : '...')}</ReactMarkdown>
                      {msg.isStreaming && (
                        <span className="inline-flex gap-1 ml-1">
                          <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      )}
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                <span className="text-slate-600 text-xs px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-slate-500 text-xs mb-2 px-1">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q.slice(3).trim())}
                  disabled={isStreaming}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-xs hover:border-sky-500/40 hover:text-sky-400 transition-all disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 pb-2">
          <div className="max-w-4xl mx-auto p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-slate-900/95 backdrop-blur border-t border-slate-800 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tripPlan ? `Ask anything about your ${tripPlan.destination} trip...` : 'Ask about any destination, budget, visa requirements...'}
                rows={1}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-colors resize-none min-h-[48px] max-h-32 overflow-y-auto"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 128) + 'px';
                }}
                disabled={isStreaming}
              />
            </div>
            {isStreaming ? (
              <button
                onClick={() => { abortRef.current = true; setIsStreaming(false); }}
                className="w-12 h-12 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors flex items-center justify-center flex-shrink-0"
              >
                ⏹
              </button>
            ) : (
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-400 hover:to-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-slate-600 text-xs mt-2 text-center">
            Press Enter to send · Shift+Enter for new line · AI may make mistakes — verify critical info
          </p>
        </div>
      </div>
    </div>
  );
}
