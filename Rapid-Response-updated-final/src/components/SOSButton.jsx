import { useRef, useState, useCallback } from 'react'
import { useApp } from '../context/AppContext.jsx'

const HOLD_DURATION = 2000
const CIRCUMFERENCE = 477

export default function SOSButton({ onFired }) {
  const { fireSOS, emergency } = useApp()
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [hint, setHint] = useState('Hold for 2 seconds to activate')
  const timerRef = useRef(null)
  const startRef = useRef(null)
  const firedRef = useRef(false)

  const clear = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const startHold = useCallback((e) => {
    e.preventDefault()
    if (timerRef.current || emergency) return
    firedRef.current = false
    startRef.current = Date.now()
    setHolding(true)
    setHint('Keep holding…')
    timerRef.current = setInterval(() => {
      const p = Math.min((Date.now() - startRef.current) / HOLD_DURATION, 1)
      setProgress(p)
      if (p >= 1 && !firedRef.current) {
        firedRef.current = true
        clear()
        setHolding(false)
        setHint('🚨 SOS Activated')
        fireSOS()
        onFired?.()
      }
    }, 30)
  }, [clear, emergency, fireSOS, onFired])

  const endHold = useCallback(() => {
    clear()
    setHolding(false)
    setProgress(0)
    if (!firedRef.current) setHint('Hold for 2 seconds to activate')
  }, [clear])

  const dashoffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="sos-wrap">
      <div className="sos-ring-outer">
        <div className="sos-pulse-ring" />
        <div className="sos-pulse-ring" />
        <div className="sos-pulse-ring" />
        <button
          id="sosBigBtn"
          className={(holding ? 'holding ' : '') + (emergency ? 'fired' : '')}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerCancel={endHold}
          onPointerLeave={endHold}
          onContextMenu={(e) => e.preventDefault()}
        >
          <svg className="sos-progress-svg" viewBox="0 0 160 160">
            <circle
              className="sos-progress-circle"
              cx="80" cy="80" r="76"
              style={{ strokeDashoffset: dashoffset }}
            />
          </svg>
          <span className="sos-label">SOS</span>
          <span className="sos-sub">Press &amp; Hold</span>
        </button>
      </div>
      <p className="sos-hint">{hint}</p>
    </div>
  )
}
