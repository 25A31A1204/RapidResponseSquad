import { useApp } from '../context/AppContext.jsx'
import { isValidPhone, prettyPhone } from '../utils/phone.js'

export default function ContactsSheet({ onClose, onAdd, onEdit }) {
  const { contacts, deleteContact } = useApp()

  function handleDelete(i, name) {
    if (window.confirm(`Remove ${name} from your emergency contacts?`)) deleteContact(i)
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <p className="sheet-title">❤️ Emergency Contacts</p>
        <p className="sheet-note">
          These people get your name and live location the moment you trigger an SOS.
        </p>

        <div className="contact-list">
          {contacts.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '16px 0', lineHeight: 1.6 }}>
              No one will be alerted yet.<br />Add the people who should hear from you first.
            </p>
          )}
          {contacts.map((c, i) => {
            const ok = isValidPhone(c.phone)
            return (
              <div className={'contact-row' + (ok ? '' : ' invalid')} key={i}>
                <div className="contact-avatar">{c.emoji || '👤'}</div>
                <div className="contact-info">
                  <p className="contact-name">{c.name}</p>
                  <p className="contact-rel">{c.rel || 'Contact'} · {prettyPhone(c.phone)}</p>
                  {!ok && <p className="contact-warn">Number won't receive alerts — tap ✎ to fix it</p>}
                </div>
                <div className="contact-btns">
                  <button className="contact-call" onClick={() => ok && (window.location.href = 'tel:' + c.phone)}>Call</button>
                  <button className="contact-edit" onClick={() => onEdit(i)} aria-label="Edit contact">✎</button>
                  <button className="contact-del" onClick={() => handleDelete(i, c.name)} aria-label="Delete contact">🗑</button>
                </div>
              </div>
            )
          })}
        </div>

        <button className="add-contact-btn" onClick={onAdd}>+ Add contact</button>
        <p className="contact-sync-note">Saved on this device</p>
      </div>
    </div>
  )
}
