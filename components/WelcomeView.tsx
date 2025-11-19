
import React, { useState } from 'react';
import { DogProfile, WeatherType, ActivityLevel, Nutrients } from '../types';
import { calculateTargetNutrients } from '../utils/calculations';
import { Dog, Sun, Cloud, CloudRain, Thermometer, Wind } from 'lucide-react';

interface Props {
  onComplete: (profile: DogProfile, date: string, weather: WeatherType) => void;
}

const WelcomeView: React.FC<Props> = ({ onComplete }) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState<WeatherType>(WeatherType.SUNNY);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState<number>(3);
  const [weight, setWeight] = useState<number>(10);
  const [habits, setHabits] = useState<ActivityLevel[]>([ActivityLevel.MODERATE_WALK]);

  const handleHabitToggle = (habit: ActivityLevel) => {
    if (habits.includes(habit)) {
      setHabits(habits.filter(h => h !== habit));
    } else {
      setHabits([...habits, habit]);
    }
  };

  const handleSubmit = () => {
    const targets = calculateTargetNutrients(weight, age, weather, habits);
    const profile: DogProfile = {
      name,
      breed: breed || 'Mixed',
      age,
      weight,
      habits,
      targetNutrients: targets
    };
    onComplete(profile, date, weather);
  };

  const WeatherIcon = ({ type, icon: Icon, label }: { type: WeatherType, icon: any, label: string }) => (
    <button
      onClick={() => setWeather(type)}
      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
        weather === type 
        ? 'bg-orange-500 text-white shadow-lg scale-105' 
        : 'bg-white text-gray-500 hover:bg-orange-50'
      }`}
    >
      <Icon size={24} className="mb-1" />
      <span className="text-[10px] font-bold text-center leading-tight">{label}</span>
    </button>
  );

  const habitLabels: Record<ActivityLevel, string> = {
    [ActivityLevel.REST]: "Rest 休息",
    [ActivityLevel.LIGHT_WALK]: "Light Walk 散步",
    [ActivityLevel.MODERATE_WALK]: "Moderate Walk 健走",
    [ActivityLevel.INTENSE_RUN]: "Run 奔跑",
    [ActivityLevel.PLAY]: "Play 遊戲",
    [ActivityLevel.OTHER]: "Other 其他"
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="bg-orange-100 p-4 rounded-full inline-block mb-4">
          <Dog size={48} className="text-orange-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-800">PawPal Health<br/><span className="text-lg">狗狗健康追蹤</span></h1>
        <p className="text-gray-500 mt-2 text-sm">Start tracking a wonderful day<br/>開始記錄美好的一天</p>
      </div>

      <div className="w-full space-y-6 bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl">
        
        {/* Date & Weather */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-600 ml-1">Date & Weather 日期與天氣</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <div className="grid grid-cols-5 gap-2 mt-2">
            <WeatherIcon type={WeatherType.SUNNY} icon={Sun} label="Sunny 晴天" />
            <WeatherIcon type={WeatherType.CLOUDY} icon={Cloud} label="Cloudy 陰天" />
            <WeatherIcon type={WeatherType.RAINY} icon={CloudRain} label="Rainy 雨天" />
            <WeatherIcon type={WeatherType.COOL} icon={Wind} label="Cool 涼爽" />
            <WeatherIcon type={WeatherType.HOT} icon={Thermometer} label="Hot 炎熱" />
          </div>
        </div>

        {/* Dog Info */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-gray-600 ml-1">Dog Profile 基本資料</label>
          
          <input 
            type="text" 
            placeholder="Name 名字" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200"
          />

          <div className="relative">
               <input 
                type="text" 
                list="breeds"
                placeholder="Breed 品種 (e.g. Poodle)" 
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200"
               />
               <datalist id="breeds">
                  <option value="Mixed 米克斯" />
                  <option value="Poodle 貴賓犬" />
                  <option value="Maltese 瑪爾濟斯" />
                  <option value="Pomeranian 博美犬" />
                  <option value="Chihuahua 吉娃娃" />
                  <option value="Yorkshire Terrier 約克夏" />
                  <option value="Shih Tzu 西施犬" />
                  <option value="Dachshund 臘腸犬" />
                  <option value="Pug 巴哥犬" />
                  <option value="French Bulldog 法國鬥牛犬" />
                  <option value="Bichon Frise 比熊犬" />
                  <option value="Schnauzer 雪納瑞" />
                  <option value="Shiba Inu 柴犬" />
                  <option value="Corgi 柯基" />
                  <option value="Beagle 米格魯" />
                  <option value="Cavalier King Charles Spaniel 查理士" />
                  <option value="Shetland Sheepdog 喜樂蒂" />
                  <option value="Jack Russell Terrier 傑克羅素梗" />
                  <option value="West Highland White Terrier 西高地白梗" />
                  <option value="Papillon 蝴蝶犬" />
                  <option value="Pekingese 北京犬" />
                  <option value="Mini Pinscher 迷你杜賓" />
                  <option value="Cocker Spaniel 可卡犬" />
                  <option value="Taiwan Dog 台灣犬" />
                  <option value="Golden Retriever 黃金獵犬" />
                  <option value="Labrador 拉布拉多" />
               </datalist>
           </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="relative">
                <input 
                  type="number" 
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200"
                />
                <span className="absolute right-3 top-3 text-gray-400 text-sm">Age 歲</span>
             </div>
             <div className="relative">
                <input 
                  type="number" 
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200"
                />
                <span className="absolute right-3 top-3 text-gray-400 text-sm">Weight kg</span>
             </div>
          </div>
        </div>

        {/* Habits */}
        <div className="space-y-2">
           <label className="text-sm font-bold text-gray-600 ml-1">Daily Habits 日常習慣</label>
           <div className="flex flex-wrap gap-2">
              {[ActivityLevel.REST, ActivityLevel.LIGHT_WALK, ActivityLevel.INTENSE_RUN, ActivityLevel.PLAY].map((h) => (
                <button
                  key={h}
                  onClick={() => handleHabitToggle(h)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    habits.includes(h) 
                    ? 'bg-teal-500 text-white' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {habitLabels[h]}
                </button>
              ))}
           </div>
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-orange-500/30 transition-all transform hover:scale-[1.02] active:scale-95"
        >
          Start Day 開始今天 🐾
        </button>

      </div>
    </div>
  );
};

export default WelcomeView;
