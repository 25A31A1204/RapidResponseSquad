import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { normalizePhone, isValidPhone } from '../utils/phone.js'

const EMOJI_CHOICES = ['👤', '👩', '👨', '🧑', '👵', '👴', '👮', '🧑‍⚕️', '🫂']

export default function ContactFormSheet({ editingIndex, onClose }) {
  const { contacts, addContact, updateContact } = useApp()
  const editing = editingIndex != null && editingIndex > -1
  const existing = editing ? contacts[editingIndex] : null

  const [name, setName] = useState(existing?.name || '')
  const [phone, setPhone] = useState(existing?.phone || '')
  const [rel, setRel] = useState(existing?.rel || '')
  const [emoji, setEmoji] = useState(existing?.emoji || '👤')
  const [error, setError] = useState('')

  function handleSave() {
    const trimmedName = name.trim()
    const normalized = normalizePhone(phone)
    const relFinal = rel.trim() || 'Contact'

    if (!trimmedName) { setError('Add a name so you can tell contacts apart.'); return }
    if (!isValidPhone(normalized)) {
      setError("That number doesn't look right. Use 10 digits, or the full number with country code.")
      return
    }
    const clashIdx = contacts.findIndex((c, i) => c.phone === normalized && i !== editingIndex)
    if (clashIdx !== -1) { setError(`${contacts[clashIdx].name} already uses that number.`); return }

    const entry = { name: trimmedName, rel: relFinal, phone: normalized, emoji }
    if (editing) updateContact(editingIndex, entry)
    else addContact(entry)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <p className="sheet-title">{editing ? 'Edit contact' : 'Add contact'}</p>
        <p className="sheet-note">Use a number that can receive SMS or WhatsApp.</p>

        <div className="cf-field">
          <label htmlFor="cfName">Name</label>
          <input id="cfName" type="text" autoComplete="name" placeholder="Amma"
            value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>

        <div className="cf-field">
          <label htmlFor="cfPhone">Phone number</label>
          <input id="cfPhone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210"
            value={phone} onChange={(e) => setPhone(e.target.value)} />
          <span className="cf-help">10-digit Indian numbers get +91 added automatically.</span>
        </div>

        <div className="cf-field">
          <label htmlFor="cfRel">Relationship</label>
          <input id="cfRel" type="text" placeholder="Mother"
            value={rel} onChange={(e) => setRel(e.target.value)} />
        </div>

        <div className="cf-field">
          <label>Icon</label>
          <div className="cf-emoji">
            {EMOJI_CHOICES.map((e) => (
              <button key={e} type="button" className={emoji === e ? 'sel' : ''} onClick={() => setEmoji(e)}>{e}</button>
            ))}
          </div>
        </div>

        <p className="cf-error">{error}</p>

        <div className="cf-actions">
          <button className="cf-btn cf-cancel" onClick={onClose}>Cancel</button>
          <button className="cf-btn cf-save" onClick={handleSave}>Save contact</button>
        </div>
      </div>
    </div>
  )
}
