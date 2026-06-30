export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'intense'
export type TrainingType = 'strength' | 'cardio' | 'hybrid' | 'sport' | 'none'
export type TrainingTime = 'morning' | 'noon' | 'afternoon' | 'night'
export type MainGoal = 'lose_fat' | 'gain_muscle' | 'recomposition' | 'performance' | 'health'
export type Diet = 'mediterranean' | 'keto' | 'carnivore' | 'intermittent_fasting' | 'low_carb' | 'weight_gain'
export type FoodCategory = 'protein' | 'carbs' | 'vegetable' | 'fruit' | 'dairy' | 'fat' | 'other'

export interface FoodEntry {
  id: string
  date: string
  meal: 'desayuno' | 'almuerzo' | 'cena' | 'snack'
  name: string
  portion: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  aiDetected: boolean
}

export interface WeightEntry {
  id: string
  date: string
  weight: number
}

export interface ChatMessage {
  id: string
  role: 'coach' | 'user'
  content: string
  recipeCard?: { title: string; kcal: number; protein: number; timeMin: number }
  timestamp: string
}

export interface UserProfile {
  // Personal
  name: string
  age: number
  heightCm: number
  weightKg: number
  goalWeightKg: number
  activityLevel: ActivityLevel
  sleepHours: number
  occupation: string
  // Step 2
  trainingType: TrainingType
  trainingFrequency: number
  trainingDuration: number
  trainingTime: TrainingTime
  // Step 3
  mainGoal: MainGoal
  goalContext: string
  // Step 4
  diet: Diet
  // Step 5
  allergies: string
  intolerances: string
  preferences: string[]
}

export interface PantryItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: FoodCategory
  addedAt: string
}

export interface RecipeMacros {
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface RecipeIngredient {
  name: string
  quantity: number
  unit: string
}

export interface Recipe {
  id: string
  title: string
  time_min: number
  difficulty: 'easy' | 'medium' | 'hard'
  macros: RecipeMacros
  pantry_ingredients: RecipeIngredient[]
  missing_ingredients: RecipeIngredient[]
  steps: string[]
  goal_fit: string
  generatedAt: string
}

export type AppTab = 'hoy' | 'plan' | 'progreso' | 'perfil'
