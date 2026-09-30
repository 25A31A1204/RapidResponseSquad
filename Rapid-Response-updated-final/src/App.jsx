import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import VolunteerTracking from './pages/VolunteerTracking.jsx'
import HospitalFinder from './pages/HospitalFinder.jsx'
import VolunteerLogin from './pages/VolunteerLogin.jsx'
import VolunteerDashboard from './pages/VolunteerDashboard.jsx'
import VolunteerRespond from './pages/VolunteerRespond.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/tracking" element={<VolunteerTracking />} />
      <Route path="/hospitals" element={<HospitalFinder />} />
      <Route path="/volunteer/login" element={<VolunteerLogin />} />
      <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
      <Route path="/volunteer/respond/:id" element={<VolunteerRespond />} />
    </Routes>
  )
}
