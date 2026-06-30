import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PantryItem, FoodCategory } from '../../types'
import { storage } from '../../hooks/useStorage'
import { useClaude } from '../../hooks/useClaude'

const CATEGORY_COLORS: Record<FoodCategory, string> = {
  protein: 'badge-red',
  carbs: 'badge-amber',
  vegetable: 'badge-green',
  fruit: 'badge-orange',
  dairy: 'badge-blue',
  fat: 'badge-stone',
  other: 'badge-stone',
}

const CATEGORY_ICONS: Record<FoodCategory, string> = {
  protein: '🔴', carbs: '🟡', vegetable: '🟢',
  fruit: '🟠', dairy: '🔵', fat: '🟤', other: '⚪',
}

const CATEGORIES: FoodCategory[] = ['protein', 'carbs', 'vegetable', 'fruit', 'dairy', 'fat', 'other']

const EMPTY_ITEM = { name: '', quantity: 100, unit: 'g', category: 'other' as FoodCategory }

export default function Pantry() {
  const { t, i18n } = useTranslation()
  const { scanReceipt, loading, error } = useClaude()
  const [items, setItems] = useState<PantryItem[]>(() => storage.getPantry())
  const [showSheet, setShowSheet] = useState(false)
  const [form, setForm] = useState(EMPTY_ITEM)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const saveItems = (next: PantryItem[]) => {
    setItems(next)
    storage.savePantry(next)
  }

  const addItem = () => {
    if (!form.name.trim()) return
    const item: PantryItem = { ...form, id: crypto.randomUUID(), addedAt: new Date().toISOString() }
    saveItems([item, ...items])
    setForm(EMPTY_ITEM)
    setShowSheet(false)
    showToast(t('pantry_item_added'))
  }

  const deleteItem = (id: string) => {
    saveItems(items.filter(i => i.id !== id))
    showToast(t('pantry_item_deleted'))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      const scanned = await scanReceipt(base64, i18n.language)
      if (scanned.length > 0) {
        saveItems([...scanned, ...items])
        showToast(`+${scanned.length} ${t('pantry_item_added')}`)
      }
    }
    reader.readAsDataURL(file)
  }

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const filtered = items.filter(i => i.category === cat)
    if (filtered.length > 0) acc[cat] = filtered
    return acc
  }, {} as Partial<Record<FoodCategory, PantryItem[]>>)

  return (
    <div className="screen">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="page-title">{t('pantry_title')}</h1>
          <span className="badge badge-green">{items.length}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
        <label style={{ flex: 1 }}>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          <div className="btn btn-primary btn-full" style={{ cursor: 'pointer' }}>
            📷 {t('pantry_upload_cta')}
          </div>
        </label>
        <button className="btn btn-outline" onClick={() => { setForm(EMPTY_ITEM); setShowSheet(true) }}>
          + {t('pantry_add_manual')}
        </button>
      </div>

      {/* Loading / error */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <span>{t('ocr_loading')}</span>
        </div>
      )}
      {error && !loading && (
        <div className="card" style={{ background: '#fee2e2', borderColor: 'var(--red)' }}>
          <p style={{ color: '#991b1b', fontSize: '0.88rem' }}>{t('ocr_error')}</p>
        </div>
      )}

      {/* Items grouped by category */}
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🥫</div>
          <h3>{t('pantry_empty')}</h3>
          <p>{t('pantry_empty_sub')}</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="card">
            <div className="card-label">
              {CATEGORY_ICONS[cat as FoodCategory]} {t(`cat_${cat}`)} ({catItems!.length})
            </div>
            {catItems!.map(item => (
              <div key={item.id} className="pantry-item">
                <div className="pantry-item-info">
                  <div className="pantry-item-name">{item.name}</div>
                  <div className="pantry-item-sub">{item.quantity} {item.unit}</div>
                </div>
                <span className={`badge ${CATEGORY_COLORS[item.category] ?? 'badge-stone'}`}>{t(`cat_${item.category}`)}</span>
                <button className="btn btn-sm btn-danger" onClick={() => deleteItem(item.id)}>✕</button>
              </div>
            ))}
          </div>
        ))
      )}

      {/* Add item sheet */}
      {showSheet && (
        <div className="overlay" onClick={() => setShowSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">{t('pantry_add_manual')}</div>

            <div className="field">
              <label>{t('field_item_name')}</label>
              <input type="text" value={form.name} placeholder="Ej: Pechuga de pollo"
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>

            <div className="grid-2">
              <div className="field">
                <label>{t('field_quantity')}</label>
                <input type="number" value={form.quantity} min={1}
                  onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))} />
              </div>
              <div className="field">
                <label>{t('field_unit')}</label>
                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                  {['g', 'kg', 'ml', 'L', 'u', 'taza', 'cup'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="field">
              <label>{t('field_category')}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                {CATEGORIES.map(c => (
                  <button key={c} className={`pref-badge${form.category === c ? ' selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, category: c }))}>
                    {CATEGORY_ICONS[c]} {t(`cat_${c}`)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowSheet(false)}>
                {t('btn_cancel')}
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={addItem}>
                {t('btn_add')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
    </div>
  )
}
