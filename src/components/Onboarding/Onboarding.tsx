import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserProfile, ActivityLevel, TrainingType, TrainingTime, Diet } from '../../types'
import i18n from '../../i18n/index'

type DesignGoal = 'lose_weight' | 'eat_healthy' | 'fitness'

const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'intense']
const TRAINING_TYPES: TrainingType[] = ['strength', 'cardio', 'sport', 'none']
const TRAINING_TIMES: TrainingTime[] = ['morning', 'noon', 'afternoon', 'night']
const DIETS: { id: Diet; icon: string }[] = [
  { id: 'mediterranean', icon: '🌿' },
  { id: 'keto', icon: '🥑' },
  { id: 'carnivore', icon: '🥩' },
  { id: 'intermittent_fasting', icon: '⏳' },
  { id: 'low_carb', icon: '🥗' },
  { id: 'weight_gain', icon: '💪' },
]
const PREFS = [
  { id: 'vegetarian',   label: 'Vegetariano' },
  { id: 'vegan',        label: 'Vegano' },
  { id: 'gluten_free',  label: 'Sin gluten' },
  { id: 'lactose_free', label: 'Sin lactosa' },
  { id: 'keto',         label: 'Keto' },
  { id: 'low_carb',     label: 'Bajo en carbos' },
  { id: 'mediterranean',label: 'Mediterráneo' },
  { id: 'none',         label: 'Sin restricciones' },
]

// Maps 3 design chips to existing MainGoal values
const GOAL_MAP: Record<DesignGoal, string> = {
  lose_weight: 'lose_fat',
  eat_healthy: 'health',
  fitness:     'performance',
}
const GOAL_REVERSE: Record<string, DesignGoal> = {
  lose_fat:    'lose_weight',
  health:      'eat_healthy',
  performance: 'fitness',
}

const DEFAULT_PROFILE: UserProfile = {
  name:              '',
  age:               25,
  heightCm:          165,
  weightKg:          65,
  goalWeightKg:      60,
  activityLevel:     'moderate',
  sleepHours:        7,
  occupation:        '',
  trainingType:      'strength',
  trainingFrequency: 3,
  trainingDuration:  45,
  trainingTime:      'morning',
  mainGoal:          'lose_fat',
  goalContext:       '',
  diet:              'mediterranean',
  allergies:         '',
  intolerances:      '',
  preferences:       [],
}

const TOTAL_STEPS = 5

interface Props { onComplete: (p: UserProfile) => void }

