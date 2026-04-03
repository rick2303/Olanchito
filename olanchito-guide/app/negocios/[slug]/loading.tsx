export default function Loading() {
  return (
    <main className="section-container py-8">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-6 h-4 w-48 animate-pulse rounded-full bg-jungle-100" />

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Left column */}
          <div className="space-y-4">
            {/* Image */}
            <div className="aspect-[16/7] w-full animate-pulse rounded-2xl bg-jungle-100" />

            {/* Name + badges */}
            <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5 space-y-3">
              <div className="h-7 w-2/3 animate-pulse rounded-full bg-jungle-100" />
              <div className="flex gap-2">
                <div className="h-5 w-20 animate-pulse rounded-full bg-jungle-100" />
                <div className="h-5 w-24 animate-pulse rounded-full bg-jungle-100" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full animate-pulse rounded-full bg-jungle-100" />
                <div className="h-4 w-5/6 animate-pulse rounded-full bg-jungle-100" />
                <div className="h-4 w-4/6 animate-pulse rounded-full bg-jungle-100" />
              </div>
            </div>

            {/* Info cards */}
            <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 animate-pulse rounded-lg bg-jungle-100" />
                  <div className="h-4 w-40 animate-pulse rounded-full bg-jungle-100" />
                </div>
              ))}
            </div>

            {/* Reviews placeholder */}
            <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
              <div className="h-5 w-32 animate-pulse rounded-full bg-jungle-100 mb-4" />
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded-full bg-jungle-100" />
                    <div className="h-4 w-full animate-pulse rounded-full bg-jungle-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5 space-y-3">
              <div className="h-11 w-full animate-pulse rounded-xl bg-jungle-100" />
              <div className="h-11 w-full animate-pulse rounded-xl bg-jungle-100" />
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
              <div className="h-5 w-32 animate-pulse rounded-full bg-jungle-100" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
