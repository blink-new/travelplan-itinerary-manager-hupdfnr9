import { blink } from '../blink/client'

export async function initializeDatabase() {
  try {
    // Try to list trips to see if database is available
    const user = await blink.auth.me()
    await blink.db.trips.list({
      where: { userId: user.id },
      limit: 1
    })
    
    console.log('Database is available and working')
    return true
  } catch (error) {
    console.log('Database not available or tables not created:', error)
    console.log('Using mock data fallback')
    return false
  }
}

// Database service wrapper with fallback to mock data
export class DatabaseService {
  private static isDatabaseAvailable: boolean | null = null

  static async checkDatabaseAvailability(): Promise<boolean> {
    if (this.isDatabaseAvailable !== null) {
      return this.isDatabaseAvailable
    }

    try {
      const user = await blink.auth.me()
      await blink.db.trips.list({
        where: { userId: user.id },
        limit: 1
      })
      this.isDatabaseAvailable = true
      return true
    } catch (error) {
      console.log('Database not available, using mock data:', error)
      this.isDatabaseAvailable = false
      return false
    }
  }

  static async getTrips(userId: string): Promise<Trip[]> {
    const isAvailable = await this.checkDatabaseAvailability()
    
    if (isAvailable) {
      try {
        return await blink.db.trips.list({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        })
      } catch (error) {
        console.error('Database query failed, falling back to mock data:', error)
      }
    }
    
    // Return mock data with the current user ID
    return mockTrips.map(trip => ({ ...trip, userId }))
  }

  static async getTripEntries(tripId: string, userId: string): Promise<TripEntry[]> {
    const isAvailable = await this.checkDatabaseAvailability()
    
    if (isAvailable) {
      try {
        return await blink.db.tripEntries.list({
          where: { tripId, userId },
          orderBy: { date: 'asc', startTime: 'asc' }
        })
      } catch (error) {
        console.error('Database query failed, falling back to mock data:', error)
      }
    }
    
    // Return mock data filtered by tripId
    return mockTripEntries.filter(entry => entry.tripId === tripId)
  }

  static async getPackingItems(tripId: string, userId: string): Promise<PackingItem[]> {
    const isAvailable = await this.checkDatabaseAvailability()
    
    if (isAvailable) {
      try {
        return await blink.db.packingItems.list({
          where: { tripId, userId },
          orderBy: { category: 'asc', itemName: 'asc' }
        })
      } catch (error) {
        console.error('Database query failed, falling back to mock data:', error)
      }
    }
    
    // Return mock data filtered by tripId
    return mockPackingItems.filter(item => item.tripId === tripId)
  }
}

// Mock data for when database is not available
export const mockTrips: Trip[] = [
  {
    id: '1',
    userId: 'mock-user',
    title: 'Tokyo Adventure',
    description: 'Exploring the vibrant culture and cuisine of Japan',
    destination: 'Tokyo, Japan',
    startDate: '2024-03-15',
    endDate: '2024-03-22',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    userId: 'mock-user',
    title: 'European Summer',
    description: 'Multi-city tour across Europe',
    destination: 'Paris, Rome, Barcelona',
    startDate: '2024-06-10',
    endDate: '2024-06-25',
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: '3',
    userId: 'mock-user',
    title: 'Bali Retreat',
    description: 'Relaxing getaway in tropical paradise',
    destination: 'Bali, Indonesia',
    startDate: '2024-08-05',
    endDate: '2024-08-12',
    createdAt: '2024-02-01T09:15:00Z',
    updatedAt: '2024-02-01T09:15:00Z'
  }
]

export const mockTripEntries: TripEntry[] = [
  {
    id: '1',
    tripId: '1',
    userId: 'mock-user',
    title: 'Arrival at Narita Airport',
    description: 'Flight arrival and transfer to hotel',
    location: 'Narita International Airport',
    address: '1-1 Furugome, Narita, Chiba 282-0004, Japan',
    date: '2024-03-15',
    startTime: '14:30',
    endTime: '16:00',
    category: 'transport',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    tripId: '1',
    userId: 'mock-user',
    title: 'Visit Senso-ji Temple',
    description: 'Explore Tokyo\'s oldest temple in Asakusa',
    location: 'Senso-ji Temple',
    address: '2-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan',
    date: '2024-03-16',
    startTime: '10:00',
    endTime: '12:00',
    category: 'sightseeing',
    createdAt: '2024-01-15T10:05:00Z',
    updatedAt: '2024-01-15T10:05:00Z'
  },
  {
    id: '3',
    tripId: '1',
    userId: 'mock-user',
    title: 'Sushi Dinner at Tsukiji',
    description: 'Fresh sushi at the famous fish market',
    location: 'Tsukiji Outer Market',
    address: '4 Chome Tsukiji, Chuo City, Tokyo 104-0045, Japan',
    date: '2024-03-16',
    startTime: '18:00',
    endTime: '20:00',
    category: 'dining',
    createdAt: '2024-01-15T10:10:00Z',
    updatedAt: '2024-01-15T10:10:00Z'
  }
]

export const mockPackingItems: PackingItem[] = [
  {
    id: '1',
    tripId: '1',
    userId: 'mock-user',
    itemName: 'Passport',
    category: 'documents',
    isPacked: true,
    notes: 'Check expiration date',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    tripId: '1',
    userId: 'mock-user',
    itemName: 'Camera',
    category: 'electronics',
    isPacked: false,
    notes: 'Don\'t forget extra batteries',
    createdAt: '2024-01-15T10:05:00Z'
  },
  {
    id: '3',
    tripId: '1',
    userId: 'mock-user',
    itemName: 'Comfortable Walking Shoes',
    category: 'clothing',
    isPacked: false,
    createdAt: '2024-01-15T10:10:00Z'
  }
]

export interface Trip {
  id: string
  userId: string
  title: string
  description?: string
  destination: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt?: string
}

export interface TripEntry {
  id: string
  tripId: string
  userId: string
  title: string
  description?: string
  location?: string
  address?: string
  date: string
  startTime?: string
  endTime?: string
  category: string
  createdAt: string
  updatedAt?: string
}

export interface PackingItem {
  id: string
  tripId: string
  userId: string
  itemName: string
  category?: string
  isPacked: boolean
  notes?: string
  createdAt: string
}