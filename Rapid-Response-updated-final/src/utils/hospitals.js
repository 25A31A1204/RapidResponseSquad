import { haversineKm } from './routing.js'

// Queries real hospitals/clinics from OpenStreetMap around a point. No API
// key needed — Overpass is OSM's free query service. Returns [] on failure
// so the UI can show a clear "couldn't load" state instead of fake data.
export async function fetchNearbyHospitals(lat, lng, radiusM = 12000) {
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"="hospital"](around:${radiusM},${lat},${lng});
      way["amenity"="hospital"](around:${radiusM},${lat},${lng});
      node["amenity"="clinic"](around:${Math.round(radiusM * 0.6)},${lat},${lng});
    );
    out center 40;
  `.trim()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error('Overpass request failed')
    const data = await res.json()

    const seen = new Set()
    const hospitals = (data.elements || [])
      .map((el) => {
        const elLat = el.lat ?? el.center?.lat
        const elLng = el.lon ?? el.center?.lon
        if (elLat == null || elLng == null) return null
        const tags = el.tags || {}
        const name = tags.name || tags['name:en']
        if (!name) return null
        const key = name + '|' + elLat.toFixed(3) + ',' + elLng.toFixed(3)
        if (seen.has(key)) return null
        seen.add(key)

        const addrParts = [tags['addr:housenumber'], tags['addr:street'] || tags['addr:place'], tags['addr:suburb'], tags['addr:city']].filter(Boolean)
        const km = haversineKm(lat, lng, elLat, elLng)

        return {
          id: 'osm_' + el.type + el.id,
          name,
          type: tags.amenity === 'clinic' ? 'Clinic' : (tags.healthcare === 'hospital' || tags.amenity === 'hospital') ? 'Hospital' : 'Medical Facility',
          phone: tags.phone || tags['contact:phone'] || null,
          address: addrParts.length ? addrParts.join(', ') : null,
          open24: tags.opening_hours === '24/7',
          emergency: tags.emergency === 'yes',
          lat: elLat,
          lng: elLng,
          km,
          etaMin: Math.max(2, Math.round(km * 2.6)),
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.km - b.km)
      .slice(0, 20)

    return hospitals
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}
