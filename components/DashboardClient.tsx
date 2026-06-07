"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { createSubject, deleteSubject,deleteNote } from "@/lib/actions";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import BookLoad from "@/components/ui/book_load";

interface SubjectData {
  id: string;
  title: string;
  color: string | null;
  notesCount: number;
  updatedAt: string;
}

interface NoteData {
  id: string;
  title: string;
  subjectId: string;
  subjectTitle: string;
  subjectColor: string | null;
  updatedAt: string;
}

export default function DashboardClient({
  userName,
  subjects,
  notes,
  defaultTab = "dashboard",
}: {
  userName: string;
  subjects: SubjectData[];
  notes: NoteData[];
  defaultTab?: string;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Sync activeTab state if defaultTab changes via navigation
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // State for creating new subject
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [newSubjectTitle, setNewSubjectTitle] = useState("");
  const [loading, setLoading] = useState(false);

  // States for search-and-store
  const [displayedSubjects, setDisplayedSubjects] = useState<SubjectData[]>(subjects);
  const [displayedNotes, setDisplayedNotes] = useState<NoteData[]>(notes);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    subjects: any[];
    chapters: any[];
    notes: any[];
  }>({ subjects: [], chapters: [], notes: [] });
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Debounced search logic
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults({ subjects: [], chapters: [], notes: [] });
      setPopoverOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      setPopoverOpen(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults({
            subjects: data.subjects || [],
            chapters: data.chapters || [],
            notes: data.notes || [],
          });
        }
      } catch (err) {
        console.error("Debounced search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Click outside listener to close search popover
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".search-container")) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setDisplayedSubjects(subjects);
  }, [subjects]);

  useEffect(() => {
    setDisplayedNotes(notes);
  }, [notes]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setDisplayedSubjects(subjects);
      setDisplayedNotes(notes);
      setSearchResults({ subjects: [], chapters: [], notes: [] });
      setPopoverOpen(false);
    }
  };


  const handleDeleteNote = async (e: React.MouseEvent, noteId: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete note "${title}"?`)) {
      setLoading(true);
      try {
        await deleteNote(noteId);
        toast.success(`Note "${title}" deleted successfully!`);
        router.refresh();
      } catch (err) {
        toast.error("Failed to delete note");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(cleanQuery)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      
      setDisplayedSubjects(data.subjects);
      setDisplayedNotes(data.notes);

      // If a note with the exact title is returned, redirect to its editor
      const exactNote = data.notes.find(
        (n: any) => n.title.toLowerCase() === cleanQuery.toLowerCase()
      );
      if (exactNote) {
        router.push(`/note/${exactNote.id}`);
      }
    } catch (err) {
      console.error("Failed to perform backend search and store:", err);
    } finally {
      setSearching(false);
    }
  };

  // Helper to resolve HSL colors and icons for subjects
  const getSubjectStyles = (title: string, index: number, colorOverride?: string | null) => {
    const cleanTitle = title.toLowerCase();
    
    // Default schemes matching original design specs
    const schemes = [
      { bg: "bg-primary-fixed", text: "text-on-primary-fixed", indicator: "bg-primary-fixed-dim", icon: "calculate" },
      { bg: "bg-secondary-fixed", text: "text-on-secondary-fixed", indicator: "bg-secondary-fixed-dim", icon: "terminal" },
      { bg: "bg-tertiary-fixed", text: "text-on-tertiary-fixed", indicator: "bg-tertiary-fixed-dim", icon: "auto_stories" }
    ];

    let scheme = schemes[index % schemes.length];

    if (cleanTitle.includes("math") || cleanTitle.includes("calc") || cleanTitle.includes("algebra")) {
      scheme = schemes[0]; // math
    } else if (cleanTitle.includes("cs") || cleanTitle.includes("computer") || cleanTitle.includes("code") || cleanTitle.includes("algorithm")) {
      scheme = schemes[1]; // cs
    } else if (cleanTitle.includes("lit") || cleanTitle.includes("poetry") || cleanTitle.includes("book") || cleanTitle.includes("write")) {
      scheme = schemes[2]; // lit
    }

    if (colorOverride) {
      // If user has specific color selected
      return {
        bg: colorOverride,
        text: "text-primary",
        indicator: "bg-primary-container",
        icon: scheme.icon
      };
    }

    return scheme;
  };

  // Helper to get time-based greeting
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };

  // Helper to format date strings relatively
  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 0) return "Just now";
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) {
      return `${diffSecs} sec ago`;
    }
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hr${diffHours !== 1 ? "s" : ""} ago`;
    }
    if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    }
    if (diffWeeks < 4) {
      return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
    }
    if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
    }
    return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectTitle.trim()) return;

    setLoading(true);
    try {
      // Randomly assign a fixed color class for new subjects
      const colorOptions = ["bg-primary-fixed", "bg-secondary-fixed", "bg-tertiary-fixed"];
      const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      
      await createSubject(newSubjectTitle.trim(), randomColor);
      toast.success(`Subject "${newSubjectTitle.trim()}" created successfully!`);
      setNewSubjectTitle("");
      setIsCreatingSubject(false);
      router.refresh();
    } catch (err) {
      toast.error("Failed to create subject");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${title}"? This will delete all chapters and notes inside it.`)) {
      try {
        await deleteSubject(id);
        toast.success(`Subject "${title}" deleted successfully!`);
        router.refresh();
      } catch (err) {
        toast.error("Failed to delete subject");
        console.error(err);
      }
    }
  };

  const filteredNotes = displayedNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subjectTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubjects = displayedSubjects.filter(
    (subj) =>
      subj.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
      
      {/* Unified SideNavBar */}
      <Sidebar
        activeRoute="/dashboard"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[280px] flex flex-col h-screen overflow-hidden bg-background">
        
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-lg h-24 bg-background z-30 shrink-0">
          <div className="flex items-center gap-lg">
            <h2 className="md:hidden font-headline-sm font-bold text-primary">Inkwell</h2>
            {/* Search Bar Container */}
            <div className="hidden md:block relative w-96 search-container">
              <form
                className={`search-form ${searchQuery ? "has-text" : ""}`}
                onSubmit={handleSearchSubmit}
                onReset={() => handleSearchChange("")}
              >
                <label htmlFor="search">
                  <input
                    required
                    autoComplete="off"
                    placeholder="Search subjects, chapters, notes..."
                    id="search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => setPopoverOpen(true)}
                    onClick={() => setPopoverOpen(true)}
                  />
                  <div className="search-icon-wrapper">
                    <svg strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="swap-on">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                    <svg strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="swap-off">
                      <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                  </div>
                  <button type="reset" className="search-close-btn">
                    <svg viewBox="0 0 20 20" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                      <path clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" fillRule="evenodd" />
                    </svg>
                  </button>
                </label>
              </form>

              {/* Popover */}
              {popoverOpen && searchQuery && (
                <div className="absolute top-full left-0 w-[450px] mt-2 bg-surface-container-lowest border border-outline-variant shadow-ambient-overlay rounded-2xl z-55 overflow-hidden max-h-96 overflow-y-auto p-2 flex flex-col gap-2 animate-fade-in">
                  {searching ? (
                    <div className="flex items-center justify-center p-md text-sm text-secondary gap-xs">
                      <span className="animate-spin material-symbols-outlined text-[18px]">sync</span>
                      Searching...
                    </div>
                  ) : (searchResults.subjects.length === 0 && searchResults.chapters.length === 0 && searchResults.notes.length === 0) ? (
                    <div className="p-md text-sm text-secondary italic text-center">
                      No matches found. Press Enter to create a note.
                    </div>
                  ) : (
                    <>
                      {searchResults.subjects.length > 0 && (
                        <div>
                          <div className="px-sm py-1 font-label-sm text-outline text-[10px] uppercase tracking-wider select-none border-b border-outline-variant/30 mb-xs">
                            Subjects
                          </div>
                          <div className="flex flex-col gap-xs">
                            {searchResults.subjects.map((subj) => (
                              <Link
                                key={subj.id}
                                href={`/subject/${subj.id}`}
                                onClick={() => setPopoverOpen(false)}
                                className="flex items-center gap-md px-md py-2 hover:bg-surface-container-low rounded-xl transition-colors group outline-none"
                              >
                                <span className="material-symbols-outlined text-secondary text-[18px] group-hover:text-primary transition-colors">folder</span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-body-md font-semibold text-on-surface group-hover:text-primary transition-colors truncate">{subj.title}</span>
                                  <span className="text-[10px] text-outline font-label-sm">found in subject</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.chapters.length > 0 && (
                        <div>
                          <div className="px-sm py-1 font-label-sm text-outline text-[10px] uppercase tracking-wider select-none border-b border-outline-variant/30 mb-xs mt-sm">
                            Chapters
                          </div>
                          <div className="flex flex-col gap-xs">
                            {searchResults.chapters.map((chap) => (
                              <Link
                                key={chap.id}
                                href={`/subject/${chap.subjectId}`}
                                onClick={() => setPopoverOpen(false)}
                                className="flex items-center gap-md px-md py-2 hover:bg-surface-container-low rounded-xl transition-colors group outline-none"
                              >
                                <span className="material-symbols-outlined text-secondary text-[18px] group-hover:text-primary transition-colors">menu_book</span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-body-md font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                                    {chap.subjectTitle} / {chap.title}
                                  </span>
                                  <span className="text-[10px] text-outline font-label-sm">found in subject/chapters</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.notes.length > 0 && (
                        <div>
                          <div className="px-sm py-1 font-label-sm text-outline text-[10px] uppercase tracking-wider select-none border-b border-outline-variant/30 mb-xs mt-sm">
                            Notes
                          </div>
                          <div className="flex flex-col gap-xs">
                            {searchResults.notes.map((note) => (
                              <Link
                                key={note.id}
                                href={`/note/${note.id}`}
                                onClick={() => setPopoverOpen(false)}
                                className="flex items-center gap-md px-md py-2 hover:bg-surface-container-low rounded-xl transition-colors group outline-none"
                              >
                                <span className="material-symbols-outlined text-secondary text-[18px] group-hover:text-primary transition-colors">description</span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-body-md font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                                    {note.subjectTitle} / {note.chapterTitle} / {note.title}
                                  </span>
                                  <span className="text-[10px] text-outline font-label-sm">found in subject/chapter/notes</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-lg">
            <button onClick={() => setActiveTab("dashboard")} className="font-label-md text-primary font-bold hover:text-primary transition-colors">
              Notes
            </button>
          </nav>

          {/* Trailing Actions */}
          <div className="flex items-center gap-sm md:gap-md">
            <form onSubmit={handleSearchSubmit} className="flex md:hidden relative items-center">
              <input
                type="text"
                placeholder="Search or create..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className={`w-32 focus:w-48 h-9 px-3 text-sm rounded-full bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all border-none outline-none ${
                  searching ? "animate-pulse" : ""
                }`}
              />
            </form>
            
            <button className="w-10 h-10 flex items-center justify-center text-secondary hover:text-primary rounded-full hover:bg-surface-container transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-background"></span>
            </button>
            
            <div className="w-10 h-10 flex items-center justify-center">
              <UserButton />
            </div>
          </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto px-md md:px-lg xl:px-margin-desktop pb-xl w-full max-w-[1200px] mx-auto">
          
          <div className="mb-lg">
            <h2 className="font-display-lg text-primary mb-sm">
              {getGreeting()},{" "}
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary inline-block">
                {userName}
              </span>.
            </h2>
            <p className="font-body-lg text-secondary">Here&apos;s a look at your current workspace.</p>
          </div>

          {/* Tab Content 1: Active Subjects */}
          {(activeTab === "dashboard" || activeTab === "subjects") && (
            <section className="mb-xl">
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-headline-md text-on-surface font-semibold">Active Subjects</h3>
                <button
                  onClick={() => setIsCreatingSubject((prev) => !prev)}
                  className="font-label-md text-primary hover:text-surface-tint flex items-center gap-xs"
                >
                  Create Subject <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>

              {/* Create Subject Form Modal */}
              {isCreatingSubject && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-md transition-all duration-300">
                  <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-3xl max-w-full shadow-ambient-overlay flex flex-col gap-md relative overflow-hidden min-w-[320px]">
                    {loading && (
                      <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-sm z-55 flex flex-col items-center justify-center">
                        <BookLoad />
                        <p className="text-secondary font-label-md mt-sm">Creating subject...</p>
                      </div>
                    )}
                    <h3 className="font-headline-sm text-primary font-bold">New Subject</h3>
                    <p className="text-secondary text-sm">Create a new subject folder to organize your chapters and notes.</p>
                    <form onSubmit={handleCreateSubject} className="flex flex-col gap-md">
                      <input
                        type="text"
                        placeholder="Subject Title (e.g. Mathematics)"
                        value={newSubjectTitle}
                        onChange={(e) => setNewSubjectTitle(e.target.value)}
                        className="w-full h-12 px-md rounded-xl bg-surface-container-low border border-outline-variant outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-on-surface"
                        disabled={loading}
                        autoFocus
                      />
                      <div className="flex gap-md justify-end mt-sm">
                        <button
                          type="button"
                          onClick={() => setIsCreatingSubject(false)}
                          className="border border-outline-variant text-secondary px-lg h-11 rounded-full font-label-md hover:bg-surface-container-high transition-colors"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-primary text-on-primary px-lg h-11 rounded-full font-label-md hover:bg-surface-tint transition-colors flex items-center justify-center min-w-[100px]"
                          disabled={loading}
                        >
                          {loading ? "Creating..." : "Create"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {filteredSubjects.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                  <span className="material-symbols-outlined text-outline text-5xl mb-sm block">folder_open</span>
                  <h4 className="font-headline-sm text-on-surface mb-xs">No Subjects Found</h4>
                  <p className="text-secondary mb-md">Get started by creating your first academic subject.</p>
                  <button
                    onClick={() => setIsCreatingSubject(true)}
                    className="bg-primary/10 text-primary font-label-md px-lg py-sm rounded-full hover:bg-primary/20 transition-all inline-flex items-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Create Subject
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                  {filteredSubjects.map((subj, index) => {
                    const styles = getSubjectStyles(subj.title, index, subj.color);
                    return (
                      <Link
                        key={subj.id}
                        href={`/subject/${subj.id}`}
                        className="bg-surface-container-lowest rounded-2xl p-md shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all cursor-pointer group flex flex-col h-48 border border-surface-container-lowest hover:border-surface-container-high"
                      >
                        <div className="flex justify-between items-start mb-auto w-full">
                          <div className={`w-12 h-12 rounded-full ${styles.bg} ${styles.text} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                            <span className="material-symbols-outlined">{styles.icon}</span>
                          </div>
                          <div className="flex items-center gap-xs">
                            <span className="font-label-sm px-3 py-1 bg-surface-container rounded-full text-secondary flex items-center gap-xs">
                              <span className={`w-2 h-2 rounded-full ${styles.indicator}`}></span>
                              Subject
                            </span>
                            <button
                              onClick={(e) => handleDeleteSubject(e, subj.id, subj.title)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-error hover:bg-error/10 transition-colors z-10"
                              title="Delete Subject"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-headline-sm text-on-surface mb-xs group-hover:text-primary transition-colors">
                            {subj.title}
                          </h4>
                          <p className="font-label-md text-secondary">
                            {subj.notesCount} notes • Edited {getRelativeTime(subj.updatedAt)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Tab Content 2: Recent Notes List */}
          {(activeTab === "dashboard" || activeTab === "recent") && (
            <section className="mb-xl">
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-headline-md text-on-surface font-semibold">Recent Notes</h3>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-sm shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                {/* List Header */}
                <div className="hidden sm:grid grid-cols-12 gap-sm px-md py-sm font-label-sm text-outline uppercase tracking-wider mb-sm border-b border-surface-container-high/50 pb-2">
                  <div className="col-span-5">Title</div>
                  <div className="col-span-3">Subject</div>
                  <div className="col-span-2 text-right">Last Modified</div>
                  <div className="col-span-2 text-center">Delete</div>
                </div>

                {/* List Items */}
                {filteredNotes.length === 0 ? (
                  <p className="p-md text-secondary italic text-center">No notes found.</p>
                ) : (
                  <div className="flex flex-col gap-xs">
                    {filteredNotes.map((note, index) => {
                      const subjStyles = getSubjectStyles(note.subjectTitle, index, note.subjectColor);
                      return (
                        <Link
                          key={note.id}
                          href={`/note/${note.id}`}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-y-2 gap-x-sm px-md py-3 items-center hover:bg-surface-container-low transition-colors group rounded-xl"
                        >
                          <div className="col-span-1 sm:col-span-5 flex items-center gap-sm">
                            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-surface-container-high transition-colors">
                              <span className="material-symbols-outlined text-secondary text-[18px]">description</span>
                            </div>
                            <span className="font-body-md font-medium text-on-surface group-hover:text-primary transition-colors">
                              {note.title}
                            </span>
                          </div>
                          <div className="col-span-1 sm:col-span-3">
                            <span className={`font-label-sm px-3 py-1 ${subjStyles.bg} ${subjStyles.text} rounded-full`}>
                              {note.subjectTitle}
                            </span>
                          </div>
                          <div className="col-span-1 sm:col-span-2 font-label-md text-secondary sm:text-right">
                            {getRelativeTime(note.updatedAt)}
                          </div>
                          <div className="col-span-1 sm:col-span-2 flex justify-center">
                            <button
                              onClick={(e) => handleDeleteNote(e, note.id, note.title)}
                              className="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:text-error hover:bg-error/10 transition-colors focus:outline-none"
                              title="Delete Note"
                              disabled={loading}
                            >
                              <span className="material-symbols-outlined text-[22px]">delete</span>
                            </button>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

        </main>
      </div>

      {/* BottomNavBar (Mobile Only Navigation) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface-container-lowest border-t border-surface-container shadow-[0_-4px_24px_rgba(0,0,0,0.02)] md:hidden pb-2">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl mt-2 transition-all ${
            activeTab === "dashboard" ? "text-primary bg-surface-container-low font-bold" : "text-secondary"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "dashboard" ? "'FILL' 1" : "'FILL' 0" }}>
            home
          </span>
          <span className="font-label-sm mt-1">Home</span>
        </button>
        <button
          onClick={() => setActiveTab("subjects")}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl mt-2 transition-all ${
            activeTab === "subjects" ? "text-primary bg-surface-container-low font-bold" : "text-secondary"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "subjects" ? "'FILL' 1" : "'FILL' 0" }}>
            book
          </span>
          <span className="font-label-sm mt-1">Subjects</span>
        </button>
        <button
          onClick={() => setActiveTab("recent")}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl mt-2 transition-all ${
            activeTab === "recent" ? "text-primary bg-surface-container-low font-bold" : "text-secondary"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "recent" ? "'FILL' 1" : "'FILL' 0" }}>
            history
          </span>
          <span className="font-label-sm mt-1">Recent</span>
        </button>
        <Link
          href="/settings"
          className="flex flex-col items-center justify-center text-secondary w-16 h-14 rounded-2xl mt-2 transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-sm mt-1">Settings</span>
        </Link>
      </nav>
      
    </div>
  );
}
