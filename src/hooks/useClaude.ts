import { useState } from 'react'
import { PantryItem, Recipe, UserProfile } from '../types'
import { storage } from './useStorage'

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

function stripJsonFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

async function callClaude(messages: ClaudeMessage[], systemPrompt: string): Promise<string> {
  const apiKey = storage.getApiKey()
  if (!apiKey) throw new Error('No API key set. Add your Anthropic API key in Profile.')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // Required for browser-side calls; in production use a backend proxy
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `API error ${response.status}`)
  }

  const data = await response.json()
  return (data.content[0] as { text: string }).text
}

function buildRecipeSystemPrompt(lang: string): string {
  return lang === 'es'
    ? `Eres NutriCoach.Ai, un chef nutricionista experto. Genera exactamente 3 recetas personalizadas basadas en el perfil del usuario. Responde SOLO con JSON válido, sin texto adicional ni backticks.`
    : `You are NutriCoach.Ai, an expert nutritionist chef. Generate exactly 3 personalized recipes based on the user's profile. Reply ONLY with valid JSON, no extra text or backticks.`
}

function buildRecipeUserPrompt(profile: UserProfile, pantry: PantryItem[], lang: string): string {
  const pantryList = pantry.length > 0
    ? pantry.map(i => `- ${i.name} (${i.quantity} ${i.unit})`).join('\n')
    : (lang === 'es' ? 'Despensa vacía — usa ingredientes comunes.' : 'Empty pantry — use common ingredients.')

  return `[IDIOMA / LANGUAGE]: ${lang}

PERFIL / PROFILE:
- Edad/Age: ${profile.age}
- Peso/Weight: ${profile.weightKg}kg → Meta/Goal: ${profile.goalWeightKg}kg
- Altura/Height: ${profile.heightCm}cm
- Actividad/Activity: ${profile.activityLevel}
- Sueño/Sleep: ${profile.sleepHours}h
- Profesión/Occupation: ${profile.occupation}

ENTRENAMIENTO / TRAINING:
- Tipo/Type: ${profile.trainingType} — ${profile.trainingFrequency}x/semana, ${profile.trainingDuration}min
- Momento/Time: ${profile.trainingTime}

OBJETIVO / GOAL: ${profile.mainGoal}
Contexto/Context: ${profile.goalContext || 'N/A'}

[CRITICAL] DIETA / DIET: ${profile.diet}
⚠️ ALL recipes must strictly follow this diet. No exceptions.

RESTRICCIONES / RESTRICTIONS:
- Alergias/Allergies: ${profile.allergies || 'None'}
- Intolerancias/Intolerances: ${profile.intolerances || 'None'}
- Preferencias/Preferences: ${profile.preferences.join(', ') || 'None'}

DESPENSA / PANTRY:
${pantryList}

Genera / Generate: 3 recetas en ${lang === 'es' ? 'español' : 'English'}

Respond with this exact JSON structure:
{
  "recipes": [
    {
      "title": "...",
      "time_min": 0,
      "difficulty": "easy|medium|hard",
      "macros": { "kcal": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
      "pantry_ingredients": [{ "name": "...", "quantity": 0, "unit": "..." }],
      "missing_ingredients": [{ "name": "...", "quantity": 0, "unit": "..." }],
      "steps": ["..."],
      "goal_fit": "..."
    }
  ]
}`
}

function buildOcrSystemPrompt(lang: string): string {
  return lang === 'es'
    ? `Eres un asistente OCR de supermercado. Extrae todos los alimentos del ticket. Normaliza nombres ("PECH POLLO FIL" → "Pechuga de pollo"). Responde SOLO con JSON válido, sin texto adicional ni backticks.`
    : `You are a supermarket OCR assistant. Extract all food items from the receipt. Normalize names ("PECH CHICK BRS" → "Chicken breast"). Reply ONLY with valid JSON, no extra text or backticks.`
}

export function useClaude() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateRecipes = async (
    profile: UserProfile,
    pantry: PantryItem[],
    lang: string
  ): Promise<Recipe[]> => {
    setLoading(true)
    setError(null)
    try {
      const system = buildRecipeSystemPrompt(lang)
      const userMsg = buildRecipeUserPrompt(profile, pantry, lang)
      const raw = await callClaude([{ role: 'user', content: userMsg }], system)
      const parsed = JSON.parse(stripJsonFences(raw)) as { recipes: Omit<Recipe, 'id' | 'generatedAt'>[] }
      return parsed.recipes.map(r => ({
        ...r,
        id: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
      }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }

  const scanReceipt = async (base64Image: string, lang: string): Promise<PantryItem[]> => {
    setLoading(true)
    setError(null)
    try {
      const system = buildOcrSystemPrompt(lang)
      const ocrContent: ContentBlock[] = [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
        },
        {
          type: 'text',
          text: lang === 'es'
            ? 'Extrae todos los alimentos de este ticket de supermercado.'
            : 'Extract all food items from this supermarket receipt.',
        },
      ]
      const raw = await callClaude([{ role: 'user', content: ocrContent }], system)
      const parsed = JSON.parse(stripJsonFences(raw)) as { items: Omit<PantryItem, 'id' | 'addedAt'>[] }
      return parsed.items.map(i => ({
        ...i,
        id: crypto.randomUUID(),
        addedAt: new Date().toISOString(),
      }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }

  return { generateRecipes, scanReceipt, loading, error }
}
