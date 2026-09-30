import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { prettyPhone, smsHref, waHref } from '../utils/phone.js'

const STEP_META = {
  volunteer: { icon: '🙋', title: 'Notifying Nearby Volunteers' },
  contact: { icon: '💬', title: 'Alerting Emergency Contacts' },
  location: { icon: '📍', title: 'Live Location Shared', sub: 'Updating every 30s to all parties' },
}

function checkIcon(state) {
  return state === 'done' ? '✅' : state === 'active' ? '🔄' : '⏳'
}

export default function SOSOverlay() {
  const { emergency, dismissSOS, markContactSent } = useApp()
  const navigate = useNavigate()

  const steps = emergency?.steps
  const allDone = !!steps && steps.volunteer === 'done' && steps.contact === 'done' && steps.location === 'done'

  // Once all three SOS steps are checked off, move straight to live volunteer tracking.
  useEffect(() => {
    if (!allDone) return
    const t = setTimeout(() => navigate('/tracking'), 900)
    return () => clearTimeout(t)
  }, [allDone, navigate])

  if (!emergency) return null
  const { volunteerText, contactText, manualSend, loc } = emergency

  return (
    <div className="sos-overlay open">
      <div className="sos-alert-card">
        <div className="sac-header">
          <div className="sac-icon-wrap">🚨</div>
          <div>
            <p className="sac-title">SOS Activated</p>
            <p className="sac-sub">Emergency response in progress</p>
          </div>
        </div>

        <div className="sac-steps">
          {['volunteer', 'contact', 'location'].map((id) => (
            <div className={'sac-step ' + (steps[id] || '')} key={id}>
              <span className="step-icon">{STEP_META[id].icon}</span>
              <div className="step-text">
                <strong>{STEP_META[id].title}</strong>
                <span>{id === 'volunteer' ? volunteerText : id === 'contact' ? contactText : STEP_META[id].sub}</span>
              </div>
              <span className="step-check">{checkIcon(steps[id])}</span>
            </div>
          ))}
        </div>

        {manualSend?.show && (
          <div className="sac-send">
            {manualSend.reason === 'none' ? (
              <div className="sac-send-head">
                <strong>No one to alert</strong>
                Add emergency contacts so the next SOS reaches someone. Call 112 now.
              </div>
            ) : (
              <>
                <div className="sac-send-head">
                  <strong>Send the alert yourself</strong>
                  Tap to message each contact directly — it's the fastest way to reach them.
                </div>
                {manualSend.list.map((c, i) => (
                  <div className={'send-row' + (manualSend.sent[i] ? ' sent' : '')} key={i}>
                    <div className="send-name">{c.name}<span>{prettyPhone(c.phone)}</span></div>
                    <a className="send-btn send-sms" href={smsHref(c.phone, manualSend.message)} onClick={() => markContactSent(i)}>SMS</a>
                    <a className="send-btn send-wa" href={waHref(c.phone, manualSend.message)} target="_blank" rel="noopener noreferrer" onClick={() => markContactSent(i)}>WhatsApp</a>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {steps.location && (
          <div className="sac-location">
            <div className="sac-location-dot" />
            <span>{loc ? `Live: ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : 'Location unavailable — turn on GPS'}</span>
          </div>
        )}

        <div className="sac-call-banner">
          <div className="sac-call-label">
            <strong>📞 Call Emergency Services</strong>
            <span>Tap to dial 112 immediately</span>
          </div>
          <button className="sac-call-btn" onClick={() => (window.location.href = 'tel:112')}>Call 112</button>
        </div>

        <div className="sac-actions">
          <button className="sac-btn sac-btn-dismiss" onClick={dismissSOS}>Dismiss</button>
          <button className="sac-btn sac-btn-tracking" onClick={() => navigate('/tracking')}>📍 Track Volunteer</button>
        </div>
        {allDone && <p className="sac-redirect">All steps complete — opening live tracking…</p>}
      </div>
    </div>
  )
}
