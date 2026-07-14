import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FoodEntry } from '../../types'
import { storage } from '../../hooks/useStorage'
import { compressImage } from '../../hooks/useClaude'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

interface Props {
  onClose: () => void
}

type Meal = FoodEntry['meal']

function stripJsonFences(raw: string): string {
  return raw.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
}

function currentMealSlot(): Meal {
  const h = new Date().getHours()
  if (h < 11) return 'desayuno'
  if (h < 15) return 'almuerzo'
  if (h < 20) return 'cena'
  return 'snack'
}

const MEAL_SLOTS: { key: Meal; emoji: string; i18n: string }[] = [
  { key: 'desayuno', emoji: '☀️', i18n: 'meal_desayuno' },
  { key: 'almuerzo', emoji: '🌤️', i18n: 'meal_almuerzo' },
  { key: 'cena',     emoji: '🌙', i18n: 'meal_cena'     },
  { key: 'snack',    emoji: '🍎', i18n: 'meal_snack'    },
]

type Phase = 'idle' | 'loading' | 'review' | 'error'

interface EntryDraft {
  meal: Meal; name: string; portion: string
  kcal: number; protein: number; carbs: number; fat: number
}

export default function FoodLog({ onClose }: Props) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase]     = useState<Phase>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [manual, setManual]   = useState(false)

  const [draft, setDraft] = useState<EntryDraft>({
    meal: currentMealSlot(), name: '', portion: '',
    kcal: 0, protein: 0, carbs: 0, fat: 0,
  })

  const field = <K extends keyof EntryDraft>(key: K, val: EntryDraft[K]) =>
    setDraft(p => ({ ...p, [key]: val }))

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setPhase('loading')

    const rawBase64 = await new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onload = ev => resolve((ev.target?.result as string).split(',')[1])
      reader.readAsDataURL(file)
    })

    try {
      const base64 = await compressImage(rawBase64)
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 256,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
              {
                type: 'text',
                text: 'Identifica el alimento. Devuelve SOLO un objeto JSON sin markdown:\n{"name":"nombre en español","portion":"porción estimada","kcal":número,"protein":número,"carbs":número,"fat":número}\nEstima macros reales para la porción identificada.',
              },
            ],
          }],
        }),
      })

      if (!res.ok) throw new Error(`API ${res.status}`)
      const data   = await res.json()
      const parsed = JSON.parse(stripJsonFences(data.content?.[0]?.text ?? '{}'))

      setDraft(p => ({
        ...p,
        name:    String(parsed.name    ?? ''),
        portion: String(parsed.portion ?? ''),
        kcal:    Number(parsed.kcal)    || 0,
        protein: Number(parsed.protein) || 0,
        carbs:   Number(parsed.carbs)   || 0,
        fat:     Number(parsed.fat)     || 0,
      }))
      setPhase('review')
    } catch (err) {
      console.error(err)
      setErrorMsg(t('foodlog_ocr_error'))
      setPhase('error')
    }
  }

  function goManual() {
    setManual(true)
    setPhase('review')
  }

  function save() {
    const entry: FoodEntry = {
      id:         crypto.randomUUID(),
      date:       new Date().toISOString().slice(0, 10),
      aiDetected: !manual,
      ...draft,
    }
    storage.saveFoodLog([...storage.getFoodLog(), entry])
    onClose()
  }

  /* ── Error ── */
  if (phase === 'error') return (
    <>
      <div className="sheet-handle" />
      <div className="sheet-title">{t('foodlog_title')}</div>
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <p>{errorMsg}</p>
      </div>
      <div style={{ display: 'flex', gap: '.75rem' }}>
        <button className="btn btn-secondary btn-full" onClick={() => { setPhase('idle'); setPreview(null) }}>
          {t('error_retry')}
        </button>
        <button className="btn btn-outline btn-full" onClick={goManual}>
          {t('foodlog_manual')}
        </button>
      </div>
    </>
  )

  /* ── Loading ── */
  if (phase === 'loading') return (
    <>
      <div className="sheet-handle" />
      <div className="sheet-title">{t('foodlog_title')}</div>
      {preview && (
        <img src={preview} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 'var(--r-lg)', marginBottom: '1.25rem' }} />
      )}
      <div className="loading-overlay">
        <div className="spinner" />
        <p style={{ fontWeight: 700, color: 'var(--muted)' }}>{t('foodlog_analyzing')}</p>
      </div>
    </>
  )

  /* ── Review / Manual ── */
  if (phase === 'review') return (
    <>
      <div className="sheet-handle" />
      <div className="sheet-title">{t('foodlog_review_title')}</div>

      {preview && !manual && (
        <img src={preview} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 'var(--r-lg)', marginBottom: '1.25rem' }} />
      )}

      <div className="nc-field">
        <label className="nc-label">{t('foodlog_field_name')}</label>
        <input
          className="nc-input"
          value={draft.name}
          placeholder={t('foodlog_name_placeholder')}
          onChange={e => field('name', e.target.value)}
        />
      </div>

      <div className="nc-field">
        <label className="nc-label">{t('foodlog_field_portion')}</label>
        <input
          className="nc-input"
          value={draft.portion}
          placeholder={t('foodlog_portion_placeholder')}
          onChange={e => field('portion', e.target.value)}
        />
      </div>

      {/* Macro boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.45rem', marginBottom: '1.25rem' }}>
        {([
          { label: 'Kcal',                  key: 'kcal'    as const, color: 'var(--rosa)'      },
          { label: t('home_macro_protein'), key: 'protein' as const, color: 'var(--rosa)'      },
          { label: t('home_macro_carbs'),   key: 'carbs'   as const, color: 'var(--coral-dark)' },
          { label: t('home_macro_fat'),     key: 'fat'     as const, color: 'var(--oro-dark)'  },
        ] as const).map(m => (
          <div key={m.key} style={{ background: 'var(--crema)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', padding: '.5rem .2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '.58rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>{m.label}</div>
            <input
              type="number" min="0"
              value={draft[m.key] || ''}
              onChange={e => field(m.key, Number(e.target.value))}
              style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, color: m.color, fontFamily: 'inherit', padding: 0 }}
            />
          </div>
        ))}
      </div>

      {/* Meal slot */}
      <div className="nc-field">
        <label className="nc-label">{t('foodlog_field_meal')}</label>
        <div className="nc-chips">
          {MEAL_SLOTS.map(s => (
            <button key={s.key} className={`nc-chip${draft.meal === s.key ? ' active' : ''}`} onClick={() => field('meal', s.key)}>
              {s.emoji} {t(s.i18n)}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary btn-full"
        style={{ padding: '1rem', fontSize: '1rem', marginTop: '.5rem' }}
        disabled={!draft.name.trim()}
        onClick={save}
      >
        ✓ {t('foodlog_save')}
      </button>
    </>
  )

  /* ── Idle ── */
  return (
    <>
      <div className="sheet-handle" />
      <div className="sheet-title">{t('foodlog_title')}</div>
      <p style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        {t('foodlog_subtitle')}
      </p>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        <button className="btn btn-primary btn-full" style={{ padding: '1.1rem', fontSize: '1.05rem' }} onClick={() => fileRef.current?.click()}>
          📷 {t('foodlog_camera_cta')}
        </button>
        <button className="btn btn-outline btn-full" style={{ padding: '1rem' }} onClick={goManual}>
          ✏️ {t('foodlog_manual')}
        </button>
        <button className="btn btn-secondary btn-full" style={{ padding: '.9rem' }} onClick={onClose}>
          {t('btn_cancel')}
        </button>
      </div>
    </>
  )
}
