import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Small emoji-based markers via divIcon — avoids the classic "broken default
// marker icon" bundler issue entirely, since we never touch L.Icon.Default.
function userIcon() {
  return L.divIcon({
    className: 'rm-icon-wrap',
    html: '<div class="rm-user"><span class="rm-user-pulse"></span><span class="rm-user-dot"></span></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}
function volunteerIcon(active) {
  return L.divIcon({
    className: 'rm-icon-wrap',
    html: `<div class="rm-vol${active ? ' active' : ''}"><span>🏍️</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 34],
  })
}

// Re-fits the map whenever `fitKey` changes (e.g. a new step or a volunteer
// gets accepted) — deliberately NOT tied to live marker movement, so the
// camera doesn't fight the user while the bike animates.
function FitBounds({ points, fitKey }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    if (points.length === 1) map.setView(points[0], 15, { animate: true })
    else map.fitBounds(points, { padding: [56, 56], maxZoom: 16, animate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey])
  return null
}

// Recenters on the user whenever `focusSignal` increments (the "Focus map on
// me" button).
function FocusUser({ center, focusSignal }) {
  const map = useMap()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    map.setView(center, 16, { animate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal])
  return null
}

export default function RealMap({
  userCoords, userName, volunteers, selectedId, routeLatLngs,
  onAccept, fitKey, focusSignal,
}) {
  const center = useMemo(
    () => [userCoords?.lat ?? 17.385, userCoords?.lng ?? 78.4867],
    [userCoords?.lat, userCoords?.lng]
  )

  const boundsPoints = useMemo(() => {
    const pts = [center]
    volunteers.forEach((v) => pts.push([v.lat, v.lng]))
    return pts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], volunteers.map((v) => `${v.id}:${v.lat.toFixed(3)}`).join(',')])

  return (
    <MapContainer center={center} zoom={14} className="real-map" scrollWheelZoom>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      <FitBounds points={boundsPoints} fitKey={fitKey} />
      <FocusUser center={center} focusSignal={focusSignal} />

      <Marker position={center} icon={userIcon()}>
        <Popup closeButton={false}>{userName || 'You'}</Popup>
      </Marker>

      {routeLatLngs && routeLatLngs.length > 1 && (
        <>
          <Polyline
            positions={routeLatLngs.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
          />
          <Polyline
            positions={routeLatLngs.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#1E90FF', weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
          />
        </>
      )}

      {volunteers.map((v) => (
        <Marker
          key={v.id}
          position={[v.lat, v.lng]}
          icon={volunteerIcon(v.id === selectedId)}
          eventHandlers={{ click: () => onAccept?.(v.id) }}
        >
          <Popup closeButton={false} className="rm-popup">
            <strong>{v.name}</strong>
            <span>{v.vehicle}<br />⭐ {v.rating} · {v.etaMin} min away</span>
            {v.id !== selectedId && !selectedId && (
              <button onClick={() => onAccept?.(v.id)}>Accept this volunteer</button>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
