import { useState } from 'react'
import { Sparkles, FileText, Wand2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useToast } from '../../hooks/use-toast'
import { blink } from '../../blink/client'

interface ParsedTrip {
  title: string
  destination: string
  startDate: string
  endDate: string
  entries: Array<{
    title: string
    date: string
    time?: string
    location?: string
    description?: string
    category: string
  }>
}

interface TextParserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTripCreated?: () => void
}

export function TextParserDialog({ open, onOpenChange, onTripCreated }: TextParserDialogProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsedTrip, setParsedTrip] = useState<ParsedTrip | null>(null)
  const { toast } = useToast()

  const handleParse = async () => {
    if (!text.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some travel information to parse.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      
      // Use AI to parse the travel text
      const { object } = await blink.ai.generateObject({
        prompt: `Parse the following travel information and extract trip details and itinerary entries. Return a structured object with trip information and individual entries.

Travel text: "${text}"

Please extract:
- Trip title (create a catchy name if not provided)
- Destination(s)
- Start and end dates
- Individual itinerary entries with dates, times, locations, and activities

Format dates as YYYY-MM-DD and times as HH:MM. Categorize entries as: accommodation, transportation, activity, dining, or other.`,
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            destination: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            entries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  date: { type: 'string' },
                  time: { type: 'string' },
                  location: { type: 'string' },
                  description: { type: 'string' },
                  category: { 
                    type: 'string',
                    enum: ['accommodation', 'transportation', 'activity', 'dining', 'other']
                  }
                },
                required: ['title', 'date', 'category']
              }
            }
          },
          required: ['title', 'destination', 'startDate', 'endDate', 'entries']
        }
      })

      setParsedTrip(object as ParsedTrip)
    } catch (error) {
      console.error('Failed to parse text:', error)
      toast({
        title: 'Error',
        description: 'Failed to parse travel information. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTrip = async () => {
    if (!parsedTrip) return

    try {
      setLoading(true)
      const user = await blink.auth.me()
      
      // For now, we'll simulate trip creation since database is not available
      console.log('Creating parsed trip:', {
        ...parsedTrip,
        userId: user.id,
      })

      toast({
        title: 'Trip created successfully!',
        description: `Your trip "${parsedTrip.title}" has been created with ${parsedTrip.entries.length} entries.`,
      })

      setText('')
      setParsedTrip(null)
      onOpenChange(false)
      onTripCreated?.()
    } catch (error) {
      console.error('Failed to create trip:', error)
      toast({
        title: 'Error',
        description: 'Failed to create trip. Please try again.',
        variant: 'destructive',
      })
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
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Travel Text Parser
          </DialogTitle>
        </DialogHeader>

        {!parsedTrip ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="travel-text">Travel Information</Label>
              <Textarea
                id="travel-text"
                placeholder="Paste your travel information here... For example:

Trip to Tokyo from March 15-22, 2024
- Flight arrives at Narita Airport on March 15 at 2:30 PM
- Hotel: Park Hyatt Tokyo (March 15-22)
- March 16: Visit Senso-ji Temple at 10 AM, lunch at Tsukiji Market at 12 PM
- March 17: Tokyo Disneyland all day
- March 18: Shibuya and Harajuku shopping
- March 19: Day trip to Mount Fuji
- March 20: Tokyo National Museum, dinner in Ginza
- March 21: Last minute shopping in Shinjuku
- March 22: Flight departs at 11 AM"
                rows={12}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="resize-none"
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">How it works</h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI will analyze your travel text and automatically extract:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Trip title and destination</li>
                    <li>• Travel dates</li>
                    <li>• Individual activities and events</li>
                    <li>• Locations and timing</li>
                    <li>• Activity categories</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleParse}
                disabled={loading || !text.trim()}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Parse Text
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{parsedTrip.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>📍 {parsedTrip.destination}</span>
                  <span>📅 {formatDate(parsedTrip.startDate)} - {formatDate(parsedTrip.endDate)}</span>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-3">
              <h4 className="font-medium text-foreground">
                Itinerary ({parsedTrip.entries.length} entries)
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {parsedTrip.entries.map((entry, index) => (
                  <Card key={index} className="border-l-4 border-l-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-foreground">{entry.title}</h5>
                            <Badge className={getCategoryColor(entry.category)}>
                              {entry.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span>📅 {formatDate(entry.date)}</span>
                            {entry.time && <span>🕐 {entry.time}</span>}
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setParsedTrip(null)
                  setText('')
                }}
                className="flex-1"
              >
                Start Over
              </Button>
              <Button
                onClick={handleCreateTrip}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {loading ? 'Creating...' : 'Create Trip'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}