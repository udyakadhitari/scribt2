"use client";

import { useState } from "react";
import Link from "next/link";

interface Note {
  id: string;
  title: string;
  subject: string;
  lastModified: string;
  bgClass: string;
  textClass: string;
}

interface Subject {
  title: string;
  notesCount?: number;
  lastEdited: string;
  category: string;
  icon: string;
  bgClass: string;
  textClass: string;
  indicatorClass: string;
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  const subjects: Subject[] = [
    {
      title: "Advanced Calculus",
      lastEdited: "Last edited 2h ago",
      category: "Mathematics",
      icon: "calculate",
      bgClass: "bg-primary-fixed",
      textClass: "text-on-primary-fixed",
      indicatorClass: "bg-primary-fixed-dim",
    },
    {
      title: "Data Structures",
      notesCount: 14,
      lastEdited: "Last edited yesterday",
      category: "Comp Sci",
      icon: "terminal",
      bgClass: "bg-secondary-fixed",
      textClass: "text-on-secondary-fixed",
      indicatorClass: "bg-secondary-fixed-dim",
    },
    {
      title: "Modernist Poetry",
      notesCount: 3,
      lastEdited: "Last edited 3d ago",
      category: "Literature",
      icon: "auto_stories",
      bgClass: "bg-tertiary-fixed",
      textClass: "text-on-tertiary-fixed",
      indicatorClass: "bg-tertiary-fixed-dim",
    },
  ];

  const recentNotes: Note[] = [
    {
      id: "note-1",
      title: "Integration by Parts Examples",
      subject: "Mathematics",
      lastModified: "2 hours ago",
      bgClass: "bg-primary-fixed",
      textClass: "text-on-primary-fixed",
    },
    {
      id: "note-2",
      title: "Binary Search Tree Implementation",
      subject: "Comp Sci",
      lastModified: "Yesterday",
      bgClass: "bg-secondary-fixed",
      textClass: "text-on-secondary-fixed",
    },
    {
      id: "note-3",
      title: "T.S. Eliot 'The Waste Land' Analysis",
      subject: "Literature",
      lastModified: "Oct 24",
      bgClass: "bg-tertiary-fixed",
      textClass: "text-on-tertiary-fixed",
    },
    {
      id: "note-4",
      title: "Graph Traversal Algorithms (BFS/DFS)",
      subject: "Comp Sci",
      lastModified: "Oct 20",
      bgClass: "bg-secondary-fixed",
      textClass: "text-on-secondary-fixed",
    },
  ];

