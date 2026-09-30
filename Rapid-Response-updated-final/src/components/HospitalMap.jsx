import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Same emoji/div-icon approach as RealMap — no bundler asset issues, easy to
// theme with CSS.
function userIcon() {
  return L.divIcon({
    className: 'rm-icon-wrap',
    html: '<div class="rm-user"><span class="rm-user-pulse"></span><span class="rm-user-dot"></span></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

// Red "+" pin for hospitals — classic map-marker teardrop shape with a plus
// glyph, matching the Google-Maps-style hospital marker the user asked for.
function hospitalIcon(active) {
  return L.divIcon({
    className: 'rm-icon-wrap',
    html: `<div class="rm-hosp${active ? ' active' : ''}"><span>+</span></div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    popupAnchor: [0, -34],
  })
}

// Fits the map to show every hospital + the user whenever the underlying
// data set changes (new search results loaded, filter changes the count).
function FitBounds({ points, fitKey }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    if (points.length === 1) map.setView(points[0], 15, { animate: true })
    else map.fitBounds(points, { padding: [48, 48], maxZoom: 15, animate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey])
  return null
}

// Pans/zooms to a specific hospital when it's selected from the list, without
// fighting the user's own pan/zoom the rest of the time.
function FocusPoint({ point, focusSignal }) {
  const map = useMap()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (point) map.setView(point, 16, { animate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal])
  return null
}

export default function HospitalMap({ userCoords, userName, hospitals, selectedId, onSelect, focusSignal }) {
  const center = useMemo(
    () => [userCoords?.lat ?? 17.385, userCoords?.lng ?? 78.4867],
    [userCoords?.lat, userCoords?.lng]
  )

  const selected = hospitals.find((h) => h.id === selectedId)
  const focusPoint = selected ? [selected.lat, selected.lng] : center

  const boundsPoints = useMemo(() => {
    const pts = [center]
    hospitals.forEach((h) => pts.push([h.lat, h.lng]))
    return pts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], hospitals.map((h) => h.id).join(',')])

  return (
    <MapContainer center={center} zoom={13} className="real-map hosp-map" scrollWheelZoom>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      <FitBounds points={boundsPoints} fitKey={hospitals.length + ':' + boundsPoints.length} />
      <FocusPoint point={focusPoint} focusSignal={focusSignal} />

      <Marker position={center} icon={userIcon()}>
        <Popup closeButton={false}>{userName || 'You'}</Popup>
      </Marker>

      {hospitals.map((h) => (
        <Marker
          key={h.id}
          position={[h.lat, h.lng]}
          icon={hospitalIcon(h.id === selectedId)}
          eventHandlers={{ click: () => onSelect?.(h.id) }}
        >
          <Popup closeButton={false} className="rm-popup hosp-popup">
            <strong>{h.name}</strong>
            <span>{h.type} · {h.km < 1 ? `${Math.round(h.km * 1000)} m` : `${h.km.toFixed(1)} km`} away</span>
            {h.address && <span className="hosp-popup-addr">📍 {h.address}</span>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
