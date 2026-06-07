import BookLoad from "@/components/ui/book_load";

export default function SubjectLoading() {
  return (
    <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden antialiased animate-pulse">
      {/* Sidebar Skeleton */}
      <aside className="bg-surface-container-lowest w-[280px] h-screen hidden md:flex flex-col border-r border-outline-variant fixed left-0 top-0 bottom-0 z-40 p-lg gap-lg">
        <div className="flex items-center gap-sm">
          <div className="w-8 h-8 bg-surface-container rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface-container rounded w-2/3" />
            <div className="h-3 bg-surface-container-low rounded w-1/2" />
          </div>
        </div>
        <div className="w-full bg-surface-container h-12 rounded-full" />
        <div className="flex-1 space-y-sm">
          <div className="h-10 bg-surface-container rounded-full w-full" />
          <div className="h-10 bg-surface-container rounded-full w-full" />
          <div className="h-10 bg-surface-container rounded-full w-full" />
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col md:pl-[280px] h-screen">
        {/* TopAppBar Skeleton */}
        <header className="h-16 flex items-center justify-between px-lg border-b border-outline-variant bg-surface-container-lowest shrink-0">
          <div className="flex items-center gap-sm w-48">
            <div className="w-4 h-4 bg-surface-container rounded-full" />
            <div className="h-4 bg-surface-container rounded w-full" />
          </div>
          <div className="flex items-center gap-md">
            <div className="w-8 h-8 bg-surface-container rounded-full" />
            <div className="w-20 h-8 bg-surface-container rounded-xl" />
            <div className="w-8 h-8 bg-surface-container rounded-full" />
          </div>
        </header>

        {/* Content Centered Loader */}
        <main className="flex-1 flex flex-col items-center justify-center bg-surface-container-low p-lg select-none">
          <BookLoad />
          <p className="text-secondary font-headline-sm mt-md animate-pulse">Loading subject...</p>
        </main>
      </div>
    </div>
  );
}
