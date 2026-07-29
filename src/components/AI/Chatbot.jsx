import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Sparkles, Bot } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const quickPrompts = [
  'When are my exams?',
  'Show my timetable',
  "What's my attendance?",
  'How do I pay fees?',
  'Upcoming campus events',
  'Latest circulars',
];

export default function Chatbot({ isOpen, onToggle, user, role }) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hello! I'm CampusAI, your smart campus assistant. Ask me anything about your exams, timetable, attendance, fees, or campus events.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (role !== 'student' || !user) return;
    supabase.from('students').select('department, semester').eq('student_id', user.id).single()
      .then(({ data }) => setStudentInfo(data));
  }, [user, role]);

  const sendToAI = async (text) => {
    const question = text || input;
    if (!question.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const context = {
        role: role || 'student',
        userId: user?.id,
        department: studentInfo?.department,
        semester: studentInfo?.semester,
      };

      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, context }),
      });

      if (!res.ok) throw new Error('Server error');

      const { reply } = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I had trouble connecting. The AI server might not be running.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-purple-500 text-white shadow-xl shadow-accent/30 flex items-center justify-center hover:scale-105 transition-transform duration-200 animate-pulse-glow"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[540px] bg-surface-900 border border-surface-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 bg-surface-800/80 border-b border-surface-700/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">CampusAI</h4>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="text-[10px] text-surface-500">Online</span>
                </div>
              </div>
              <span className="badge-accent text-[10px] flex items-center gap-1 ml-1">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-accent text-white rounded-2xl rounded-br-md'
                    : 'bg-surface-800 text-surface-200 rounded-2xl rounded-bl-md border border-surface-700/30'
                } px-4 py-2.5`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-surface-800 text-surface-400 rounded-2xl rounded-bl-md border border-surface-700/30 px-4 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-surface-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-surface-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-surface-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 pb-2">
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendToAI(p)}
                  className="px-3 py-1.5 rounded-full bg-surface-800/60 border border-surface-700/30 text-xs text-surface-400 hover:text-white hover:border-accent/30 whitespace-nowrap transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendToAI()}
                placeholder="Ask about campus..."
                className="input-field text-sm"
              />
              <button
                onClick={() => sendToAI()}
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
