import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import TopNav from '../components/TopNav.jsx'
import RealMap from '../components/RealMap.jsx'
import { useApp } from '../context/AppContext.jsx'
import {
  bearingDistToKmXY, kmXYToLatLng, buildFallbackRoute, fetchRoadRoute, animateAlongRoute,
} from '../utils/routing.js'

const SEED_VOLUNTEERS = [
  { id: 'rahul', name: 'Rahul', bearing: 40, distKm: 0.9, rating: '4.9', vehicle: 'Bike · Yellow Helmet' },
  { id: 'priya', name: 'Priya', bearing: 110, distKm: 1.6, rating: '4.8', vehicle: 'Bike · First-aid kit' },
  { id: 'arjun', name: 'Arjun', bearing: 220, distKm: 2.3, rating: '4.7', vehicle: 'Bike · Red Jacket' },
]

export default function VolunteerTracking() {
  const { userName, coords } = useApp()
  const baseLat = coords?.lat ?? 17.385
  const baseLng = coords?.lng ?? 78.4867

  const seedWithLatLng = useMemo(
    () => SEED_VOLUNTEERS.map((v) => {
      const { x, y } = bearingDistToKmXY(v.bearing, v.distKm)
      return { ...v, ...kmXYToLatLng(baseLat, baseLng, x, y) }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseLat, baseLng]
  )

  const [volunteers, setVolunteers] = useState(seedWithLatLng)
  useEffect(() => setVolunteers(seedWithLatLng), [seedWithLatLng])

  const [step, setStep] = useState('search') // search | accept | enroute | arrive
  const [selectedId, setSelectedId] = useState(null)
  const [routeLL, setRouteLL] = useState([])
  const [onRoad, setOnRoad] = useState(false)
  const [progress, setProgress] = useState(0)
  const [distance, setDistance] = useState(null)
  const [eta, setEta] = useState(null)
  const [status, setStatus] = useState('Getting your location…')
  const [msgLog, setMsgLog] = useState('')
  const [toast, setToast] = useState(false)
  const [focusTick, setFocusTick] = useState(0)

  const animRef = useRef(null)
  const autoAcceptTimer = useRef(null)
  const selectedRef = useRef(null)

  useEffect(() => {
    const t1 = setTimeout(() => setStatus('Location locked — scanning for nearby volunteers…'), 500)
    const t2 = setTimeout(() => { setStep('accept'); setStatus('3 volunteers nearby — tap a marker to choose one') }, 1400)
    autoAcceptTimer.current = setTimeout(() => {
      if (!selectedRef.current) handleAccept('priya')
    }, 11000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(autoAcceptTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => animRef.current?.cancel(), [])

  const runRoute = useCallback((points, v, usingRoad) => {
    setOnRoad(usingRoad)
    setRouteLL(points)
    setStatus(`${v.name} accepted your SOS and is on the way${usingRoad ? ' — following the road' : ''}`)
    animRef.current = animateAlongRoute(points, {
      onTick: (t, pos, remKm, remEta, remPts) => {
        setProgress(t)
        setVolunteers((vs) => vs.map((vv) => (vv.id === v.id ? { ...vv, lat: pos.lat, lng: pos.lng } : vv)))
        setDistance(remKm)
        setEta(remEta)
        setRouteLL(remPts)
      },
      onDone: () => {
        setStep('arrive')
        setStatus(`${v.name} has arrived at your location`)
        setToast(true)
        setTimeout(() => setToast(false), 4500)
      },
    })
  }, [])

  const handleAccept = useCallback((id) => {
    if (selectedRef.current) return
    selectedRef.current = id
    setSelectedId(id)
    clearTimeout(autoAcceptTimer.current)
    setStep('enroute')

    const v = seedWithLatLng.find((v) => v.id === id)
    setStatus(`Routing ${v.name} to you along real roads…`)

    fetchRoadRoute(v.lat, v.lng, baseLat, baseLng).then((roadPts) => {
      if (roadPts && roadPts.length > 1) {
        runRoute(roadPts, v, true)
      } else {
        const { x, y } = bearingDistToKmXY(v.bearing, v.distKm)
        const kmPts = buildFallbackRoute(x, y)
        const llPts = kmPts.map((p) => kmXYToLatLng(baseLat, baseLng, p.x, p.y))
        runRoute(llPts, v, false)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedWithLatLng, baseLat, baseLng, runRoute])

  const accepted = volunteers.find((v) => v.id === selectedId)
  const visibleVolunteers = selectedId ? volunteers.filter((v) => v.id === selectedId) : volunteers

  const distLabel = distance == null ? '—' : distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`
  const etaLabel = step === 'arrive' ? 'Here' : eta == null ? '—' : `${eta} min`

  const timelineSteps = [
    { id: 'search', icon: '🔍', title: 'Finding nearby volunteers', sub: 'Scanning your area' },
    { id: 'accept', icon: '🙋', title: 'Volunteer accepts', sub: 'Tap a marker to pick one' },
    { id: 'enroute', icon: '🏍️', title: 'On the way', sub: onRoad ? 'Following real roads to you' : 'Tracking their route to you' },
    { id: 'arrive', icon: '🎯', title: 'Arrived', sub: 'Volunteer reaches your location' },
  ]
  const order = ['search', 'accept', 'enroute', 'arrive']
  function stateFor(id) {
    const curI = order.indexOf(step), thisI = order.indexOf(id)
    if (thisI < curI) return 'done'
    if (thisI === curI) return step === 'arrive' ? 'done' : 'active'
    return ''
  }

  const fitKey = step + ':' + (selectedId || '')

  return (
    <>
      <TopNav live backTo="/" />
      <div className="wrap">
        <div className="page-head">
          <div className="page-title">HELP IS COMING</div>
          <p className="page-sub">Live tracking of the volunteer heading your way</p>
        </div>

        <div className="grid">
          <div className="card">
            <div className="timeline">
              {timelineSteps.map((s) => {
                const st = stateFor(s.id)
                return (
                  <div className={'tl-step' + (st ? ' ' + st : '')} key={s.id}>
                    <span className="tl-icon">{s.icon}</span>
                    <div className="tl-text"><strong>{s.title}</strong><span>{s.sub}</span></div>
                    <span className="tl-check">{st === 'done' ? '✅' : st === 'active' ? '🔄' : '⏳'}</span>
                  </div>
                )
              })}
            </div>

            {accepted && (
              <div className="vp show">
                <div className="vp-avatar"><div className="vp-pulse" /><span>🙋‍♀️</span></div>
                <div className="vp-info">
                  <div className="vp-name">{accepted.name}</div>
                  <div className="vp-meta">{accepted.vehicle} · ⭐ {accepted.rating}</div>
                  <div className="vp-stars">★★★★★</div>
                </div>
              </div>
            )}

            <div className="stats">
              <div className="stat"><div className="stat-label">DISTANCE</div><div className="stat-value">{distLabel}</div></div>
              <div className="stat"><div className="stat-label">ETA</div><div className="stat-value eta">{etaLabel}</div></div>
            </div>

            <div className="progress-track"><div className="progress-fill" style={{ width: `${progress * 100}%` }} /></div>

            <div className="actions">
              <button className="btn btn-primary" onClick={() => { setFocusTick((t) => t + 1); setStatus('Map centered on your location') }}>📍 Focus map on me</button>
              <div className="btn-row">
                <button className="btn btn-outline" disabled={!accepted} onClick={() => setMsgLog(`Calling ${accepted?.name}…`)}>📞 Call</button>
                <button className="btn btn-outline" disabled={!accepted} onClick={() => setMsgLog(`Message sent to ${accepted?.name}: "On my way, stay safe."`)}>💬 Message</button>
              </div>
              <button className="btn btn-danger" onClick={() => (window.location.href = 'tel:108')}>🚑 Call Ambulance (108)</button>
            </div>

            <div className="status-line"><span className="status-dot-live" />{msgLog || status}</div>
          </div>

          <div className="map-card">
            <RealMap
              userCoords={{ lat: baseLat, lng: baseLng }}
              userName={userName}
              volunteers={visibleVolunteers}
              selectedId={selectedId}
              routeLatLngs={routeLL}
              onAccept={handleAccept}
              fitKey={fitKey}
              focusSignal={focusTick}
            />
            <div className="map-legend">
              <div className="legend-item"><span className="legend-dot" style={{ background: '#0ABFA3' }} />{userName}</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: '#E53535' }} />Volunteer</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: '#1E90FF' }} />Route</div>
            </div>
          </div>
        </div>
      </div>

      <div className={'arrival-toast' + (toast ? ' show' : '')}>🎉 <span>{accepted?.name} has arrived at your location</span></div>
    </>
  )
}
