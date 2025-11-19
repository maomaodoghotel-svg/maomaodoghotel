
import React, { useState, useEffect } from 'react';
import { DailyLog, DogProfile, UserProgress } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { generateLongTermAdvice } from '../services/geminiService';
import { Award, Star, Zap, Crown, LayoutGrid, Sparkles } from 'lucide-react';

interface Props {
  logs: DailyLog[];
  profile: DogProfile;
  progress: UserProgress;
}

const HistoryView: React.FC<Props> = ({ logs, profile, progress }) => {
  const [advice, setAdvice] = useState('Analyzing trends... 分析趨勢中...');

  useEffect(() => {
    if (logs.length > 0) {
        generateLongTermAdvice(logs).then(setAdvice);
    } else {
        setAdvice("Not enough data yet! 還沒有足夠的資料來分析喔！");
    }
  }, [logs]);

  const data = logs.map(log => {
      const consumed = log.meals.reduce((acc, m) => acc + m.nutrients.calories, 0);
      const burned = log.activities.reduce((acc, a) => acc + a.caloriesBurned, 0);
      const sodium = log.meals.reduce((acc, m) => acc + m.nutrients.sodium, 0);
      const water = log.meals.reduce((acc, m) => acc + (m.nutrients.water || 0), 0);
      
      return {
          date: log.date.slice(5), // MM-DD
          netCalories: consumed - burned,
          sodium,
          water,
          protein: log.meals.reduce((acc, m) => acc + m.nutrients.protein, 0),
      };
  });

  const ChartCard = ({ title, dataKey, color, target }: any) => (
    <div className="bg-white p-5 rounded-3xl shadow-sm mb-6">
        <h3 className="font-bold text-gray-700 mb-6 pl-2 border-l-4 border-orange-400 text-sm">{title}</h3>
        <div className="h-48 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                    <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} 
                    />
                    {target && (
                        <Line type="monotone" dataKey={() => target} stroke="#e5e7eb" strokeDasharray="5 5" dot={false} strokeWidth={2} name="Goal" />
                    )}
                    <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{fill: color, r: 3, strokeWidth: 0}} activeDot={{r: 6}} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
  );

  return (
    <div className="p-6 pb-24 bg-gray-50 min-h-screen">
      <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-gray-800">My Journey 旅程</h2>
          <p className="text-gray-500 text-sm">Growth & Memories</p>
      </div>

      {/* Mature Journey / Rewards Section */}
      <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 border border-gray-100 relative overflow-hidden">
          <div className="flex justify-between items-end mb-4">
             <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Level</div>
                <div className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
                   Level {progress.level}
                </div>
             </div>
             <div className="text-right">
                <div className="text-xs font-bold text-indigo-500 mb-1">{progress.xp} XP</div>
             </div>
          </div>

          {/* Minimalist XP Bar */}
          <div className="w-full bg-gray-100 h-1.5 rounded-full mb-8 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(progress.xp % 100)}%` }}></div>
          </div>

          {/* Minimalist Sticker Badges */}
          <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Collection 收藏</div>
              <div className="grid grid-cols-4 gap-3">
                  {progress.badges.length > 0 ? progress.badges.map(b => (
                      <div key={b.id} className="aspect-square bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 hover:border-indigo-100 transition-colors group">
                          <div className="text-2xl mb-1 grayscale group-hover:grayscale-0 transition-all duration-500">{b.icon}</div>
                          <div className="text-[8px] text-gray-400 font-bold text-center leading-tight px-1">{b.name}</div>
                      </div>
                  )) : (
                    <div className="col-span-4 text-center py-4 text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        Start your journey today.<br/>今天開始你的旅程。
                    </div>
                  )}
              </div>
          </div>
      </div>

      <div className="bg-indigo-50 p-5 rounded-3xl mb-8 border border-indigo-100">
          <div className="flex gap-3">
             <Sparkles className="text-indigo-400 shrink-0" size={20} />
             <p className="text-indigo-900 text-sm font-medium leading-relaxed">
                 {advice}
             </p>
          </div>
      </div>

      {logs.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
              No history yet.<br/>還沒有歷史紀錄。
          </div>
      ) : (
          <>
            <ChartCard title="Net Calories 淨熱量" dataKey="netCalories" color="#f97316" target={profile.targetNutrients.calories} />
            
            <div className="bg-white p-5 rounded-3xl shadow-sm mb-6">
                <h3 className="font-bold text-gray-700 mb-6 pl-2 border-l-4 border-blue-400 text-sm">Water Intake 水分攝取</h3>
                <div className="h-48 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                            <Area type="monotone" dataKey="water" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWater)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <ChartCard title="Protein 蛋白質" dataKey="protein" color="#ef4444" target={profile.targetNutrients.protein} />
            <ChartCard title="Sodium 鈉" dataKey="sodium" color="#8b5cf6" target={profile.targetNutrients.sodium} />
          </>
      )}
    </div>
  );
};

export default HistoryView;
