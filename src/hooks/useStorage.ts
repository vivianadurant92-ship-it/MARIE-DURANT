import { UserProfile, PantryItem, Recipe, FoodEntry, WeightEntry, ChatMessage } from '../types'

const KEYS = {
  PROFILE: 'nutricoach:profile',
  PANTRY: 'nutricoach:pantry',
  RECIPES: 'nutricoach:recipes',
  LANGUAGE: 'nutricoach:language',
  FOOD_LOG: 'nutricoach:foodlog',
  WEIGHT_LOG: 'nutricoach:weightlog',
  CHAT: 'nutricoach:chat',
}

function get<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : null
  } catch { return null }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export const storage = {
  getProfile: (): UserProfile | null => {
    const p = get<UserProfile>(KEYS.PROFILE)
    if (p && !('name' in p)) return { ...(p as object), name: '' } as UserProfile
    return p
  },
  saveProfile: (p: UserProfile) => set(KEYS.PROFILE, p),

  getPantry: (): PantryItem[] => get<PantryItem[]>(KEYS.PANTRY) ?? [],
  savePantry: (items: PantryItem[]) => set(KEYS.PANTRY, items),

  getRecipes: (): Recipe[] => get<Recipe[]>(KEYS.RECIPES) ?? [],
  saveRecipes: (r: Recipe[]) => set(KEYS.RECIPES, r),

  getLanguage: (): string => localStorage.getItem(KEYS.LANGUAGE) ?? 'es',
  saveLanguage: (lang: string) => localStorage.setItem(KEYS.LANGUAGE, lang),

  getFoodLog: (): FoodEntry[] => get<FoodEntry[]>(KEYS.FOOD_LOG) ?? [],
  saveFoodLog: (entries: FoodEntry[]) => set(KEYS.FOOD_LOG, entries),

  getWeightLog: (): WeightEntry[] => get<WeightEntry[]>(KEYS.WEIGHT_LOG) ?? [],
  saveWeightLog: (entries: WeightEntry[]) => set(KEYS.WEIGHT_LOG, entries),

  getChatHistory: (): ChatMessage[] => get<ChatMessage[]>(KEYS.CHAT) ?? [],
  saveChatHistory: (msgs: ChatMessage[]) => set(KEYS.CHAT, msgs),

  clearAll: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),
}
