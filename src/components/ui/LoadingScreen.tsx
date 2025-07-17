import { Plane } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <Plane className="h-12 w-12 text-primary animate-bounce mx-auto" />
          <div className="absolute inset-0 h-12 w-12 text-primary/20 animate-ping mx-auto">
            <Plane className="h-12 w-12" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">TravelPlan</h1>
        <p className="text-muted-foreground">Loading your travel adventures...</p>
      </div>
    </div>
  )
}