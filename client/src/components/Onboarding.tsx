import React, { useState } from 'react';
import { ShieldCheck, BookOpen, Calendar, HelpCircle, HardDrive, CloudLightning } from 'lucide-react';

interface OnboardingProps {
  onComplete: (config: {
    exam: string;
    examDate: string;
    localOnly: boolean;
  }) => void;
}

const EXAMS = [
  { value: 'JEE', label: 'JEE (Engineering)' },
  { value: 'NEET', label: 'NEET (Medical)' },
  { value: 'GATE', label: 'GATE (Postgrad Engg)' },
  { value: 'CAT', label: 'CAT (Management)' },
  { value: 'UPSC', label: 'UPSC (Civil Services)' },
  { value: 'CUET', label: 'CUET (University Entrance)' },
  { value: 'Boards', label: 'Class 10/12 Board Exams' },
  { value: 'Other', label: 'Other Entrance/Licensing Exam' }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [exam, setExam] = useState('JEE');
  const [examDate, setExamDate] = useState('');
  const [localOnly, setLocalOnly] = useState(false); // Cloud-Sync is default
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedDisclaimer || !acceptedPrivacy) return;
    onComplete({
      exam,
      examDate,
      localOnly
    });
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome to MindEase</h1>
          <p className="text-sm text-slate-600">
            A quiet, AI-powered space to support your well-being during Indian entrance and board examinations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Context Selection */}
          <div className="space-y-2">
            <label htmlFor="exam-select" className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <BookOpen size={16} className="text-indigo-500" />
              <span>Which exam are you preparing for?</span>
            </label>
            <select
              id="exam-select"
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-slate-800 font-medium"
            >
              {EXAMS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Date Context */}
          <div className="space-y-2">
            <label htmlFor="exam-date" className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar size={16} className="text-indigo-500" />
              <span>Approximately when is the exam? (Optional)</span>
            </label>
            <input
              id="exam-date"
              type="month"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-slate-800"
            />
          </div>

          {/* Data Storage Option: Cloud vs Local */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <HelpCircle size={16} className="text-indigo-500" />
              <span>Data Privacy & Storage Option</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLocalOnly(false)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  !localOnly
                    ? 'border-brand-500 bg-brand-50/40 text-brand-900 ring-2 ring-brand-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm mb-1">
                  <CloudLightning size={16} className="text-brand-600" />
                  <span>Cloud Sync Mode</span>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">
                  Saves your logs securely in Cloud Firestore using an anonymous ID. Retain logs across sessions.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLocalOnly(true)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  localOnly
                    ? 'border-brand-500 bg-brand-50/40 text-brand-900 ring-2 ring-brand-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm mb-1">
                  <HardDrive size={16} className="text-indigo-600" />
                  <span>Local-Only Mode</span>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">
                  Keeps all journal logs on your device. Only sends text to servers temporarily for analysis.
                </p>
              </button>
            </div>
          </div>

          {/* Guidelines / Disclaimers Checklist */}
          <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-5">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              Consent & Privacy Policy
            </h4>

            <div className="space-y-3.5 text-xs text-slate-600">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedDisclaimer}
                  onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="leading-relaxed">
                  I understand that MindEase is a well-being companion tool and <strong>NOT a clinical therapy, diagnostic, or medical service</strong>. It does not replace professional health services.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="leading-relaxed">
                  I agree that my logs are saved anonymously without user accounts or login credentials. I can wipe my data completely at any time.
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!acceptedDisclaimer || !acceptedPrivacy}
            className={`w-full py-3 rounded-xl font-bold text-sm text-center shadow-lg transition-all ${
              acceptedDisclaimer && acceptedPrivacy
                ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20 hover:scale-[1.01]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            Enter MindEase
          </button>
        </form>

      </div>
    </div>
  );
}