  const filteredNotes = recentNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubjects = subjects.filter(
    (subj) =>
      subj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subj.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
      
      {/* SideNavBar (Desktop Only) */}
      <nav className="w-[280px] h-screen hidden md:flex flex-col bg-surface-container-lowest fixed left-0 top-0 bottom-0 z-40 border-r border-surface-container-high">
        {/* Header */}
        <div className="p-lg flex items-center gap-sm">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined font-bold text-[20px]">ink_pen</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-primary font-bold">Inkwell</h1>
            <p className="font-label-sm text-secondary">Technical Workspace</p>
          </div>
        </div>

        {/* CTA: Creates a new note, pointing to editor */}
        <div className="px-md mb-lg">
          <Link
            href="/editor"
            className="w-full bg-primary text-on-primary font-label-md h-12 rounded-full flex items-center justify-center gap-sm hover:bg-surface-tint transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Note
          </Link>
        </div>

        {/* Main Tabs */}
        <div className="flex-1 px-sm flex flex-col gap-xs overflow-y-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-sm px-md py-3 rounded-full text-left font-bold transition-all duration-200 ${
              activeTab === "dashboard"
                ? "text-primary bg-surface-container scale-[1.01]"
                : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "dashboard" ? "'FILL' 1" : "'FILL' 0" }}>
              dashboard
            </span>
            Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab("subjects")}
            className={`flex items-center gap-sm px-md py-3 rounded-full text-left font-bold transition-all duration-200 ${
              activeTab === "subjects"
                ? "text-primary bg-surface-container scale-[1.01]"
                : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "subjects" ? "'FILL' 1" : "'FILL' 0" }}>
              folder_open
            </span>
            Subjects
          </button>
          
          <button
            onClick={() => setActiveTab("recent")}
            className={`flex items-center gap-sm px-md py-3 rounded-full text-left font-bold transition-all duration-200 ${
              activeTab === "recent"
                ? "text-primary bg-surface-container scale-[1.01]"
                : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "recent" ? "'FILL' 1" : "'FILL' 0" }}>
              history
            </span>
            Recent
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-sm px-md py-3 rounded-full text-left font-bold transition-all duration-200 ${
              activeTab === "ai"
                ? "text-primary bg-surface-container scale-[1.01]"
                : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "ai" ? "'FILL' 1" : "'FILL' 0" }}>
              smart_toy
            </span>
            AI Assistant
          </button>

          <Link
            href="/design-system"
            className="flex items-center gap-sm px-md py-3 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors duration-200"
          >
            <span className="material-symbols-outlined">palette</span>
            Style Guide
          </Link>
        </div>

        {/* Footer Tabs */}
        <div className="p-sm flex flex-col gap-xs mt-auto pb-lg">
          <a className="flex items-center gap-sm px-md py-3 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">help_outline</span>
            Help
          </a>
          <a className="flex items-center gap-sm px-md py-3 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">archive</span>
            Archived
          </a>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[280px] flex flex-col h-screen overflow-hidden bg-background">
        
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-lg h-24 bg-background z-30 shrink-0">
          {/* Mobile Brand / Desktop Search */}
          <div className="flex items-center gap-lg">
            <h2 className="md:hidden font-headline-sm font-bold text-primary">Inkwell</h2>
            {/* Search Bar */}
            <div className="hidden md:flex items-center relative w-72 group">
              <span className="material-symbols-outlined absolute left-4 text-secondary text-[20px] group-focus-within:text-primary transition-colors">
                search
              </span>
              <input
                className="w-full h-12 pl-12 pr-14 rounded-full bg-surface-container-lowest focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline font-body-md transition-all outline-none shadow-[0_2px_8px_rgba(0,0,0,0.02)] border-none"
                placeholder="Search notes or subjects..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-3 flex items-center gap-1">
                <kbd className="font-label-sm text-outline bg-surface-container-low px-1.5 py-0.5 rounded-md">⌘</kbd>
                <kbd className="font-label-sm text-outline bg-surface-container-low px-1.5 py-0.5 rounded-md">K</kbd>
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-lg">
            <Link className="font-label-md text-primary font-bold hover:text-primary transition-colors" href="/dashboard">
              Notes
            </Link>
            <Link className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="/editor">
              Drafts
            </Link>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">
              Shared
            </a>
          </nav>

          {/* Trailing Actions */}
          <div className="flex items-center gap-sm md:gap-md">
            {/* Mobile Search input placeholder */}
            <div className="flex md:hidden relative items-center">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 focus:w-48 h-9 px-3 text-sm rounded-full bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all border-none outline-none"
              />
            </div>
            
            <button className="w-10 h-10 flex items-center justify-center text-secondary hover:text-primary rounded-full hover:bg-surface-container transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-background"></span>
            </button>
            
            <button className="w-10 h-10 rounded-full overflow-hidden shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/20">
              <img
                alt="User Avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ41GHxMEbb4j2ETMxPnmi0zU20XrIgS7YHQUtgvySU7C6I8iCZ9W8QBgIyN3PrqgM6bnTERuE2a3NOOg8OhVr2DUthXoN12D98J__TtTaszX3kVdb4D_L6rQakrkAeA_vpjSKQpyCsjTfW06waG1pAnA993tdekvjvJNIcuVlUKCS-nyUXN2Wv9CmT5d9avBjZQDFhQKDbqF6OYsPMECvPmVO3d6QGXU6VuGkb20SewO54Wkg5h5hnCJoYIqQjPDEpDfMVMJu6Rz8"
              />
            </button>
          </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto px-md md:px-lg xl:px-margin-desktop pb-xl w-full max-w-[1200px] mx-auto">
          
          <div className="mb-lg">
            <h2 className="font-display-lg text-primary mb-sm">Good morning, Alex.</h2>
            <p className="font-body-lg text-secondary">Here&apos;s a look at your current workspace.</p>
          </div>

          {/* Tab Content 1: Active Subjects */}
          {(activeTab === "dashboard" || activeTab === "subjects") && (
            <section className="mb-xl">
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-headline-md text-on-surface font-semibold">Active Subjects</h3>
                <button
                  onClick={() => setActiveTab("subjects")}
                  className="font-label-md text-primary hover:text-surface-tint flex items-center gap-xs"
                >
                  View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>

              {filteredSubjects.length === 0 ? (
                <p className="text-secondary italic">No subjects matching your search.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                  {filteredSubjects.map((subj, index) => (
                    <Link
                      key={index}
                      href="/editor"
                      className="bg-surface-container-lowest rounded-2xl p-md shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all cursor-pointer group flex flex-col h-48 border border-surface-container-lowest hover:border-surface-container-high"
                    >
                      <div className="flex justify-between items-start mb-auto">
                        <div className={`w-12 h-12 rounded-full ${subj.bgClass} ${subj.textClass} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                          <span className="material-symbols-outlined">{subj.icon}</span>
                        </div>
                        <span className="font-label-sm px-3 py-1 bg-surface-container rounded-full text-secondary flex items-center gap-xs">
                          <span className={`w-2 h-2 rounded-full ${subj.indicatorClass}`}></span>
                          {subj.category}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-headline-sm text-on-surface mb-xs group-hover:text-primary transition-colors">
                          {subj.title}
                        </h4>
                        <p className="font-label-md text-secondary">
                          {subj.notesCount ? `${subj.notesCount} notes • ` : ""}
                          {subj.lastEdited}
                        </p>
                      </div>
                    </Link>
                  ))}
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
                  <div className="col-span-6">Title</div>
                  <div className="col-span-3">Subject</div>
                  <div className="col-span-3 text-right">Last Modified</div>
                </div>

                {/* List Items */}
                {filteredNotes.length === 0 ? (
                  <p className="p-md text-secondary italic text-center">No notes matching your search query.</p>
                ) : (
                  <div className="flex flex-col gap-xs">
                    {filteredNotes.map((note) => (
                      <Link
                        key={note.id}
                        href="/editor"
                        className="grid grid-cols-1 sm:grid-cols-12 gap-y-2 gap-x-sm px-md py-3 items-center hover:bg-surface-container-low transition-colors group rounded-xl"
                      >
                        <div className="col-span-1 sm:col-span-6 flex items-center gap-sm">
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-surface-container-high transition-colors">
                            <span className="material-symbols-outlined text-secondary text-[18px]">description</span>
                          </div>
                          <span className="font-body-md font-medium text-on-surface group-hover:text-primary transition-colors">
                            {note.title}
                          </span>
                        </div>
                        <div className="col-span-1 sm:col-span-3">
                          <span className={`font-label-sm px-3 py-1 ${note.bgClass} ${note.textClass} rounded-full`}>
                            {note.subject}
                          </span>
                        </div>
                        <div className="col-span-1 sm:col-span-3 font-label-md text-secondary sm:text-right">
                          {note.lastModified}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* AI Assistant tab view */}
          {activeTab === "ai" && (
            <section className="mb-xl max-w-2xl bg-surface-container-lowest p-lg rounded-2xl shadow-sm border border-surface-container-high">
              <div className="flex items-center gap-sm mb-md text-primary">
                <span className="material-symbols-outlined text-4xl fill">smart_toy</span>
                <div>
                  <h3 className="font-headline-md font-semibold">Inkwell AI Companion</h3>
                  <p className="text-secondary text-sm">Ask questions, explain code snippets, or generate content.</p>
                </div>
              </div>
              <p className="text-on-surface-variant leading-relaxed mb-md">
                The Inkwell AI assistant is integrated directly into your editor view. Select any text while writing, and the AI panel will slide open with customized suggestions.
              </p>
              <Link href="/editor" className="inline-flex bg-primary text-on-primary font-label-md px-lg py-sm rounded-full hover:bg-surface-tint transition-colors">
                Open Editor with AI Sidebar
              </Link>
            </section>
          )}

        </main>
      </div>

      {/* BottomNavBar (Mobile Only Navigation) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface-container-lowest border-t border-surface-container shadow-[0_-4px_24px_rgba(0,0,0,0.02)] md:hidden pb-2">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl mt-2 transition-all ${
            activeTab === "dashboard" ? "text-primary bg-surface-container-low font-bold" : "text-secondary hover:text-on-surface"
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
            activeTab === "subjects" ? "text-primary bg-surface-container-low font-bold" : "text-secondary hover:text-on-surface"
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
            activeTab === "recent" ? "text-primary bg-surface-container-low font-bold" : "text-secondary hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "recent" ? "'FILL' 1" : "'FILL' 0" }}>
            history
          </span>
          <span className="font-label-sm mt-1">Recent</span>
        </button>
        <Link
          href="/design-system"
          className="flex flex-col items-center justify-center text-secondary hover:text-on-surface w-16 h-14 rounded-2xl hover:bg-surface-container-low mt-2 transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-sm mt-1">Styles</span>
        </Link>
      </nav>
      
    </div>
  );
}
