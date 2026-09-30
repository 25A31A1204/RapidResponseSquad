const RAW = [
  { id: 'req1', name: 'Ananya Reddy', type: 'Medical Emergency', note: 'Sudden chest pain, needs help reaching a hospital.', phone: '+919876500001', agoMin: 2, km: 1.1, bearing: 55 },
  { id: 'req2', name: 'Vikram Singh', type: 'Road Accident', note: 'Minor bike accident, bleeding from the arm.', phone: '+919876500002', agoMin: 6, km: 2.4, bearing: 160 },
  { id: 'req3', name: 'Sneha Iyer', type: 'Feeling Unsafe', note: 'Being followed while walking home, needs an escort.', phone: '+919876500003', agoMin: 1, km: 0.7, bearing: 260 },
]

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

export function getDemoRequests(baseLat, baseLng) {
  const lat = baseLat ?? 17.385
  const lng = baseLng ?? 78.4867
  return RAW.map((r) => {
    const angle = (r.bearing + (hash(r.id) % 7)) * (Math.PI / 180)
    const dLat = (r.km / 111) * Math.cos(angle)
    const dLng = (r.km / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle)
    return { ...r, lat: lat + dLat, lng: lng + dLng }
  })
}
