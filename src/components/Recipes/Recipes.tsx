import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Recipe, UserProfile } from '../../types'
import { storage } from '../../hooks/useStorage'
import { useClaude } from '../../hooks/useClaude'

interface Props { profile: UserProfile }

export default function Recipes({ profile }: Props) {
  const { t, i18n } = useTranslation()
  const { generateRecipes, loading, error } = useClaude()
  const [recipes, setRecipes] = useState<Recipe[]>(() => storage.getRecipes())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2800) }

  const handleGenerate = async () => {
    const pantry = storage.getPantry()
    const result = await generateRecipes(profile, pantry, i18n.language)
    if (result.length > 0) {
      setRecipes(result)
      storage.saveRecipes(result)
      setExpanded(null)
    }
  }

  const handleCooked = (recipe: Recipe) => {
    const pantry = storage.getPantry()
    const updated = pantry.map(item => {
      const used = recipe.pantry_ingredients.find(
        ing => ing.name.toLowerCase() === item.name.toLowerCase()
      )
      if (!used) return item
      const newQty = item.quantity - used.quantity
      return newQty <= 0 ? null : { ...item, quantity: Math.round(newQty * 10) / 10 }
    }).filter(Boolean) as typeof pantry
    storage.savePantry(updated)
    showToast(t('cooked_toast'))
  }

  const difficultyBadge = (d: string) => {
    const map: Record<string, string> = { easy: 'badge-green', medium: 'badge-amber', hard: 'badge-red' }
    const labelMap: Record<string, string> = {
      easy: t('recipe_difficulty_easy'),
      medium: t('recipe_difficulty_medium'),
      hard: t('recipe_difficulty_hard'),
    }
    return <span className={`badge ${map[d] ?? 'badge-stone'}`}>{labelMap[d] ?? d}</span>
  }

  return (
    <div className="screen">
      <div className="page-header">
        <h1 className="page-title">{t('recipes_title')}</h1>
      </div>

      <button className="btn btn-amber btn-full" style={{ fontSize: '1rem', padding: '0.9rem', marginBottom: '1.25rem' }}
        onClick={handleGenerate} disabled={loading}>
        {loading ? '⏳ ' + t('recipes_loading') : '🍳 ' + t('recipes_cta')}
      </button>

      {error && !loading && (
        <div className="card" style={{ background: '#fee2e2', borderColor: 'var(--red)', marginBottom: '1rem' }}>
          <p style={{ color: '#991b1b', fontSize: '0.88rem' }}>{t('recipes_error')}</p>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <span>{t('recipes_loading')}</span>
        </div>
      )}

      {!loading && recipes.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <h3>{t('recipes_empty')}</h3>
        </div>
      )}

      {!loading && recipes.map(recipe => (
        <div key={recipe.id} className="recipe-card">
          <div className="recipe-header" onClick={() => setExpanded(expanded === recipe.id ? null : recipe.id)}
            style={{ cursor: 'pointer' }}>
            <div className="recipe-title">{recipe.title}</div>
            <div className="recipe-meta">
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                ⏱ {t('recipe_time', { min: recipe.time_min })}
              </span>
              {difficultyBadge(recipe.difficulty)}
            </div>
          </div>

          {/* Macros always visible */}
          <div className="recipe-body" style={{ paddingBottom: expanded === recipe.id ? '0.5rem' : '1rem' }}>
            <div className="macros-row">
              {[
                { val: recipe.macros.kcal, lbl: 'kcal' },
                { val: `${recipe.macros.protein_g}g`, lbl: t('home_macro_protein') },
                { val: `${recipe.macros.carbs_g}g`, lbl: t('home_macro_carbs') },
                { val: `${recipe.macros.fat_g}g`, lbl: t('home_macro_fat') },
              ].map(m => (
                <div key={m.lbl} className="macro-box">
                  <div className="macro-val">{m.val}</div>
                  <div className="macro-lbl">{m.lbl}</div>
                </div>
              ))}
            </div>

            {expanded === recipe.id && (
              <>
                {/* Pantry ingredients */}
                {recipe.pantry_ingredients.length > 0 && (
                  <>
                    <div className="recipe-section-title">✅ {t('recipe_pantry_items')}</div>
                    {recipe.pantry_ingredients.map((ing, i) => (
                      <div key={i} className="ingredient-row">
                        <span>{ing.name}</span>
                        <span style={{ color: 'var(--stone-400)', fontSize: '0.82rem' }}>{ing.quantity} {ing.unit}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Missing ingredients */}
                {recipe.missing_ingredients.length > 0 && (
                  <>
                    <div className="recipe-section-title">🛒 {t('recipe_missing_items')}</div>
                    {recipe.missing_ingredients.map((ing, i) => (
                      <div key={i} className="ingredient-row">
                        <span style={{ color: 'var(--orange)' }}>{ing.name}</span>
                        <span style={{ color: 'var(--stone-400)', fontSize: '0.82rem' }}>{ing.quantity} {ing.unit}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Steps */}
                <div className="recipe-section-title">👨‍🍳 {t('recipe_steps')}</div>
                {recipe.steps.map((step, i) => (
                  <div key={i} className="recipe-step">
                    <div className="step-num">{i + 1}</div>
                    <div>{step}</div>
                  </div>
                ))}

                {/* Goal fit */}
                {recipe.goal_fit && (
                  <div style={{
                    background: 'var(--green-light)', borderRadius: 'var(--radius-md)',
                    padding: '0.75rem', marginTop: '0.75rem', marginBottom: '0.5rem',
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--green-dark)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                      {t('recipe_goal_fit')}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--stone-600)', lineHeight: 1.5 }}>{recipe.goal_fit}</p>
                  </div>
                )}

                <button className="btn btn-primary btn-full" style={{ marginTop: '0.75rem' }}
                  onClick={() => handleCooked(recipe)}>
                  {t('cooked_it')}
                </button>
              </>
            )}

            <button
              onClick={() => setExpanded(expanded === recipe.id ? null : recipe.id)}
              style={{ background: 'none', border: 'none', color: 'var(--green)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', marginTop: expanded === recipe.id ? '0.75rem' : '0.5rem', fontFamily: 'inherit' }}>
              {expanded === recipe.id ? `▲ ${t('recipe_collapse')}` : `▼ ${t('recipe_expand')}`}
            </button>
          </div>
        </div>
      ))}

      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
    </div>
  )
}
