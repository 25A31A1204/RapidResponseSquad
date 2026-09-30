import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import RealMap from '../components/RealMap.jsx'
import { useApp } from '../context/AppContext.jsx'
import { getDemoRequests } from '../data/volunteerRequests.js'
import { fetchRoadRoute, animateAlongRoute } from '../utils/routing.js'

export default function VolunteerRespond() {
  const { id } = useParams()
  const routeState = useLocation().state
  const { volunteer, coords, emergency, userName, dismissSOS } = useApp()

  const myLat = coords?.lat ?? 17.385
  const myLng = coords?.lng ?? 78.4867

  const target = useMemo(() => {
    if (id === 'live') {
      if (!emergency?.loc) return null
      return { id: 'live', name: userName, type: 'SOS Emergency', note: null, phone: null, lat: emergency.loc.lat, lng: emergency.loc.lng, isLive: true }
    }
    if (routeState?.id === id) return routeState
    return getDemoRequests(myLat, myLng).find((r) => r.id === id) || null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const [me, setMe] = useState({ id: 'me', name: volunteer?.name || 'You', vehicle: volunteer?.vehicle || 'Bike', rating: '—', lat: myLat, lng: myLng })
  const [step, setStep] = useState('routing') // routing | enroute | arrived
  const [onRoad, setOnRoad] = useState(false)
  const [progress, setProgress] = useState(0)
  const [distance, setDistance] = useState(null)
  const [eta, setEta] = useState(null)
  const [routeLL, setRouteLL] = useState([])
  const [status, setStatus] = useState('Calculating the best route…')
  const [focusTick, setFocusTick] = useState(0)
  const [msgLog, setMsgLog] = useState('')
  const animRef = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    if (!target || started.current) return
    started.current = true
    setStep('enroute')
    fetchRoadRoute(myLat, myLng, target.lat, target.lng).then((roadPts) => {
      let pts = roadPts
      let usingRoad = true
      if (!pts || pts.length < 2) {
        usingRoad = false
        const steps = 60
        pts = Array.from({ length: steps + 1 }, (_, i) => {
          const t = i / steps
          return { lat: myLat + (target.lat - myLat) * t, lng: myLng + (target.lng - myLng) * t }
        })
      }
      setOnRoad(usingRoad)
      setRouteLL(pts)
      setStatus(`On the way to ${target.name}${usingRoad ? ' — following the road' : ''}`)
      animRef.current = animateAlongRoute(pts, {
        onTick: (t, pos, remKm, remEta, remPts) => {
          setProgress(t)
          setMe((m) => ({ ...m, lat: pos.lat, lng: pos.lng }))
          setDistance(remKm)
          setEta(remEta)
          setRouteLL(remPts)
        },
        onDone: () => {
          setStep('arrived')
          setStatus(`You've arrived at ${target.name}'s location`)
          if (target.isLive) setTimeout(() => dismissSOS(), 1500)
        },
      })
    })
    return () => animRef.current?.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  function markArrived() {
    animRef.current?.cancel()
    setStep('arrived')
    setStatus(`You've arrived at ${target.name}'s location`)
    if (target?.isLive) setTimeout(() => dismissSOS(), 1200)
  }

  if (!target) {
    return (
      <div className="vl-wrap">
        <div className="card vl-card">
          <div className="vl-icon">🕊️</div>
          <h1 className="vl-title">Request no longer available</h1>
          <p className="vl-sub">This emergency may have already been resolved or picked up.</p>
          <Link to="/volunteer/dashboard" className="btn btn-primary" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const distLabel = distance == null ? '—' : distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`
  const etaLabel = step === 'arrived' ? 'Arrived' : eta == null ? '—' : `${eta} min`

  return (
    <>
      <nav className="vd-topbar">
        <div className="vd-brand">🦺 Responding to {target.name}</div>
        <div className="vd-who">
          <Link to="/volunteer/dashboard" className="vd-logout" style={{ textDecoration: 'none' }}>← Dashboard</Link>
        </div>
      </nav>

      <div className="wrap">
        <div className="grid">
          <div className="card">
            <div className="timeline">
              <div className={'tl-step' + (step !== 'routing' ? ' done' : ' active')}>
                <span className="tl-icon">✅</span>
                <div className="tl-text"><strong>Request accepted</strong><span>{target.type}</span></div>
                <span className="tl-check">{step !== 'routing' ? '✅' : '🔄'}</span>
              </div>
              <div className={'tl-step' + (step === 'enroute' ? ' active' : step === 'arrived' ? ' done' : '')}>
                <span className="tl-icon">🏍️</span>
                <div className="tl-text"><strong>On the way</strong><span>{onRoad ? 'Following real roads' : 'Heading to their location'}</span></div>
                <span className="tl-check">{step === 'arrived' ? '✅' : step === 'enroute' ? '🔄' : '⏳'}</span>
              </div>
              <div className={'tl-step' + (step === 'arrived' ? ' active' : '')}>
                <span className="tl-icon">🎯</span>
                <div className="tl-text"><strong>Arrived</strong><span>Reached {target.name}</span></div>
                <span className="tl-check">{step === 'arrived' ? '✅' : '⏳'}</span>
              </div>
            </div>

            {target.note && (
              <div className="vp show">
                <div className="vp-avatar"><span>🚨</span></div>
                <div className="vp-info">
                  <div className="vp-name">{target.name}</div>
                  <div className="vp-meta">{target.note}</div>
                </div>
              </div>
            )}

            <div className="stats">
              <div className="stat"><div className="stat-label">DISTANCE</div><div className="stat-value">{distLabel}</div></div>
              <div className="stat"><div className="stat-label">ETA</div><div className="stat-value eta">{etaLabel}</div></div>
            </div>

            <div className="progress-track"><div className="progress-fill" style={{ width: `${progress * 100}%` }} /></div>

            <div className="actions">
              <button className="btn btn-primary" onClick={() => setFocusTick((t) => t + 1)}>📍 Focus map on me</button>
              <div className="btn-row">
                <button className="btn btn-outline" disabled={!target.phone} onClick={() => target.phone && (window.location.href = `tel:${target.phone}`)}>📞 Call</button>
                <button className="btn btn-outline" onClick={() => setMsgLog(`Message sent to ${target.name}: "On my way!"`)}>💬 Message</button>
              </div>
              {step === 'enroute' && (
                <button className="btn btn-outline" onClick={markArrived}>✅ Mark as Arrived</button>
              )}
            </div>

            <div className="status-line"><span className="status-dot-live" />{msgLog || status}</div>
          </div>

          <div className="map-card">
            <RealMap
              userCoords={{ lat: target.lat, lng: target.lng }}
              userName={target.name}
              volunteers={[me]}
              selectedId="me"
              routeLatLngs={routeLL}
              fitKey={step}
              focusSignal={focusTick}
            />
            <div className="map-legend">
              <div className="legend-item"><span className="legend-dot" style={{ background: '#0ABFA3' }} />{target.name}</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: '#E53535' }} />You</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: '#1E90FF' }} />Route</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
