export default function VolunteerQuickAction({ onClick, active }) {
  return (
    <button className="volunteer-quick" onClick={onClick}>
      <div className="vq-icon">🦺</div>
      <div className="vq-text">
        <p className="vq-title">Volunteer Login</p>
        <p className="vq-desc">{active ? 'Go to your volunteer dashboard' : 'Respond to nearby SOS'}</p>
      </div>
      <span className="vq-arrow">→</span>
    </button>
  )
}
