import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { storage } from './hooks/useStorage'
import { AppTab, UserProfile } from './types'
import Onboarding from './components/Onboarding/Onboarding'
import Home       from './components/Home/Home'
import Recipes    from './components/Recipes/Recipes'
import Progress   from './components/Progress/Progress'
import Profile    from './components/Profile/Profile'
import FoodLog    from './components/FoodLog/FoodLog'
import Chat       from './components/Chat/Chat'

export default function App() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<UserProfile | null>(() => storage.getProfile())
  const [activeTab, setActiveTab] = useState<AppTab>('hoy')
  const [fabOpen,  setFabOpen]  = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const handleOnboardingComplete = (p: UserProfile) => {
    storage.saveProfile(p)
    setProfile(p)
  }

  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <>
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'hoy'      && (
          <Home
            profile={profile}
            onNavigate={setActiveTab}
            onFab={() => setFabOpen(true)}
            onOpenChat={() => setChatOpen(true)}
          />
        )}
        {activeTab === 'plan'     && <Recipes profile={profile} />}
        {activeTab === 'progreso' && <Progress profile={profile} />}
        {activeTab === 'perfil'   && (
          <Profile
            profile={profile}
            onProfileUpdate={p => { setProfile(p); storage.saveProfile(p) }}
            onReset={() => { storage.clearAll(); setProfile(null) }}
          />
        )}
      </main>

      {/* ── Food Log sheet (FAB) ── */}
      {fabOpen && (
        <div className="overlay" onClick={() => setFabOpen(false)}>
          <div className="sheet" style={{ maxHeight: '95dvh' }} onClick={e => e.stopPropagation()}>
            <FoodLog onClose={() => setFabOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Chat overlay ── */}
      {chatOpen && <Chat profile={profile} onClose={() => setChatOpen(false)} />}

      {/* ── Tab bar ── */}
      <nav className="tab-bar">
        <button className={`tab-item${activeTab === 'hoy' ? ' active' : ''}`} onClick={() => setActiveTab('hoy')}>
          <div className="tab-icon-box" />
          <span className="tab-label">{t('tab_hoy')}</span>
        </button>

        <button className={`tab-item${activeTab === 'plan' ? ' active' : ''}`} onClick={() => setActiveTab('plan')}>
          <div className="tab-icon-box round" />
          <span className="tab-label">{t('tab_plan')}</span>
        </button>

        <button className="tab-fab" onClick={() => setFabOpen(true)}>+</button>

        <button className={`tab-item${activeTab === 'progreso' ? ' active' : ''}`} onClick={() => setActiveTab('progreso')}>
          <div className="tab-icon-box" />
          <span className="tab-label">{t('tab_progreso')}</span>
        </button>

        <button className={`tab-item${activeTab === 'perfil' ? ' active' : ''}`} onClick={() => setActiveTab('perfil')}>
          <div className="tab-icon-box round" />
          <span className="tab-label">{t('tab_perfil')}</span>
        </button>
      </nav>
    </>
  )
}
