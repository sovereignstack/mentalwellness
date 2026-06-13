import { useState } from 'react';
import { ShieldAlert, Compass, Trash2, PhoneCall, AlertCircle } from 'lucide-react';
import { BoxBreathing, Grounding54321 } from './exercises';

interface HelpSOSProps {
  onDataWiped: () => void;
}

export default function HelpSOS({ onDataWiped }: HelpSOSProps) {
  const [activeExercise, setActiveExercise] = useState<'54321' | 'box' | null>(null);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm_1' | 'confirm_2'>('idle');
  const [isWiping, setIsWiping] = useState(false);

  const handleWipeData = async () => {
    setIsWiping(true);
    try {
      // 1. Wipe client-side localStorage
      localStorage.clear();

      // 2. Wipe server-side Firestore
      const response = await fetch('/api/data', {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('All session and database records deleted successfully.');
      }
    } catch (error) {
      console.error('Failed to wipe data from server:', error);
    } finally {
      setIsWiping(false);
      setDeleteStep('idle');
      onDataWiped(); // Reset to onboarding state
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-1 text-center py-4">
        <h1 className="text-2xl font-bold text-slate-800">Support & Resource Center</h1>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
          Indian National Helplines & Grounding Exercises
        </p>
      </div>

      {/* Helplines and SOS info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-100 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <PhoneCall className="text-rose-500" size={20} />
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">
            24/7 Professional Helpline Contact Support
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                Tele-MANAS (Mental Health Helpline)
              </h4>
              <p className="text-xs text-slate-500">
                Government of India National Mental Health program.
              </p>
            </div>
            <a
              href="tel:14416"
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl text-center shadow-md shadow-rose-600/10"
            >
              Call 14416
            </a>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">KIRAN (Govt Helpline)</h4>
              <p className="text-xs text-slate-500">
                Government support for psychological wellness & rehabilitation.
              </p>
            </div>
            <a
              href="tel:18005990019"
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl text-center shadow-md shadow-rose-600/10"
            >
              Call 1800-599-0019
            </a>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">AASRA Suicide Prevention Line</h4>
              <p className="text-xs text-slate-500">
                Non-profit volunteer-run suicide prevention helpline.
              </p>
            </div>
            <a
              href="tel:+919820466726"
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl text-center shadow-md shadow-rose-600/10"
            >
              Call +91-9820466726
            </a>
          </div>
        </div>
      </div>

      {/* Grounding Exercises */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-100 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Compass className="text-indigo-500" size={20} />
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">
            Interactive Grounding Exercises
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveExercise('54321')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border text-center transition-all ${
              activeExercise === '54321'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            5-4-3-2-1 Senses
          </button>
          <button
            onClick={() => setActiveExercise('box')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border text-center transition-all ${
              activeExercise === 'box'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            Box Breathing
          </button>
        </div>

        {activeExercise === '54321' && <Grounding54321 />}

        {activeExercise === 'box' && <BoxBreathing size="lg" />}
      </div>

      {/* Settings / Danger Zone */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-100 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Trash2 className="text-rose-500" size={20} />
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">Danger Zone (Wipe Data)</h2>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Because your logs contain personal wellness thoughts, you have full control over your
            data. Deleting your data will wipe all local check-ins on this browser and clear all
            Firestore records matching your anonymous session ID.
            <strong> This action is irreversible.</strong>
          </p>

          <div className="pt-2">
            {deleteStep === 'idle' && (
              <button
                type="button"
                onClick={() => setDeleteStep('confirm_1')}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete All My Data</span>
              </button>
            )}

            {deleteStep === 'confirm_1' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3 animate-fade-in">
                <p className="text-xs text-amber-800 font-semibold flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>
                    Are you sure? This will delete all entries from this browser and cloud.
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteStep('confirm_2')}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                  >
                    Yes, I am sure
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep('idle')}
                    className="bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 'confirm_2' && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3 animate-fade-in">
                <p className="text-xs text-rose-800 font-bold flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  <span>
                    Final Warning: All wellness charts, history, and AI analysis will be lost
                    forever.
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isWiping}
                    onClick={handleWipeData}
                    className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg transition-all"
                  >
                    {isWiping ? 'Wiping records...' : 'Confirm Deletion'}
                  </button>
                  <button
                    type="button"
                    disabled={isWiping}
                    onClick={() => setDeleteStep('idle')}
                    className="bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
