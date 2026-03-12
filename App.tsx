
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Plus, 
  Trash2, 
  GraduationCap, 
  History, 
  Menu, 
  X, 
  Camera, 
  FileUp, 
  Sparkles,
  Info,
  BookMarked,
  LayoutDashboard
} from 'lucide-react';
import { Message, MessageRole, ExamMode, ChatSession } from './types';
import { getGeminiResponse } from './services/geminiService';
import { ExamModeToggle } from './components/ExamModeToggle';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [examMode, setExamMode] = useState<ExamMode>(ExamMode.NORMAL);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize first session
  useEffect(() => {
    const saved = localStorage.getItem('vtu_study_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
    } else {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vtu_study_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, currentSessionId, isLoading]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Study Topic',
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: "👋 Hello VTU Engineer! I'm your Smart Study Assistant. Need help with a syllabus topic, previous year questions, or a 10-mark answer? Just ask!",
          timestamp: Date.now(),
        }
      ],
      updatedAt: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedImage) || isLoading || !currentSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: Date.now(),
      imageData: attachedImage || undefined
    };

    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (!currentSession) return;

    const updatedSessions = sessions.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: [...s.messages, userMessage],
          updatedAt: Date.now(),
          title: s.title === 'New Study Topic' ? (inputText.slice(0, 30) || 'Image Analysis') : s.title
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    setInputText('');
    setAttachedImage(null);
    setIsLoading(true);

    // Prepare history for API
    const history = currentSession.messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

    const response = await getGeminiResponse(userMessage.content, examMode, history, userMessage.imageData);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
    };

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: [...s.messages, assistantMessage],
          updatedAt: Date.now()
        };
      }
      return s;
    }));
    setIsLoading(false);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xl">
              <GraduationCap className="w-8 h-8" />
              <span>VTU Buddy</span>
            </div>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="p-4">
            <button 
              onClick={createNewSession}
              className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 rounded-xl border-2 border-dashed border-blue-200 font-semibold hover:bg-blue-100 transition-colors"
            >
              <Plus size={20} />
              New Topic
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">
              <History size={14} />
              Study History
            </div>
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => {
                  setCurrentSessionId(s.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border
                  ${currentSessionId === s.id 
                    ? 'bg-blue-50 border-blue-200 text-blue-800' 
                    : 'bg-white border-transparent hover:bg-slate-50 text-slate-600 hover:border-slate-200'}
                `}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2 rounded-lg ${currentSessionId === s.id ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
                    <BookMarked size={16} />
                  </div>
                  <span className="truncate text-sm font-medium">{s.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center gap-3 text-slate-500 text-sm">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                VTU
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-700">Student Portal</span>
                <span className="text-[10px]">Academic Year 2024-25</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 lg:px-8">
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="font-bold text-lg truncate flex items-center gap-2">
              <Sparkles className="text-yellow-500 fill-yellow-500" size={20} />
              {currentSession?.title || 'Study Assistant'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               AI Tutor Online
             </div>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-6 lg:p-8"
        >
          {currentSession?.messages.map((m, idx) => (
            <div 
              key={m.id} 
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[90%] lg:max-w-[80%] rounded-3xl p-4 lg:p-6 shadow-sm
                ${m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'}
              `}>
                {m.imageData && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 bg-black/5">
                    <img src={m.imageData} alt="Uploaded problem" className="max-h-80 w-full object-contain" />
                  </div>
                )}
                <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert' : ''}`}>
                  {m.content.split('\n').map((line, i) => (
                    <p key={i} className={line.trim() === '' ? 'h-2' : 'mb-2'}>
                      {line}
                    </p>
                  ))}
                </div>
                <div className={`mt-2 text-[10px] uppercase font-bold tracking-widest opacity-40 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 rounded-3xl rounded-bl-none p-6 shadow-sm max-w-[80%]">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                </div>
                <p className="mt-3 text-xs text-slate-400 font-medium italic">Preparing your exam-oriented notes...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Area with Sticky Toggle and Input */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4 lg:px-8 pb-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Mode Selection */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Study Mode:</span>
              <ExamModeToggle currentMode={examMode} onModeChange={setExamMode} />
              <div className="group relative">
                <Info size={16} className="text-slate-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[11px] p-3 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
                  Select a mode to change how the AI answers. "10 Marks" gives detailed structural answers ideal for VTU theory papers.
                </div>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative group">
              {attachedImage && (
                <div className="absolute bottom-full left-0 mb-4 p-2 bg-white rounded-xl shadow-xl border border-blue-200 flex items-center gap-3">
                  <img src={attachedImage} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-blue-700">Image Attached</span>
                    <button 
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="text-[10px] text-red-500 font-bold uppercase hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-end gap-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-200 group-focus-within:border-blue-400 group-focus-within:ring-4 group-focus-within:ring-blue-100 transition-all">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  title="Upload image or snap question paper"
                >
                  <Camera size={24} />
                </button>
                
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask a question (e.g., 'Explain Quick Sort with an example' or 'Module 2 MOS Transistor')..."
                  className="flex-1 max-h-40 min-h-[48px] py-3 bg-transparent border-none focus:ring-0 text-slate-700 resize-none font-medium text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />

                <button
                  type="submit"
                  disabled={isLoading || (!inputText.trim() && !attachedImage)}
                  className={`
                    p-3 rounded-xl transition-all flex items-center justify-center
                    ${isLoading || (!inputText.trim() && !attachedImage)
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-105 active:scale-95'}
                  `}
                >
                  <Send size={24} />
                </button>
              </div>
            </form>
            
            <p className="text-[10px] text-center text-slate-400 font-medium">
              Academic Support Tool • Always verify complex formulas with official VTU textbooks like <i>The Text Book of Engineering Physics</i> or <i>M. Morris Mano</i>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
