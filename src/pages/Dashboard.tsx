import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Plus, 
  MoreVertical,
  Package,
  Sparkles
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { CreateTripDialog } from '../components/trips/CreateTripDialog'
import { TextParserDialog } from '../components/trips/TextParserDialog'
import { blink } from '../blink/client'
import { DatabaseService, type Trip } from '../lib/database'

export function Dashboard() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateTrip, setShowCreateTrip] = useState(false)
  const [showTextParser, setShowTextParser] = useState(false)

  useEffect(() => {
    loadTrips()
  }, [])

  const loadTrips = async () => {
    try {
      setLoading(true)
      const user = await blink.auth.me()
      
      // Use DatabaseService which handles fallback automatically
      const userTrips = await DatabaseService.getTrips(user.id)
      setTrips(userTrips)
    } catch (error) {
      console.error('Failed to load trips:', error)
      setTrips([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric' 
    }
    
    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`
    }
    
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${end.getFullYear()}`
  }

  const getDaysUntilTrip = (startDate: string) => {
    const start = new Date(startDate)
    const today = new Date()
    const diffTime = start.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getTripStatus = (startDate: string, endDate: string) => {
    const today = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (today < start) return 'upcoming'
    if (today >= start && today <= end) return 'active'
    return 'completed'
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Trips</h1>
          <p className="text-muted-foreground mt-1">
            Plan, organize, and manage your travel adventures
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowTextParser(true)}
            className="border-primary/20 text-primary hover:bg-primary/5"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Smart Parser
          </Button>
          <Button 
            onClick={() => setShowCreateTrip(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Trip
          </Button>
        </div>
      </div>

      {/* Trips Grid */}
      {trips.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No trips yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start planning your next adventure by creating your first trip or using our smart text parser
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setShowTextParser(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Try Smart Parser
            </Button>
            <Button onClick={() => setShowCreateTrip(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Trip
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const status = getTripStatus(trip.startDate, trip.endDate)
            const daysUntil = getDaysUntilTrip(trip.startDate)
            
            return (
              <Card key={trip.id} className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {trip.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={status === 'active' ? 'default' : status === 'upcoming' ? 'secondary' : 'outline'}
                          className={
                            status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                            status === 'upcoming' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                          }
                        >
                          {status === 'active' ? 'Active' : status === 'upcoming' ? 'Upcoming' : 'Completed'}
                        </Badge>
                        {status === 'upcoming' && daysUntil > 0 && (
                          <span className="text-xs text-muted-foreground">
                            in {daysUntil} days
                          </span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/trip/${trip.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/packing/${trip.id}`}>Packing List</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete Trip
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{trip.destination}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                  </div>

                  {trip.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {trip.description}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link to={`/trip/${trip.id}`}>
                        <Clock className="h-4 w-4 mr-2" />
                        View Itinerary
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/packing/${trip.id}`}>
                        <Package className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialogs */}
      <CreateTripDialog 
        open={showCreateTrip} 
        onOpenChange={setShowCreateTrip}
        onTripCreated={loadTrips}
      />
      <TextParserDialog 
        open={showTextParser} 
        onOpenChange={setShowTextParser}
        onTripCreated={loadTrips}
      />
    </div>
  )
}