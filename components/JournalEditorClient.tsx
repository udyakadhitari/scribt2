"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEditor } from "@tiptap/react";
import { extensions } from "@/components/editor/extensions";
import TiptapEditor from "@/components/editor/editor";
import { updateJournalEntry, deleteJournalEntry } from "@/lib/actions";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import BookLoad from "@/components/ui/book_load";

interface JournalEntryData {
  id: string;
  title: string | null;
  content: any;
  mood: string | null;
  date: string;
}

interface JournalEditorProps {
  userName: string;
  entry: JournalEntryData;
}

export default function JournalEditorClient({ userName, entry }: JournalEditorProps) {
  const router = useRouter();

  // Header and title states
  const [title, setTitle] = useState(entry.title || "Dear diary...");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  // Date states
  const [dateStr, setDateStr] = useState(entry.date.split("T")[0]); // YYYY-MM-DD
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(dateStr);

  // Mood states
  const [mood, setMood] = useState(entry.mood || "neutral");

  // Sync state
  const [saveStatus, setSaveStatus] = useState("Saved just now");

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format date for display: e.g. "June 5, 2026"
  const getDisplayDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Unknown Date";
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Debounced auto-save triggers database actions
  const triggerAutoSave = (currentTitle: string, currentHtml: string, currentMood: string, currentDate: string) => {
    setSaveStatus("Saving...");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateJournalEntry(entry.id, {
          title: currentTitle,
          content: { html: currentHtml },
          mood: currentMood,
          date: currentDate,
        });
        setSaveStatus("Saved just now");
      } catch (err) {
        setSaveStatus("Failed to save changes");
      }
    }, 1000); // 1000ms debounce
  };

  // Instantiating Tiptap Editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: entry.content?.html || "",
    editorProps: {
      attributes: {
        class: "prose max-w-none font-body-lg text-body-lg text-on-surface outline-none min-h-[500px] focus:outline-none",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      triggerAutoSave(title, html, mood, dateStr);
    },
  });

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    const trimmed = tempTitle.trim();
    if (!trimmed) {
      setTempTitle(title);
      return;
    }
    setTitle(trimmed);
    const html = editor?.getHTML() || "";
    triggerAutoSave(trimmed, html, mood, dateStr);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleBlur();
    } else if (e.key === "Escape") {
      setTempTitle(title);
      setIsEditingTitle(false);
    }
  };

  const handleDateBlur = () => {
    setIsEditingDate(false);
    if (!tempDate) {
      setTempDate(dateStr);
      return;
    }
    
    const parsedDate = new Date(tempDate);
    if (isNaN(parsedDate.getTime())) {
      toast.error("Invalid date selected");
      setTempDate(dateStr);
      return;
    }

    const year = parsedDate.getFullYear();
    if (year < 1000 || year > 9999) {
      toast.error("Year must be between 1000 and 9999");
      setTempDate(dateStr);
      return;
    }

    setDateStr(tempDate);
    const html = editor?.getHTML() || "";
    triggerAutoSave(title, html, mood, tempDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTempDate(val);
  };

  const handleMoodSelect = (newMood: string) => {
    setMood(newMood);
    const html = editor?.getHTML() || "";
    triggerAutoSave(title, html, newMood, dateStr);
  };

  const handleDeleteEntry = async () => {
    if (confirm("Are you sure you want to tear out this journal entry?")) {
      const toastId = toast.loading("Tearing out page...");
      try {
        await deleteJournalEntry(entry.id);
        toast.success("Page removed from diary.", { id: toastId });
        router.push("/journal");
        router.refresh();
      } catch (error) {
        toast.error("Failed to delete journal entry.", { id: toastId });
      }
    }
  };

  const moodsList = [
    { value: "happy", emoji: "😊", label: "Happy" },
    { value: "peaceful", emoji: "🧘", label: "Peaceful" },
    { value: "thoughtful", emoji: "🧠", label: "Thoughtful" },
    { value: "excited", emoji: "⚡", label: "Excited" },
    { value: "sad", emoji: "😢", label: "Sad" },
    { value: "stressed", emoji: "😰", label: "Stressed" },
  ];

  return (
    <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden antialiased relative">
      
      {/* Unified SideNavBar */}
      <Sidebar activeRoute="/journal" />

      {/* Main Workspace Area */}
      <div className="flex-1 md:ml-[280px] flex flex-col h-screen overflow-hidden bg-background">
        
        {/* TopAppBar */}
        <header className="flex justify-between items-center w-full px-lg h-16 bg-surface-container-lowest shrink-0 z-30 border-b border-outline-variant/30">
          <div className="flex items-center gap-sm text-secondary font-body-md text-body-md">
            <span className="material-symbols-outlined text-[18px]">book</span>
            <Link href="/journal" className="hover:text-primary cursor-pointer transition-colors">
              Journal
            </Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface font-semibold truncate max-w-[200px]">{title}</span>
            <span className="ml-lg text-outline font-label-sm text-label-sm flex items-center gap-xs hidden sm:flex select-none">
              <span className="material-symbols-outlined text-[14px]">
                {saveStatus === "Saving..." ? "sync" : saveStatus === "Failed to save changes" ? "error" : "cloud_done"}
              </span>
              {saveStatus}
            </span>
          </div>

          <div className="flex items-center gap-md">
            <button
              onClick={handleDeleteEntry}
              className="w-8 h-8 flex items-center justify-center text-secondary hover:text-error hover:bg-error/10 transition-colors rounded-full border-none bg-transparent cursor-pointer"
              title="Delete Entry"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </header>

        {/* Notebook Writing Environment */}
        <main className="flex-1 overflow-y-auto p-lg bg-surface-container-high">
          <div className="max-w-[850px] mx-auto space-y-md">
            
            {/* Paper Sheet container */}
            <div className="journal-ruled-paper relative">
              
              {/* Header Mask covering pre-printed text on the journal-bg.png (y = 30px to 210px) */}
              <div className="absolute top-[30px] left-[30px] right-[30px] h-[180px] bg-[#faf7f2] z-10 rounded-t-2xl flex flex-col justify-end pb-4 px-8 select-none">
                <div className="flex justify-between items-end gap-md w-full">
                  {/* Title (Cursive handwriting, left) */}
                  <div className="flex-1 min-w-0">
                    {isEditingTitle ? (
                      <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        className="w-full bg-transparent border-none text-on-surface focus:ring-0 p-0 font-cursive-caveat text-5xl outline-none font-bold placeholder-outline-variant"
                        placeholder="Dear diary..."
                        autoFocus
                      />
                    ) : (
                      <h2
                        onDoubleClick={() => {
                          setTempTitle(title);
                          setIsEditingTitle(true);
                        }}
                        className="font-cursive-caveat text-5xl text-on-surface font-bold cursor-pointer hover:bg-black/5 px-2 rounded-lg transition-colors leading-tight truncate py-1 select-none"
                        title="Double click to edit title"
                      >
                        {title}
                      </h2>
                    )}
                  </div>

                  {/* Date (Right, underlined uppercase) */}
                  <div className="shrink-0 flex items-center gap-sm">
                    {isEditingDate ? (
                      <input
                        type="date"
                        value={tempDate}
                        onChange={handleDateChange}
                        onBlur={handleDateBlur}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Escape") {
                            handleDateBlur();
                          }
                        }}
                        className="bg-surface border border-primary px-3 py-1 rounded text-on-surface font-label-md text-sm outline-none focus:ring-1 focus:ring-primary w-40"
                        autoFocus
                      />
                    ) : (
                      <div
                        onDoubleClick={() => {
                          setTempDate(dateStr);
                          setIsEditingDate(true);
                        }}
                        className="text-right cursor-pointer hover:bg-black/5 px-2 py-1 rounded-lg transition-colors select-none"
                        title="Double click to edit date"
                      >
                        <span className="text-[10px] text-outline font-bold tracking-widest uppercase block mb-[2px]">Date</span>
                        <span className="font-semibold text-sm border-b border-outline text-secondary tracking-wide">
                          {getDisplayDate(dateStr)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mood selector floating bar (aligned over the mask) */}
              <div className="absolute top-[40px] left-[40px] flex items-center gap-sm bg-surface/90 border border-outline-variant/60 shadow-ambient-raised rounded-full py-1 px-md z-20 select-none backdrop-blur-md">
                <span className="text-[10px] uppercase font-bold text-outline tracking-wider mr-xs">Mood:</span>
                {moodsList.map((m) => {
                  const isSelected = mood.toLowerCase() === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => handleMoodSelect(m.value)}
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-lg transition-transform hover:scale-125 border-none cursor-pointer ${
                        isSelected 
                          ? "bg-primary-container text-on-primary-container ring-2 ring-primary scale-110 shadow-sm" 
                          : "bg-transparent hover:bg-surface-container-high"
                      }`}
                      title={m.label}
                    >
                      {m.emoji}
                    </button>
                  );
                })}
              </div>

              {/* Tiptap Ruled Text Editor content */}
              <div className="journal-editor">
                <TiptapEditor editor={editor} />
              </div>

            </div>

          </div>
        </main>
      </div>
      
    </div>
  );
}
