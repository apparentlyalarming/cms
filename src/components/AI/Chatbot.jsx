import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Sparkles, Bot, User, Minimize2 } from 'lucide-react';
import { chatbotFAQ } from '../../data';

const quickPrompts = [
  'When are mid-sem exams?',
  'How do I pay fees?',
  "What's the attendance requirement?",
  'Hostel leave procedure?',
  'When does placement start?',
  'Library timings?',
];

export default function Chatbot({ isOpen, onToggle }) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hello! I'm CampusAI, your smart campus assistant. Ask me anything about fees, schedules, policies, or use the quick prompts below.",
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const findAnswer = (question) => {
    const q = question.toLowerCase();
    for (const faq of chatbotFAQ) {
      if (q.includes(faq.q.toLowerCase().slice(0, 10))) {
        return faq.a;
      }
    }
    const keywords = {
      fee: 'Fees can be paid through the student portal under Fee Status > Pay Now, or via the college banking portal. UPI, net banking, and card payments are accepted.',
      exam: 'Mid-semester exams begin on August 12, 2026. Check the exam schedule circular for your individual timetable.',
      attend: 'A minimum of 75% attendance is required in each subject to be eligible for end-semester examinations.',
      hostel: 'Submit a leave/pass request through the Hostel Management section. Night outs require warden approval 24 hours in advance.',
      place: 'Placement season begins in August for final-year students. TCS is the first company visiting on August 25, 2026.',
      library: 'The library is open 8:00 AM - 8:00 PM on regular days, and extended to midnight during exam periods (Aug 10 - Aug 25).',
      password: "Click 'Forgot Password' on the login page and use your registered email. If issues persist, contact IT support at helpdesk@campus.edu.",
      mess: 'The updated mess menu is available in the Circulars section. New continental options on weekends and a Jain food counter have been added.',
    };
    for (const [key, answer] of Object.entries(keywords)) {
      if (q.includes(key)) return answer;
    }
    return "I'm not sure about that. Try asking about fees, exams, attendance, hostel, placements, library, or portal access. You can also check the Circulars section for official announcements.";
  };

  const sendMessage = (text) => {
    const question = text || input;
    if (!question.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setInput('');

    setTimeout(() => {
      const answer = findAnswer(question);
      setMessages(prev => [...prev, { role: 'bot', text: answer }]);
    }, 500 + Math.random() * 500);
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
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 pb-2">
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p)}
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
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about campus..."
                className="input-field text-sm"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
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
