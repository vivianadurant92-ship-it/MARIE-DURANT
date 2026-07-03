import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChatMessage, UserProfile } from '../../types'
import { storage } from '../../hooks/useStorage'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

interface Props {
  profile: UserProfile
  onClose: () => void
}

interface RecipeCard {
  title: string; kcal: number; protein: number; timeMin: number
  ingredients?: string[]; steps?: string[]
}

function buildSystemPrompt(p: UserProfile): string {
  return `Eres Nora, coach de nutrición personal en NutriCoach.Ai. Tu tono es cálido, empático y motivador. Das respuestas concisas (2-4 oraciones salvo que te pidan más). Usas el nombre de la usuaria cuando es natural.

Perfil:
- Nombre: ${p.name || 'la usuaria'}
- Objetivo: ${p.mainGoal} | Dieta: ${p.diet}
- Edad: ${p.age} | Peso: ${p.weightKg}kg → meta ${p.goalWeightKg}kg
- Actividad: ${p.activityLevel} | Sueño: ${p.sleepHours}h

Cuando te pidan una receta incluye un bloque JSON (SOLO dentro de las etiquetas):
<recipe>{"title":"Nombre","kcal":350,"protein":30,"timeMin":20,"ingredients":["100g pollo","…"],"steps":["Paso 1","…"]}</recipe>

Responde siempre en el idioma en que te escribe la usuaria (español por defecto).`
}

function extractRecipe(text: string): RecipeCard | null {
  const m = text.match(/<recipe>([\s\S]*?)<\/recipe>/)
  if (!m) return null
  try { return JSON.parse(m[1]) } catch { return null }
}

function cleanText(text: string): string {
  return text.replace(/<recipe>[\s\S]*?<\/recipe>/g, '').trim()
}

function stripJsonFences(raw: string): string {
  return raw.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
}

