import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const todayKey = () => new Date().toISOString().slice(0, 10)

function ScaleField({ label, value, onChange, max = 5 }) {
  return (
    <div className="field-row">
      <label>{label}</label>
      <div className="scale-row">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className={`scale-btn ${value === n ? 'active' : ''}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function DailyLog({ userId, onSaved }) {
  const [form, setForm] = useState({
    hot_flashes: 0,
    night_sweats: false,
    sleep_hours: '',
    sleep_quality: null,
    mood: null,
    brain_fog: null,
    joint_aches: null,
    cycle_status: 'none',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadToday() {
      const { data } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', todayKey())
        .maybeSingle()
      if (data) {
        setForm({
          hot_flashes: data.hot_flashes ?? 0,
          night_sweats: data.night_sweats ?? false,
          sleep_hours: data.sleep_hours ?? '',
          sleep_quality: data.sleep_quality,
          mood: data.mood,
          brain_fog: data.brain_fog,
          joint_aches: data.joint_aches,
          cycle_status: data.cycle_status ?? 'none',
          notes: data.notes ?? '',
        })
      }
    }
    loadToday()
  }, [userId])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const payload = {
      user_id: userId,
      log_date: todayKey(),
      hot_flashes: Number(form.hot_flashes) || 0,
      night_sweats: form.night_sweats,
      sleep_hours: form.sleep_hours === '' ? null : Number(form.sleep_hours),
      sleep_quality: form.sleep_quality,
      mood: form.mood,
      brain_fog: form.brain_fog,
      joint_aches: form.joint_aches,
      cycle_status: form.cycle_status,
      notes: form.notes,
    }
    const { error } = await supabase.from('logs').upsert(payload, { onConflict: 'user_id,log_date' })
    setSaving(false)
    if (error) return setError(error.message)
    setSaved(true)
    onSaved?.()
  }

  return (
    <div className="card">
      <h2>Today's log</h2>
      <p className="sub">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>

      <div className="field-grid">
        <div className="field-row">
          <label>Hot flashes today</label>
          <input
            type="number"
            min="0"
            value={form.hot_flashes}
            onChange={(e) => set('hot_flashes', e.target.value)}
          />
        </div>
        <div className="field-row">
          <label>Sleep last night (hours)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="14"
            value={form.sleep_hours}
            onChange={(e) => set('sleep_hours', e.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.night_sweats}
            onChange={(e) => set('night_sweats', e.target.checked)}
            style={{ width: 'auto' }}
          />
          Night sweats
        </label>
      </div>

      <ScaleField label="Sleep quality (1 rough — 5 great)" value={form.sleep_quality} onChange={(v) => set('sleep_quality', v)} />
      <ScaleField label="Mood (1 low — 5 good)" value={form.mood} onChange={(v) => set('mood', v)} />
      <ScaleField label="Brain fog (1 clear — 5 foggy)" value={form.brain_fog} onChange={(v) => set('brain_fog', v)} />
      <ScaleField label="Joint aches (1 none — 5 severe)" value={form.joint_aches} onChange={(v) => set('joint_aches', v)} />

      <div className="field-row">
        <label>Cycle status</label>
        <select value={form.cycle_status} onChange={(e) => set('cycle_status', e.target.value)}>
          <option value="none">No period</option>
          <option value="spotting">Spotting</option>
          <option value="light">Light</option>
          <option value="regular">Regular</option>
          <option value="heavy">Heavy</option>
        </select>
      </div>

      <div className="field-row">
        <label>Notes</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Anything else worth remembering about today"
        />
      </div>

      <button className="primary-btn" onClick={handleSave} disabled={saving}>
        {saving ? <span className="loader" /> : 'Save today'}
      </button>
      {saved && <p className="toast">Saved.</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
