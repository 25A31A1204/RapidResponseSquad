export default function ActionGrid({ onContacts, onHistory, onHospitals }) {
  return (
    <div className="action-grid">
      <button className="action-card ac-contacts" onClick={onContacts}>
        <div className="ac-icon">❤️</div>
        <div>
          <p className="ac-title">Emergency Contacts</p>
          <p className="ac-desc">Manage who gets alerted</p>
        </div>
      </button>
      <button className="action-card ac-hospitals" onClick={onHospitals}>
        <div className="ac-icon">🏥</div>
        <div>
          <p className="ac-title">Nearby Hospitals</p>
          <p className="ac-desc">Call or get directions</p>
        </div>
      </button>
      <button className="action-card ac-history" onClick={onHistory}>
        <div className="ac-icon">📜</div>
        <div>
          <p className="ac-title">Emergency History</p>
          <p className="ac-desc">Past alerts &amp; responses</p>
        </div>
      </button>
    </div>
  )
}
