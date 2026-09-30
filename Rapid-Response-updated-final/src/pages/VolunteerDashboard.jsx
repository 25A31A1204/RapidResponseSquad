import { useMemo, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { getDemoRequests } from '../data/volunteerRequests.js'

export default function VolunteerDashboard() {
  const { volunteer, volunteerLogout, coords, emergency, acceptEmergencyAsVolunteer, userName } = useApp()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState([])

  const baseLat = coords?.lat ?? 17.385
  const baseLng = coords?.lng ?? 78.4867
  const demoRequests = useMemo(() => getDemoRequests(baseLat, baseLng), [baseLat, baseLng])

  if (!volunteer) return <Navigate to="/volunteer/login" replace />

  const liveActive = emergency && emergency.status === 'active' && !emergency.acceptedBy && !dismissed.includes('live')
  const visibleDemo = demoRequests.filter((r) => !dismissed.includes(r.id))

  function reject(id) { setDismissed((d) => [...d, id]) }

  function acceptLive() {
    acceptEmergencyAsVolunteer()
    navigate('/volunteer/respond/live')
  }
  function acceptDemo(req) {
    navigate(`/volunteer/respond/${req.id}`, { state: req })
  }

  return (
    <div className="vd-wrap">
      <nav className="vd-topbar">
        <div className="vd-brand">🦺 Volunteer Mode</div>
        <div className="vd-who">
          <span>{volunteer.name} · {volunteer.vehicle}</span>
          <button className="vd-logout" onClick={() => { volunteerLogout(); navigate('/') }}>Log out</button>
        </div>
      </nav>

      <div className="wrap">
        <h1 className="page-title">Nearby Emergency Requests</h1>
        <p className="page-sub">Accept a request to start turn-by-turn tracking to their location.</p>

        <div className="vd-list">
          {liveActive && (
            <div className="card vd-card vd-card-live">
              <div className="vd-card-top">
                <div>
                  <p className="hf-name">{userName}</p>
                  <p className="hf-type">SOS Emergency · triggered just now</p>
                </div>
                <span className="vd-badge-live">🔴 LIVE</span>
              </div>
              <p className="vd-note">Active SOS on this device — your live location will be shared once you accept.</p>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={acceptLive}>✅ Accept</button>
                <button className="btn btn-outline" onClick={() => reject('live')}>✕ Reject</button>
              </div>
            </div>
          )}

          {visibleDemo.map((r) => (
            <div className="card vd-card" key={r.id}>
              <div className="vd-card-top">
                <div>
                  <p className="hf-name">{r.name}</p>
                  <p className="hf-type">{r.type} · {r.agoMin} min ago</p>
                </div>
                <span className="hf-badge vd-badge-dist">{r.km.toFixed(1)} km</span>
              </div>
              <p className="vd-note">{r.note}</p>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={() => acceptDemo(r)}>✅ Accept</button>
                <button className="btn btn-outline" onClick={() => reject(r.id)}>✕ Reject</button>
              </div>
            </div>
          ))}

          {!liveActive && visibleDemo.length === 0 && (
            <div className="card hf-empty">No pending requests right now. New ones will appear here.</div>
          )}
        </div>
      </div>
    </div>
  )
}
