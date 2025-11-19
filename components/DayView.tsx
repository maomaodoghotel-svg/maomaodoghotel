
import React, { useState, useEffect } from 'react';
import { DogProfile, DailyLog, MealLog, ActivityLog, ActivityLevel, WeatherType } from '../types';
import { calculateBurnedCalories } from '../utils/calculations';
import { analyzeFood } from '../services/geminiService';
import { Camera, Plus, Flame, Droplets, Bone, Utensils, Activity, X, Loader2, AlertCircle, Moon } from 'lucide-react';

interface Props {
  profile: DogProfile;
  currentLog: DailyLog;
  onUpdateLog: (log: DailyLog) => void;
}

const activityLabels: Record<ActivityLevel, string> = {
    [ActivityLevel.REST]: "Rest 休息",
    [ActivityLevel.LIGHT_WALK]: "Light Walk 小小散步",
    [ActivityLevel.MODERATE_WALK]: "Moderate Walk 中度散步",
    [ActivityLevel.INTENSE_RUN]: "Intense Run 激烈奔跑",
    [ActivityLevel.PLAY]: "Play 遊戲",
    [ActivityLevel.OTHER]: "Other 其他"
};

const DayView: React.FC<Props> = ({ profile, currentLog, onUpdateLog }) => {
  const [modalOpen, setModalOpen] = useState<'MEAL' | 'ACTIVITY' | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Derived Stats ---
  const consumedCalories = currentLog.meals.reduce((sum, m) => sum + m.nutrients.calories, 0);
  const burnedCalories = currentLog.activities.reduce((sum, a) => sum + a.caloriesBurned, 0);
  const netCalories = consumedCalories - burnedCalories;
  const waterIntake = currentLog.meals.reduce((sum, m) => sum + (m.nutrients.water || 0), 0); 

  const waterTarget = profile.targetNutrients.water;

  // --- Modal States ---
  const [mealType, setMealType] = useState<'BREAKFAST' | 'DINNER' | 'SNACK'>('BREAKFAST');
  const [mealDesc, setMealDesc] = useState('');
  const [mealImage, setMealImage] = useState<string | null>(null);

  const [activityType, setActivityType] = useState<ActivityLevel>(ActivityLevel.LIGHT_WALK);
  const [activityDuration, setActivityDuration] = useState(15);
  const [activityTimeContext, setActivityTimeContext] = useState<'DAY' | 'NIGHT'>('DAY');

  // --- Handlers ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMealImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitMeal = async () => {
    setLoading(true);
    try {
      const nutrients = await analyzeFood(mealDesc, mealImage || undefined);
      const newMeal: MealLog = {
        id: Date.now().toString(),
        type: mealType,
        description: mealDesc || 'Food Image',
        imageUrl: mealImage || undefined,
        nutrients,
        timestamp: Date.now(),
      };
      
      onUpdateLog({
        ...currentLog,
        meals: [...currentLog.meals, newMeal],
      });
      setModalOpen(null);
      setMealDesc('');
      setMealImage(null);
    } catch (error) {
      alert("Could not analyze food. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitActivity = () => {
    const burned = calculateBurnedCalories(profile.weight, activityType, activityDuration);
    const newActivity: ActivityLog = {
        id: Date.now().toString(),
        type: activityType,
        durationMinutes: activityDuration,
        caloriesBurned: burned,
        timestamp: Date.now(),
        timeOfDay: activityTimeContext
    };

    onUpdateLog({
        ...currentLog,
        activities: [...currentLog.activities, newActivity]
    });
    setModalOpen(null);
  };

  const getActivitiesByTime = (time: 'DAY' | 'NIGHT') => {
    return currentLog.activities.filter(a => {
      if (a.timeOfDay) return a.timeOfDay === time;
      const hour = new Date(a.timestamp).getHours();
      if (time === 'DAY') return hour < 18;
      return hour >= 18;
    });
  };

  const dayActivities = getActivitiesByTime('DAY');
  const nightActivities = getActivitiesByTime('NIGHT');

  // --- Render ---

  const ProgressRing = ({ current, target, color, icon: Icon }: any) => {
    const percent = Math.min(100, Math.max(0, (current / target) * 100));
    return (
        <div className="relative flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Icon size={14} />
                <span>Goal 目標: {Math.round(target)}</span>
            </div>
            <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={251.2} 
                        strokeDashoffset={251.2 - (251.2 * percent / 100)} 
                        className={color} 
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                    <span className="text-xl font-extrabold text-gray-800">{Math.round(current)}</span>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="pb-24">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm mb-6">
         <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Good Morning 早安! 🌞</h2>
                <p className="text-gray-500 text-sm">{currentLog.date} • {profile.name}</p>
            </div>
            <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold capitalize">
                {currentLog.weather}
            </div>
         </div>

         {/* Dog Profile Basic Info */}
         <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 shadow-inner">
            <div className="flex flex-col items-center w-1/3 border-r border-gray-200">
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Breed 品種</span>
               <span className="font-bold text-gray-700 text-sm truncate w-full text-center px-1">{profile.breed || 'Unknown'}</span>
            </div>
            <div className="flex flex-col items-center w-1/3 border-r border-gray-200">
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Age 年齡</span>
               <span className="font-bold text-gray-700 text-sm">{profile.age} yr</span>
            </div>
            <div className="flex flex-col items-center w-1/3">
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Weight 體重</span>
               <span className="font-bold text-gray-700 text-sm">{profile.weight} kg</span>
            </div>
         </div>

         {/* Primary Stats */}
         <div className="grid grid-cols-2 gap-4">
             <ProgressRing current={netCalories} target={profile.targetNutrients.calories} color="text-orange-500" icon={Flame} />
             <ProgressRing current={waterIntake} target={waterTarget} color="text-blue-400" icon={Droplets} />
         </div>
      </div>

      {/* Timeline Sections */}
      <div className="px-6 space-y-6">
        
        {/* Morning Section */}
        <section>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-6 bg-yellow-400 rounded-full"></span>
                    早晨 Morning
                </h3>
                <button 
                    onClick={() => { setMealType('BREAKFAST'); setModalOpen('MEAL'); }}
                    className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold hover:bg-yellow-200"
                >
                    + Log Breakfast 紀錄早餐
                </button>
            </div>
            <div className="space-y-2">
                {currentLog.meals.filter(m => m.type === 'BREAKFAST').map(meal => (
                    <div key={meal.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-400 flex justify-between items-center">
                        <div>
                            <div className="font-bold text-gray-800">{meal.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                                {meal.nutrients.calories} kcal • Prot: {meal.nutrients.protein}g
                            </div>
                        </div>
                        {meal.imageUrl && <img src={meal.imageUrl} alt="food" className="w-12 h-12 rounded-lg object-cover" />}
                    </div>
                ))}
                {currentLog.meals.filter(m => m.type === 'BREAKFAST').length === 0 && (
                    <div className="text-center py-4 bg-white/50 rounded-xl text-sm text-gray-400 border border-dashed border-gray-300">
                        No breakfast logged yet 還沒有紀錄早餐
                    </div>
                )}
            </div>
        </section>

        {/* Day Activity Section */}
        <section>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-6 bg-teal-400 rounded-full"></span>
                    白天活動 Activity
                </h3>
                <button 
                    onClick={() => { setActivityTimeContext('DAY'); setModalOpen('ACTIVITY'); }}
                    className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-bold hover:bg-teal-200"
                >
                    + Log Activity 紀錄活動
                </button>
            </div>
             <div className="space-y-2">
                {dayActivities.map(act => (
                    <div key={act.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-teal-400 flex justify-between items-center">
                        <div>
                            <div className="font-bold text-gray-800">{activityLabels[act.type]}</div>
                            <div className="text-xs text-gray-400 mt-1">
                                {act.durationMinutes} min • -{act.caloriesBurned} kcal
                            </div>
                        </div>
                        <Activity size={18} className="text-teal-400" />
                    </div>
                ))}
                 {dayActivities.length === 0 && (
                    <div className="text-center py-4 bg-white/50 rounded-xl text-sm text-gray-400 border border-dashed border-gray-300">
                        No activity yet 今天還沒有運動
                    </div>
                )}
            </div>
        </section>

        {/* Dinner Section */}
        <section>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-6 bg-indigo-400 rounded-full"></span>
                    晚餐 Dinner
                </h3>
                <button 
                     onClick={() => { setMealType('DINNER'); setModalOpen('MEAL'); }}
                    className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold hover:bg-indigo-200"
                >
                    + Log Dinner 紀錄晚餐
                </button>
            </div>
             <div className="space-y-2">
                {currentLog.meals.filter(m => m.type === 'DINNER').map(meal => (
                    <div key={meal.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-indigo-400 flex justify-between items-center">
                         <div>
                            <div className="font-bold text-gray-800">{meal.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                                {meal.nutrients.calories} kcal • Prot: {meal.nutrients.protein}g
                            </div>
                        </div>
                        {meal.imageUrl && <img src={meal.imageUrl} alt="food" className="w-12 h-12 rounded-lg object-cover" />}
                    </div>
                ))}
                  {currentLog.meals.filter(m => m.type === 'DINNER').length === 0 && (
                    <div className="text-center py-4 bg-white/50 rounded-xl text-sm text-gray-400 border border-dashed border-gray-300">
                        No dinner logged yet 還沒有紀錄晚餐
                    </div>
                )}
            </div>
        </section>

        {/* Night Activity Section */}
        <section>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-6 bg-purple-400 rounded-full"></span>
                    夜間活動 Night Activity
                </h3>
                <button 
                    onClick={() => { setActivityTimeContext('NIGHT'); setModalOpen('ACTIVITY'); }}
                    className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold hover:bg-purple-200"
                >
                    + Log Activity 紀錄活動
                </button>
            </div>
             <div className="space-y-2">
                {nightActivities.map(act => (
                    <div key={act.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-400 flex justify-between items-center">
                        <div>
                            <div className="font-bold text-gray-800">{activityLabels[act.type]}</div>
                            <div className="text-xs text-gray-400 mt-1">
                                {act.durationMinutes} min • -{act.caloriesBurned} kcal
                            </div>
                        </div>
                        <Moon size={18} className="text-purple-400" />
                    </div>
                ))}
                 {nightActivities.length === 0 && (
                    <div className="text-center py-4 bg-white/50 rounded-xl text-sm text-gray-400 border border-dashed border-gray-300">
                        No night activity yet 晚上還沒有運動
                    </div>
                )}
            </div>
        </section>

      </div>

      {/* Modals */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slide-up">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                    {modalOpen === 'MEAL' ? 'Log Meal 紀錄餐點' : 'Log Activity 紀錄活動'}
                </h3>
                <button onClick={() => setModalOpen(null)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X size={24} className="text-gray-500" />
                </button>
             </div>

             {modalOpen === 'MEAL' ? (
                 <div className="space-y-4">
                     <div className="flex gap-2">
                         {['BREAKFAST', 'SNACK', 'DINNER'].map(t => (
                             <button 
                                key={t} 
                                onClick={() => setMealType(t as any)}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg border ${mealType === t ? 'bg-orange-500 text-white border-orange-500' : 'text-gray-500 border-gray-200'}`}
                             >
                                 {t === 'BREAKFAST' ? 'Breakfast 早餐' : t === 'SNACK' ? 'Snack 點心' : 'Dinner 晚餐'}
                             </button>
                         ))}
                     </div>
                     
                     <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        {mealImage ? (
                            <img src={mealImage} className="h-32 mx-auto rounded-lg object-contain" />
                        ) : (
                            <div className="flex flex-col items-center text-gray-400">
                                <Camera size={32} className="mb-2" />
                                <span className="text-sm font-bold">Take photo for AI analysis<br/>拍照分析</span>
                            </div>
                        )}
                     </div>

                     <div className="text-center text-xs text-gray-400 font-bold">- OR -</div>

                     <textarea 
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                        placeholder="Describe food 輸入食物內容 (e.g. 100g chicken, half cup dry food)..."
                        rows={3}
                        value={mealDesc}
                        onChange={(e) => setMealDesc(e.target.value)}
                     ></textarea>

                     <button 
                        onClick={submitMeal}
                        disabled={loading || (!mealDesc && !mealImage)}
                        className="w-full py-3 bg-black text-white rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50"
                     >
                         {loading ? <Loader2 className="animate-spin" /> : 'Analyze & Log 分析並紀錄'}
                     </button>
                 </div>
             ) : (
                 <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-2">
                         {Object.values(ActivityLevel).map(l => (
                             <button 
                                key={l}
                                onClick={() => setActivityType(l)}
                                className={`p-2 text-xs font-bold rounded-lg border truncate ${activityType === l ? (activityTimeContext === 'NIGHT' ? 'bg-purple-500 text-white border-purple-500' : 'bg-teal-500 text-white border-teal-500') : 'text-gray-500 border-gray-200'}`}
                             >
                                 {activityLabels[l]}
                             </button>
                         ))}
                     </div>
                     
                     <div>
                         <label className="text-sm font-bold text-gray-500 mb-2 block">Duration 持續時間: {activityDuration} min</label>
                         <input 
                            type="range" min="5" max="120" step="5" 
                            value={activityDuration}
                            onChange={(e) => setActivityDuration(Number(e.target.value))}
                            className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${activityTimeContext === 'NIGHT' ? 'accent-purple-500' : 'accent-teal-500'}`}
                         />
                     </div>

                     <button 
                        onClick={submitActivity}
                        className={`w-full py-3 text-white rounded-xl font-bold ${activityTimeContext === 'NIGHT' ? 'bg-purple-600' : 'bg-teal-600'}`}
                     >
                         Confirm Activity 確認活動
                     </button>
                 </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DayView;
