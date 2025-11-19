
export enum WeatherType {
  SUNNY = 'Sunny',
  CLOUDY = 'Cloudy',
  RAINY = 'Rainy',
  COOL = 'Cool',
  HOT = 'Hot',
}

export enum ActivityLevel {
  REST = 'Rest',
  LIGHT_WALK = 'Light Walk',
  MODERATE_WALK = 'Moderate Walk',
  INTENSE_RUN = 'Intense Run',
  PLAY = 'Play',
  OTHER = 'Other',
}

export interface Nutrients {
  protein: number; // g
  fat: number; // g
  omega3: number; // g
  carbs: number; // g
  fiber: number; // g
  calories: number; // kcal
  sodium: number; // mg
  calcium: number; // mg
  phosphorus: number; // mg
  vitaminD: number; // IU
  water: number; // ml
}

export interface DogProfile {
  name: string;
  breed: string;
  age: number;
  weight: number; // kg
  habits: ActivityLevel[];
  targetNutrients: Nutrients;
}

export interface ActivityLog {
  id: string;
  type: ActivityLevel;
  durationMinutes: number;
  caloriesBurned: number;
  timestamp: number;
  timeOfDay?: 'DAY' | 'NIGHT';
}

export interface MealLog {
  id: string;
  type: 'BREAKFAST' | 'DINNER' | 'SNACK';
  description: string;
  imageUrl?: string;
  nutrients: Nutrients;
  timestamp: number;
  timeOfDay?: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  type: 'STATUS' | 'REMINDER' | 'HIGHLIGHT' | 'TOMORROW';
  question: string;
  options: QuizOption[];
  correctMessage: string; // Mature, encouraging
  wrongMessage: string;   // Gentle guidance
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  weather: WeatherType;
  profileSnapshot: DogProfile; // Snapshot of profile at that day
  meals: MealLog[];
  activities: ActivityLog[];
  aiAdvice?: string;
  quizCompleted?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string; // Lucide icon name or emoji
  description: string;
  dateEarned: string;
}

export interface UserProgress {
  xp: number;
  level: number;
  badges: Badge[];
}

export type ViewState = 'WELCOME' | 'DASHBOARD' | 'SUMMARY' | 'HISTORY';
