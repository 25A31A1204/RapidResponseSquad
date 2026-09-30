import { useApp } from '../context/AppContext.jsx'

export default function ReadyBar({ onClick }) {
  const { contacts, validContacts } = useApp()
  const n = validContacts().length
  const ok = n > 0
  const text = ok
    ? `SOS will alert ${n} contact${n > 1 ? 's' : ''}`
    : contacts.length
      ? "No usable numbers saved — fix them before you need them"
      : 'No emergency contacts yet — add one now'

  return (
    <div className={'ready-bar ' + (ok ? 'ok' : 'warn')} onClick={onClick}>
      <span className="ready-text">{text}</span>
      <span className="ready-cta">Manage</span>
    </div>
  )
}
