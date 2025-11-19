
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Nutrients, DailyLog, QuizQuestion } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize the client securely
const ai = new GoogleGenAI({ apiKey });

const nutrientSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    protein: { type: Type.NUMBER, description: "Protein in grams" },
    fat: { type: Type.NUMBER, description: "Total fat in grams" },
    omega3: { type: Type.NUMBER, description: "Omega-3 fatty acids in grams" },
    carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
    fiber: { type: Type.NUMBER, description: "Dietary fiber in grams" },
    calories: { type: Type.NUMBER, description: "Energy in kcal" },
    sodium: { type: Type.NUMBER, description: "Sodium in mg" },
    calcium: { type: Type.NUMBER, description: "Calcium in mg" },
    phosphorus: { type: Type.NUMBER, description: "Phosphorus in mg" },
    vitaminD: { type: Type.NUMBER, description: "Vitamin D in IU" },
  },
  required: ["protein", "fat", "omega3", "carbs", "fiber", "calories", "sodium", "calcium", "phosphorus", "vitaminD"],
};

const quizSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['STATUS', 'REMINDER', 'HIGHLIGHT', 'TOMORROW'] },
    question: { type: Type.STRING },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING },
          isCorrect: { type: Type.BOOLEAN }
        },
        required: ["id", "text", "isCorrect"]
      }
    },
    correctMessage: { type: Type.STRING },
    wrongMessage: { type: Type.STRING }
  },
  required: ["type", "question", "options", "correctMessage", "wrongMessage"]
};

