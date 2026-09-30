import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { mapLinkFor } from '../utils/phone.js'
import { fetchNearbyHospitals } from '../utils/hospitals.js'
import TopNav from '../components/TopNav.jsx'
import HospitalMap from '../components/HospitalMap.jsx'

const FILTERS = ['All', 'Hospital', 'Clinic', 'Emergency', '24/7']

export default function HospitalFinder() {
  const { coords, refreshLocation, userName } = useApp()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [locating, setLocating] = useState(false)
  const [hospitals, setHospitals] = useState([])
  const [status, setStatus] = useState('loading') // loading | ok | error
  const [selectedId, setSelectedId] = useState(null)
  const [focusSignal, setFocusSignal] = useState(0)

  const lat = coords?.lat ?? 17.385
  const lng = coords?.lng ?? 78.4867

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    fetchNearbyHospitals(lat, lng)
      .then((list) => {
        if (cancelled) return
        setHospitals(list)
        setStatus('ok')
      })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [lat, lng])

  async function handleLocate() {
    setLocating(true)
    await refreshLocation()
    setLocating(false)
  }

  function selectHospital(id) {
    setSelectedId(id)
    setFocusSignal((n) => n + 1)
  }

  const visible = hospitals.filter((h) => {
    const haystack = (h.name + ' ' + h.type + ' ' + (h.address || '')).toLowerCase()
    const matchesQuery = query.trim() ? haystack.includes(query.trim().toLowerCase()) : true
    const matchesFilter =
      filter === 'All' ? true
      : filter === '24/7' ? h.open24
      : filter === 'Emergency' ? h.emergency
      : h.type === filter
    return matchesQuery && matchesFilter
  })

  return (
    <>
      <TopNav />
      <div className="wrap hf-wrap">
        <h1 className="page-title">Nearby Hospitals</h1>
        <p className="page-sub">
          {coords ? 'Real hospitals near your live location, from OpenStreetMap.' : 'Turn on location for hospitals near you — showing a default area for now.'}
        </p>

        <div className="hf-layout">
          <div className="hf-list-col">
            <div className="hf-toolbar card">
              <input
                className="hf-search"
                placeholder="Search hospital, area…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="btn btn-outline hf-locate" onClick={handleLocate} disabled={locating}>
                {locating ? 'Locating…' : '📍 Use my location'}
              </button>
            </div>

            <div className="hf-filters">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className={'hf-chip' + (filter === f ? ' active' : '')}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="hf-list">
              {status === 'loading' && (
                <div className="card hf-empty">🔎 Finding real hospitals near you…</div>
              )}

              {status === 'error' && (
                <div className="card hf-empty">
                  Couldn't load hospital data right now — the map data service may be slow or unreachable.
                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn-outline" onClick={() => { setStatus('loading'); fetchNearbyHospitals(lat, lng).then((l) => { setHospitals(l); setStatus('ok') }).catch(() => setStatus('error')) }}>
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {status === 'ok' && visible.length === 0 && (
                <div className="card hf-empty">No hospitals match that search/filter nearby. Try widening your search or moving to a city center.</div>
              )}

              {status === 'ok' && visible.map((h) => (
                <div
                  className={'card hf-card' + (h.id === selectedId ? ' selected' : '')}
                  key={h.id}
                  onClick={() => selectHospital(h.id)}
                >
                  <div className="hf-card-top">
                    <div>
                      <p className="hf-name">{h.name}</p>
                      <p className="hf-type">{h.type}</p>
                    </div>
                    {h.open24 && <span className="hf-badge">24/7</span>}
                  </div>

                  <div className="hf-tags">
                    <span className="hf-tag">{h.type}</span>
                    {h.emergency && <span className="hf-tag">Emergency</span>}
                  </div>

                  <div className="stats hf-stats">
                    <div className="stat">
                      <div className="stat-label">DISTANCE</div>
                      <div className="stat-value">{h.km < 1 ? `${Math.round(h.km * 1000)} m` : `${h.km.toFixed(1)} km`}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">EST. ARRIVAL</div>
                      <div className="stat-value eta">{h.etaMin} min</div>
                    </div>
                  </div>

                  <div className="btn-row">
                    {h.phone ? (
                      <a className="btn btn-primary" href={`tel:${h.phone}`} onClick={(e) => e.stopPropagation()}>📞 Call</a>
                    ) : (
                      <button className="btn btn-primary" disabled>📞 No number listed</button>
                    )}
                    <a
                      className="btn btn-outline"
                      href={mapLinkFor(h.lat, h.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      🧭 Directions
                    </a>
                  </div>
                  {h.address && <div className="hf-rating">📍 {h.address}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="hf-map-col">
            <div className="hf-map-sticky card">
              <HospitalMap
                userCoords={coords}
                userName={userName}
                hospitals={visible}
                selectedId={selectedId}
                onSelect={selectHospital}
                focusSignal={focusSignal}
              />
              <div className="hf-map-legend">
                <span className="hf-legend-item"><span className="hf-legend-dot hf-legend-user" /> You</span>
                <span className="hf-legend-item"><span className="hf-legend-dot hf-legend-hosp">+</span> Hospital</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
