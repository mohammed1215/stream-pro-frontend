export function VideoPageSkeleton() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <main className="mx-auto max-w-[1800px] p-4 lg:p-6 flex flex-col lg:flex-row gap-6 animate-pulse">
        <div className="flex-1 space-y-4">
          <div className="aspect-video w-full bg-muted rounded-xl" />
          <div className="h-8 w-3/4 bg-muted rounded-lg" />
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-muted rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-3 w-1/4 bg-muted rounded" />
            </div>
            <div className="h-10 w-32 bg-muted rounded-full" />
          </div>
          <div className="h-32 w-full bg-muted rounded-xl" />
        </div>
        <div className="w-full lg:w-100 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-24 w-40 bg-muted rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
