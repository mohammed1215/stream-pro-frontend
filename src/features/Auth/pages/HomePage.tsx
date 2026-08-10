export const HomePage = () => {
  return (
    <div className="h-screen w-full relative">
      <main className="p-4 h-full">
        {/* No Videos */}
        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
          <h1 className="text-2xl font-bold">No Videos</h1>
          <p className="text-muted-foreground">
            You haven't searched for any videos yet. Start by using the search
            bar above to find your favorite content.
          </p>
        </div>
      </main>
    </div>
  )
}
