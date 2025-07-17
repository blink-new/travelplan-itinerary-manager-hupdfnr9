import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Plane, 
  LayoutDashboard, 
  Calendar, 
  Package, 
  User, 
  Plus,
  LogOut,
  MapPin
} from 'lucide-react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { blink } from '../../blink/client'
import { CreateTripDialog } from '../trips/CreateTripDialog'

interface User {
  id: string
  email: string
  displayName?: string
}

interface SidebarProps {
  user: User
}

export function Sidebar({ user }: SidebarProps) {
  const location = useLocation()
  const [showCreateTrip, setShowCreateTrip] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const handleLogout = () => {
    blink.auth.logout()
  }

  const getInitials = (email: string, displayName?: string) => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email.charAt(0).toUpperCase()
  }

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Plane className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">TravelPlan</h1>
              <p className="text-sm text-muted-foreground">Smart Itinerary Manager</p>
            </div>
          </div>

          {/* Create Trip Button */}
          <div className="p-4">
            <Button 
              onClick={() => setShowCreateTrip(true)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Trip
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(user.email, user.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.displayName || user.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <CreateTripDialog 
        open={showCreateTrip} 
        onOpenChange={setShowCreateTrip}
      />
    </>
  )
}