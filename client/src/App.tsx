import { useState, useEffect, lazy, Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import Layout from './components/Layout.tsx';
import Onboarding from './components/Onboarding.tsx';
import Today from './components/Today.tsx';
import HelpSOS from './components/HelpSOS.tsx';

// Trends pulls in the heavy charting library (recharts); load it on demand so it
// stays out of the initial bundle. It is precached by the PWA, so it still works offline.
const TrendsView = lazy(() => import('./components/TrendsView.tsx'));

interface LocalConfig {
  exam: string;
  examDate: string;
  localOnly: boolean;
}

function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [config, setConfig] = useState<LocalConfig>({
    exam: 'JEE',
    examDate: '',
    localOnly: false
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load configuration on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('local_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig(parsed);
        setOnboarded(true);
      }
    } catch (e) {
      console.error('Failed to load local config:', e);
    }
  }, []);

  const handleOnboardingComplete = (newConfig: LocalConfig) => {
    try {
      localStorage.setItem('local_config', JSON.stringify(newConfig));
      setConfig(newConfig);
      setOnboarded(true);
      setActiveTab('today');
    } catch (e) {
      console.error('Failed to save local config:', e);
    }
  };

  const handleDataWiped = () => {
    setOnboarded(false);
    setActiveTab('today');
    setConfig({
      exam: 'JEE',
      examDate: '',
      localOnly: false
    });
  };

  const handleEntryLogged = () => {
    // Increment trigger to force trends view reload when navigated
    setRefreshTrigger(prev => prev + 1);
  };

  if (!onboarded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'today' && (
        <Today 
          exam={config.exam} 
          localOnly={config.localOnly} 
          onEntryLogged={handleEntryLogged} 
        />
      )}
      {activeTab === 'trends' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="animate-spin text-brand-500" size={32} />
              <p className="text-sm text-slate-500">Loading your trends…</p>
            </div>
          }
        >
          <TrendsView localOnly={config.localOnly} refreshTrigger={refreshTrigger} />
        </Suspense>
      )}
      {activeTab === 'help' && (
        <HelpSOS 
          onDataWiped={handleDataWiped} 
        />
      )}
    </Layout>
  );
}

export default App;
