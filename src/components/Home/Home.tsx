import { useTranslation } from 'react-i18next'
import { AppTab, UserProfile, FoodEntry } from '../../types'
import { storage } from '../../hooks/useStorage'

interface Props {
  profile: UserProfile
  onNavigate: (tab: AppTab) => void
  onFab: () => void
  onOpenChat: () => void
}

function calcTDEE(p: UserProfile): number {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age - 161
  const mults = { sedentary: 1.2, light: 1.375, moderate: 1.55, intense: 1.725 }
  const tdee = bmr * mults[p.activityLevel]
  if (p.mainGoal === 'lose_fat')     return Math.round(tdee - 400)
  if (p.mainGoal === 'gain_muscle')  return Math.round(tdee + 300)
  return Math.round(tdee)
}

const RING_R  = 76
const RING_C  = 2 * Math.PI * RING_R  // ≈ 477.5

function ringOffset(consumed: number, goal: number): number {
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0
  return RING_C * (1 - pct)
}

const MEAL_ORDER: FoodEntry['meal'][] = ['desayuno', 'almuerzo', 'cena', 'snack']

export default function Home({ profile, onNavigate, onFab, onOpenChat }: Props) {
  const { t, i18n } = useTranslation()

  // Calorie / macro targets
  const kcalGoal    = calcTDEE(profile)
  const proteinGoal = Math.round(profile.weightKg * 2)
  const carbGoal    = Math.round((kcalGoal * 0.4) / 4)
  const fatGoal     = Math.round((kcalGoal * 0.3) / 9)

  // Today's food entries
  const today       = new Date().toISOString().slice(0, 10)
  const todayLog    = storage.getFoodLog().filter(e => e.date === today)

  const consumed = {
    kcal:    todayLog.reduce((s, e) => s + e.kcal,    0),
    protein: todayLog.reduce((s, e) => s + e.protein, 0),
    carbs:   todayLog.reduce((s, e) => s + e.carbs,   0),
    fat:     todayLog.reduce((s, e) => s + e.fat,     0),
  }

  const remaining = Math.max(0, kcalGoal - consumed.kcal)
  const offset    = ringOffset(consumed.kcal, kcalGoal)

  // Greeting
  const h     = new Date().getHours()
  const gKey  = h < 12 ? 'home_greeting_morning' : h < 19 ? 'home_greeting_afternoon' : 'home_greeting_evening'

  // Localised date label
  const dateLabel = new Date().toLocaleDateString(
    i18n.language === 'es' ? 'es-ES' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long' }
  )

  // Group entries by meal
  const byMeal = MEAL_ORDER.reduce((acc, meal) => {
    const entries = todayLog.filter(e => e.meal === meal)
    if (entries.length) acc[meal] = entries
    return acc
  }, {} as Partial<Record<FoodEntry['meal'], FoodEntry[]>>)

  const bmi = (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1)

  return (
    <div className="screen" style={{ paddingTop: '1.25rem' }}>

      {/* ── Date + Greeting ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <p style={{
            fontSize: '.7rem', fontWeight: 700, color: 'var(--muted)',
            textTransform: 'capitalize', letterSpacing: '.04em', marginBottom: '.25rem',
          }}>
            {dateLabel}
          </p>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600, fontSize: '1.75rem', lineHeight: 1, color: 'var(--dark)',
          }}>
            {t(gKey)}{profile.name && (
              <>, <em style={{ fontStyle: 'italic', color: 'var(--rosa)' }}>{profile.name}</em></>
            )}
          </h1>
        </div>

        {/* Logo mark */}
        <svg width="44" height="50" viewBox="0 0 150 170" style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 10px rgba(212,115,138,.45))' }}>
          <defs>
            <linearGradient id="leafHome" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F4D6B0" />
              <stop offset=".5" stopColor="#E8A0AD" />
              <stop offset="1" stopColor="#D4738A" />
            </linearGradient>
          </defs>
          <path d="M75 8 C32 44 18 84 18 110 a57 57 0 0 0 114 0 C132 84 118 44 75 8 Z" fill="url(#leafHome)" />
          <path d="M75 30 C75 70 75 120 75 150" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="3" strokeLinecap="round" />
          <path d="M75 78 C90 70 102 64 112 56" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M75 100 C60 92 48 86 38 78" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2.6" strokeLinecap="round" />
          <text x="75" y="128" fontFamily="'Cormorant Garamond',serif" fontStyle="italic" fontWeight="600" fontSize="76" fill="#fff" textAnchor="middle">n</text>
        </svg>
      </div>

      {/* ── Calorie Ring Card ── */}
      <div className="kcal-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>

          {/* SVG donut ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="148" height="148" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E7C490" />
                  <stop offset="100%" stopColor="#C9A36B" />
                </linearGradient>
              </defs>
              {/* Track */}
              <circle
                cx="100" cy="100" r={RING_R}
                fill="none"
                stroke="rgba(255,255,255,.12)"
                strokeWidth="14"
              />
              {/* Progress */}
              <circle
                cx="100" cy="100" r={RING_R}
                fill="none"
                stroke="url(#ring-grad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={offset}
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dashoffset .9s ease' }}
              />
            </svg>

            {/* Center numbers */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center', width: '90px',
            }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '2rem', fontWeight: 600,
                color: 'var(--white)', lineHeight: 1,
              }}>
                {remaining}
              </div>
              <div style={{
                fontSize: '.6rem', color: 'rgba(255,255,255,.68)',
                fontWeight: 600, letterSpacing: '.04em', marginTop: '.2rem',
              }}>
                {t('home_kcal_remaining')}
              </div>
            </div>
          </div>

          {/* Macro bars */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
            {[
              {
                label: t('home_macro_protein'),
                consumed: consumed.protein, goal: proteinGoal,
                cls: 'progress-fill-protein',
              },
              {
                label: t('home_macro_carbs'),
                consumed: consumed.carbs, goal: carbGoal,
                cls: 'progress-fill-carbs',
              },
              {
                label: t('home_macro_fat'),
                consumed: consumed.fat, goal: fatGoal,
                cls: 'progress-fill-fat',
              },
            ].map(m => (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.28rem' }}>
                  <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.85)', fontWeight: 700 }}>
                    {m.label}
                  </span>
                  <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>
                    {m.consumed}g / {m.goal}g
                  </span>
                </div>
                <div className="progress-track" style={{ background: 'rgba(255,255,255,.15)' }}>
                  <div
                    className={`progress-fill ${m.cls}`}
                    style={{ width: `${Math.min(100, m.goal > 0 ? (m.consumed / m.goal) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Coach Nudge ── */}
      <div className="coach-bubble" style={{ cursor: 'default' }}>
        <div className="coach-avatar">
          <span className="coach-avatar-n">n</span>
        </div>
        <div style={{ flex: 1 }}>
          <p className="coach-text">
            {consumed.kcal === 0
              ? <>
                  {t('home_coach_start')}{' '}
                  <span className="coach-text-accent">
                    {profile.name || t('home_coach_default_name')}
                  </span>.
                </>
              : <>
                  {t('home_coach_progress')}{' '}
                  <span className="coach-text-accent">
                    {remaining} kcal {t('home_coach_remaining')}
                  </span>. {t('home_coach_keep')}
                </>
            }
          </p>
          <button
            onClick={onOpenChat}
            style={{ background: 'none', border: 'none', padding: '4px 0 0', fontSize: '.75rem', fontWeight: 700, color: 'var(--rosa-light)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t('chat_open_cta')}
          </button>
        </div>
      </div>

      {/* ── Log Food CTA ── */}
      <button
        className="btn btn-primary btn-full"
        style={{ fontSize: '1rem', padding: '.9rem', marginBottom: '1.25rem' }}
        onClick={onFab}
      >
        📷 {t('home_log_food')}
      </button>

      {/* ── Today's Meals ── */}
      <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted)', marginBottom: '.75rem' }}>
        {t('home_today')}
      </div>

      {Object.keys(byMeal).length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '1.5rem',
          color: 'var(--muted)', fontSize: '.88rem', lineHeight: 1.5,
        }}>
          {t('home_meals_empty')}
        </div>
      ) : (
        MEAL_ORDER.filter(m => byMeal[m]).map(meal => (
          <div key={meal} className="card">
            <div className="card-label">{t(`meal_${meal}`)}</div>
            {byMeal[meal]!.map(entry => (
              <div key={entry.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '.45rem 0', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.92rem' }}>{entry.name}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '1px' }}>
                    {entry.portion}
                  </div>
                </div>
                <span style={{ fontWeight: 800, color: 'var(--rosa)', fontSize: '.92rem' }}>
                  {entry.kcal} kcal
                </span>
              </div>
            ))}
          </div>
        ))
      )}

      {/* ── Profile summary badge ── */}
      <div className="card" style={{ marginTop: '.5rem' }}>
        <div className="card-label">{t('home_profile_card')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          <span className="badge badge-green">{t(`diet_${profile.diet}`)}</span>
          <span className="badge badge-rosa">{t(`goal_${profile.mainGoal}`)}</span>
          <span className="badge badge-stone">IMC {bmi}</span>
          <span className="badge badge-stone">{profile.weightKg} → {profile.goalWeightKg} kg</span>
        </div>
      </div>

      {/* ── Plan CTA ── */}
      <button
        className="btn btn-outline btn-full"
        style={{ marginBottom: '1rem' }}
        onClick={() => onNavigate('plan')}
      >
        🍳 {t('home_cta_recipes')}
      </button>

      <p style={{ fontSize: '.7rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5, paddingBottom: '1rem' }}>
        {t('legal_disclaimer')}
      </p>
    </div>
  )
}
