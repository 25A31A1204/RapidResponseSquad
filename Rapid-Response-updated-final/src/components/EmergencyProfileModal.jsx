import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { prettyPhone } from '../utils/phone.js'

export default function EmergencyProfileModal({ onClose }) {
  const { userName, setUserName, profile, setProfile, validContacts } = useApp()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ ...profile, name: userName })

  const firstContact = validContacts()[0]
  const contactLabel = firstContact ? `${firstContact.name} · ${prettyPhone(firstContact.phone)}` : 'Not set'

  function save() {
    setUserName(draft.name.trim() || userName)
    setProfile({
      bloodGroup: draft.bloodGroup, allergies: draft.allergies,
      conditions: draft.conditions, insurance: draft.insurance,
    })
    setEditing(false)
  }

  const fields = [
    { key: 'name', label: 'NAME', value: editing ? draft.name : userName },
    { key: 'bloodGroup', label: 'BLOOD GROUP', value: editing ? draft.bloodGroup : profile.bloodGroup },
    { key: 'allergies', label: 'ALLERGIES', value: editing ? draft.allergies : profile.allergies },
    { key: 'contact', label: 'EMERGENCY CONTACT', value: contactLabel, readOnly: true },
    { key: 'conditions', label: 'CONDITIONS', value: editing ? draft.conditions : profile.conditions },
    { key: 'insurance', label: 'INSURANCE', value: editing ? draft.insurance : profile.insurance },
  ]

  return (
    <div className="profile-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="emergency-profile-box">
        <div className="profile-header">
          <div className="profile-title">
            <div className="profile-icon">♙</div>
            <span>EMERGENCY PROFILE</span>
          </div>
          <div className="profile-actions">
            {editing ? (
              <button className="edit-profile-btn" onClick={save}>✓ Save</button>
            ) : (
              <button className="edit-profile-btn" onClick={() => { setDraft({ ...profile, name: userName }); setEditing(true) }}>✎ Edit</button>
            )}
            <button className="close-profile-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="profile-grid">
          {fields.map((f) => (
            <div className={'profile-card' + (editing && !f.readOnly ? ' editing' : '')} key={f.key}>
              <div className="profile-label">{f.label}</div>
              {editing && !f.readOnly ? (
                <input
                  value={draft[f.key] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                />
              ) : (
                <div className="profile-value">{f.value || '—'}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
