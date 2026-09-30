import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { isValidPhone, normalizePhone } from '../utils/phone.js'

const VEHICLES = ['On foot', 'Bike', 'Car', 'Ambulance']

export default function VolunteerLogin() {
  const { volunteerLogin } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [vehicle, setVehicle] = useState('Bike')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return setError('Enter your name')
    const normalized = normalizePhone(phone)
    if (!isValidPhone(normalized)) return setError('Enter a valid phone number')
    setError('')
    volunteerLogin({ name: name.trim(), phone: normalized, vehicle })
    navigate('/volunteer/dashboard')
  }

  return (
    <div className="vl-wrap">
      <div className="card vl-card">
        <div className="vl-icon">🦺</div>
        <h1 className="vl-title">Volunteer Login</h1>
        <p className="vl-sub">Sign in to see nearby emergency requests and respond to people who need help.</p>

        <form onSubmit={handleSubmit} className="vl-form">
          <label className="field">
            <span>Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Kumar" />
          </label>
          <label className="field">
            <span>Phone number</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" />
          </label>
          <label className="field">
            <span>How will you respond?</span>
            <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              {VEHICLES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>

          {error && <p className="vl-error">{error}</p>}

          <button className="btn btn-primary" type="submit">Log in as Volunteer</button>
        </form>

        <Link to="/" className="vl-back">← Back to main app</Link>
      </div>
    </div>
  )
}
