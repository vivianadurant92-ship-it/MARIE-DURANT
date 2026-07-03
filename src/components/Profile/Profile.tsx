import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserProfile } from '../../types'
import { storage } from '../../hooks/useStorage'
import i18n from '../../i18n/index'

interface Props {
  profile: UserProfile
  onProfileUpdate: (p: UserProfile) => void
  onReset: () => void
}

function calcTDEE(p: UserProfile): number {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age - 161
  const mults = { sedentary: 1.2, light: 1.375, moderate: 1.55, intense: 1.725 }
  const tdee  = bmr * mults[p.activityLevel]
  if (p.mainGoal === 'lose_fat')    return Math.round(tdee - 400)
  if (p.mainGoal === 'gain_muscle') return Math.round(tdee + 300)
  return Math.round(tdee)
}

type Section = 'main' | 'edit'

export default function Profile({ profile, onProfileUpdate, onReset }: Props) {
  const { t } = useTranslation()

  const [section, setSection]   = useState<Section>('main')
  const [showReset, setShowReset] = useState(false)
  const [toast, setToast]       = useState('')

  // Edit draft
  const [editDraft, setEditDraft] = useState({ name: profile.name, weightKg: profile.weightKg, goalWeightKg: profile.goalWeightKg })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const tdee  = calcTDEE(profile)
  const bmi   = (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1)
  const delta = profile.weightKg - profile.goalWeightKg

  const switchLang = () => {
    const next = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(next)
    storage.saveLanguage(next)
  }

  /* ── Edit section ── */
  if (section === 'edit') return (
    <div className="screen" style={{ paddingTop: '1rem' }}>
      <button className="ob-back" style={{ marginBottom: '1rem' }} onClick={() => setSection('main')}>←</button>
      <div className="ob-title-block" style={{ marginBottom: '1.5rem' }}>
        <div className="ob-eyebrow">{t('profile_title')}</div>
        <h2 className="ob-title">{t('profile_edit')}</h2>
      </div>

      <div className="nc-field">
        <label className="nc-label">{t('field_name')}</label>
        <input className="nc-input" value={editDraft.name} placeholder={t('field_name_placeholder')} onChange={e => setEditDraft(p => ({ ...p, name: e.target.value }))} />
      </div>
      <div className="nc-weight-row" style={{ marginBottom: '1.25rem' }}>
        <div className="nc-weight-box">
          <div className="nc-weight-label">{t('field_weight')}</div>
          <input className="nc-input nc-input-center" type="number" value={editDraft.weightKg} onChange={e => setEditDraft(p => ({ ...p, weightKg: Number(e.target.value) }))} />
        </div>
        <div className="nc-weight-box nc-weight-goal">
          <div className="nc-weight-label">{t('field_goal_weight')}</div>
          <input className="nc-input nc-input-center" type="number" value={editDraft.goalWeightKg} onChange={e => setEditDraft(p => ({ ...p, goalWeightKg: Number(e.target.value) }))} />
        </div>
      </div>

      <button className="btn btn-primary btn-full" style={{ padding: '1rem' }}
        onClick={() => { onProfileUpdate({ ...profile, ...editDraft }); showToast(t('profile_saved')); setSection('main') }}>
        ✓ {t('btn_save')}
      </button>
      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
    </div>
  )

  /* ── Main ── */
  const stats = [
    { label: t('profile_calories_needed'), val: `${tdee}`, unit: 'kcal', bg: 'linear-gradient(150deg,var(--crema-rosa),#fde6dc)', color: 'var(--rosa)' },
    { label: t('profile_bmi'),             val: bmi,       unit: '',     bg: 'linear-gradient(150deg,var(--crema),#f0ead5)',       color: 'var(--oro-dark)' },
    { label: delta > 0 ? t('profile_to_lose') : t('profile_to_gain'), val: `${Math.abs(delta).toFixed(1)}`, unit: 'kg', bg: 'linear-gradient(150deg,var(--verde-light),#dfeee2)', color: 'var(--verde)' },
  ]

  const detailRows = [
    { label: t('field_age'),           val: `${profile.age} ${t('profile_years')}` },
    { label: t('field_height'),        val: `${profile.heightCm} cm`                },
    { label: t('field_weight'),        val: `${profile.weightKg} kg`                },
    { label: t('field_goal_weight'),   val: `${profile.goalWeightKg} kg`            },
    { label: t('field_activity'),      val: t(`activity_${profile.activityLevel}`)  },
    { label: t('field_sleep'),         val: `${profile.sleepHours}h`                },
    { label: t('field_training_type'), val: t(`training_${profile.trainingType}`)   },
  ]

  return (
    <div className="screen" style={{ paddingTop: 0 }}>

      {/* ── Gradient header ── */}
      <div style={{
        background: 'linear-gradient(160deg, var(--rosa), var(--rosa-light))',
        padding: 'calc(1.5rem + env(safe-area-inset-top,0)) 1.25rem 1.5rem',
        marginBottom: '1rem',
        position: 'relative',
      }}>
        {/* Avatar */}
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          background: 'rgba(255,255,255,.25)',
          border: '2.5px solid rgba(255,255,255,.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '.75rem',
        }}>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontSize: '2.2rem', color: 'var(--white)', lineHeight: 1 }}>
            {profile.name ? profile.name[0].toUpperCase() : 'n'}
          </span>
        </div>

        <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: '1.75rem', fontWeight: 600, color: 'var(--white)', lineHeight: 1, marginBottom: '.3rem' }}>
          {profile.name || 'Mi Perfil'}
        </div>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          <span style={{ padding: '.25rem .7rem', borderRadius: 'var(--r-full)', background: 'rgba(255,255,255,.22)', fontSize: '.72rem', fontWeight: 700, color: 'var(--white)' }}>
            {t(`diet_${profile.diet}`)}
          </span>
          <span style={{ padding: '.25rem .7rem', borderRadius: 'var(--r-full)', background: 'rgba(255,255,255,.22)', fontSize: '.72rem', fontWeight: 700, color: 'var(--white)' }}>
            {t(`goal_${profile.mainGoal}`)}
          </span>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'flex', gap: '.6rem', marginBottom: '1rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 'var(--r-lg)', padding: '.9rem .75rem', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: '1.6rem', fontWeight: 600, color: s.color, lineHeight: 1 }}>
              {s.val}
            </div>
            {s.unit && <div style={{ fontSize: '.62rem', fontWeight: 700, color: s.color, opacity: .8, letterSpacing: '.04em' }}>{s.unit}</div>}
            <div style={{ fontSize: '.65rem', color: 'var(--muted)', fontWeight: 600, marginTop: '.25rem', lineHeight: 1.2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Datos personales ── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.6rem' }}>
          <div className="card-label" style={{ marginBottom: 0 }}>{t('profile_personal_data')}</div>
          <button
            style={{ border: 'none', background: 'var(--crema-rosa)', borderRadius: 'var(--r-full)', padding: '.25rem .75rem', fontSize: '.7rem', fontWeight: 700, color: 'var(--rosa)', cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={() => setSection('edit')}
          >
            {t('profile_edit')} →
          </button>
        </div>
        {detailRows.map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.45rem 0', borderBottom: '1px solid var(--border)', fontSize: '.88rem' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 700 }}>{r.label}</span>
            <span style={{ fontWeight: 800 }}>{r.val}</span>
          </div>
        ))}
        {profile.preferences.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.45rem 0', fontSize: '.88rem' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 700 }}>{t('field_preferences')}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-end' }}>
              {profile.preferences.map(p => <span key={p} className="badge badge-green">{t(`pref_${p}`)}</span>)}
            </div>
          </div>
        )}
      </div>

      {/* ── Settings list ── */}
      <div className="card">
        <div className="card-label">{t('profile_settings')}</div>

        {/* Language */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.7rem 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: '.9rem' }}>🌐 {t('profile_language')}</div>
          <div style={{ display: 'flex', background: 'var(--crema)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-full)', padding: '2px', gap: '2px' }}>
            {['es', 'en'].map(lang => (
              <button key={lang} onClick={switchLang}
                style={{ padding: '.2rem .65rem', border: 'none', borderRadius: 'var(--r-full)', fontSize: '.7rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: i18n.language === lang ? 'var(--rosa)' : 'transparent', color: i18n.language === lang ? 'var(--white)' : 'var(--muted)', transition: 'all .15s' }}>
                {lang === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
              </button>
            ))}
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={() => setShowReset(true)}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.7rem 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
        >
          <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--red)' }}>🔄 {t('profile_reset')}</div>
          <span style={{ color: 'var(--muted)', fontSize: '.9rem' }}>→</span>
        </button>
      </div>

      <p style={{ fontSize: '.7rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5, paddingBottom: '1rem' }}>
        {t('legal_disclaimer')}
      </p>

      {/* ── Reset sheet ── */}
      {showReset && (
        <div className="overlay" onClick={() => setShowReset(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">⚠️ {t('profile_reset_title')}</div>
            <p style={{ fontSize: '.9rem', color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {t('profile_reset_desc')}
            </p>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowReset(false)}>{t('btn_cancel')}</button>
              <button className="btn btn-danger"    style={{ flex: 1 }} onClick={onReset}>{t('profile_reset_confirm')}</button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
    </div>
  )
}
