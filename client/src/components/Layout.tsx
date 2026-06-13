import React, { useState, useEffect } from 'react';
import { ShieldAlert, Info, WifiOff, Home, BarChart2, Shield } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDeleteAllData?: () => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeGrounding, setActiveGrounding] = useState<'54321' | 'box' | null>(null);
  const [boxStep, setBoxStep] = useState(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Box breathing timer simulation
  useEffect(() => {
    if (activeGrounding !== 'box') return;
    
    const interval = setInterval(() => {
      setBoxStep((prev) => (prev + 1) % 4);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeGrounding]);

  const boxBreathingPhases = [
    { text: 'Breathe In...', sub: 'Slowly through your nose (4s)', bg: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { text: 'Hold...', sub: 'Gently keep air in your lungs (4s)', bg: 'bg-amber-50 border-amber-200 text-amber-700' },
    { text: 'Breathe Out...', sub: 'Slowly through your mouth (4s)', bg: 'bg-teal-50 border-teal-200 text-teal-700' },
    { text: 'Hold Empty...', sub: 'Keep lungs empty before next breath (4s)', bg: 'bg-rose-50 border-rose-200 text-rose-700' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs py-2 px-4 flex items-center justify-center gap-2 font-medium sticky top-0 z-50 shadow-sm animate-pulse">
          <WifiOff size={14} />
          <span>Offline Mode. AI analysis is paused, but quick logs, crisis resource numbers, and grounding scripts are fully functional.</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('today')}>
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
              ME
            </div>
            <div>
              <span className="text-lg font-bold text-slate-800 tracking-tight">MindEase</span>
              <span className="text-[10px] block font-semibold text-brand-600 uppercase tracking-wider -mt-1">Well-being Companion</span>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'today'
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Home size={16} />
              <span className="hidden sm:inline">Today</span>
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'trends'
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart2 size={16} />
              <span className="hidden sm:inline">Trends</span>
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'help'
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Shield size={16} />
              <span className="hidden sm:inline">Resources</span>
            </button>

            {/* Quick SOS Trigger */}
            <button
              onClick={() => setIsSOSOpen(true)}
              className="ml-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide flex items-center gap-1 transition-all hover:scale-105 shadow-md shadow-rose-600/10"
              aria-label="Trigger immediate crisis support"
            >
              <ShieldAlert size={14} />
              <span>SOS HELP</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:py-8">
        {children}
      </main>

      {/* Persistent Disclaimer Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 mt-12 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-slate-600 font-semibold">
            <Info size={14} />
            <span>Non-Clinical companion tool</span>
          </div>
          <p className="leading-relaxed">
            MindEase is an AI well-being companion that provides general stress tracking, pattern insights, and coping recommendations for students preparing for high-stakes Indian exams. It does not provide clinical mental health treatment, medical diagnosis, or therapist intervention.
          </p>
          <p className="font-medium text-slate-600">
            If you are in severe distress or experiencing thoughts of self-harm, please tap the SOS button to access national 24/7 helplines in India.
          </p>
          <div className="pt-2 text-[10px] text-slate-400">
            &copy; {new Date().getFullYear()} MindEase. Your privacy is protected. Anonymous Session data is processed in compliance with student safety protocols.
          </div>
        </div>
      </footer>

      {/* SOS Modal Dialog */}
      {isSOSOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative overflow-y-auto max-h-[90vh]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sos-modal-title"
          >
            <button 
              onClick={() => {
                setIsSOSOpen(false);
                setActiveGrounding(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl font-semibold leading-none p-2 rounded-full hover:bg-slate-50"
              aria-label="Close modal"
            >
              &times;
            </button>

            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert size={26} />
              </div>
              <h2 id="sos-modal-title" className="text-xl font-bold text-slate-800">Emergency Crisis Support</h2>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                If you or a student you know is feeling unsafe or experiencing severe distress, please reach out to these free, confidential, 24/7 Indian helplines:
              </p>
            </div>

            {/* Helplines */}
            <div className="space-y-3 mb-6">
              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Tele-MANAS (Govt of India)</h4>
                  <p className="text-xs text-slate-500">Free, confidential mental health helpline.</p>
                </div>
                <a 
                  href="tel:14416" 
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-600/10"
                >
                  Call 14416
                </a>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">KIRAN (Govt Helpline)</h4>
                  <p className="text-xs text-slate-500">Govt support for mental health rehabilitation.</p>
                </div>
                <a 
                  href="tel:18005990019" 
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-600/10"
                >
                  Call 1800-599-0019
                </a>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">AASRA Helpline</h4>
                  <p className="text-xs text-slate-500">Non-profit suicide prevention network.</p>
                </div>
                <a 
                  href="tel:+919820466726" 
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-600/10"
                >
                  Call +91-9820466726
                </a>
              </div>
            </div>

            {/* Grounding Exercise Picker inside SOS */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="font-semibold text-slate-800 text-sm mb-3">Grounding Exercises (Immediate Relief)</h3>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setActiveGrounding('54321');
                    setBoxStep(0);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                    activeGrounding === '54321'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  5-4-3-2-1 Senses
                </button>
                <button
                  onClick={() => {
                    setActiveGrounding('box');
                    setBoxStep(0);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                    activeGrounding === 'box'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  Box Breathing (4s)
                </button>
              </div>

              {activeGrounding === '54321' && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 animate-fade-in">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide text-indigo-700">5-4-3-2-1 Grounding Method</h4>
                  <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4">
                    <li>Name <strong>5 things</strong> you can see around you.</li>
                    <li>Name <strong>4 things</strong> you can touch.</li>
                    <li>Name <strong>3 things</strong> you can hear.</li>
                    <li>Name <strong>2 things</strong> you can smell.</li>
                    <li>Name <strong>1 thing</strong> you can taste.</li>
                  </ol>
                </div>
              )}

              {activeGrounding === 'box' && (
                <div className={`border rounded-2xl p-4 text-center transition-all duration-500 ${boxBreathingPhases[boxStep].bg} animate-fade-in`}>
                  <div className="w-10 h-10 border-2 border-current rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                    {boxStep + 1}
                  </div>
                  <h4 className="font-bold text-lg">{boxBreathingPhases[boxStep].text}</h4>
                  <p className="text-xs opacity-80 mt-1">{boxBreathingPhases[boxStep].sub}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setIsSOSOpen(false);
                setActiveGrounding(null);
              }}
              className="mt-6 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-semibold transition-all"
            >
              Close Help Center
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
