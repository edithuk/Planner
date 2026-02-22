import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTripStore } from '../store/tripStore';
import type { Trip } from '../types';

type Message = { role: 'user' | 'assistant'; content: string };

function serializeTripForApi(trip: Trip) {
  return {
    name: trip.name,
    wishlist: trip.wishlist.map((p) => ({
      name: p.name,
      placeId: p.placeId,
      lat: p.lat,
      lng: p.lng,
      recommendedFor: p.recommendedFor,
      instructions: p.instructions,
    })),
    todo: trip.todo.map((p) => ({
      name: p.name,
      placeId: p.placeId,
      lat: p.lat,
      lng: p.lng,
      recommendedFor: p.recommendedFor,
      instructions: p.instructions,
    })),
    recommendedPlaces: trip.recommendedPlaces.map((p) => ({
      name: p.name,
      placeId: p.placeId,
      lat: p.lat,
      lng: p.lng,
      recommendedFor: p.recommendedFor,
      instructions: p.instructions,
    })),
    days: trip.days.map((d) => ({
      name: d.name,
      items: d.items.map((p) => ({
        name: p.name,
        placeId: p.placeId,
        lat: p.lat,
        lng: p.lng,
        recommendedFor: p.recommendedFor,
        instructions: p.instructions,
      })),
    })),
  };
}

export function Chatbot() {
  const { trips, selectedTripId, createItinerary } = useTripStore();
  const selectedTrip = trips.find((t) => t.id === selectedTripId);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    setError(null);

    try {
      const tripData = selectedTrip ? serializeTripForApi(selectedTrip) : undefined;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          tripData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Request failed: ${res.status}`);
      }

      const assistantText = data.text ?? data.response ?? 'No response received.';
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);

      if (data.itinerary && Array.isArray(data.itinerary) && selectedTripId) {
        createItinerary(selectedTripId, data.itinerary);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get response';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, something went wrong: ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`fixed z-50 flex flex-col transition-all duration-200 ease-out
          bottom-20 right-4 left-4 md:bottom-6 md:left-auto md:right-6 md:w-[320px]
          ${isOpen ? 'h-[70dvh] md:h-[400px]' : 'h-0 overflow-hidden md:h-0'}`}
      >
        <div
          className={`flex flex-col flex-1 min-h-0 rounded-t-xl md:rounded-xl
            bg-zinc-900 border border-zinc-700 shadow-xl overflow-hidden
            ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-zinc-700 bg-zinc-800">
            <h3 className="font-semibold text-zinc-100">Trip Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-sm text-zinc-500">
                Ask about places, get suggestions, or say &quot;Create an itinerary from my wishlist&quot; to plan your trip.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none [&_a]:text-blue-400 [&_a]:underline [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl px-3 py-2 bg-zinc-800 border border-zinc-700">
                  <span className="inline-flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 p-3 border-t border-zinc-700">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about places, get suggestions, or create itinerary..."
                rows={1}
                disabled={loading}
                className="flex-1 min-h-[40px] max-h-24 py-2 px-3 rounded-lg bg-zinc-800 border border-zinc-600
                  text-zinc-200 placeholder-zinc-500 text-sm resize-none focus:outline-none focus:ring-1
                  focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700
                  disabled:cursor-not-allowed text-white text-sm font-medium transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`fixed z-50 flex items-center justify-center w-12 h-12 rounded-full
          bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all
          bottom-20 right-4 md:bottom-6 md:right-6
          ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </>
  );
}
