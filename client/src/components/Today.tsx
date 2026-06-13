import { useState, useEffect } from 'react';
import { 
  Smile, 
  ArrowRight, 
  Send, 
  Clock, 
  MessageSquare,
  Compass,
  AlertCircle
} from 'lucide-react';

interface TodayProps {
  exam: string;
  localOnly: boolean;
  onEntryLogged: () => void;
}

interface Entry {
  id: string;
  date: string;
  mood: number;
  emotions: string[];
  tags: string[];
  journal: string;
  quickLog: boolean;
  themes: string[];
  detectedStressors: string[];
  reflection: string;
  copingStrategy: string;
  mindfulnessExercise: string;
  safetyFlag: 'none' | 'elevated' | 'crisis';
}

const EMOTIONS = [
  // High Unpleasant (Stressed, Anxious)
  { word: 'anxious', quadrant: 'high_unpleasant', label: 'Anxious', color: 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/50' },
  { word: 'overwhelmed', quadrant: 'high_unpleasant', label: 'Overwhelmed', color: 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/50' },
  { word: 'panicked', quadrant: 'high_unpleasant', label: 'Panicked', color: 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/50' },
  { word: 'frustrated', quadrant: 'high_unpleasant', label: 'Frustrated', color: 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/50' },
  { word: 'restless', quadrant: 'high_unpleasant', label: 'Restless', color: 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/50' },
  { word: 'pressured', quadrant: 'high_unpleasant', label: 'Pressured', color: 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/50' },

  // Low Unpleasant (Drained, Defeated)
  { word: 'drained', quadrant: 'low_unpleasant', label: 'Drained', color: 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200/50' },
  { word: 'hopeless', quadrant: 'low_unpleasant', label: 'Hopeless', color: 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200/50' },
  { word: 'lonely', quadrant: 'low_unpleasant', label: 'Lonely', color: 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200/50' },
  { word: 'defeated', quadrant: 'low_unpleasant', label: 'Defeated', color: 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200/50' },
  { word: 'foggy', quadrant: 'low_unpleasant', label: 'Foggy', color: 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200/50' },
  { word: 'numb', quadrant: 'low_unpleasant', label: 'Numb', color: 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200/50' },

  // Low Pleasant (Calm, Grateful)
  { word: 'calm', quadrant: 'low_pleasant', label: 'Calm', color: 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100/50' },
  { word: 'relieved', quadrant: 'low_pleasant', label: 'Relieved', color: 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100/50' },
  { word: 'content', quadrant: 'low_pleasant', label: 'Content', color: 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100/50' },
  { word: 'rested', quadrant: 'low_pleasant', label: 'Rested', color: 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100/50' },
  { word: 'grateful', quadrant: 'low_pleasant', label: 'Grateful', color: 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100/50' },
  { word: 'at_ease', quadrant: 'low_pleasant', label: 'At Ease', color: 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100/50' },

  // High Pleasant (Motivated, Focused)
  { word: 'motivated', quadrant: 'high_pleasant', label: 'Motivated', color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100/50' },
  { word: 'hopeful', quadrant: 'high_pleasant', label: 'Hopeful', color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100/50' },
  { word: 'focused', quadrant: 'high_pleasant', label: 'Focused', color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100/50' },
  { word: 'confident', quadrant: 'high_pleasant', label: 'Confident', color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100/50' },
  { word: 'excited', quadrant: 'high_pleasant', label: 'Excited', color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100/50' },
  { word: 'proud', quadrant: 'high_pleasant', label: 'Proud', color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100/50' }
];

const TAGS = [
  { value: 'exam_pressure', label: 'Exam Pressure' },
  { value: 'mock_test', label: 'Mock Test' },
  { value: 'results', label: 'Results' },
  { value: 'parents', label: 'Parental Pressure' },
  { value: 'comparison', label: 'Peer Comparison' },
  { value: 'sleep', label: 'Poor Sleep' },
  { value: 'focus', label: 'Focus Issues' },
  { value: 'self_doubt', label: 'Self Doubt' },
  { value: 'time_management', label: 'Time Crunch' },
  { value: 'health', label: 'Health Issues' },
  { value: 'other', label: 'Other Stress' }
];

const NUDGES = [
  "How are you feeling about your studies or upcoming mock tests?",
  "What is the biggest source of pressure you are navigating today?",
  "Did you notice any positive moments in your study blocks today?",
  "Describe how you feel right now after your mock tests or study hours."
];

export default function Today({ exam, localOnly, onEntryLogged }: TodayProps) {
  // Selection states
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [journalText, setJournalText] = useState('');
  const [randomPrompt, setRandomPrompt] = useState('');

  // UI Flow states
  const [isLoading, setIsLoading] = useState(false);
  const [loggedEntry, setLoggedEntry] = useState<Entry | null>(null);

  // Companion Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Box breathing state for crisis mode
  const [boxStep, setBoxStep] = useState(0);

  useEffect(() => {
    // Generate a random nudge prompt
    setRandomPrompt(NUDGES[Math.floor(Math.random() * NUDGES.length)]);
  }, [loggedEntry]);

  // Box breathing timer in crisis
  useEffect(() => {
    if (!loggedEntry || loggedEntry.safetyFlag === 'none') return;
    const interval = setInterval(() => {
      setBoxStep((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, [loggedEntry]);

  const toggleEmotion = (word: string) => {
    setSelectedEmotions(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
  };

  const toggleTag = (value: string) => {
    setSelectedTags(prev =>
      prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
    );
  };

  const saveEntryLocally = (entry: Entry) => {
    try {
      const localData = localStorage.getItem('local_entries');
      const entries = localData ? JSON.parse(localData) : [];
      entries.push(entry);
      localStorage.setItem('local_entries', JSON.stringify(entries));
    } catch (err) {
      console.error('Failed to save entry in localStorage:', err);
    }
  };

  // Quick log flow: skips AI analysis, saves immediately
  const handleQuickLog = async () => {
    if (selectedEmotions.length === 0) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotions: selectedEmotions,
          tags: selectedTags,
          journal: '',
          exam,
          localOnly
        })
      });

      const data = await response.json();
      if (response.ok && data.entry) {
        if (localOnly) {
          saveEntryLocally(data.entry);
        }
        setLoggedEntry(data.entry);
        onEntryLogged();
      }
    } catch (error) {
      console.error('Quick log error:', error);
      // Client-only fallback in case of connection failure
      const fallbackEntry: Entry = {
        id: Math.random().toString(),
        date: new Date().toISOString().split('T')[0],
        mood: 3,
        emotions: selectedEmotions,
        tags: selectedTags,
        journal: '',
        quickLog: true,
        themes: [],
        detectedStressors: [],
        reflection: 'Quick mood logged locally. Make sure to take regular deep breaths.',
        copingStrategy: '',
        mindfulnessExercise: '',
        safetyFlag: 'none'
      };
      saveEntryLocally(fallbackEntry);
      setLoggedEntry(fallbackEntry);
    } finally {
      setIsLoading(false);
    }
  };

  // Full Log analysis flow
  const handleAnalyzeLog = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotions: selectedEmotions,
          tags: selectedTags,
          journal: journalText,
          exam,
          localOnly
        })
      });

      const data = await response.json();
      if (response.ok && data.entry) {
        if (localOnly) {
          saveEntryLocally(data.entry);
        }
        setLoggedEntry(data.entry);
        onEntryLogged();
      }
    } catch (error) {
      console.error('Entry analysis error:', error);
      // Fallback response for complete network or API crash
      const fallbackEntry: Entry = {
        id: Math.random().toString(),
        date: new Date().toISOString().split('T')[0],
        mood: 3,
        emotions: selectedEmotions,
        tags: selectedTags,
        journal: journalText,
        quickLog: false,
        themes: selectedTags,
        detectedStressors: selectedTags,
        reflection: 'Thank you for writing. Even when the server connection is weak, remember that your efforts matter and resting is part of the process.',
        copingStrategy: 'Write down 3 tiny tasks for today, complete just one, and cross off the rest.',
        mindfulnessExercise: 'Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds. Repeat 3 times.',
        safetyFlag: 'none'
      };
      saveEntryLocally(fallbackEntry);
      setLoggedEntry(fallbackEntry);
    } finally {
      setIsLoading(false);
    }
  };

  // Companion chat message submission
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');

    const updatedHistory = [...chatMessages, { role: 'user' as const, text: userMsg }];
    setChatMessages(updatedHistory);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: updatedHistory,
          newMessage: userMsg,
          exam
        })
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setChatMessages(prev => [...prev, { role: 'model', text: data.reply }]);
        
        // If crisis triggered in follow-up, update main safety flag representation
        if (data.safetyFlag && data.safetyFlag !== 'none' && loggedEntry) {
          setLoggedEntry({
            ...loggedEntry,
            safetyFlag: data.safetyFlag,
            reflection: data.reply
          });
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'model', text: 'I am here to support you. Let us take it slow today.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const boxBreathingPhases = [
    { text: 'Inhale...', sub: 'Through your nose (4s)', bg: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { text: 'Hold...', sub: 'Keep air in (4s)', bg: 'bg-amber-50 border-amber-200 text-amber-700' },
    { text: 'Exhale...', sub: 'Slowly through mouth (4s)', bg: 'bg-teal-50 border-teal-200 text-teal-700' },
    { text: 'Hold Empty...', sub: 'Wait (4s)', bg: 'bg-rose-50 border-rose-200 text-rose-700' }
  ];

  // ==========================================
  // RENDER: Logged Entry Results Screen
  // ==========================================
  if (loggedEntry) {
    const hasCrisis = loggedEntry.safetyFlag === 'crisis' || loggedEntry.safetyFlag === 'elevated';

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        
        {/* Distress / Crisis Card */}
        {hasCrisis ? (
          <div className="bg-white rounded-3xl border-2 border-rose-200 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 shrink-0">
                <AlertCircle size={30} />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-800">Support is Available</h2>
                <span className="inline-block px-2.5 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-full uppercase tracking-wider">
                  {loggedEntry.safetyFlag} distress detected
                </span>
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              {loggedEntry.reflection}
            </p>

            {/* India Helplines List */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Tele-MANAS (Mental Health)</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500">Government free & confidential 24/7 support.</p>
                </div>
                <a href="tel:14416" className="bg-rose-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl hover:bg-rose-700">
                  Call 14416
                </a>
              </div>
              
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm">KIRAN (Govt Helpline)</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500">24/7 mental wellness rehabilitation support.</p>
                </div>
                <a href="tel:18005990019" className="bg-rose-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl hover:bg-rose-700">
                  Call 1800-599-0019
                </a>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm">AASRA Helpline</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500">24/7 suicide prevention support.</p>
                </div>
                <a href="tel:+919820466726" className="bg-rose-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl hover:bg-rose-700">
                  Call AASRA
                </a>
              </div>
            </div>

            {/* Quick Breathing Exercise for distress */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Compass size={18} className="text-rose-500 animate-spin-slow" />
                <span>Box Breathing (Pause & Regain Balance)</span>
              </h3>
              <div className={`border rounded-2xl p-5 text-center transition-all duration-500 ${boxBreathingPhases[boxStep].bg}`}>
                <div className="w-10 h-10 border-2 border-current rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                  {boxStep + 1}
                </div>
                <h4 className="font-bold text-lg">{boxBreathingPhases[boxStep].text}</h4>
                <p className="text-xs opacity-95 mt-0.5">{boxBreathingPhases[boxStep].sub}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setLoggedEntry(null);
                setSelectedEmotions([]);
                setSelectedTags([]);
                setJournalText('');
                setChatMessages([]);
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl text-xs transition-all"
            >
              Reset / Log Mood Later
            </button>
          </div>
        ) : (
          // Standard Analysis Cards
          <div className="space-y-6">
            
            {/* Reflection card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <Smile className="text-brand-500" size={24} />
                <h2 className="text-lg font-bold text-slate-800">Your Companion Reflects</h2>
              </div>
              
              <p className="text-slate-600 text-sm leading-relaxed italic">
                &ldquo;{loggedEntry.reflection}&rdquo;
              </p>

              {loggedEntry.themes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {loggedEntry.themes.map((t, idx) => (
                    <span key={idx} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Support Cards Grid (Coping + Mindfulness) */}
            {!loggedEntry.quickLog && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Coping Action */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 space-y-3 flex flex-col">
                  <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-widest block">Coping Strategy</span>
                  <h3 className="font-bold text-slate-800 text-sm">Suggested Practice</h3>
                  <p className="text-xs text-slate-600 leading-relaxed flex-1">
                    {loggedEntry.copingStrategy}
                  </p>
                </div>

                {/* Mindfulness Micro-Exercise */}
                <div className="bg-teal-50/50 border border-teal-100 rounded-3xl p-6 space-y-3 flex flex-col">
                  <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-widest block">Mindfulness Exercise</span>
                  <h3 className="font-bold text-slate-800 text-sm">Adaptive Exercise</h3>
                  <p className="text-xs text-slate-600 leading-relaxed flex-1">
                    {loggedEntry.mindfulnessExercise}
                  </p>
                </div>
              </div>
            )}

            {/* Chat Box Conversation */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-slate-100 flex flex-col h-[400px]">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
                <MessageSquare size={18} className="text-brand-500" />
                <h3 className="font-bold text-slate-800 text-sm">Empathetic Companion Chat</h3>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-4">
                <div className="bg-slate-50 text-slate-600 p-3 rounded-2xl max-w-[85%] self-start border border-slate-100">
                  Hi! How are you holding up with your {exam} prep? Feel free to tell me what is on your mind.
                </div>

                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl max-w-[85%] ${
                      msg.role === 'user'
                        ? 'bg-brand-600 text-white self-end ml-auto shadow-md shadow-brand-600/10'
                        : 'bg-slate-50 text-slate-600 self-start border border-slate-100'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}

                {isChatLoading && (
                  <div className="bg-slate-50 text-slate-400 p-3 rounded-2xl max-w-[30%] animate-pulse">
                    Typing...
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChatMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Talk to your companion..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-brand-600 hover:bg-brand-700 text-white p-2.5 rounded-xl transition-all shadow-md shadow-brand-600/10 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>

            {/* Clear Screen Reset Button */}
            <button
              onClick={() => {
                setLoggedEntry(null);
                setSelectedEmotions([]);
                setSelectedTags([]);
                setJournalText('');
                setChatMessages([]);
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-2xl font-bold text-xs transition-all text-center"
            >
              Start New Check-in
            </button>

          </div>
        )}

      </div>
    );
  }

  // ==========================================
  // RENDER: Logging Entry Screen (Today's Entry Form)
  // ==========================================
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      
      {/* Intro prompt */}
      <div className="space-y-1 text-center py-4">
        <h1 className="text-2xl font-bold text-slate-800">How is your day going?</h1>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
          Check-in for your {exam} preparation
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-100 space-y-6">
        
        {/* Step 1: Mood Meter (Emotion picker) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Smile size={18} className="text-brand-500" />
              <span>1. Name Your Emotions</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">Select all that apply</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EMOTIONS.map(emo => {
              const isSelected = selectedEmotions.includes(emo.word);
              return (
                <button
                  type="button"
                  key={emo.word}
                  onClick={() => toggleEmotion(emo.word)}
                  className={`border py-2.5 px-3 rounded-xl text-xs font-semibold text-center transition-all ${
                    isSelected
                      ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-600/10 scale-[1.02]'
                      : emo.color
                  }`}
                >
                  {emo.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Context Stressor Tags */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Clock size={18} className="text-brand-500" />
            <span>2. What is affecting your state?</span>
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {TAGS.map(tag => {
              const isSelected = selectedTags.includes(tag.value);
              return (
                <button
                  type="button"
                  key={tag.value}
                  onClick={() => toggleTag(tag.value)}
                  className={`border py-1.5 px-3 rounded-full text-xs transition-all ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Optional Journaling */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <MessageSquare size={18} className="text-brand-500" />
              <span>3. Write a journal entry (Optional)</span>
            </h3>
            <button
              type="button"
              onClick={() => setRandomPrompt(NUDGES[Math.floor(Math.random() * NUDGES.length)])}
              className="text-[10px] text-brand-600 hover:text-brand-700 font-bold"
            >
              Get writing prompt
            </button>
          </div>

          {randomPrompt && (
            <p className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-[11px] text-slate-500 italic leading-relaxed">
              Prompt: {randomPrompt}
            </p>
          )}

          <textarea
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="Type your open-ended thoughts here... (e.g. My study schedule was disrupted, feeling anxious about mock scores, parental expectations are heavy...)"
            rows={4}
            maxLength={2000}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800 resize-none"
          />
        </div>

        {/* Logging Paths Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
          {/* Quick Log */}
          <button
            type="button"
            onClick={handleQuickLog}
            disabled={selectedEmotions.length === 0 || isLoading}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 shadow-sm ${
              selectedEmotions.length > 0 && !isLoading
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:scale-[1.01]'
                : 'bg-slate-50 text-slate-300 cursor-not-allowed border-dashed border border-slate-200'
            }`}
          >
            <span>Quick Log</span>
            <span className="text-[10px] opacity-75 font-medium">(No AI, ~2 taps)</span>
          </button>

          {/* Analyze & Log */}
          <button
            type="button"
            onClick={handleAnalyzeLog}
            disabled={selectedEmotions.length === 0 || !journalText.trim() || isLoading}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 shadow-lg ${
              selectedEmotions.length > 0 && journalText.trim() && !isLoading
                ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20 hover:scale-[1.01]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span>Analyzing entry...</span>
            ) : (
              <>
                <span>Analyze & Save</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