export const analyzeFood = async (
  description: string,
  imageBase64?: string
): Promise<Nutrients> => {
  try {
    const parts: any[] = [{ text: `Analyze this dog food. Provide estimated nutritional values for a typical serving size if not specified. Strict JSON output.` }];
    
    if (description) {
      parts.push({ text: `Description: ${description}` });
    }
    
    if (imageBase64) {
        // Remove data URL prefix if present
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: nutrientSchema,
        systemInstruction: "You are a veterinary nutritionist AI. Analyze food images or text descriptions for dogs. Return estimated nutritional values based on standard dog food composition data. If specific amounts aren't given, estimate a reasonable single serving for a medium dog (e.g., 1 cup dry food or 1 can wet food).",
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return { ...data, water: 0 }; // Water is calculated separately usually, setting 0 base from food analysis unless specified
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Food analysis failed:", error);
    // Fallback for demo purposes if API fails or limits hit
    return {
      protein: 5, fat: 3, omega3: 0.1, carbs: 10, fiber: 1, calories: 100, sodium: 20, calcium: 50, phosphorus: 40, vitaminD: 10, water: 0
    };
  }
};

export const generateDailyAdvice = async (log: DailyLog, target: Nutrients): Promise<string> => {
  try {
    // Summarize data for the prompt
    const consumed = log.meals.reduce((acc, meal) => ({
        calories: acc.calories + meal.nutrients.calories,
        protein: acc.protein + meal.nutrients.protein,
        sodium: acc.sodium + meal.nutrients.sodium,
        water: acc.water + meal.nutrients.water
    }), { calories: 0, protein: 0, sodium: 0, water: 0 });

    const burned = log.activities.reduce((acc, act) => acc + act.caloriesBurned, 0);
    const netCalories = consumed.calories - burned;

    const prompt = `
      Analyze today's dog stats:
      Target Calories: ${target.calories}
      Net Calories (Eaten - Burned): ${netCalories}
      Protein Eaten: ${consumed.protein}g (Target: ${target.protein}g)
      Sodium Eaten: ${consumed.sodium}mg (Target: ${target.sodium}mg)
      Water Calculated Need: ${target.water}ml
      
      Provide a cute, supportive, one-sentence health summary.
      OUTPUT FORMAT: Bilingual - English first, followed by Traditional Chinese translation.
      Tone: Mature, Relaxed, Comforting.
      Examples: 
      - "Eating well today! Keep it up. (今天吃得很好！繼續保持。)"
      - "Protein is a bit low, maybe some meat tomorrow? (蛋白質稍微低了點，明天加一點肉會更棒。)"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Great job today! 今天過得很棒喔！";
  } catch (e) {
    return "Have a happy day! 今天也要開開心心喔！🐶";
  }
};

export const generateLongTermAdvice = async (logs: DailyLog[]): Promise<string> => {
   try {
    const summary = logs.slice(-7).map(l => {
        const consumed = l.meals.reduce((acc, m) => acc + m.nutrients.calories, 0);
        const burned = l.activities.reduce((acc, a) => acc + a.caloriesBurned, 0);
        const sodium = l.meals.reduce((acc, m) => acc + m.nutrients.sodium, 0);
        return { date: l.date, net: consumed - burned, sodium };
    });

    const prompt = `
      Analyze the last 7 days of dog health data: ${JSON.stringify(summary)}.
      Provide a gentle, long-term health advice based on trends.
      OUTPUT FORMAT: Bilingual - English first, followed by Traditional Chinese translation.
      Tone: Mature, Relaxed.
      Example: "Calorie intake is slightly high lately, maybe add a bit more walking. (最近熱量稍高，可以增加一點散步時間，體態會更棒。)"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Keep watching the long-term trends! 持續觀察寶貝的長期趨勢！";
   } catch (e) {
     return "Consistency is key to health! 長期保持均衡飲食，是健康的關鍵喔！";
   }
};

export const generateDailyQuiz = async (log: DailyLog, target: Nutrients): Promise<QuizQuestion> => {
  try {
    const consumed = log.meals.reduce((acc, m) => ({
      calories: acc.calories + m.nutrients.calories,
      fat: acc.fat + m.nutrients.fat,
      sodium: acc.sodium + m.nutrients.sodium,
      water: acc.water + (m.nutrients.water || 0),
    }), { calories: 0, fat: 0, sodium: 0, water: 0 });

    const burned = log.activities.reduce((sum, a) => sum + a.caloriesBurned, 0);
    const netCalories = consumed.calories - burned;

    const prompt = `
      Based on this data:
      Target Cals: ${target.calories}, Net: ${netCalories}
      Target Water: ${target.water}, Actual: ${consumed.water}
      Target Sodium: ${target.sodium}, Actual: ${consumed.sodium}
      Activity Minutes: ${log.activities.reduce((s, a) => s + a.durationMinutes, 0)}

      Generate 1 Daily Quiz Question in JSON.
      Select ONE of these 4 types that fits today best:
      
      1. STATUS (Understanding Today): Ask about a metric (High/Low/Just Right). 
         Tone: Neutral, straightforward.
         Ex: "Is today's water intake high, low, or just right? (今天的水分攝取，落在什麼狀態？)"

      2. REMINDER (Gentle Hint): Identify what needs attention.
         Tone: Gentle teacher, light reminder.
         Ex: "Which area needs a small adjustment? (今天的營養素裡，哪一項比較接近需要微調？)"

      3. HIGHLIGHT (Encouragement): Identify what went well.
         Tone: Stable, encouraging.
         Ex: "What is the best part of today? (今天最值得鼓勵的地方是哪一個？)"

      4. TOMORROW (Future Focus): Goal for tomorrow.
         Tone: Mature, life-oriented.
         Ex: "What should we focus on tomorrow? (根據今天的情況，明天最值得留意的是？)"

      STRICT GUIDELINES:
      - Language: Bilingual (English + Traditional Chinese).
      - Tone: "Mature Cute", Relaxed, "Just right". NOT childish, NOT scolding.
      - Correct Message: "Well done, clearly grasped today's status. (做得很好，清楚掌握今天的狀態。)"
      - Wrong Message: "Close, but good direction. (差一點點，但方向很好，明天一起調整。)"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as QuizQuestion;
    }
    throw new Error("Failed to generate quiz");

  } catch (e) {
    // Fallback quiz
    return {
      type: 'HIGHLIGHT',
      question: "What is the best part of today? 今天最值得鼓勵的地方是哪一個？",
      options: [
        { id: '1', text: "Logged carefully 用心記錄生活", isCorrect: true },
        { id: '2', text: "Balanced Diet 飲食均衡", isCorrect: false },
        { id: '3', text: "Good Activity 活動充足", isCorrect: false }
      ],
      correctMessage: "Well done, clearly grasped today's status. 做得很好，清楚掌握今天的狀態。",
      wrongMessage: "Close, but good direction. 差一點點，但方向很好，明天一起調整。"
    };
  }
};
