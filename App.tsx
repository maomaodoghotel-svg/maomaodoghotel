
import React, { useState, useEffect } from 'react';
import { ViewState, DogProfile, DailyLog, WeatherType, UserProgress } from './types';
import WelcomeView from './components/WelcomeView';
import DayView from './components/DayView';
import SummaryView from './components/SummaryView';
import HistoryView from './components/HistoryView';
import { LayoutDashboard, PieChart, LineChart } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('WELCOME');
  const [profile, setProfile] = useState<DogProfile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentLog, setCurrentLog] = useState<DailyLog | null>(null);
  
  // User Progress
  const [progress, setProgress] = useState<UserProgress>({
    xp: 0,
    level: 1,
    badges: []
  });

  // Load data from local storage on mount
  useEffect(() => {
    const storedProfile = localStorage.getItem('pawpal_profile');
    const storedLogs = localStorage.getItem('pawpal_logs');
    const storedProgress = localStorage.getItem('pawpal_progress');
    
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    }
    if (storedProgress) {
      setProgress(JSON.parse(storedProgress));
    }
  }, []);

  // Save logs whenever they change
  useEffect(() => {
    localStorage.setItem('pawpal_logs', JSON.stringify(logs));
  }, [logs]);
  
  // Save progress
  useEffect(() => {
      localStorage.setItem('pawpal_progress', JSON.stringify(progress));
  }, [progress]);

  const handleWelcomeComplete = (newProfile: DogProfile, date: string, weather: WeatherType) => {
    setProfile(newProfile);
    localStorage.setItem('pawpal_profile', JSON.stringify(newProfile));
    setCurrentDate(date);
    
    // Check if log exists for this date, else create new
    const existingLog = logs.find(l => l.date === date);
    if (existingLog) {
      setCurrentLog(existingLog);
    } else {
      const newLog: DailyLog = {
        date,
        weather,
        profileSnapshot: newProfile,
        meals: [],
        activities: [],
        quizCompleted: false,
      };
      setCurrentLog(newLog);
      setLogs(prev => [...prev, newLog]);
    }
    setView('DASHBOARD');
  };

  const handleUpdateLog = (updatedLog: DailyLog) => {
    setCurrentLog(updatedLog);
    setLogs(prev => prev.map(l => l.date === updatedLog.date ? updatedLog : l));
  };

  const handleRewardEarned = (amount: number) => {
      let newXp = progress.xp + amount;
      const newLevel = Math.floor(newXp / 100) + 1;
      const newBadges = [...progress.badges];
      
      // Streak Logic (Simple)
      if (logs.length >= 3 && !newBadges.find(b => b.id === 'streak3')) {
          newBadges.push({ id: 'streak3', name: '3 Days', icon: '🌱', description: '3 days consistency', dateEarned: new Date().toISOString() });
      }
      if (logs.length >= 7 && !newBadges.find(b => b.id === 'streak7')) {
          newBadges.push({ id: 'streak7', name: '1 Week', icon: '🌿', description: '1 week consistency', dateEarned: new Date().toISOString() });
      }
       if (logs.length >= 30 && !newBadges.find(b => b.id === 'streak30')) {
          newBadges.push({ id: 'streak30', name: '1 Month', icon: '🌳', description: '1 month consistency', dateEarned: new Date().toISOString() });
      }

      setProgress({
          xp: newXp,
          level: newLevel,
          badges: newBadges
      });
  };

  // Navigation Bar
  const NavBar = () => (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md border border-gray-200 text-gray-400 rounded-full px-8 py-4 shadow-2xl z-50 flex gap-10 items-center">
      <button 
        onClick={() => setView('DASHBOARD')}
        className={`flex flex-col items-center gap-1 transition-all ${view === 'DASHBOARD' ? 'text-orange-500 scale-110' : 'hover:text-gray-600'}`}
      >
        <LayoutDashboard size={22} strokeWidth={view === 'DASHBOARD' ? 2.5 : 2} />
      </button>
      
      <button 
        onClick={() => setView('SUMMARY')}
        className={`flex flex-col items-center gap-1 transition-all ${view === 'SUMMARY' ? 'text-orange-500 scale-110' : 'hover:text-gray-600'}`}
      >
        <PieChart size={22} strokeWidth={view === 'SUMMARY' ? 2.5 : 2} />
      </button>
      
      <button 
        onClick={() => setView('HISTORY')}
        className={`flex flex-col items-center gap-1 transition-all ${view === 'HISTORY' ? 'text-orange-500 scale-110' : 'hover:text-gray-600'}`}
      >
        <LineChart size={22} strokeWidth={view === 'HISTORY' ? 2.5 : 2} />
      </button>
    </div>
  );

  if (!profile || view === 'WELCOME') {
    return <WelcomeView onComplete={handleWelcomeComplete} />;
  }

  if (!currentLog) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 mx-auto max-w-md shadow-2xl relative overflow-hidden font-sans text-gray-800">
       {/* Top Decoration */}
       <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none z-0"></div>

      <main className="relative z-10 h-full">
        {view === 'DASHBOARD' && (
          <DayView profile={profile} currentLog={currentLog} onUpdateLog={handleUpdateLog} />
        )}
        {view === 'SUMMARY' && (
          <SummaryView 
            log={currentLog} 
            profile={profile} 
            onQuizComplete={handleUpdateLog} 
            onRewardEarned={handleRewardEarned}
          />
        )}
        {view === 'HISTORY' && (
          <HistoryView logs={logs} profile={profile} progress={progress} />
        )}
      </main>

      <NavBar />
    </div>
  );
};

export default App;
