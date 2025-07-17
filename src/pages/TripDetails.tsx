import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  ExternalLink,
  Navigation,
  MoreVertical
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { blink } from '../blink/client'
import { DatabaseService, type Trip, type TripEntry } from '../lib/database'
import { CreateEntryDialog } from '../components/trips/CreateEntryDialog'

export function TripDetails() {
  const { id } = useParams<{ id: string }>()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [entries, setEntries] = useState<TripEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateEntry, setShowCreateEntry] = useState(false)

  useEffect(() => {
    loadTripDetails()
  }, [id, loadTripDetails])

  const loadTripDetails = useCallback(async () => {
    try {
      setLoading(true)
      const user = await blink.auth.me()
      
      // Get all trips and find the one we need
      const allTrips = await DatabaseService.getTrips(user.id)
      const foundTrip = allTrips.find(t => t.id === id)
      
      if (foundTrip) {
        setTrip(foundTrip)
        
        // Load trip entries
        const tripEntries = await DatabaseService.getTripEntries(id!, user.id)
        setEntries(tripEntries)
      } else {
        // Trip not found, set to null
        setTrip(null)
        setEntries([])
      }
    } catch (error) {
      console.error('Failed to load trip details:', error)
      setTrip(null)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [id])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'accommodation': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'transportation': return 'bg-green-100 text-green-800 border-green-200'
      case 'activity': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'dining': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getGoogleMapsUrl = (address?: string, location?: string) => {
    const query = encodeURIComponent(address || location || '')
    return `https://www.google.com/maps/search/?api=1&query=${query}`
  }

  const getDirectionsUrl = (fromAddress: string, toAddress: string) => {
    const origin = encodeURIComponent(fromAddress)
    const destination = encodeURIComponent(toAddress)
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
  }

  const groupEntriesByDate = (entries: TripEntry[]) => {
    return entries.reduce((groups, entry) => {
      const date = entry.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(entry)
      return groups
    }, {} as Record<string, TripEntry[]>)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Trip not found</h2>
        <p className="text-muted-foreground mb-4">The trip you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  const groupedEntries = groupEntriesByDate(entries)
  const sortedDates = Object.keys(groupedEntries).sort()

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trips
          </Link>
        </Button>
      </div>

      {/* Trip Info */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                {trip.title}
              </CardTitle>
              <div className="flex items-center gap-4 text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{trip.destination}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </span>
                </div>
              </div>
              {trip.description && (
                <p className="text-muted-foreground">{trip.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to={`/packing/${trip.id}`}>
                  Packing List
                </Link>
              </Button>
              <Button onClick={() => setShowCreateEntry(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Itinerary */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <h3 className="text-lg font-semibold text-foreground">
                  {formatDate(date)}
                </h3>
              </div>
              
              <div className="ml-6 space-y-3 border-l-2 border-border pl-6">
                {groupedEntries[date]
                  .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                  .map((entry, index) => (
                    <Card key={entry.id} className="relative">
                      <div className="absolute -left-8 top-6 w-3 h-3 bg-background border-2 border-primary rounded-full"></div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-foreground">{entry.title}</h4>
                              <Badge className={getCategoryColor(entry.category)}>
                                {entry.category}
                              </Badge>
                            </div>
                            
                            {(entry.startTime || entry.endTime) && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {entry.startTime && formatTime(entry.startTime)}
                                  {entry.endTime && ` - ${formatTime(entry.endTime)}`}
                                </span>
                              </div>
                            )}
                            
                            {entry.location && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <MapPin className="h-4 w-4" />
                                <span>{entry.location}</span>
                              </div>
                            )}
                            
                            {entry.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {entry.description}
                              </p>
                            )}
                            
                            <div className="flex gap-2">
                              {entry.address && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a
                                    href={getGoogleMapsUrl(entry.address, entry.location)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <MapPin className="h-3 w-3 mr-1" />
                                    View on Maps
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </Button>
                              )}
                              
                              {index > 0 && groupedEntries[date][index - 1].address && entry.address && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a
                                    href={getDirectionsUrl(
                                      groupedEntries[date][index - 1].address!,
                                      entry.address
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Navigation className="h-3 w-3 mr-1" />
                                    Directions
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit Entry</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Delete Entry
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {entries
            .sort((a, b) => {
              const dateCompare = a.date.localeCompare(b.date)
              if (dateCompare !== 0) return dateCompare
              return (a.startTime || '').localeCompare(b.startTime || '')
            })
            .map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-foreground">{entry.title}</h4>
                        <Badge className={getCategoryColor(entry.category)}>
                          {entry.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>📅 {formatDate(entry.date)}</span>
                        {entry.startTime && (
                          <span>🕐 {formatTime(entry.startTime)}</span>
                        )}
                      </div>
                      
                      {entry.location && (
                        <p className="text-sm text-muted-foreground mb-1">
                          📍 {entry.location}
                        </p>
                      )}
                      
                      {entry.description && (
                        <p className="text-sm text-muted-foreground">
                          {entry.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {entry.address && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={getGoogleMapsUrl(entry.address, entry.location)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            Maps
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Entry</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete Entry
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>

      {/* Create Entry Dialog */}
      {trip && (
        <CreateEntryDialog 
          open={showCreateEntry} 
          onOpenChange={setShowCreateEntry}
          tripId={trip.id}
          onEntryCreated={loadTripDetails}
        />
      )}
    </div>
  )
}