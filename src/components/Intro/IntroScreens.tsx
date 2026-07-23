import { useRef, useState, CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n/index'
import slide1Img from '../../assets/intro/slide1-comida.jpg'
import slide2Img from '../../assets/intro/slide2-escaneo.jpg'
import slide3Img from '../../assets/intro/slide3-bowl.jpg'
import slide5Img from '../../assets/intro/slide5-barcode.jpg'

const TOTAL_SLIDES = 5
const SWIPE_THRESHOLD = 50

const DASH_MACROS = [
  { key: 'protein', val: '62g',  pct: 62, labelKey: 'home_macro_protein', color: 'var(--rosa)' },
  { key: 'carbs',   val: '140g', pct: 51, labelKey: 'home_macro_carbs',   color: 'var(--coral-dark)' },
  { key: 'fat',     val: '38g',  pct: 54, labelKey: 'home_macro_fat',     color: 'var(--oro-dark)' },
]

const CHART_POINTS = '4,32 20,26 34,29 48,18 62,22 78,10 94,14'

type Corner = 'tl' | 'tr' | 'bl' | 'br'

const SCAN_PINS: { key: string; labelKey: string; corner: Corner; anchor: { x: number; y: number }; dot: { x: number; y: number } }[] = [
  { key: 'egg',     labelKey: 'intro_pin_egg',     corner: 'tl', anchor: { x: 8,  y: 14 }, dot: { x: 33, y: 45 } },
  { key: 'tofu',    labelKey: 'intro_pin_tofu',    corner: 'tr', anchor: { x: 92, y: 14 }, dot: { x: 54, y: 46 } },
  { key: 'corn',    labelKey: 'intro_pin_corn',    corner: 'br', anchor: { x: 92, y: 86 }, dot: { x: 70, y: 54 } },
  { key: 'cabbage', labelKey: 'intro_pin_cabbage', corner: 'bl', anchor: { x: 8,  y: 86 }, dot: { x: 45, y: 80 } },
]

const PIN_CORNER_STYLE: Record<Corner, CSSProperties> = {
  tl: { top: '8%', left: '4%' },
  tr: { top: '8%', right: '4%' },
  bl: { bottom: '8%', left: '4%' },
  br: { bottom: '8%', right: '4%' },
}

interface Props { onDone: () => void }

export default function IntroScreens({ onDone }: Props) {
  const { t } = useTranslation()
  const [slide, setSlide] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const weekDays = t('intro_week_days').split(',')

  const switchLang = () => {
    const nextLang = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(nextLang)
    localStorage.setItem('nutricoach:language', nextLang)
  }

  const next = () => (slide === TOTAL_SLIDES - 1 ? onDone() : setSlide(s => s + 1))
  const back = () => setSlide(s => Math.max(s - 1, 0))

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx <= -SWIPE_THRESHOLD) next()
    else if (dx >= SWIPE_THRESHOLD) back()
    touchStartX.current = null
  }

  return (
    <div className="nc-intro">
      <div className="nc-intro-topbar">
        <button className="nc-intro-lang" onClick={switchLang}>{t('lang_toggle')}</button>
        <button className="nc-intro-skip" onClick={onDone}>{t('intro_skip')}</button>
      </div>

      <div className="nc-intro-body" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="nc-intro-slide" key={slide}>
          <h1 className="nc-intro-title">{t(`intro_slide${slide + 1}_title`)}</h1>
          <p className="nc-intro-sub">{t(`intro_slide${slide + 1}_sub`)}</p>
          <div className="nc-intro-mock-wrap">
            {slide === 0 ? (
              <div className="nc-intro-dash">
                <div className="nc-intro-dash-kcal">
                  <div
                    className="nc-intro-ring-lg"
                    style={{ background: 'conic-gradient(var(--oro) 0% 59%, rgba(255,255,255,.22) 59% 100%)' }}
                  >
                    <div className="nc-intro-ring-lg-inner" />
                  </div>
                  <div>
                    <div className="nc-intro-dash-kcal-num">1,240 <span>/ 2,100</span></div>
                    <div className="nc-intro-dash-kcal-lbl">{t('home_kcal_remaining')}</div>
                  </div>
                </div>

                <div className="nc-intro-dash-macros">
                  {DASH_MACROS.map(m => (
                    <div key={m.key} className="nc-intro-dash-macro">
                      <div
                        className="nc-intro-ring-sm"
                        style={{ background: `conic-gradient(${m.color} 0% ${m.pct}%, var(--border) ${m.pct}% 100%)` }}
                      >
                        <div className="nc-intro-ring-sm-inner" />
                      </div>
                      <div className="nc-intro-dash-macro-val">{m.val}</div>
                      <div className="nc-intro-dash-macro-lbl">{t(m.labelKey)}</div>
                    </div>
                  ))}
                </div>

                <div className="nc-intro-dash-section">{t('intro_recent_uploaded')}</div>

                <div className="nc-intro-food-row">
                  <div className="nc-intro-food-thumb">
                    <img src={slide1Img} alt="" />
                  </div>
                  <div className="nc-intro-food-info">
                    <div className="nc-intro-food-name">{t('intro_food_name')}</div>
                    <div className="nc-intro-food-kcal">320 kcal</div>
                    <div className="nc-intro-food-macros">
                      <span><i className="nc-intro-food-dot" style={{ background: 'var(--rosa)' }} />14g</span>
                      <span><i className="nc-intro-food-dot" style={{ background: 'var(--coral-dark)' }} />28g</span>
                      <span><i className="nc-intro-food-dot" style={{ background: 'var(--oro-dark)' }} />18g</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : slide === 1 ? (
              <div className="nc-intro-scan-card">
                <img src={slide2Img} alt="" />
                <svg className="nc-intro-scan-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {SCAN_PINS.map(p => (
                    <line
                      key={p.key}
                      x1={p.anchor.x} y1={p.anchor.y}
                      x2={p.dot.x} y2={p.dot.y}
                      stroke="rgba(255,255,255,.85)"
                      strokeWidth="0.6"
                    />
                  ))}
                </svg>
                {SCAN_PINS.map(p => (
                  <span key={p.key} className="nc-intro-pin-dot" style={{ left: `${p.dot.x}%`, top: `${p.dot.y}%` }} />
                ))}
                {SCAN_PINS.map(p => (
                  <span key={p.key} className="nc-intro-pin" style={PIN_CORNER_STYLE[p.corner]}>
                    {t(p.labelKey)}
                  </span>
                ))}
              </div>
            ) : slide === 2 ? (
              <div className="nc-intro-photo-card">
                <div className="nc-intro-photo">
                  <img src={slide3Img} alt="" />
                </div>
                <div className="nc-intro-photo-body">
                  <div className="nc-intro-photo-title">{t('intro_mock_dish')}</div>
                  <div className="macros-row">
                    {[
                      { val: 420, lbl: 'kcal' },
                      { val: '24g', lbl: t('home_macro_protein') },
                      { val: '45g', lbl: t('home_macro_carbs') },
                      { val: '16g', lbl: t('home_macro_fat') },
                    ].map(m => (
                      <div key={m.lbl} className="macro-box">
                        <div className="macro-val">{m.val}</div>
                        <div className="macro-lbl">{m.lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : slide === 3 ? (
              <div className="nc-intro-progress">
                <div className="nc-intro-progress-top">
                  <div className="nc-intro-weight-card">
                    <div className="nc-intro-card-lbl">{t('intro_weight_label')}</div>
                    <div className="nc-intro-weight-num">68.4 <span>kg</span></div>
                    <div className="nc-intro-weight-bar">
                      <div className="nc-intro-weight-bar-fill" style={{ width: '62%' }} />
                    </div>
                    <div className="nc-intro-weight-goal">{t('field_goal')} <b>62 kg</b></div>
                    <button className="nc-intro-weight-btn" type="button">
                      {t('progress_log_weight')} <span>→</span>
                    </button>
                  </div>

                  <div className="nc-intro-streak-card">
                    <div className="nc-intro-streak-flame">🔥</div>
                    <div className="nc-intro-streak-num">21</div>
                    <div className="nc-intro-streak-lbl">{t('intro_streak_label')}</div>
                    <div className="nc-intro-streak-days">
                      {weekDays.map((d, i) => (
                        <span key={i} className={`nc-intro-streak-day${i < 2 ? ' active' : ''}`}>{d}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="nc-intro-chart-card">
                  <div className="nc-intro-chart-wrap">
                    <svg className="nc-intro-chart-svg" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <polyline
                        points={CHART_POINTS}
                        fill="none"
                        stroke="var(--verde)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="94" cy="14" r="2.4" fill="var(--white)" stroke="var(--verde)" strokeWidth="1.6" />
                    </svg>
                    <div className="nc-intro-chart-tooltip">
                      <b>68.4 kg</b>
                      <span>{t('home_today')}</span>
                    </div>
                  </div>
                  <div className="nc-intro-motivation">{t('intro_motivation')}</div>
                </div>

                <div className="nc-intro-avgcal-card">
                  <div className="nc-intro-card-lbl">{t('intro_avg_calories')}</div>
                  <div className="nc-intro-avgcal-num">2,150 <span>kcal</span></div>
                </div>
              </div>
            ) : (
              <div className="nc-intro-barcode-card">
                <div className="nc-intro-barcode-photo">
                  <img src={slide5Img} alt="" />
                  <div className="nc-intro-barcode-frame">
                    <span className="nc-intro-corner tl" />
                    <span className="nc-intro-corner tr" />
                    <span className="nc-intro-corner bl" />
                    <span className="nc-intro-corner br" />
                  </div>
                </div>

                <div className="nc-intro-barcode-name">{t('intro_barcode_product')}</div>

                <div className="nc-intro-barcode-stats">
                  <div
                    className="nc-intro-kcal-ring"
                    style={{ background: 'conic-gradient(var(--oro) 0% 70%, var(--border) 70% 100%)' }}
                  >
                    <div className="nc-intro-kcal-ring-inner">
                      <span className="nc-intro-kcal-ring-val">140</span>
                      <span className="nc-intro-kcal-ring-lbl">cal</span>
                    </div>
                  </div>
                  <div className="nc-intro-barcode-macros">
                    <div className="nc-intro-barcode-macro">
                      <div className="nc-intro-barcode-macro-val">22g</div>
                      <div className="nc-intro-barcode-macro-lbl" style={{ color: 'var(--coral-dark)' }}>{t('home_macro_carbs')}</div>
                    </div>
                    <div className="nc-intro-barcode-macro">
                      <div className="nc-intro-barcode-macro-val">6g</div>
                      <div className="nc-intro-barcode-macro-lbl" style={{ color: 'var(--rosa)' }}>{t('home_macro_fat')}</div>
                    </div>
                    <div className="nc-intro-barcode-macro">
                      <div className="nc-intro-barcode-macro-val">15g</div>
                      <div className="nc-intro-barcode-macro-lbl" style={{ color: 'var(--oro-dark)' }}>{t('home_macro_protein')}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="nc-intro-dots">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <div key={i} className={`nc-intro-dot${i === slide ? ' active' : ''}`} />
        ))}
      </div>

      <div className="nc-intro-footer">
        <button className="btn-pill btn-pill-primary btn-pill-full" onClick={next}>
          {slide === TOTAL_SLIDES - 1 ? t('splash_cta') : t('onboarding_next')}
        </button>
      </div>
    </div>
  )
}