export default function Onboarding({ onComplete }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)           // 1-5 = data (intro carousel handles the splash)
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')

  const set = <K extends keyof UserProfile>(key: K, val: UserProfile[K]) =>
    setProfile(p => ({ ...p, [key]: val }))

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS))
  const back = () => setStep(s => Math.max(s - 1, 1))

  const switchLang = () => {
    const nextLang = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(nextLang)
    localStorage.setItem('nutricoach:language', nextLang)
  }

  const fmtDuration = (m: number) => {
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    const min = m % 60
    return min === 0 ? `${h}h` : `${h}h ${min}m`
  }

  const toFtLabel = (cm: number) => {
    const totalIn = cm / 2.54
    const ft = Math.floor(totalIn / 12)
    const inches = Math.round(totalIn % 12)
    return `${ft}′ ${inches}″`
  }

  const activeDesignGoal = (): DesignGoal | null =>
    GOAL_REVERSE[profile.mainGoal] ?? null

  const setDesignGoal = (g: DesignGoal) =>
    set('mainGoal', GOAL_MAP[g] as UserProfile['mainGoal'])

  // ── DATA STEPS (1-5) ─────────────────────────────
  return (
    <div className="ob-wrapper">
      {/* Header */}
      <div className="ob-header">
        <button className="ob-back" onClick={back}>←</button>
        <div className="ob-progress-bar">
          <div
            className="ob-progress-fill"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <button className="lang-toggle-sm" onClick={switchLang}>
          {t('lang_toggle')}
        </button>
      </div>

      <div className="ob-step-label">{t('onboarding_step', { step })}</div>

      <div className="ob-content">

        {/* ── STEP 1 — Tus datos ── */}
        {step === 1 && (
          <>
            <div className="ob-title-block">
              <p className="ob-eyebrow">{t('step1_eyebrow')}</p>
              <h1 className="ob-title">{t('step1_title')}</h1>
            </div>

            {/* Name */}
            <div className="nc-field">
              <label className="nc-label">{t('field_name')}</label>
              <input
                className="nc-input"
                type="text"
                placeholder={t('field_name_placeholder')}
                value={profile.name}
                onChange={e => set('name', e.target.value)}
                autoComplete="given-name"
              />
            </div>

            {/* Age */}
            <div className="nc-field">
              <label className="nc-label">{t('field_age')}</label>
              <div className="nc-stepper">
                <button
                  className="nc-stepper-btn"
                  onClick={() => set('age', Math.max(10, profile.age - 1))}
                >−</button>
                <span className="nc-stepper-val">{profile.age}</span>
                <button
                  className="nc-stepper-btn"
                  onClick={() => set('age', Math.min(100, profile.age + 1))}
                >+</button>
              </div>
            </div>

            {/* Height */}
            <div className="nc-field">
              <label className="nc-label">{t('field_height')}</label>
              <div className="nc-input-row">
                <input
                  className="nc-input nc-input-flex"
                  type="number"
                  inputMode="decimal"
                  value={
                    heightUnit === 'cm'
                      ? profile.heightCm
                      : Math.round((profile.heightCm / 30.48) * 10) / 10
                  }
                  onChange={e =>
                    set(
                      'heightCm',
                      heightUnit === 'cm'
                        ? +e.target.value
                        : Math.round(+e.target.value * 30.48)
                    )
                  }
                />
                <span className="nc-unit-equiv">{toFtLabel(profile.heightCm)}</span>
                <div className="nc-unit-toggle">
                  <button
                    className={`nc-unit-btn${heightUnit === 'cm' ? ' active' : ''}`}
                    onClick={() => setHeightUnit('cm')}
                  >cm</button>
                  <button
                    className={`nc-unit-btn${heightUnit === 'ft' ? ' active' : ''}`}
                    onClick={() => setHeightUnit('ft')}
                  >ft</button>
                </div>
              </div>
            </div>

            {/* Weight + Goal */}
            <div className="nc-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                <span className="nc-label" style={{ margin: 0 }}>{t('field_weight')}</span>
                <div className="nc-unit-toggle">
                  <button
                    className={`nc-unit-btn${weightUnit === 'kg' ? ' active' : ''}`}
                    onClick={() => setWeightUnit('kg')}
                  >kg</button>
                  <button
                    className={`nc-unit-btn${weightUnit === 'lbs' ? ' active' : ''}`}
                    onClick={() => setWeightUnit('lbs')}
                  >lbs</button>
                </div>
              </div>
              <div className="nc-weight-row">
                {/* Current weight stepper */}
                <div className="nc-weight-box">
                  <span className="nc-weight-label">{t('field_current')}</span>
                  <div className="nc-stepper">
                    <button className="nc-stepper-btn" onClick={() => {
                      if (weightUnit === 'kg') {
                        set('weightKg', Math.max(20, Math.round((profile.weightKg - 0.5) * 10) / 10))
                      } else {
                        const lbs = Math.round(profile.weightKg * 2.205 * 10) / 10
                        set('weightKg', Math.round(Math.max(44, lbs - 1) / 2.205 * 10) / 10)
                      }
                    }}>−</button>
                    <span className="nc-stepper-val" style={{ fontSize: '.92rem' }}>
                      {weightUnit === 'kg'
                        ? profile.weightKg
                        : Math.round(profile.weightKg * 2.205 * 10) / 10}
                      <span style={{ fontSize: '.68rem', color: 'var(--muted)', marginLeft: 2 }}>{weightUnit}</span>
                    </span>
                    <button className="nc-stepper-btn" onClick={() => {
                      if (weightUnit === 'kg') {
                        set('weightKg', Math.min(300, Math.round((profile.weightKg + 0.5) * 10) / 10))
                      } else {
                        const lbs = Math.round(profile.weightKg * 2.205 * 10) / 10
                        set('weightKg', Math.round(Math.min(660, lbs + 1) / 2.205 * 10) / 10)
                      }
                    }}>+</button>
                  </div>
                </div>
                {/* Goal weight stepper */}
                <div className="nc-weight-box nc-weight-goal">
                  <span className="nc-weight-label">{t('field_goal')}</span>
                  <div className="nc-stepper">
                    <button className="nc-stepper-btn" onClick={() => {
                      if (weightUnit === 'kg') {
                        set('goalWeightKg', Math.max(20, Math.round((profile.goalWeightKg - 0.5) * 10) / 10))
                      } else {
                        const lbs = Math.round(profile.goalWeightKg * 2.205 * 10) / 10
                        set('goalWeightKg', Math.round(Math.max(44, lbs - 1) / 2.205 * 10) / 10)
                      }
                    }}>−</button>
                    <span className="nc-stepper-val" style={{ fontSize: '.92rem' }}>
                      {weightUnit === 'kg'
                        ? profile.goalWeightKg
                        : Math.round(profile.goalWeightKg * 2.205 * 10) / 10}
                      <span style={{ fontSize: '.68rem', color: 'var(--muted)', marginLeft: 2 }}>{weightUnit}</span>
                    </span>
                    <button className="nc-stepper-btn" onClick={() => {
                      if (weightUnit === 'kg') {
                        set('goalWeightKg', Math.min(300, Math.round((profile.goalWeightKg + 0.5) * 10) / 10))
                      } else {
                        const lbs = Math.round(profile.goalWeightKg * 2.205 * 10) / 10
                        set('goalWeightKg', Math.round(Math.min(660, lbs + 1) / 2.205 * 10) / 10)
                      }
                    }}>+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Goal chips */}
            <div className="nc-field">
              <label className="nc-label">{t('field_main_goal')}</label>
              <div className="nc-chips">
                {(['lose_weight', 'eat_healthy', 'fitness'] as DesignGoal[]).map(g => (
                  <button
                    key={g}
                    className={`nc-chip${activeDesignGoal() === g ? ' active' : ''}`}
                    onClick={() => setDesignGoal(g)}
                  >
                    {t(`goal_chip_${g}`)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2 — Entrenamiento ── */}
        {step === 2 && (
          <>
            <div className="ob-title-block">
              <p className="ob-eyebrow">{t('step2_eyebrow')}</p>
              <h1 className="ob-title">{t('step2_title')}</h1>
            </div>

            <div className="nc-field">
              <label className="nc-label">{t('field_training_type')}</label>
              <div className="nc-chips">
                {TRAINING_TYPES.map(tt => (
                  <button
                    key={tt}
                    className={`nc-chip${profile.trainingType === tt ? ' active' : ''}`}
                    onClick={() => set('trainingType', tt)}
                  >
                    {t(`training_${tt}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="nc-field">
              <label className="nc-label">{t('field_activity')}</label>
              <div className="nc-chips">
                {ACTIVITY_LEVELS.map(a => (
                  <button
                    key={a}
                    className={`nc-chip${profile.activityLevel === a ? ' active' : ''}`}
                    onClick={() => set('activityLevel', a)}
                  >
                    {t(`activity_${a}`)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '.75rem' }}>
              <div className="nc-field" style={{ flex: 1 }}>
                <label className="nc-label">{t('field_frequency')}</label>
                <div className="nc-stepper">
                  <button
                    className="nc-stepper-btn"
                    onClick={() => set('trainingFrequency', Math.max(0, profile.trainingFrequency - 1))}
                  >−</button>
                  <span className="nc-stepper-val">{profile.trainingFrequency}×</span>
                  <button
                    className="nc-stepper-btn"
                    onClick={() => set('trainingFrequency', Math.min(7, profile.trainingFrequency + 1))}
                  >+</button>
                </div>
              </div>
              <div className="nc-field" style={{ flex: 1 }}>
                <label className="nc-label">{t('field_duration_short')}</label>
                <div className="nc-stepper">
                  <button
                    className="nc-stepper-btn"
                    onClick={() => set('trainingDuration', Math.max(15, profile.trainingDuration - 15))}
                  >−</button>
                  <span className="nc-stepper-val">{fmtDuration(profile.trainingDuration)}</span>
                  <button
                    className="nc-stepper-btn"
                    onClick={() => set('trainingDuration', Math.min(180, profile.trainingDuration + 15))}
                  >+</button>
                </div>
              </div>
            </div>

            <div className="nc-field">
              <label className="nc-label">{t('field_training_time')}</label>
              <div className="nc-chips">
                {TRAINING_TIMES.map(tt => (
                  <button
                    key={tt}
                    className={`nc-chip${profile.trainingTime === tt ? ' active' : ''}`}
                    onClick={() => set('trainingTime', tt)}
                  >
                    {t(`time_${tt}`)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3 — Objetivo ── */}
        {step === 3 && (
          <>
            <div className="ob-title-block">
              <p className="ob-eyebrow">{t('step3_eyebrow')}</p>
              <h1 className="ob-title">{t('step3_title')}</h1>
            </div>

            <div className="nc-field">
              <label className="nc-label">{t('field_goal_context')}</label>
              <textarea
                className="nc-textarea"
                value={profile.goalContext}
                placeholder={t('goal_context_placeholder')}
                onChange={e => set('goalContext', e.target.value)}
              />
            </div>

            <div className="nc-field">
              <label className="nc-label">{t('field_sleep')}</label>
              <div className="nc-stepper">
                <button
                  className="nc-stepper-btn"
                  onClick={() => set('sleepHours', Math.max(4, +(profile.sleepHours - 0.5).toFixed(1)))}
                >−</button>
                <span className="nc-stepper-val">{profile.sleepHours}h</span>
                <button
                  className="nc-stepper-btn"
                  onClick={() => set('sleepHours', Math.min(12, +(profile.sleepHours + 0.5).toFixed(1)))}
                >+</button>
              </div>
            </div>

            <div className="nc-field">
              <label className="nc-label">{t('field_occupation')}</label>
              <input
                className="nc-input"
                type="text"
                value={profile.occupation}
                placeholder={t('occupation_placeholder')}
                onChange={e => set('occupation', e.target.value)}
              />
            </div>
          </>
        )}

        {/* ── STEP 4 — Dieta ── */}
        {step === 4 && (
          <>
            <div className="ob-title-block">
              <p className="ob-eyebrow">{t('step4_eyebrow')}</p>
              <h1 className="ob-title">{t('step4_title')}</h1>
              <p className="ob-sub">{t('step4_subtitle')}</p>
            </div>
            <div className="diet-grid">
              {DIETS.map(({ id, icon }) => (
                <div
                  key={id}
                  className={`diet-card${profile.diet === id ? ' selected' : ''}`}
                  onClick={() => set('diet', id)}
                >
                  <div className="diet-icon">{icon}</div>
                  <div className="diet-name">{t(`diet_${id}`)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 5 — Restricciones ── */}
        {step === 5 && (
          <>
            <div className="ob-title-block">
              <p className="ob-eyebrow">{t('step5_eyebrow')}</p>
              <h1 className="ob-title">{t('step5_title')}</h1>
            </div>

            <div className="nc-field">
              <label className="nc-label">{t('field_avoidances')}</label>
              <input
                className="nc-input"
                type="text"
                value={profile.allergies}
                placeholder={t('avoidances_placeholder')}
                onChange={e => { set('allergies', e.target.value); set('intolerances', '') }}
              />
            </div>

            <div className="nc-field">
              <label className="nc-label">{t('field_preferences')}</label>
              <div className="nc-chips">
                {PREFS.map(({ id, label }) => (
                  <button
                    key={id}
                    className={`nc-chip${profile.preferences.includes(id) ? ' active' : ''}`}
                    onClick={() => {
                      if (id === 'none') {
                        set('preferences', profile.preferences.includes('none') ? [] : ['none'])
                      } else {
                        const without = profile.preferences.filter(x => x !== 'none' && x !== id)
                        const prefs = profile.preferences.includes(id) ? without : [...without, id]
                        set('preferences', prefs)
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="ob-footer">
        {step < TOTAL_STEPS
          ? (
            <button className="btn-pill btn-pill-primary btn-pill-full" onClick={next}>
              {t('onboarding_next')}
            </button>
          ) : (
            <button
              className="btn-pill btn-pill-primary btn-pill-full"
              onClick={() => onComplete(profile)}
            >
              {t('onboarding_finish')}
            </button>
          )
        }
      </div>
    </div>
  )
}
