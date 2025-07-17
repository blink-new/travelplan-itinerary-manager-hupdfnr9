import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { blink } from './blink/client'
import { Toaster } from './components/ui/toaster'
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { TripDetails } from './pages/TripDetails'
import { CalendarView } from './pages/CalendarView'
import { PackingList } from './pages/PackingList'
import { Profile } from './pages/Profile'
import { LoadingScreen } from './components/ui/LoadingScreen'

interface User {
  id: string
  email: string
  displayName?: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">TravelPlan</h1>
          <p className="text-muted-foreground">Please sign in to continue</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar user={user} />
          <main className="flex-1 ml-64">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/trip/:id" element={<TripDetails />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/packing/:tripId" element={<PackingList />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
        <Toaster />
      </div>
    </Router>
  )
}

export default App