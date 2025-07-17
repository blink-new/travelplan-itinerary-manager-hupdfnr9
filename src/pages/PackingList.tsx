import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Check, 
  X, 
  Sparkles,
  Shirt,
  Plane,
  Camera,
  Pill
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Checkbox } from '../components/ui/checkbox'
import { Input } from '../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { useToast } from '../hooks/use-toast'
import { blink } from '../blink/client'
import { DatabaseService } from '../lib/database'

interface PackingItem {
  id: string
  itemName: string
  category: string
  isPacked: boolean
  quantity: number
  notes?: string
}

interface Trip {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
}

export function PackingList() {
  const { tripId } = useParams<{ tripId: string }>()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<PackingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItemName, setNewItemName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const { toast } = useToast()

  const categories = [
    { id: 'clothing', name: 'Clothing', icon: Shirt, color: 'bg-blue-100 text-blue-800' },
    { id: 'electronics', name: 'Electronics', icon: Camera, color: 'bg-purple-100 text-purple-800' },
    { id: 'toiletries', name: 'Toiletries', icon: Pill, color: 'bg-green-100 text-green-800' },
    { id: 'travel', name: 'Travel', icon: Plane, color: 'bg-orange-100 text-orange-800' },
    { id: 'general', name: 'General', icon: Package, color: 'bg-gray-100 text-gray-600' }
  ]

  useEffect(() => {
    loadPackingList()
  }, [tripId, loadPackingList])

  const loadPackingList = useCallback(async () => {
    try {
      setLoading(true)
      const user = await blink.auth.me()
      
      // Get all trips and find the one we need
      const allTrips = await DatabaseService.getTrips(user.id)
      const foundTrip = allTrips.find(t => t.id === tripId)
      
      if (foundTrip) {
        setTrip(foundTrip)
        
        // Load packing items
        const packingItems = await DatabaseService.getPackingItems(tripId!, user.id)
        
        // Convert database format to component format
        const formattedItems: PackingItem[] = packingItems.map(item => ({
          id: item.id,
          itemName: item.itemName,
          category: item.category || 'general',
          isPacked: Number(item.isPacked) > 0, // Convert SQLite boolean
          quantity: 1, // Default quantity
          notes: item.notes
        }))
        
        setItems(formattedItems)
      } else {
        // Trip not found, set to null
        setTrip(null)
        setItems([])
      }
    } catch (error) {
      console.error('Failed to load packing list:', error)
      setTrip(null)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [tripId])

  const addItem = async () => {
    if (!newItemName.trim()) return

    const newItem: PackingItem = {
      id: Date.now().toString(),
      itemName: newItemName.trim(),
      category: selectedCategory,
      isPacked: false,
      quantity: 1
    }

    setItems(prev => [...prev, newItem])
    setNewItemName('')
    
    toast({
      title: 'Item added',
      description: `${newItem.itemName} has been added to your packing list.`,
    })
  }

  const togglePacked = async (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, isPacked: !item.isPacked }
        : item
    ))
  }

  const removeItem = async (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
    toast({
      title: 'Item removed',
      description: 'Item has been removed from your packing list.',
    })
  }

  const generateAISuggestions = async () => {
    if (!trip) return

    try {
      setAiLoading(true)
      
      const { object } = await blink.ai.generateObject({
        prompt: `Generate a comprehensive packing list for a trip to ${trip.destination} from ${trip.startDate} to ${trip.endDate}. Consider the destination's climate, culture, and typical activities. Organize items by category: clothing, electronics, toiletries, travel, and general.`,
        schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  itemName: { type: 'string' },
                  category: { 
                    type: 'string',
                    enum: ['clothing', 'electronics', 'toiletries', 'travel', 'general']
                  },
                  quantity: { type: 'number' },
                  notes: { type: 'string' },
                  priority: {
                    type: 'string',
                    enum: ['essential', 'recommended', 'optional']
                  }
                },
                required: ['itemName', 'category', 'quantity', 'priority']
              }
            }
          },
          required: ['suggestions']
        }
      })

      const suggestions = (object as any).suggestions
      const existingItemNames = new Set(items.map(item => item.itemName.toLowerCase()))
      
      const newSuggestions = suggestions
        .filter((suggestion: any) => !existingItemNames.has(suggestion.itemName.toLowerCase()))
        .map((suggestion: any) => ({
          id: `ai-${Date.now()}-${Math.random()}`,
          itemName: suggestion.itemName,
          category: suggestion.category,
          isPacked: false,
          quantity: suggestion.quantity,
          notes: suggestion.notes,
          priority: suggestion.priority,
          isAISuggestion: true
        }))

      setItems(prev => [...prev, ...newSuggestions])
      
      toast({
        title: 'AI suggestions added!',
        description: `Added ${newSuggestions.length} personalized packing suggestions.`,
      })
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate AI suggestions. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setAiLoading(false)
      setShowAISuggestions(false)
    }
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.icon || Package
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.color || 'bg-gray-100 text-gray-600'
  }

  const getItemsByCategory = (categoryId: string) => {
    return items.filter(item => item.category === categoryId)
  }

  const getPackingProgress = () => {
    if (items.length === 0) return 0
    const packedItems = items.filter(item => item.isPacked).length
    return Math.round((packedItems / items.length) * 100)
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'essential': return 'bg-red-100 text-red-800 border-red-200'
      case 'recommended': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'optional': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
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

  const progress = getPackingProgress()

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/trip/${trip.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trip
          </Link>
        </Button>
      </div>

      {/* Trip Info & Progress */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                Packing List - {trip.title}
              </CardTitle>
              <p className="text-muted-foreground">
                {trip.destination} • {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-1">{progress}%</div>
              <div className="text-sm text-muted-foreground">
                {items.filter(item => item.isPacked).length} of {items.length} packed
              </div>
              <div className="w-32 bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Add Item & AI Suggestions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Add new item..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addItem()}
                className="flex-1"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Button onClick={addItem} disabled={!newItemName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            
            <Dialog open={showAISuggestions} onOpenChange={setShowAISuggestions}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/5">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Suggestions
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Packing Suggestions
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Get personalized packing suggestions based on your destination, travel dates, and typical activities.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Trip Details:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Destination: {trip.destination}</li>
                      <li>• Duration: {Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))} days</li>
                      <li>• Season: {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'long' })}</li>
                    </ul>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowAISuggestions(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={generateAISuggestions}
                      disabled={aiLoading}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {aiLoading ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Suggestions
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Packing List */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Items ({items.length})</TabsTrigger>
          {categories.map(category => {
            const categoryItems = getItemsByCategory(category.id)
            return categoryItems.length > 0 ? (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name} ({categoryItems.length})
              </TabsTrigger>
            ) : null
          })}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No items yet</h3>
              <p className="text-muted-foreground mb-4">
                Start adding items to your packing list or use AI suggestions
              </p>
              <Button onClick={() => setShowAISuggestions(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Suggestions
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const CategoryIcon = getCategoryIcon(item.category)
                return (
                  <Card key={item.id} className={`transition-all ${item.isPacked ? 'bg-muted/50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={item.isPacked}
                          onCheckedChange={() => togglePacked(item.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          <Badge className={getCategoryColor(item.category)} variant="outline">
                            {categories.find(cat => cat.id === item.category)?.name}
                          </Badge>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${item.isPacked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {item.itemName}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-sm text-muted-foreground">
                                (x{item.quantity})
                              </span>
                            )}
                            {(item as any).priority && (
                              <Badge className={getPriorityColor((item as any).priority)} size="sm">
                                {(item as any).priority}
                              </Badge>
                            )}
                            {(item as any).isAISuggestion && (
                              <Badge variant="outline" size="sm" className="border-primary/20 text-primary">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {categories.map(category => {
          const categoryItems = getItemsByCategory(category.id)
          return categoryItems.length > 0 ? (
            <TabsContent key={category.id} value={category.id} className="space-y-3">
              {categoryItems.map((item) => {
                const CategoryIcon = category.icon
                return (
                  <Card key={item.id} className={`transition-all ${item.isPacked ? 'bg-muted/50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={item.isPacked}
                          onCheckedChange={() => togglePacked(item.id)}
                          className="mt-1"
                        />
                        
                        <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${item.isPacked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {item.itemName}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-sm text-muted-foreground">
                                (x{item.quantity})
                              </span>
                            )}
                            {(item as any).priority && (
                              <Badge className={getPriorityColor((item as any).priority)} size="sm">
                                {(item as any).priority}
                              </Badge>
                            )}
                            {(item as any).isAISuggestion && (
                              <Badge variant="outline" size="sm" className="border-primary/20 text-primary">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>
          ) : null
        })}
      </Tabs>
    </div>
  )
}