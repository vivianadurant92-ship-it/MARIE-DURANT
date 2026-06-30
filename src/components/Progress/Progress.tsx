import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserProfile, WeightEntry } from '../../types'
import { storage } from '../../hooks/useStorage'

interface Props { profile: UserProfile }

const W = 300
const H = 118
const PAD = { top: 10, right: 32, bottom: 28, left: 38 }
const chartW = W - PAD.left - PAD.right
const chartH = H - PAD.top - PAD.bottom

const UNIT_KEY = 'nutricoach:weightunit'

function toDisp(kg: number, u: 'kg' | 'lbs') {
  return u === 'kg'
    ? Math.round(kg * 10) / 10
    : Math.round(kg * 2.205 * 10) / 10
}
function toKg(val: number, u: 'kg' | 'lbs') {
  return u === 'kg' ? val : Math.round(val / 2.205 * 10) / 10
}

export default function Progress({ profile }: Props) {
  const { t } = useTranslation()
  const [entries, setEntries]       = useState<WeightEntry[]>(() => storage.getWeightLog())
  const [showAdd, setShowAdd]       = useState(false)
  const [newWeight, setNewWeight]   = useState('')
  const [goalWeight, setGoalWeight] = useState(profile.goalWeightKg)   // always kg internally
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput]   = useState('')
  const [unit, setUnit]             = useState<'kg' | 'lbs'>(
    () => (localStorage.getItem(UNIT_KEY) as 'kg' | 'lbs') ?? 'kg'
  )

  const switchUnit = (u: 'kg' | 'lbs') => {
    setUnit(u)
    localStorage.setItem(UNIT_KEY, u)
    if (editingGoal) setGoalInput(String(toDisp(goalWeight, u)))
  }

  // ── Core stats (always in kg internally) ──────────────────
  const latestKg      = entries[0]?.weight ?? profile.weightKg
  const startKg       = entries.length > 0 ? entries[entries.length - 1].weight : profile.weightKg
  const deltaKg       = +(latestKg - startKg).toFixed(2)
  const streak        = entries.filter(e => (Date.now() - new Date(e.date).getTime()) < 14 * 86400_000).length

  const losingGoal    = goalWeight < startKg
  const total         = Math.abs(startKg - goalWeight) || 1
  const done          = losingGoal ? Math.max(0, startKg - latestKg) : Math.max(0, latestKg - startKg)
  const pct           = Math.min(100, Math.round((done / total) * 100))

  // ── Display values in selected unit ───────────────────────
  const dispLatest    = toDisp(latestKg, unit)
  const dispStart     = toDisp(startKg, unit)
  const dispGoal      = toDisp(goalWeight, unit)
  const dispDelta     = +(dispLatest - dispStart).toFixed(1)

  // ── Motivation ────────────────────────────────────────────
  const getMotivation = () => {
    if (entries.length === 0) return 'Registra tu primer peso hoy para comenzar a ver tu progreso.'
    if (pct >= 100) return '¡Meta alcanzada! Tu constancia ha dado frutos. Es momento de definir un nuevo objetivo. 🎉'
    if (pct >= 75)  return `¡Ya llevas el ${pct}% del camino! Estás muy cerca de tu meta. No pares ahora. 💪`
    if (pct >= 50)  return `¡A la mitad del camino con ${pct}% completado! Mantén el ritmo y los resultados llegarán.`
    if (pct >= 25)  return `Buen comienzo con ${pct}% de avance. La constancia es tu mayor aliada. ¡Sigue así!`
    if (streak >= 3) return `Llevas ${streak} registros en las últimas 2 semanas. ¡Esa consistencia es tu mayor ventaja!`
    if (deltaKg < 0 && losingGoal) return `Has bajado ${toDisp(Math.abs(deltaKg), unit)} ${unit} desde el inicio. ¡Vas por buen camino!`
    if (deltaKg > 0 && !losingGoal) return `Has ganado ${toDisp(deltaKg, unit)} ${unit} desde el inicio. ¡Sigues avanzando!`
    return 'Cada registro cuenta. La clave está en la constancia diaria.'
  }

  // ── Chart ─────────────────────────────────────────────────
  const chartPts   = [...entries].reverse().slice(-12)
  const dispValues = chartPts.map(e => toDisp(e.weight, unit))
  const pad        = unit === 'kg' ? 1.5 : 3.5
  const minW       = Math.min(...dispValues, dispGoal) - pad
  const maxW       = Math.max(...dispValues, dispGoal) + pad
  const range      = maxW - minW || 1

  const toX = (i: number) => PAD.left + (i / Math.max(chartPts.length - 1, 1)) * chartW
  const toY = (dw: number) => PAD.top + ((maxW - dw) / range) * chartH

  const linePath = chartPts.length > 1
    ? chartPts.map((e, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(toDisp(e.weight, unit)).toFixed(1)}`).join(' ')
    : null
  const areaPath = linePath
    ? `${linePath} L${toX(chartPts.length - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${PAD.left},${(PAD.top + chartH).toFixed(1)} Z`
    : null

  const goalY   = toY(dispGoal)
  const yMid    = (minW + maxW) / 2
  const yLabels = [minW + pad, yMid, maxW - pad].map(v =>
    unit === 'kg' ? Math.round(v * 10) / 10 : Math.round(v)
  )

  const xIdxs = chartPts.length >= 3
    ? [0, Math.floor((chartPts.length - 1) / 2), chartPts.length - 1]
    : chartPts.length === 2 ? [0, 1] : [0]

  // ── Handlers ──────────────────────────────────────────────
  const openAdd = () => {
    setNewWeight(String(dispLatest))
    setShowAdd(true)
  }

  const addEntry = () => {
    const val = parseFloat(newWeight)
    if (isNaN(val)) return
    const wKg = toKg(val, unit)
    if (wKg < 20 || wKg > 300) return
    const entry: WeightEntry = { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), weight: wKg }
    const updated = [entry, ...entries].slice(0, 90)
    setEntries(updated)
    storage.saveWeightLog(updated)
    setShowAdd(false)
  }

  const openGoalEdit = () => {
    setGoalInput(String(dispGoal))
    setEditingGoal(true)
  }

  const saveGoal = () => {
    const g = parseFloat(goalInput)
    if (isNaN(g)) return
    const gKg = toKg(g, unit)
    if (gKg < 20 || gKg > 300) return
    setGoalWeight(gKg)
    storage.saveProfile({ ...profile, goalWeightKg: gKg })
    setEditingGoal(false)
  }

  return (
    <div className="screen">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">{t('tab_progreso')} <em>{t('progress_subtitle')}</em></h1>
        <div className="nc-unit-toggle">
          <button className={`nc-unit-btn${unit === 'kg' ? ' active' : ''}`} onClick={() => switchUnit('kg')}>kg</button>
          <button className={`nc-unit-btn${unit === 'lbs' ? ' active' : ''}`} onClick={() => switchUnit('lbs')}>lbs</button>
        </div>
      </div>

      {/* ── Line chart ── */}
      <div className="progress-chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
          <div>
            <span className="progress-weight-num">{dispLatest}</span>
            <span style={{ fontSize: '1rem', color: 'var(--muted)', fontWeight: 600 }}> {unit}</span>
          </div>
          {dispDelta !== 0 && (
            <span style={{
              padding: '.3rem .75rem', borderRadius: 'var(--r-full)',
              background: dispDelta < 0 ? 'var(--verde-light)' : 'var(--crema-rosa)',
              color: dispDelta < 0 ? 'var(--verde)' : 'var(--rosa)',
              fontSize: '.8rem', fontWeight: 700,
            }}>
              {dispDelta < 0 ? '▾' : '▴'} {Math.abs(dispDelta)} {unit}
            </span>
          )}
        </div>

        {linePath ? (
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#E8A0AD" stopOpacity=".35" />
                <stop offset="1" stopColor="#E8A0AD" stopOpacity="0" />
              </linearGradient>
            </defs>

            {yLabels.map(w => (
              <text key={w} x={PAD.left - 5} y={toY(w) + 4} fontSize="9" fill="#9a8088" textAnchor="end">{w}</text>
            ))}
            {yLabels.map(w => (
              <line key={`g${w}`} x1={PAD.left} y1={toY(w)} x2={PAD.left + chartW} y2={toY(w)} stroke="#f1e6e9" strokeWidth="1" />
            ))}

            <line x1={PAD.left} y1={goalY} x2={PAD.left + chartW} y2={goalY}
              stroke="#C9A36B" strokeWidth="1.5" strokeDasharray="5,3" opacity=".8" />
            <text x={PAD.left + chartW + 3} y={goalY + 4} fontSize="9" fill="#C9A36B" fontWeight="700">meta</text>

            {areaPath && <path d={areaPath} fill="url(#area-grad)" />}
            <path d={linePath} fill="none" stroke="var(--rosa)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {chartPts.map((e, i) => {
              const isLast = i === chartPts.length - 1
              return (
                <circle key={e.id} cx={toX(i)} cy={toY(toDisp(e.weight, unit))}
                  r={isLast ? 5 : 3}
                  fill={isLast ? 'var(--rosa)' : 'var(--rosa-light)'}
                  stroke="var(--white)" strokeWidth={isLast ? 2.5 : 1.5}
                />
              )
            })}

            {xIdxs.map(i => (
              <text key={i} x={toX(i)} y={H - 2} fontSize="9" fill="#9a8088" textAnchor="middle">
                {chartPts[i].date.slice(5)}
              </text>
            ))}
          </svg>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--muted)', fontSize: '.88rem' }}>
            {t('progress_no_data')}
          </div>
        )}
      </div>

      {/* ── Progress bar toward goal ── */}
      <div className="card" style={{ marginBottom: '.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Progreso hacia la meta
          </span>
          {!editingGoal && (
            <button
              style={{ fontSize: '.75rem', color: 'var(--rosa)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={openGoalEdit}
            >
              Meta: {dispGoal} {unit} ✎
            </button>
          )}
        </div>

        {editingGoal && (
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem', alignItems: 'center' }}>
            <input
              className="nc-input"
              type="number" inputMode="decimal"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              style={{ flex: 1, padding: '.5rem .75rem', fontSize: '.95rem' }}
              autoFocus
            />
            <span style={{ color: 'var(--muted)', fontSize: '.9rem', flexShrink: 0 }}>{unit}</span>
            <button className="btn btn-primary" style={{ padding: '.5rem 1rem', fontSize: '.82rem', flexShrink: 0 }} onClick={saveGoal}>Guardar</button>
            <button className="btn btn-secondary" style={{ padding: '.5rem .75rem', fontSize: '.82rem', flexShrink: 0 }} onClick={() => setEditingGoal(false)}>✕</button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.76rem', color: 'var(--muted)', marginBottom: '.45rem' }}>
          <span>Inicio<br /><strong style={{ color: 'var(--dark)' }}>{dispStart} {unit}</strong></span>
          <span style={{ textAlign: 'center' }}>Actual<br /><strong style={{ color: 'var(--rosa)' }}>{dispLatest} {unit}</strong></span>
          <span style={{ textAlign: 'right' }}>Meta<br /><strong style={{ color: 'var(--oro-dark)' }}>{dispGoal} {unit}</strong></span>
        </div>

        <div style={{ height: 10, background: 'var(--border)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: pct >= 100
              ? 'linear-gradient(90deg, #5cb88a, var(--verde))'
              : 'linear-gradient(90deg, var(--rosa-light), var(--rosa))',
            borderRadius: 'var(--r-full)', transition: 'width .6s ease',
          }} />
        </div>
        <div style={{ textAlign: 'right', fontSize: '.72rem', fontWeight: 700, marginTop: '.3rem', color: pct >= 100 ? 'var(--verde)' : 'var(--rosa)' }}>
          {pct}% completado
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '.85rem' }}>
        <div className="progress-stat-card pink">
          <div className="progress-stat-num" style={{ color: 'var(--rosa)' }}>{streak}</div>
          <div className="progress-stat-lbl">{t('progress_streak')}</div>
        </div>
        <div className="progress-stat-card green">
          <div className="progress-stat-num" style={{ color: 'var(--verde)' }}>{pct}%</div>
          <div className="progress-stat-lbl">{t('progress_goal_pct')}</div>
        </div>
      </div>

      {/* ── Coach motivacional ── */}
      <div className="coach-bubble" style={{ marginBottom: '1rem' }}>
        <div className="coach-avatar"><span className="coach-avatar-n">n</span></div>
        <p className="coach-text">{getMotivation()}</p>
      </div>

      {/* ── Log weight button ── */}
      <button className="btn btn-primary btn-full" style={{ marginBottom: '.85rem' }} onClick={openAdd}>
        + {t('progress_log_weight')}
      </button>

      {/* ── History ── */}
      {entries.length > 0 && (
        <div className="card">
          <div className="card-label">{t('progress_history')}</div>
          {entries.slice(0, 10).map(e => (
            <div key={e.id} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '.88rem',
            }}>
              <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{e.date}</span>
              <span style={{ fontWeight: 700 }}>{toDisp(e.weight, unit)} {unit}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Add weight sheet ── */}
      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">{t('progress_log_weight')}</div>
            <div className="nc-field">
              <label className="nc-label">{t('field_weight')} ({unit})</label>
              <input
                className="nc-input nc-input-center"
                type="number" inputMode="decimal"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>{t('btn_cancel')}</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={addEntry}>{t('btn_save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
