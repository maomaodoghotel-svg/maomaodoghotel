
import React, { useEffect, useState } from 'react';
import { DailyLog, DogProfile, Nutrients, QuizQuestion } from '../types';
import { generateDailyAdvice, generateDailyQuiz } from '../services/geminiService';
import { CheckCircle, AlertCircle, Sparkles, HelpCircle, Award, Star } from 'lucide-react';

interface Props {
  log: DailyLog;
  profile: DogProfile;
  onQuizComplete: (log: DailyLog) => void;
  onRewardEarned: (xp: number) => void;
}

const SummaryView: React.FC<Props> = ({ log, profile, onQuizComplete, onRewardEarned }) => {
  const [advice, setAdvice] = useState<string>('Generating advice... 正在生成今日建議...');
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<'IDLE' | 'LOADING' | 'ANSWERED' | 'COMPLETED'>('LOADING');
  
  useEffect(() => {
    const initData = async () => {
      // Advice
      if (log.aiAdvice) {
        setAdvice(log.aiAdvice);
      } else {
        const genAdvice = await generateDailyAdvice(log, profile.targetNutrients);
        setAdvice(genAdvice);
      }

      // Quiz
      if (!log.quizCompleted) {
        setQuizState('LOADING');
        const generatedQuiz = await generateDailyQuiz(log, profile.targetNutrients);
        setQuiz(generatedQuiz);
        setQuizState('IDLE');
      } else {
        setQuizState('COMPLETED');
      }
    };
    initData();
  }, [log.date]); 

  const handleOptionSelect = (optionId: string) => {
    if (quizState !== 'IDLE') return;
    setSelectedOptionId(optionId);
    setQuizState('ANSWERED');
    
    const isCorrect = quiz?.options.find(o => o.id === optionId)?.isCorrect;
    
    // Reward Logic
    if (isCorrect) {
        setTimeout(() => onRewardEarned(50), 1000); 
    } else {
        setTimeout(() => onRewardEarned(10), 1000);
    }

    // Save completion status
    setTimeout(() => {
        onQuizComplete({ ...log, quizCompleted: true });
    }, 5000);
  };

  const consumed = log.meals.reduce((acc, m) => ({
    calories: acc.calories + m.nutrients.calories,
    protein: acc.protein + m.nutrients.protein,
    fat: acc.fat + m.nutrients.fat,
    omega3: acc.omega3 + m.nutrients.omega3,
    carbs: acc.carbs + m.nutrients.carbs,
    fiber: acc.fiber + m.nutrients.fiber,
    sodium: acc.sodium + m.nutrients.sodium,
    calcium: acc.calcium + m.nutrients.calcium,
    phosphorus: acc.phosphorus + m.nutrients.phosphorus,
    vitaminD: acc.vitaminD + m.nutrients.vitaminD,
    water: acc.water + (m.nutrients.water || 0),
  }), { protein: 0, fat: 0, omega3: 0, carbs: 0, fiber: 0, calories: 0, sodium: 0, calcium: 0, phosphorus: 0, vitaminD: 0, water: 0 } as Nutrients);

  const burned = log.activities.reduce((sum, a) => sum + a.caloriesBurned, 0);
  const netCalories = consumed.calories - burned;

  const StatRow = ({ label, actual, target, unit }: any) => {
      const percent = Math.min(100, (actual / target) * 100);
      const isGood = percent >= 80 && percent <= 120;
      
      return (
          <div className="mb-4">
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                  <span>{label}</span>
                  <span className={`${isGood ? 'text-teal-600' : 'text-orange-500'}`}>
                      {actual} / {target} {unit} ({Math.round(percent)}%)
                  </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isGood ? 'bg-teal-500' : 'bg-orange-500'}`} 
                    style={{ width: `${percent}%` }}
                  />
              </div>
          </div>
      );
  };

  return (
    <div className="p-6 pb-24 space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-gray-800">Daily Summary 今日總結</h2>
        <p className="text-gray-500 text-sm">Today's Overview</p>
      </div>

      {/* AI Advice Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
          <Sparkles className="absolute top-4 right-4 text-white/30" size={48} />
          <h3 className="font-bold text-lg mb-2 relative z-10">AI Advice 小叮嚀</h3>
          <p className="text-indigo-100 leading-relaxed relative z-10">
              {advice}
          </p>
      </div>

      {/* Calories Summary */}
      <div className="bg-white p-6 rounded-3xl shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Calorie Breakdown 熱量消耗</h3>
          <div className="flex justify-between items-center text-center">
              <div>
                  <div className="text-xs text-gray-400 uppercase">Intake 攝取</div>
                  <div className="text-xl font-bold text-gray-800">{Math.round(consumed.calories)}</div>
              </div>
              <div className="text-gray-300">-</div>
              <div>
                  <div className="text-xs text-gray-400 uppercase">Burned 消耗</div>
                  <div className="text-xl font-bold text-teal-500">{burned}</div>
              </div>
              <div className="text-gray-300">=</div>
              <div>
                  <div className="text-xs text-gray-400 uppercase">Net 淨值</div>
                  <div className={`text-xl font-bold ${netCalories > profile.targetNutrients.calories * 1.1 ? 'text-red-500' : 'text-indigo-600'}`}>
                      {Math.round(netCalories)}
                  </div>
              </div>
          </div>
      </div>

      {/* Nutrients Detail */}
      <div className="bg-white p-6 rounded-3xl shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Nutrient Goals 營養素達成率</h3>
          <StatRow label="Protein 蛋白質" actual={consumed.protein} target={profile.targetNutrients.protein} unit="g" />
          <StatRow label="Fat 脂肪" actual={consumed.fat} target={profile.targetNutrients.fat} unit="g" />
          <StatRow label="Carbs 碳水" actual={consumed.carbs} target={profile.targetNutrients.carbs} unit="g" />
          <StatRow label="Sodium 鈉" actual={consumed.sodium} target={profile.targetNutrients.sodium} unit="mg" />
          <StatRow label="Water 水分" actual={consumed.water} target={profile.targetNutrients.water} unit="ml" />
      </div>

      {/* Daily Quiz Section - Mature Style */}
      <div className="pt-6 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-4">
             <HelpCircle size={20} className="text-indigo-500" />
             <h3 className="text-lg font-bold text-gray-800">Review Today 回顧今天</h3>
        </div>
        
        {quizState === 'LOADING' && !quiz && (
             <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                 Preparing your daily question...<br/>準備今日問答中...
             </div>
        )}

        {quizState === 'COMPLETED' && (
            <div className="p-6 bg-gray-50 rounded-2xl flex items-center gap-4 border border-gray-100">
                <div className="bg-white p-3 rounded-full shadow-sm">
                    <CheckCircle className="text-indigo-500" size={24} />
                </div>
                <div>
                    <p className="font-bold text-gray-700">Reflection Completed 完成回顧</p>
                    <p className="text-xs text-gray-500">Great self-awareness. 很好的自我覺察。</p>
                </div>
            </div>
        )}

        {(quizState === 'IDLE' || quizState === 'ANSWERED') && quiz && (
            <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
                <p className="font-medium text-gray-700 mb-6 text-base leading-relaxed">
                    {quiz.question}
                </p>
                <div className="space-y-3">
                    {quiz.options.map(option => {
                        const isSelected = selectedOptionId === option.id;
                        const isCorrect = option.isCorrect;
                        let btnClass = "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100";
                        
                        if (quizState === 'ANSWERED') {
                            if (isSelected && isCorrect) btnClass = "bg-indigo-50 text-indigo-800 border-indigo-200";
                            else if (isSelected && !isCorrect) btnClass = "bg-orange-50 text-orange-800 border-orange-200";
                            else if (!isSelected && isCorrect) btnClass = "bg-gray-50 text-indigo-800 border-gray-200 opacity-50"; 
                        }

                        return (
                            <button
                                key={option.id}
                                onClick={() => handleOptionSelect(option.id)}
                                disabled={quizState === 'ANSWERED'}
                                className={`w-full p-4 rounded-xl text-left text-sm font-medium border transition-all duration-300 flex justify-between items-center ${btnClass}`}
                            >
                                {option.text}
                                {quizState === 'ANSWERED' && isSelected && (
                                    isCorrect ? <CheckCircle size={16} /> : <AlertCircle size={16} />
                                )}
                            </button>
                        );
                    })}
                </div>

                {quizState === 'ANSWERED' && (
                    <div className={`mt-6 p-5 rounded-2xl text-sm font-medium animate-fade-in ${
                        selectedOptionId && quiz.options.find(o => o.id === selectedOptionId)?.isCorrect 
                        ? 'bg-indigo-50 text-indigo-900' 
                        : 'bg-gray-50 text-gray-700'
                    }`}>
                         <div className="mb-2">
                            {selectedOptionId && quiz.options.find(o => o.id === selectedOptionId)?.isCorrect 
                                ? quiz.correctMessage 
                                : quiz.wrongMessage
                            }
                         </div>
                         <div className="flex items-center gap-2 text-xs opacity-70">
                            <Star size={12} fill="currentColor" />
                            {selectedOptionId && quiz.options.find(o => o.id === selectedOptionId)?.isCorrect 
                                ? 'XP Gained 獲得經驗' 
                                : 'Participation XP 參加獎勵'
                            }
                         </div>
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="text-center p-4">
        <p className="text-[10px] text-gray-400">
            * Values are AI estimated. Consult a vet for medical advice.<br/>數值為AI估算，僅供參考。
        </p>
      </div>
    </div>
  );
};

export default SummaryView;
