"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { createChapter, createNote, deleteSubject, deleteChapter, deleteNote, updateChapter, updateSubject } from "@/lib/actions";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import BookLoad from "@/components/ui/book_load";


interface Note {
  id: string;
  title: string;
  createdAt: Date;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  notes: Note[];
}

interface Subject {
  id: string;
  title: string;
  color: string | null;
  chapters: Chapter[];
}

export default function SubjectDetailsClient({ subject }: { subject: Subject }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("subject-view");
  
  // Chapter creation state
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  
  // Note creation state
  const [creatingNoteForChapterId, setCreatingNoteForChapterId] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  
  // Loading status
  const [loading, setLoading] = useState(false);

  // Editing Chapter state
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState("");

  // Editing Subject state
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editingSubjectTitle, setEditingSubjectTitle] = useState(subject.title);

  const handleUpdateSubject = async () => {
    const trimmed = editingSubjectTitle.trim();
    if (!trimmed) {
      setIsEditingSubject(false);
      setEditingSubjectTitle(subject.title);
      return;
    }
    if (trimmed === subject.title) {
      setIsEditingSubject(false);
      return;
    }

    setLoading(true);
    try {
      await updateSubject(subject.id, trimmed);
      toast.success("Subject renamed successfully!");
      setIsEditingSubject(false);
      router.refresh();
    } catch (err) {
      toast.error("Failed to rename subject");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChapter = async (chapterId: string) => {
    const trimmed = editingChapterTitle.trim();
    if (!trimmed) {
      setEditingChapterId(null);
      return;
    }
    const currentChapter = subject.chapters.find((c) => c.id === chapterId);
    if (currentChapter && currentChapter.title === trimmed) {
      setEditingChapterId(null);
      return;
    }

    setLoading(true);
    try {
      await updateChapter(chapterId, trimmed);
      toast.success("Chapter title updated successfully!");
      setEditingChapterId(null);
      router.refresh();
    } catch (err) {
      toast.error("Failed to update chapter title");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    setLoading(true);
    try {
      await createChapter(subject.id, newChapterTitle.trim());
      toast.success(`Chapter "${newChapterTitle.trim()}" created successfully!`);
      setNewChapterTitle("");
      setIsCreatingChapter(false);
      router.refresh();
    } catch (err) {
      toast.error("Failed to create chapter");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (chapterId: string) => {
    if (!newNoteTitle.trim()) return;

    setLoading(true);
    try {
      const note = await createNote(chapterId, newNoteTitle.trim());
      toast.success(`Note "${newNoteTitle.trim()}" created successfully!`);
      setNewNoteTitle("");
      setCreatingNoteForChapterId(null);
      router.refresh();
      // Redirect straight to note editor:
      router.push(`/note/${note.id}`);
    } catch (err) {
      toast.error("Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (confirm(`Are you sure you want to delete "${subject.title}"? This will delete all chapters and notes inside it.`)) {
      setLoading(true);
      try {
        await deleteSubject(subject.id);
        toast.success(`Subject "${subject.title}" deleted successfully!`);
        router.push("/dashboard");
      } catch (err) {
        toast.error("Failed to delete subject");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteChapter = async (chapterId: string, title: string) => {
    if (confirm(`Are you sure you want to delete chapter "${title}"? This will delete all notes under it.`)) {
      setLoading(true);
      try {
        await deleteChapter(chapterId);
        toast.success(`Chapter "${title}" deleted successfully!`);
        router.refresh();
      } catch (err) {
        toast.error("Failed to delete chapter");
        console.error(err);
      } finally {
        setLoading(false);
      }
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

  return (
    <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Unified SideNavBar */}
      <Sidebar
        activeRoute={`/subject/${subject.id}`}
        activeSubject={{ id: subject.id, title: subject.title }}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[280px] flex flex-col h-screen overflow-hidden bg-background">
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-lg h-24 bg-background z-30 shrink-0">
          <div className="flex items-center gap-lg">
            <h2 className="md:hidden font-headline-sm font-bold text-primary">Scribt</h2>
            <div className="flex items-center gap-sm text-secondary font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">folder</span>
              <Link href="/dashboard" className="hover:text-primary cursor-pointer transition-colors">
                Subjects
              </Link>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-on-surface font-semibold">{subject.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-sm md:gap-md">
            <button className="w-10 h-10 flex items-center justify-center text-secondary hover:text-primary rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="w-10 h-10 flex items-center justify-center">
              <UserButton />
            </div>
          </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto px-md md:px-lg xl:px-margin-desktop pb-xl w-full max-w-[1200px] mx-auto">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-lg">
            <div>
              <div className="flex items-center gap-sm">
                <span className={`w-3.5 h-3.5 rounded-full ${subject.color || "bg-primary-fixed-dim"}`} />
                {isEditingSubject ? (
                  <input
                    type="text"
                    value={editingSubjectTitle}
                    onChange={(e) => setEditingSubjectTitle(e.target.value)}
                    onBlur={handleUpdateSubject}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateSubject();
                      if (e.key === "Escape") {
                        setIsEditingSubject(false);
                        setEditingSubjectTitle(subject.title);
                      }
                    }}
                    className="bg-surface-container-low border border-primary px-3 py-1 rounded-xl text-on-surface font-display-lg outline-none focus:ring-1 focus:ring-primary max-w-[320px] font-bold"
                    autoFocus
                    disabled={loading}
                  />
                ) : (
                  <div className="flex items-center gap-xs group/subject-title">
                    <h2 
                      onDoubleClick={() => {
                        setEditingSubjectTitle(subject.title);
                        setIsEditingSubject(true);
                      }}
                      className="font-display-lg text-primary font-bold cursor-pointer select-none"
                      title="Double click to rename"
                    >
                      {subject.title}
                    </h2>
                    <button
                      onClick={() => {
                        setEditingSubjectTitle(subject.title);
                        setIsEditingSubject(true);
                      }}
                      className="p-1 rounded-full text-secondary hover:text-primary hover:bg-surface-container-high transition-colors focus:outline-none opacity-0 group-hover/subject-title:opacity-100 focus:opacity-100"
                      title="Rename Subject"
                      disabled={loading}
                    >
                      <span className="material-symbols-outlined text-[18px] block">edit</span>
                    </button>
                  </div>
                )}
                <button
                  onClick={handleDeleteSubject}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:text-error hover:bg-error/10 transition-colors ml-xs"
                  title="Delete Subject"
                  disabled={loading}
                >
                  <span className="material-symbols-outlined text-[22px]">delete</span>
                </button>
              </div>
              <p className="font-body-lg text-secondary mt-1">
                {subject.chapters.length} Chapters • {subject.chapters.reduce((acc, c) => acc + c.notes.length, 0)} Notes
              </p>
            </div>
            
            <button
              onClick={() => setIsCreatingChapter((prev) => !prev)}
              className="bg-primary text-on-primary font-label-md px-lg py-sm rounded-full hover:bg-surface-tint transition-all flex items-center gap-xs shadow-ambient-raised"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Chapter
            </button>
          </div>

          {/* Create Chapter Modal */}
          {isCreatingChapter && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-md transition-all duration-300">
              <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-3xl max-w-full shadow-ambient-overlay flex flex-col gap-md relative overflow-hidden min-w-[320px]">
                {loading && (
                  <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-sm z-55 flex flex-col items-center justify-center">
                    <BookLoad />
                    <p className="text-secondary font-label-md mt-sm">Creating chapter...</p>
                  </div>
                )}
                <h3 className="font-headline-sm text-primary font-bold">New Chapter</h3>
                <p className="text-secondary text-sm">Add a new chapter to organize your notes inside this subject.</p>
                <form onSubmit={handleCreateChapter} className="flex flex-col gap-md">
                  <input
                    type="text"
                    placeholder="Chapter Title (e.g. Chapter 1: Introduction)"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="w-full h-12 px-md rounded-xl bg-surface-container-low border border-outline-variant outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-on-surface"
                    disabled={loading}
                    autoFocus
                  />
                  <div className="flex gap-md justify-end mt-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingChapter(false);
                        setNewChapterTitle("");
                      }}
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

          {/* Chapters grid */}
          <div className="flex flex-col gap-lg">
            {subject.chapters.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <span className="material-symbols-outlined text-outline text-5xl mb-sm block">folder_open</span>
                <h4 className="font-headline-sm text-on-surface mb-xs">No Chapters Yet</h4>
                <p className="text-secondary mb-md">Get started by creating your first chapter.</p>
                <button
                  onClick={() => setIsCreatingChapter(true)}
                  className="bg-primary/10 text-primary font-label-md px-lg py-sm rounded-full hover:bg-primary/20 transition-all inline-flex items-center gap-xs"
                  disabled={loading}
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Create Chapter
                </button>
              </div>
            ) : (
              subject.chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-md md:p-lg shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col gap-md"
                >
                  <div className="flex justify-between items-center border-b border-surface-container-high pb-sm">
                    <div className="flex items-center gap-sm flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center text-xs text-secondary font-bold font-mono shrink-0">
                        {chapter.order}
                      </span>
                      {editingChapterId === chapter.id ? (
                        <input
                          type="text"
                          value={editingChapterTitle}
                          onChange={(e) => setEditingChapterTitle(e.target.value)}
                          onBlur={() => handleUpdateChapter(chapter.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateChapter(chapter.id);
                            if (e.key === "Escape") setEditingChapterId(null);
                          }}
                          className="bg-surface-container-low border border-primary px-2 py-0.5 rounded text-on-surface font-headline-sm text-sm outline-none focus:ring-1 focus:ring-primary flex-1 max-w-[300px]"
                          autoFocus
                          disabled={loading}
                        />
                      ) : (
                        <div className="flex items-center gap-xs min-w-0 group/title">
                          <h3 className="font-headline-sm text-primary font-semibold truncate">
                            {chapter.title}
                          </h3>
                          <button
                            onClick={() => {
                              setEditingChapterId(chapter.id);
                              setEditingChapterTitle(chapter.title);
                            }}
                            className="p-1 rounded-full text-secondary hover:text-primary hover:bg-surface-container-high transition-colors focus:outline-none opacity-0 group-hover/title:opacity-100 focus:opacity-100"
                            title="Edit Chapter Title"
                            disabled={loading}
                          >
                            <span className="material-symbols-outlined text-[16px] block">edit</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-md">
                      <button
                        onClick={() => setCreatingNoteForChapterId(chapter.id)}
                        className="text-secondary hover:text-primary font-label-md flex items-center gap-xs"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Add Note
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chapter.id, chapter.title)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-error hover:bg-error/10 transition-colors"
                        title="Delete Chapter"
                        disabled={loading}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Notes list */}
                  <div className="flex flex-col gap-xs">
                    {chapter.notes.length === 0 ? (
                      <p className="text-secondary text-sm italic py-2 pl-2">No notes in this chapter yet.</p>
                    ) : (
                      chapter.notes.map((note) => (
                        <Link
                          key={note.id}
                          href={`/note/${note.id}`}
                          className="flex justify-between items-center px-md py-3 rounded-xl hover:bg-surface-container-low transition-colors group"
                        >
                          <div className="flex items-center gap-sm">
                            <span className="material-symbols-outlined text-secondary text-[18px]">description</span>
                            <span className="font-body-md font-medium text-on-surface group-hover:text-primary transition-colors">
                              {note.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-sm">
                            <span className="font-label-sm text-outline hidden md:block group-hover:hidden">
                              Created {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                            <button
                              onClick={(e) => handleDeleteNote(e, note.id, note.title)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100 z-10"
                              title="Delete Note"
                              disabled={loading}
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                            <span className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                              arrow_forward
                            </span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create Note Modal */}
          {creatingNoteForChapterId && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-md transition-all duration-300">
              <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-3xl max-w-full shadow-ambient-overlay flex flex-col gap-md relative overflow-hidden min-w-[320px]">
                {loading && (
                  <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-sm z-55 flex flex-col items-center justify-center">
                    <BookLoad />
                    <p className="text-secondary font-label-md mt-sm">Creating note...</p>
                  </div>
                )}
                <h3 className="font-headline-sm text-primary font-bold">New Note</h3>
                <p className="text-secondary text-sm">
                  Create a new note under chapter{" "}
                  <span className="font-semibold text-on-surface">
                    {subject.chapters.find((c) => c.id === creatingNoteForChapterId)?.title || ""}
                  </span>.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateNote(creatingNoteForChapterId);
                  }}
                  className="flex flex-col gap-md"
                >
                  <input
                    type="text"
                    placeholder="Note Title (e.g. Lecture 1 Notes)"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full h-12 px-md rounded-xl bg-surface-container-low border border-outline-variant outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-on-surface"
                    disabled={loading}
                    autoFocus
                  />
                  <div className="flex gap-md justify-end mt-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setCreatingNoteForChapterId(null);
                        setNewNoteTitle("");
                      }}
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
        </main>
      </div>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface-container-lowest border-t border-surface-container shadow-[0_-4px_24px_rgba(0,0,0,0.02)] md:hidden pb-2">
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-secondary w-16 h-14 rounded-2xl mt-2">
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-sm mt-1">Home</span>
        </Link>
        <button className="flex flex-col items-center justify-center text-primary font-bold w-16 h-14 rounded-2xl bg-surface-container-low mt-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            book
          </span>
          <span className="font-label-sm mt-1">Subject</span>
        </button>
        <Link href="/settings" className="flex flex-col items-center justify-center text-secondary w-16 h-14 rounded-2xl mt-2">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-sm mt-1">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
