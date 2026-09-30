import { Link } from 'react-router-dom'

export default function TopNav({ live = false, backTo = '/' }) {
  return (
    <nav className="topnav">
      <div className="topnav-left">
        <svg width="28" height="28" viewBox="0 0 100 100">
          <path d="M50 85 L20 55 A15 15 0 1 1 50 35 A15 15 0 1 1 80 55 Z" fill="#E53535" />
          <polyline points="25,55 35,55 42,45 50,65 60,40 70,55 75,55" fill="none" stroke="white" strokeWidth="4" />
        </svg>
        <span className="topnav-brand">Rapid Response</span>
        {live ? (
          <div className="live-pill"><span className="live-dot" />Live</div>
        ) : (
          <div className="status-pill"><span className="status-dot" />Safe</div>
        )}
      </div>
      <Link to={backTo} className="topnav-back">← Back</Link>
    </nav>
  )
}