export default function Chat({ profile, onClose }: Props) {
  const { t } = useTranslation()
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  const [msgs, setMsgs] = useState<ChatMessage[]>(() => {
    const saved = storage.getChatHistory()
    if (saved.length > 0) return saved
    return [{
      id:        crypto.randomUUID(),
      role:      'coach',
      content:   `¡Hola${profile.name ? ', ' + profile.name : ''}! 👋 Soy Nora, tu coach de nutrición. ¿En qué te puedo ayudar hoy? Puedo sugerirte recetas, responder dudas sobre tus macros o motivarte en tu camino.`,
      timestamp: new Date().toISOString(),
    }]
  })

  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  useEffect(() => {
    storage.saveChatHistory(msgs)
  }, [msgs])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'user',
      content: text, timestamp: new Date().toISOString(),
    }
    const next = [...msgs, userMsg]
    setMsgs(next)
    setInput('')
    setLoading(true)

    try {
      const apiMsgs = next.map(m => ({
        role:    m.role === 'coach' ? 'assistant' : 'user',
        content: m.content,
      }))

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 350,
          system:     buildSystemPrompt(profile),
          messages:   apiMsgs,
        }),
      })

      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json()
      const raw  = stripJsonFences(data.content?.[0]?.text ?? '')

      const recipe     = extractRecipe(raw)
      const cleanedText = cleanText(raw)

      const coachMsg: ChatMessage = {
        id:         crypto.randomUUID(),
        role:       'coach',
        content:    cleanedText,
        recipeCard: recipe ? { title: recipe.title, kcal: recipe.kcal, protein: recipe.protein, timeMin: recipe.timeMin } : undefined,
        timestamp:  new Date().toISOString(),
      }
      setMsgs(prev => [...prev, coachMsg])
    } catch (err) {
      console.error(err)
      appendCoach(t('chat_error'))
    } finally {
      setLoading(false)
    }
  }

  function appendCoach(text: string) {
    setMsgs(prev => [...prev, {
      id: crypto.randomUUID(), role: 'coach',
      content: text, timestamp: new Date().toISOString(),
    }])
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--white)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '.75rem',
        padding: '1rem 1rem calc(.75rem + env(safe-area-inset-top, 0))',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(255,255,255,.95)',
        backdropFilter: 'blur(12px)',
        paddingTop: 'calc(1rem + env(safe-area-inset-top, 0))',
      }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--crema-rosa)', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          ←
        </button>
        <div className="coach-avatar" style={{ width: 38, height: 38, flexShrink: 0 }}>
          <span className="coach-avatar-n">n</span>
        </div>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: '1.2rem', lineHeight: 1, color: 'var(--dark)' }}>
            Nora
          </div>
          <div style={{ fontSize: '.7rem', color: 'var(--muted)', fontWeight: 600 }}>{t('chat_subtitle')}</div>
        </div>
        <button
          style={{ marginLeft: 'auto', border: 'none', background: 'none', fontSize: '.72rem', color: 'var(--muted)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          onClick={() => { setMsgs([]); storage.saveChatHistory([]) }}
        >
          {t('chat_clear')}
        </button>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {msgs.map(msg => (
          <div key={msg.id} style={{ marginBottom: '1rem', display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '.5rem' }}>

            {/* Coach avatar */}
            {msg.role === 'coach' && (
              <div className="coach-avatar" style={{ width: 32, height: 32, flexShrink: 0 }}>
                <span className="coach-avatar-n" style={{ fontSize: '1rem' }}>n</span>
              </div>
            )}

            <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>

              {/* Bubble */}
              {msg.content && (
                <div style={{
                  padding: '.75rem 1rem',
                  borderRadius: msg.role === 'user' ? 'var(--r-lg) var(--r-lg) 4px var(--r-lg)' : 'var(--r-lg) var(--r-lg) var(--r-lg) 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, var(--rosa-light), var(--rosa))'
                    : 'var(--crema)',
                  color: msg.role === 'user' ? 'var(--white)' : 'var(--dark)',
                  fontSize: '.9rem',
                  lineHeight: 1.5,
                  border: msg.role === 'coach' ? '1px solid var(--border)' : 'none',
                }}>
                  {msg.content}
                </div>
              )}

              {/* Recipe card */}
              {msg.recipeCard && (
                <div style={{
                  background: 'linear-gradient(150deg, var(--verde), var(--verde-dark))',
                  borderRadius: 'var(--r-lg)',
                  padding: '1rem',
                  color: 'var(--white)',
                  width: '100%',
                }}>
                  <div style={{ fontSize: '.58rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', marginBottom: '.3rem' }}>
                    {t('chat_recipe')}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.15rem', fontWeight: 600, marginBottom: '.6rem', lineHeight: 1.15 }}>
                    {msg.recipeCard.title}
                  </div>
                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    {[
                      { label: 'kcal',    val: msg.recipeCard.kcal    },
                      { label: 'prot',    val: `${msg.recipeCard.protein}g` },
                      { label: '⏱',      val: `${msg.recipeCard.timeMin} min` },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontSize: '.62rem', opacity: .7, marginTop: '.1rem' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing dots */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            <div className="coach-avatar" style={{ width: 32, height: 32, flexShrink: 0 }}>
              <span className="coach-avatar-n" style={{ fontSize: '1rem' }}>n</span>
            </div>
            <div style={{ background: 'var(--crema)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg) var(--r-lg) var(--r-lg) 4px', padding: '.75rem 1rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div style={{
        padding: '.75rem 1rem calc(.75rem + env(safe-area-inset-bottom, 0))',
        borderTop: '1px solid var(--border)',
        background: 'rgba(255,255,255,.95)',
        backdropFilter: 'blur(12px)',
        display: 'flex', gap: '.6rem', alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={t('chat_placeholder')}
          rows={1}
          style={{
            flex: 1, resize: 'none', border: '1.5px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '.7rem 1rem',
            fontFamily: 'inherit', fontSize: '.92rem', background: 'var(--crema)',
            color: 'var(--dark)', lineHeight: 1.45, maxHeight: 120, overflowY: 'auto',
            transition: 'border-color .2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--rosa-light)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none',
            background: input.trim() && !loading
              ? 'linear-gradient(135deg, var(--rosa-light), var(--rosa))'
              : 'var(--border)',
            color: input.trim() && !loading ? 'var(--white)' : 'var(--muted)',
            fontSize: '1.1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background .2s',
            boxShadow: input.trim() && !loading ? 'var(--sh-rosa)' : 'none',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
