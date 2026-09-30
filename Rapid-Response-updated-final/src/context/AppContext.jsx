import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { isValidPhone, mapLinkFor } from '../utils/phone.js'

const AppContext = createContext(null)

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

const STEP_ORDER = ['volunteer', 'contact', 'location']

export function AppProvider({ children }) {
  const [userName, setUserName] = useState(() => load('rr_name', 'Prasanna'))
  const [contacts, setContacts] = useState(() => load('rr_contacts', []))
  const [history, setHistory] = useState(() => load('rr_history', []))
  const [profile, setProfile] = useState(() => load('rr_profile', {
    bloodGroup: 'O+', allergies: 'None', conditions: 'None', insurance: 'N/A'
  }))

  const [coords, setCoords] = useState(() => {
    const lat = load('rr_userLat', null)
    const lng = load('rr_userLng', null)
    return lat != null && lng != null ? { lat, lng } : null
  })

  const [emergency, setEmergency] = useState(null)
  // emergency shape: { id, startedAt, steps:{volunteer,contact,location}, status,
  //                    volunteerText, contactText, manualSend:{show,reason,message,list,sent:Set} }

  const [volunteer, setVolunteer] = useState(() => load('rr_volunteer', null))
  useEffect(() => save('rr_volunteer', volunteer), [volunteer])

  const stepTimers = useRef([])

  useEffect(() => save('rr_contacts', contacts), [contacts])
  useEffect(() => save('rr_history', history), [history])
  useEffect(() => save('rr_profile', profile), [profile])
  useEffect(() => { if (coords) { save('rr_userLat', coords.lat); save('rr_userLng', coords.lng) } }, [coords])

  const refreshLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setCoords(c)
          resolve(c)
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 4000 }
      )
    })
  }, [])

  useEffect(() => { refreshLocation() }, [refreshLocation])

  const validContacts = useCallback(() => contacts.filter((c) => isValidPhone(c.phone)), [contacts])

  function addContact(entry) { setContacts((c) => [...c, entry]) }
  function updateContact(index, entry) {
    setContacts((c) => c.map((old, i) => (i === index ? { ...old, ...entry } : old)))
  }
  function deleteContact(index) { setContacts((c) => c.filter((_, i) => i !== index)) }

  function addHistoryEntry(entry) { setHistory((h) => [entry, ...h]) }
  function clearHistory() { setHistory([]) }

  function markStep(id, state) {
    setEmergency((e) => (e ? { ...e, steps: { ...e.steps, [id]: state } } : e))
  }

  function buildContactMessage(name, mapLink) {
    return `🚨 EMERGENCY — ${name} needs help right now.\n\n` +
      `📍 Live location: ${mapLink}\n\n` +
      `Please call ${name} immediately, or dial 112.\n` +
      `— sent by Rapid Response`
  }

  async function fireSOS() {
    stepTimers.current.forEach(clearTimeout)
    stepTimers.current = []

    const id = 'sos_' + Date.now().toString(36)
    const startedAt = new Date().toISOString()
    let loc = coords
    const fresh = await refreshLocation()
    if (fresh) loc = fresh

    const list = validContacts()
    const mapLink = mapLinkFor(loc?.lat, loc?.lng)
    const message = buildContactMessage(userName, mapLink)

    setEmergency({
      id, startedAt, loc,
      steps: { volunteer: '', contact: '', location: '' },
      status: 'active',
      volunteerText: 'Finding volunteers with your location…',
      contactText: list.length ? 'Sending your name + live location…' : 'No emergency contacts saved',
      manualSend: list.length
        ? { show: true, reason: 'app', message, list, sent: {} }
        : { show: true, reason: 'none', message, list: [], sent: {} },
    })

    const t = (fn, ms) => stepTimers.current.push(setTimeout(fn, ms))

    // Step 1 — volunteer search (simulated)
    markStep('volunteer', 'active')
    t(() => {
      setEmergency((e) => e && { ...e, volunteerText: 'Volunteers notified with your live location' })
      markStep('volunteer', 'done')
    }, 900)

    // Step 2 — contact alert
    t(() => markStep('contact', 'active'), 1200)
    t(() => {
      setEmergency((e) => e && {
        ...e,
        contactText: list.length
          ? `Queued for ${list.length} contact${list.length > 1 ? 's' : ''} — send now from this phone`
          : 'No emergency contacts saved',
      })
      markStep('contact', 'done')
    }, 2100)

    // Step 3 — live location
    t(() => markStep('location', 'active'), 2500)
    t(() => markStep('location', 'done'), 3200)

    t(() => {
      addHistoryEntry({
        id, type: 'SOS', status: 'active',
        time: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        addr: loc ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : 'Unknown',
        sentTo: list.length,
      })
    }, 3200)
  }

  function markContactSent(idx) {
    setEmergency((e) => e && { ...e, manualSend: { ...e.manualSend, sent: { ...e.manualSend.sent, [idx]: true } } })
  }

  function dismissSOS() {
    stepTimers.current.forEach(clearTimeout)
    stepTimers.current = []
    setHistory((h) => h.map((row) => (row.id === emergency?.id ? { ...row, status: 'resolved' } : row)))
    setEmergency(null)
  }

  function volunteerLogin(data) {
    setVolunteer({ ...data, loggedInAt: new Date().toISOString() })
  }
  function volunteerLogout() { setVolunteer(null) }

  // Called from the Volunteer Dashboard when the logged-in volunteer accepts
  // the live emergency happening on this device (same-browser demo linkage).
  function acceptEmergencyAsVolunteer() {
    if (!volunteer) return
    setEmergency((e) => e && {
      ...e,
      acceptedBy: volunteer.name,
      volunteerText: `${volunteer.name} accepted and is on the way`,
      steps: { ...e.steps, volunteer: 'done' },
    })
  }

  const value = {
    userName, setUserName,
    contacts, addContact, updateContact, deleteContact, validContacts,
    history, addHistoryEntry, clearHistory,
    profile, setProfile,
    coords, refreshLocation,
    emergency, fireSOS, dismissSOS, markContactSent,
    volunteer, volunteerLogin, volunteerLogout, acceptEmergencyAsVolunteer,
    STEP_ORDER,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
