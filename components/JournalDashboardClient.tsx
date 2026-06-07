"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createJournalEntry, deleteJournalEntry } from "@/lib/actions";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import BookLoad from "@/components/ui/book_load";
import { UserButton } from "@clerk/nextjs";

interface JournalEntryData {
  id: string;
  title: string | null;
  content: any;
  mood: string | null;
  date: string;
}

interface JournalDashboardProps {
  userName: string;
  entries: JournalEntryData[];
}

export default function JournalDashboardClient({ userName, entries: initialEntries }: JournalDashboardProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntryData[]>(initialEntries);
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);

  // Group entries by Month/Year
  const groupEntriesByMonth = (entriesList: JournalEntryData[]) => {
    const groups: { [key: string]: JournalEntryData[] } = {};
    
    entriesList.forEach((entry) => {
      const dateObj = new Date(entry.date);
      const monthYear = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(entry);
    });

    return groups;
  };

  const handleCreateEntry = async () => {
    setCreating(true);
    const toastId = toast.loading("Writing a new blank page...");
    try {
      const entry = await createJournalEntry();
      toast.success("Opened a new journal entry!", { id: toastId });
      router.push(`/journal/${entry.id}`);
    } catch (err) {
      toast.error("Failed to create entry.", { id: toastId });
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to tear out the entry "${title || "Dear diary..."}"?`)) {
      const toastId = toast.loading("Tearing page...");
      try {
        await deleteJournalEntry(id);
        setEntries(entries.filter((entry) => entry.id !== id));
        toast.success("Page removed from diary.", { id: toastId });
      } catch (err) {
        toast.error("Could not delete entry.", { id: toastId });
      }
    }
  };

  // Filter entries based on search
  const filteredEntries = entries.filter((entry) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = (entry.title || "Dear diary...").toLowerCase().includes(q);
    const moodMatch = (entry.mood || "neutral").toLowerCase().includes(q);
    
    // Check text inside JSON content if available
    let bodyText = "";
    if (entry.content && entry.content.html) {
      bodyText = entry.content.html.replace(/<[^>]*>/g, ""); // strip HTML tags
    }
    const contentMatch = bodyText.toLowerCase().includes(q);

    return titleMatch || moodMatch || contentMatch;
  });

  const grouped = groupEntriesByMonth(filteredEntries);

  const getMoodConfig = (mood: string | null) => {
    switch (mood?.toLowerCase()) {
      case "happy":
        return { emoji: "😊", label: "Happy", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "peaceful":
        return { emoji: "🧘", label: "Peaceful", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "thoughtful":
        return { emoji: "🧠", label: "Thoughtful", bg: "bg-sky-100 text-sky-800 border-sky-200" };
      case "excited":
        return { emoji: "⚡", label: "Excited", bg: "bg-orange-100 text-on-secondary-container border-orange-200" };
      case "sad":
        return { emoji: "😢", label: "Sad", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" };
      case "stressed":
        return { emoji: "😰", label: "Stressed", bg: "bg-rose-100 text-rose-800 border-rose-200" };
      default:
        return { emoji: "📝", label: "Journal", bg: "bg-surface-container-high text-secondary border-outline-variant" };
    }
  };

  const getPlainText = (content: any) => {
    if (!content) return "Start writing your thoughts here...";
    if (content.html) {
      const text = content.html.replace(/<[^>]*>/g, "").trim();
      return text || "Start writing your thoughts here...";
    }
    return "Start writing your thoughts here...";
  };

  return (
    <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden antialiased relative">
      
      {/* Unified SideNavBar */}
      <Sidebar activeRoute="/journal" />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[280px] flex flex-col h-screen overflow-hidden bg-background">
        
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-lg h-24 bg-background z-30 shrink-0 border-b border-outline-variant/30">
          <div className="flex items-center gap-lg">
            <h2 className="md:hidden font-headline-sm font-bold text-primary mr-md">Inkwell</h2>
            
            {/* Search Bar */}
            <div className="flex items-center relative w-80 group">
              <span className="material-symbols-outlined absolute left-4 text-secondary text-[20px] group-focus-within:text-primary transition-colors">
                search
              </span>
              <input
                className="w-full h-11 pl-12 pr-6 rounded-full bg-surface-container-lowest focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline font-body-md transition-all outline-none border border-outline-variant/50"
                placeholder="Search journal entries..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-md">
            <button
              onClick={handleCreateEntry}
              disabled={creating}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-primary text-on-primary hover:bg-surface-tint transition-all border-none"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
            <span className="font-label-sm text-secondary hidden sm:inline-block">Logged in as <strong>{userName}</strong></span>
            <div className="w-10 h-10 flex items-center justify-center">
              <UserButton />
            </div>
          </div>
        </header>

        {/* Dashboard Grid Content */}
        <main className="flex-1 overflow-y-auto p-lg bg-surface-container-lowest">
          <div className="max-w-[1000px] mx-auto space-y-xl">
            
            {/* Header intro */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md border-b border-outline-variant/20 pb-md">
              <div>
                <h1 className="font-display-lg text-primary font-bold">Personal Journal</h1>
              </div>
              <button
                onClick={handleCreateEntry}
                disabled={creating}
                className="hidden md:flex items-center gap-sm px-lg h-12 bg-primary hover:bg-primary/95 text-on-primary font-bold rounded-full transition-all border-none cursor-pointer hover:shadow-ambient-raised hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">create</span>
                New Journal Entry
              </button>
            </div>

            {/* Entries list */}
            {filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-3xl border border-dashed border-outline-variant p-lg text-center shadow-sm">
                <span>
                  <BookLoad />
                </span>
                <h3 className="font-headline-sm text-on-surface font-semibold">Your diary is empty</h3>
                <p className="text-secondary max-w-full mt-xs mb-lg">Start recording your thoughts, mood, and experiences. Double click titles and dates to customize them.</p>
                <button
                  onClick={handleCreateEntry}
                  disabled={creating}
                  className="px-lg h-11 bg-primary text-on-primary font-bold rounded-full hover:bg-surface-tint border-none cursor-pointer transition-colors shadow-sm"
                >
                  Create Your First Page
                </button>
              </div>
            ) : (
              <div className="space-y-lg">
                {Object.keys(grouped).map((monthYear) => (
                  <div key={monthYear} className="space-y-md">
                    <h3 className="font-label-sm text-secondary uppercase tracking-wider pl-xs">{monthYear}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                      {grouped[monthYear].map((entry) => {
                        const dateObj = new Date(entry.date);
                        const dayNum = dateObj.getDate();
                        const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                        const moodCfg = getMoodConfig(entry.mood);

                        return (
                          <Link
                            key={entry.id}
                            href={`/journal/${entry.id}`}
                            className="bg-surface hover:bg-surface-container-low border border-outline-variant/60 hover:border-primary/20 rounded-2xl p-md flex gap-md transition-all duration-300 hover:shadow-ambient-overlay group cursor-pointer"
                          >
                            {/* Calendar Leaf Date Badge */}
                            <div className="flex flex-col items-center justify-center w-14 h-16 bg-surface-container-high rounded-xl shrink-0 group-hover:bg-primary/5 transition-colors border border-outline-variant/30 select-none">
                              <span className="text-[10px] uppercase font-bold text-secondary tracking-widest leading-none">{dayName}</span>
                              <span className="text-display-lg-mobile font-bold text-primary mt-[2px] leading-none">{dayNum}</span>
                            </div>

                            {/* Entry details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start gap-xs">
                                  <h4 className="font-cursive-caveat text-3xl text-on-surface font-bold truncate leading-tight py-[2px]">
                                    {entry.title || "Dear diary..."}
                                  </h4>
                                  
                                  <button
                                    onClick={(e) => handleDelete(e, entry.id, entry.title)}
                                    className="w-7 h-7 flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-error/5 border-none bg-transparent opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-200"
                                    title="Tear out page"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                  </button>
                                </div>
                                <p className="text-secondary text-sm truncate mt-xs line-clamp-2 pr-sm">
                                  {getPlainText(entry.content)}
                                </p>
                              </div>

                              <div className="mt-md flex items-center justify-between">
                                <span className={`text-[11px] font-bold px-sm py-[4px] border rounded-full flex items-center gap-xs ${moodCfg.bg}`}>
                                  <span>{moodCfg.emoji}</span>
                                  <span>{moodCfg.label}</span>
                                </span>
                                <span className="material-symbols-outlined text-outline text-[16px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:translate-x-1">
                                  arrow_forward
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Nav Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface-container-lowest border-t border-outline-variant md:hidden shadow-lg">
        <Link className="flex flex-col items-center justify-center text-on-surface-variant font-label-sm text-label-sm py-xs px-md rounded-xl" href="/dashboard">
          <span className="material-symbols-outlined text-[24px]">home</span>
          <span>Home</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-primary font-bold font-label-sm text-label-sm py-xs px-md rounded-xl scale-95 transition-all" href="/journal">
          <span className="material-symbols-outlined text-[24px] fill">book</span>
          <span>Journal</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-on-surface-variant font-label-sm text-label-sm py-xs px-md rounded-xl" href="/settings">
          <span className="material-symbols-outlined text-[24px]">settings</span>
          <span>Settings</span>
        </Link>
      </nav>
      
      {creating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-55 flex flex-col items-center justify-center">
          <BookLoad />
          <p className="text-secondary font-headline-sm mt-md animate-pulse">Opening your journal...</p>
        </div>
      )}
    </div>
  );
}
