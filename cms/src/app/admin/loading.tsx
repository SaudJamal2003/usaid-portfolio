/* Shown while a server component fetches. Covers every admin route, so no list
   screen has to build its own skeleton. */
export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-56 rounded bg-surface" />
        <div className="mt-2 h-4 w-80 rounded bg-surface" />
      </div>
      <div className="mb-4 flex gap-2">
        <div className="h-9 w-64 rounded-lg bg-surface" />
        <div className="h-9 w-32 rounded-lg bg-surface" />
      </div>
      <div className="rounded-xl border border-line">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-line p-4 last:border-0">
            <div className="h-4 flex-1 rounded bg-surface" />
            <div className="h-4 w-24 rounded bg-surface" />
            <div className="h-5 w-16 rounded-full bg-surface" />
          </div>
        ))}
      </div>
    </div>
  )
}
