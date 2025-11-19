import { DogProfile, WeatherType, Nutrients, ActivityLevel } from "../types";

// Resting Energy Requirement (RER) = 70 * (weight_kg ^ 0.75)
export const calculateRER = (weightKg: number): number => {
  return 70 * Math.pow(weightKg, 0.75);
};

// Daily Energy Requirement (DER/MER)
export const calculateTargetNutrients = (
  weight: number,
  age: number,
  weather: WeatherType,
  habits: ActivityLevel[]
): Nutrients => {
  const rer = calculateRER(weight);
  
  // Factor adjustments
  let activityFactor = 1.6; // Default moderate
  if (habits.includes(ActivityLevel.INTENSE_RUN)) activityFactor = 2.0;
  else if (habits.includes(ActivityLevel.LIGHT_WALK)) activityFactor = 1.4;
  else if (habits.includes(ActivityLevel.REST)) activityFactor = 1.2;
  
  // Senior dogs need less usually, puppies need more. Simplified here.
  if (age > 7) activityFactor -= 0.2;
  if (age < 2) activityFactor += 0.5;

  const dailyCalories = Math.round(rer * activityFactor);

  // Water calculation (ml)
  // Base: 60ml per kg roughly
  let waterNeed = weight * 60;
  
  // Weather modifiers
  if (weather === WeatherType.HOT) waterNeed *= 1.2;
  if (weather === WeatherType.SUNNY) waterNeed *= 1.1;

  // Activity modifiers (handled roughly here for daily target base)
  if (habits.includes(ActivityLevel.INTENSE_RUN)) waterNeed *= 1.1;

  // Nutrient distribution based on AAFCO/FEDIAF simplified guidelines per 1000 kcal
  // Ratios scaled to dailyCalories
  const scale = dailyCalories / 1000;

  return {
    calories: dailyCalories,
    protein: Math.round(45 * scale), // ~18-25% min
    fat: Math.round(15 * scale), 
    omega3: parseFloat((1.5 * scale).toFixed(2)),
    carbs: Math.round(100 * scale), // Remainder roughly
    fiber: parseFloat((5 * scale).toFixed(1)),
    sodium: Math.round(200 * scale), // mg
    calcium: Math.round(1250 * scale), // mg
    phosphorus: Math.round(1000 * scale), // mg
    vitaminD: Math.round(125 * scale), // IU
    water: Math.round(waterNeed),
  };
};

export const calculateBurnedCalories = (weight: number, activity: ActivityLevel, minutes: number): number => {
  // METs (Metabolic Equivalent of Task) approximation for dogs
  let met = 1;
  switch(activity) {
    case ActivityLevel.REST: met = 1; break;
    case ActivityLevel.LIGHT_WALK: met = 3; break;
    case ActivityLevel.MODERATE_WALK: met = 4; break;
    case ActivityLevel.PLAY: met = 5; break;
    case ActivityLevel.INTENSE_RUN: met = 8; break;
    case ActivityLevel.OTHER: met = 3; break;
  }
  
  // Calorie Burn = (METs * 3.5 * weight in kg) / 200 * minutes
  // Simplified formula for dogs: RER-based hourly burn
  // Using a simpler coefficient for gameplay
  const kcalPerMinute = (met * 3.5 * weight) / 200; 
  return Math.round(kcalPerMinute * minutes);
};