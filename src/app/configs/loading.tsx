export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 bg-zinc-800 rounded" />
          <div className="h-4 w-80 bg-zinc-800/50 rounded mt-2" />
        </div>
        <div className="h-9 w-36 bg-zinc-800 rounded-lg" />
      </div>
      <div className="mt-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-20"
          />
        ))}
      </div>
    </div>
  );
}
