import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider, RequireAuth } from './lib/auth.tsx'
import { AppLayout } from './app/AppLayout.tsx'
import { Login } from './app/pages/Login.tsx'
import { Dashboard } from './app/pages/Dashboard.tsx'
import { Vehicles } from './app/pages/Vehicles.tsx'
import { Drivers } from './app/pages/Drivers.tsx'
import { Trips } from './app/pages/Trips.tsx'
import { Maintenance } from './app/pages/Maintenance.tsx'
import { FuelExpenses } from './app/pages/FuelExpenses.tsx'
import { Analytics } from './app/pages/Analytics.tsx'
import { Settings } from './app/pages/Settings.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fleet" element={<Vehicles />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/fuel-expenses" element={<FuelExpenses />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
