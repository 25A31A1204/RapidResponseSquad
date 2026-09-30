// bearing 0 = north, 90 = east — converted to a flat-earth east/north offset
// in km (fine at these short distances), used only to seed demo positions.
export function bearingDistToKmXY(bearingDeg, distKm) {
  const rad = (bearingDeg * Math.PI) / 180
  return { x: Math.sin(rad) * distKm, y: Math.cos(rad) * distKm }
}
export function kmXYToLatLng(baseLat, baseLng, xKm, yKm) {
  return {
    lat: baseLat + yKm / 111,
    lng: baseLng + xKm / (111 * Math.cos((baseLat * Math.PI) / 180)),
  }
}

// Straight-line fallback bezier (used only if road-routing fails — offline,
// rate-limited, etc — so the demo never breaks).
export function buildFallbackRoute(sx, sy, steps = 60) {
  const midx = sx / 2, midy = sy / 2
  const perpX = -sy, perpY = sx
  const len = Math.hypot(perpX, perpY) || 1
  const bow = 0.18
  const cx = midx + (perpX / len) * Math.hypot(sx, sy) * bow
  const cy = midy + (perpY / len) * Math.hypot(sx, sy) * bow
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx
    const y = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy
    pts.push({ x, y })
  }
  return pts
}

// Real road-following route via OSRM's free public routing API — returns an
// array of {lat,lng} that hugs actual streets. Resolves null on any failure
// so callers can fall back to the straight-line approximation.
export async function fetchRoadRoute(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const coords = data?.routes?.[0]?.geometry?.coordinates
    if (!coords || coords.length < 2) return null
    return coords.map(([lng, lat]) => ({ lat, lng }))
  } catch {
    return null
  }
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
export function cumulativeDistances(points) {
  const cum = [0]
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + haversineKm(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng))
  }
  return cum
}
export function pointAtFraction(points, cum, frac) {
  const total = cum[cum.length - 1]
  const target = total * frac
  let idx = 0
  while (idx < cum.length - 1 && cum[idx + 1] < target) idx++
  const p1 = points[idx], p2 = points[idx + 1] ?? p1
  const segLen = (cum[idx + 1] ?? cum[idx]) - cum[idx] || 1
  const segT = (target - cum[idx]) / segLen
  return { lat: p1.lat + (p2.lat - p1.lat) * segT, lng: p1.lng + (p2.lng - p1.lng) * segT, idx }
}

// Slow, constant-speed animation along a route (real or fallback) driven by
// elapsed time, so speed stays steady no matter how many points the road
// geometry has. Calls onTick(t, pos, remainingKm, remainingEtaMin) every
// paint and onDone() once the route completes.
export function animateAlongRoute(points, { onTick, onDone, speedKmPerMin = 0.38 }) {
  const cum = cumulativeDistances(points)
  const totalKm = cum[cum.length - 1] || 0.1
  const etaTotalMin = Math.max(2, Math.round(totalKm / speedKmPerMin))
  const durationMs = Math.min(42000, Math.max(20000, totalKm * 11000))
  const start = performance.now()
  let lastPaint = 0
  let rafId = null

  function frame(now) {
    const t = Math.min(1, (now - start) / durationMs)
    if (now - lastPaint > 45 || t >= 1) {
      lastPaint = now
      const pos = pointAtFraction(points, cum, t)
      onTick(t, pos, Math.max(0, totalKm * (1 - t)), Math.max(0, Math.ceil(etaTotalMin * (1 - t))), points.slice(Math.max(0, pos.idx - 1)))
    }
    if (t < 1) rafId = requestAnimationFrame(frame)
    else onDone()
  }
  rafId = requestAnimationFrame(frame)
  return { totalKm, etaTotalMin, cancel: () => cancelAnimationFrame(rafId) }
}
