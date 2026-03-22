export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-56 bg-zinc-800 rounded" />
      <div className="h-4 w-72 bg-zinc-800/50 rounded mt-2" />
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 h-16"
          />
        ))}
      </div>
    </div>
  );
}
