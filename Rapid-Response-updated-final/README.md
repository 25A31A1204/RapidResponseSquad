# Rapid Response (React)

An interactive emergency-SOS app rebuilt from the original static HTML mockups
into a proper React + Vite project. Everything runs client-side (localStorage
for persistence, a self-contained simulated map) so it works instantly with
no backend, API keys, or Firebase project required.

## What's inside

- **Press-and-hold SOS button** with a live circular progress ring
- **Emergency contacts** — add/edit/delete, phone validation, one-tap SMS/WhatsApp
  alert links generated per contact
- **Live SOS overlay** — step-by-step activation (volunteer search → contact
  alert → live location), with a manual-send fallback panel
- **Emergency history** log, stored on-device
- **Editable emergency profile** (blood group, allergies, conditions, insurance)
- **Volunteer tracking page** with a self-contained animated "radar" map
  (no external map tiles or API key needed) — pick a volunteer, watch them
  move along a simulated route with live distance/ETA, and get an arrival toast

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  context/AppContext.jsx      # global state: contacts, history, profile, SOS flow
  utils/phone.js               # phone validation / formatting / sms & whatsapp links
  components/                  # TopNav, BottomNav, SOSButton, sheets, SimMap, etc.
  pages/Dashboard.jsx           # home screen
  pages/VolunteerTracking.jsx   # live tracking screen
  index.css                     # design tokens + all component styles
```

## Notes

- All data (contacts, history, profile, name) is stored in the browser's
  `localStorage` — nothing leaves the device.
- The volunteer map is a simulation: volunteer starting positions, ETA, and
  movement are generated client-side for a realistic-feeling demo without
  needing a maps API key or a live backend. Swap `SimMap.jsx` for a real
  map library (e.g. `react-leaflet` or Google Maps) if you want real
  geospatial tiles later.
- `tel:` and `sms:`/`wa.me` links use the device's native dialer/messaging
  apps, so calling and texting work for real on phones.
