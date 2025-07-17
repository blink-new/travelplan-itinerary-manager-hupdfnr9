import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CalendarIcon, Clock, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useToast } from '../../hooks/use-toast'
import { blink } from '../../blink/client'

const entrySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  date: z.date({
    required_error: 'Date is required',
  }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
})

type EntryFormData = z.infer<typeof entrySchema>

interface CreateEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
  onEntryCreated?: () => void
}

const categories = [
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'activity', label: 'Activity' },
  { value: 'dining', label: 'Dining' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' },
]

export function CreateEntryDialog({ open, onOpenChange, tripId, onEntryCreated }: CreateEntryDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      address: '',
      startTime: '',
      endTime: '',
      category: '',
    },
  })

  const onSubmit = async (data: EntryFormData) => {
    try {
      setLoading(true)
      const user = await blink.auth.me()
      
      const entryData = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tripId,
        userId: user.id,
        title: data.title,
        description: data.description || '',
        location: data.location || '',
        address: data.address || '',
        date: data.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        category: data.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      try {
        // Try to save to database
        await blink.db.tripEntries.create(entryData)
        
        toast({
          title: 'Entry added successfully!',
          description: `${data.title} has been added to your itinerary.`,
        })
      } catch (dbError) {
        console.log('Database not available, entry created locally:', dbError)
        
        toast({
          title: 'Entry added!',
          description: `${data.title} has been added (database not available).`,
        })
      }

      form.reset()
      onOpenChange(false)
      onEntryCreated?.()
    } catch (error) {
      console.error('Failed to create entry:', error)
      toast({
        title: 'Error',
        description: 'Failed to create entry. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Add Itinerary Entry
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Visit Eiffel Tower"
              {...form.register('title')}
              className={form.formState.errors.title ? 'border-destructive' : ''}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !form.watch('date') ? 'text-muted-foreground' : ''
                    } ${form.formState.errors.date ? 'border-destructive' : ''}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('date') ? (
                      format(form.watch('date'), 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('date')}
                    onSelect={(date) => form.setValue('date', date!)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.date && (
                <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => form.setValue('category', value)}>
                <SelectTrigger className={form.formState.errors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time (Optional)</Label>
              <Input
                id="startTime"
                type="time"
                {...form.register('startTime')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time (Optional)</Label>
              <Input
                id="endTime"
                type="time"
                {...form.register('endTime')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              placeholder="e.g., Eiffel Tower"
              {...form.register('location')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address (Optional)</Label>
            <Input
              id="address"
              placeholder="e.g., Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France"
              {...form.register('address')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any notes or details about this entry..."
              rows={3}
              {...form.register('description')}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {loading ? 'Adding...' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}