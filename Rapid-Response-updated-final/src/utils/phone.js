const DEFAULT_COUNTRY = '91'

// Turns "98765 43210", "098765-43210" or "+91 98765 43210" into "+919876543210".
export function normalizePhone(raw) {
  let p = String(raw || '').replace(/[^\d+]/g, '')
  if (p.startsWith('00')) p = '+' + p.slice(2)
  if (!p.startsWith('+')) {
    p = p.replace(/^0+/, '')
    p = p.length === 10 ? '+' + DEFAULT_COUNTRY + p : '+' + p
  }
  return p
}

export function isValidPhone(p) {
  return /^\+[1-9]\d{7,14}$/.test(String(p || ''))
}

export function prettyPhone(p) {
  if (!isValidPhone(p)) return p || '—'
  return p.startsWith('+91') && p.length === 13
    ? `+91 ${p.slice(3, 8)} ${p.slice(8)}`
    : p
}

export function smsHref(phone, body) {
  const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent)
  const sep = isApple ? '&' : '?'
  return `sms:${phone}${sep}body=${encodeURIComponent(body)}`
}

export function waHref(phone, body) {
  return `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(body)}`
}

export function mapLinkFor(lat, lng) {
  return lat != null && lng != null
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : 'Location unavailable'
}
