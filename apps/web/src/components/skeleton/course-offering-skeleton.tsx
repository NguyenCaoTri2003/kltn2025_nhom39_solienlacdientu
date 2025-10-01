export default function CourseOfferingSkeleton({ items = 6 }: { items?: number }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-pulse" />
        <div className="w-56 h-6 rounded-md bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-pulse" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: items }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm 
            shadow-sm animate-pulse space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300" />
              <div className="w-40 h-5 rounded-md bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300" />
            </div>

            <div className="w-28 h-3 ml-7 rounded-md bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300" />

            <div className="space-y-2 mt-3">
              <div className="w-32 h-4 rounded-md bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300" />
              <div className="w-40 h-4 rounded-md bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300" />
            </div>

            <div className="pl-5 space-y-2 mt-2">
              <div className="w-48 h-3 rounded-md bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300" />
              <div className="w-40 h-3 rounded-md bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300" />
            </div>

            <div className="flex justify-between items-center pt-3">
              <div className="w-24 h-4 rounded-md bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300" />
              <div className="w-20 h-4 rounded-md bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}