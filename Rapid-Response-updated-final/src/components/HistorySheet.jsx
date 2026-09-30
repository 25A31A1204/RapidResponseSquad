import { useApp } from '../context/AppContext.jsx'

export default function HistorySheet({ onClose }) {
  const { history, clearHistory } = useApp()

  function handleClear() {
    if (window.confirm('Clear history from this device?')) clearHistory()
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <p className="sheet-title">📜 Emergency History</p>
        <p className="sheet-note">Alerts you've raised from this device.</p>

        <div className="history-list">
          {history.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
              No alerts raised yet.
            </p>
          )}
          {history.map((h, i) => (
            <div className="history-row" key={h.id || i}>
              <div className="history-top">
                <span className="history-type">🚨 {h.type}</span>
                <span className="history-time">{h.time}</span>
              </div>
              <p className="history-addr">📍 {h.addr}</p>
              {h.sentTo > 0 && <p className="history-sent">💬 {h.sentTo} contact(s) alerted</p>}
              <span className={'history-badge ' + (h.status === 'active' ? 'hb-pending' : 'hb-resolved')}>
                {h.status === 'active' ? '⏳ Pending' : '✅ Resolved'}
              </span>
            </div>
          ))}
        </div>

        {history.length > 0 && (
          <button className="add-contact-btn" onClick={handleClear}>🗑 Clear history</button>
        )}
      </div>
    </div>
  )
}
