export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-zinc-800 rounded mb-2" />
      <div className="h-4 w-72 bg-zinc-800/50 rounded mb-6" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-24"
          />
        ))}
      </div>
      <div className="mt-8 h-6 w-40 bg-zinc-800 rounded mb-4" />
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl h-48" />
    </div>
  );
}
