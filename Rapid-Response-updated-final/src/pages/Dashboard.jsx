import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import TopNav from '../components/TopNav.jsx'
import BottomNav from '../components/BottomNav.jsx'
import ReadyBar from '../components/ReadyBar.jsx'
import SOSButton from '../components/SOSButton.jsx'
import ActionGrid from '../components/ActionGrid.jsx'
import VolunteerQuickAction from '../components/VolunteerQuickAction.jsx'
import ContactsSheet from '../components/ContactsSheet.jsx'
import ContactFormSheet from '../components/ContactFormSheet.jsx'
import HistorySheet from '../components/HistorySheet.jsx'
import EmergencyProfileModal from '../components/EmergencyProfileModal.jsx'
import SOSOverlay from '../components/SOSOverlay.jsx'

export default function Dashboard() {
  const { userName, volunteer } = useApp()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState(null) // 'contacts' | 'history' | 'contactform' | null
  const [editingIndex, setEditingIndex] = useState(-1)
  const [showProfile, setShowProfile] = useState(false)
  const [tab, setTab] = useState('home')

  return (
    <>
      <TopNav />

      <div className="main-box">
        <VolunteerQuickAction
          active={!!volunteer}
          onClick={() => navigate(volunteer ? '/volunteer/dashboard' : '/volunteer/login')}
        />

        <div className="greeting">
          <p className="greeting-name">👋 Hi, {userName}</p>
          <p className="greeting-msg">🟢 Safe? We're here if you need help.</p>
        </div>

        <ReadyBar onClick={() => setSheet('contacts')} />

        <SOSButton />

        <div className="divider">Quick Actions</div>

        <ActionGrid
          onContacts={() => setSheet('contacts')}
          onHistory={() => setSheet('history')}
          onHospitals={() => navigate('/hospitals')}
        />
      </div>

      <BottomNav
        active={tab}
        onHome={() => setTab('home')}
        onAlerts={() => { setTab('alerts'); setSheet('history') }}
        onProfile={() => { setTab('profile'); setShowProfile(true) }}
      />

      <SOSOverlay />

      {sheet === 'contacts' && (
        <ContactsSheet
          onClose={() => setSheet(null)}
          onAdd={() => { setEditingIndex(-1); setSheet('contactform') }}
          onEdit={(i) => { setEditingIndex(i); setSheet('contactform') }}
        />
      )}
      {sheet === 'contactform' && (
        <ContactFormSheet editingIndex={editingIndex} onClose={() => setSheet('contacts')} />
      )}
      {sheet === 'history' && <HistorySheet onClose={() => setSheet(null)} />}

      {showProfile && <EmergencyProfileModal onClose={() => setShowProfile(false)} />}
    </>
  )
}
