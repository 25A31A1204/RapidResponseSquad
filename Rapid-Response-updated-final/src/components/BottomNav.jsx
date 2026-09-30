export default function BottomNav({ active, onHome, onAlerts, onProfile }) {
  const items = [
    { id: 'home', icon: '🏠', label: 'Home', onClick: onHome },
    { id: 'alerts', icon: '🔔', label: 'Alerts', onClick: onAlerts },
    { id: 'profile', icon: '👤', label: 'Profile', onClick: onProfile },
  ]
  return (
    <nav className="bottomnav">
      {items.map((it) => (
        <button
          key={it.id}
          className={'bnnav-item' + (active === it.id ? ' active' : '')}
          onClick={it.onClick}
        >
          <span className="bn-icon">{it.icon}</span>
          <span className="bn-label">{it.label}</span>
        </button>
      ))}
    </nav>
  )
}
