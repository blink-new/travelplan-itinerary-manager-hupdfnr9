import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

interface TripEntry {
  id: string
  tripId: string
  tripTitle: string
  title: string
  description?: string
  location?: string
  date: string
  startTime?: string
  endTime?: string
  category: string
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries, setEntries] = useState<TripEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    loadCalendarEntries()
  }, [])

  const loadCalendarEntries = async () => {
    try {
      setLoading(true)
      
      // Mock data since database is not available
      const mockEntries: TripEntry[] = [
        {
          id: '1',
          tripId: '1',
          tripTitle: 'Tokyo Adventure',
          title: 'Arrival at Narita Airport',
          description: 'Flight JAL123 arrives from New York',
          location: 'Narita International Airport',
          date: '2024-03-15',
          startTime: '14:30',
          category: 'transportation'
        },
        {
          id: '2',
          tripId: '1',
          tripTitle: 'Tokyo Adventure',
          title: 'Check-in at Park Hyatt Tokyo',
          description: 'Luxury hotel in Shinjuku with amazing city views',
          location: 'Park Hyatt Tokyo',
          date: '2024-03-15',
          startTime: '16:00',
          category: 'accommodation'
        },
        {
          id: '3',
          tripId: '1',
          tripTitle: 'Tokyo Adventure',
          title: 'Visit Senso-ji Temple',
          description: 'Ancient Buddhist temple in Asakusa district',
          location: 'Senso-ji Temple',
          date: '2024-03-16',
          startTime: '10:00',
          category: 'activity'
        },
        {
          id: '4',
          tripId: '2',
          tripTitle: 'European Summer',
          title: 'Flight to Paris',
          description: 'Departure from JFK Airport',
          location: 'JFK Airport',
          date: '2024-06-10',
          startTime: '20:00',
          category: 'transportation'
        },
        {
          id: '5',
          tripId: '2',
          tripTitle: 'European Summer',
          title: 'Louvre Museum',
          description: 'Visit the world-famous art museum',
          location: 'Louvre Museum, Paris',
          date: '2024-06-11',
          startTime: '10:00',
          category: 'activity'
        }
      ]
      
      setEntries(mockEntries)
    } catch (error) {
      console.error('Failed to load calendar entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'accommodation': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'transportation': return 'bg-green-100 text-green-800 border-green-200'
      case 'activity': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'dining': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getEntriesForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    return entries.filter(entry => entry.date === dateString)
  }

  const getEntriesForMonth = (date: Date) => {
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.date)
      return entryDate >= start && entryDate <= end
    })
  }

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  const selectedDateEntries = selectedDate ? getEntriesForDate(selectedDate) : []

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View your travel schedule across all trips
          </p>
        </div>
      </div>

      <Tabs defaultValue="month" className="space-y-6">
        <TabsList>
          <TabsTrigger value="month">Month View</TabsTrigger>
          <TabsTrigger value="agenda">Agenda View</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">
                      {format(currentDate, 'MMMM yyyy')}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((day) => {
                      const dayEntries = getEntriesForDate(day)
                      const isSelected = selectedDate && isSameDay(day, selectedDate)
                      const isCurrentMonth = isSameMonth(day, currentDate)
                      const isToday = isSameDay(day, new Date())
                      
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`
                            p-2 min-h-[80px] text-left border rounded-lg transition-colors
                            ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}
                            ${!isCurrentMonth ? 'text-muted-foreground' : ''}
                            ${isToday && !isSelected ? 'bg-accent' : ''}
                          `}
                        >
                          <div className={`text-sm font-medium mb-1 ${isToday && !isSelected ? 'text-primary' : ''}`}>
                            {format(day, 'd')}
                          </div>
                          <div className="space-y-1">
                            {dayEntries.slice(0, 2).map((entry) => (
                              <div
                                key={entry.id}
                                className={`text-xs p-1 rounded truncate ${
                                  isSelected ? 'bg-primary-foreground/20' : 'bg-primary/10'
                                }`}
                              >
                                {entry.startTime && formatTime(entry.startTime)} {entry.title}
                              </div>
                            ))}
                            {dayEntries.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{dayEntries.length - 2} more
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected Date Details */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    selectedDateEntries.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDateEntries
                          .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                          .map((entry) => (
                            <div key={entry.id} className="border-l-4 border-l-primary/20 pl-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getCategoryColor(entry.category)} size="sm">
                                  {entry.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {entry.tripTitle}
                                </span>
                              </div>
                              <h4 className="font-medium text-sm">{entry.title}</h4>
                              {entry.startTime && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(entry.startTime)}
                                </div>
                              )}
                              {entry.location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {entry.location}
                                </div>
                              )}
                              {entry.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {entry.description}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No events scheduled for this date.</p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">Click on a date to view events.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No events scheduled</h3>
              <p className="text-muted-foreground">Create some trips to see your travel schedule here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(
                entries
                  .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''))
                  .reduce((groups, entry) => {
                    const date = entry.date
                    if (!groups[date]) {
                      groups[date] = []
                    }
                    groups[date].push(entry)
                    return groups
                  }, {} as Record<string, TripEntry[]>)
              ).map(([date, dayEntries]) => (
                <div key={date}>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <div className="space-y-3">
                    {dayEntries.map((entry) => (
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
                                <span className="font-medium text-primary">{entry.tripTitle}</span>
                                {entry.startTime && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(entry.startTime)}
                                  </div>
                                )}
                              </div>
                              
                              {entry.location && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                                  <MapPin className="h-4 w-4" />
                                  {entry.location}
                                </div>
                              )}
                              
                              {entry.description && (
                                <p className="text-sm text-muted-foreground">
                                  {entry.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}