"use client";

import { useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import Sidebar from "@/components/Sidebar";

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState("all");

  const helpTopics = [
    {
      id: "general",
      category: "general",
      icon: "dashboard",
      title: "Workspace Basics",
      description: "Learn how to organize your workspace using Subjects, Chapters, and Notes.",
      steps: [
        "Create a Subject from the Dashboard to serve as a high-level folder (e.g. Mathematics).",
        "Within a Subject page, click 'Add Chapter' to structure your curriculum or projects.",
        "Add Notes inside individual chapters to start writing document content.",
        "Rename Subjects and Chapters anytime by double-clicking their titles or clicking the pencil edit icons."
      ]
    },
    {
      id: "editor",
      category: "editor",
      icon: "edit_note",
      title: "Tiptap Document Editor",
      description: "Unlock full document formatting, symbols integration, and table editing.",
      steps: [
        "Double-click headers or edit the sheet title at the top of any note to rename the document.",
        "Use the visual toolbar to format text (Bold, Italic, Code, Sub/Superscripts) and align paragraphs.",
        "Create complex tables with custom cell selections, row/column insertion dropdowns, and borders.",
        "Press '/' anywhere on a new line to summon the Floating Slash Suggestions Menu for quick blocks insertion.",
        "Press 'Command+/' or the status bar button to insert Special Characters and Emojis."
      ]
    },
    {
      id: "whiteboard",
      category: "whiteboard",
      icon: "gesture",
      title: "Interactive Whiteboard",
      description: "Use Excalidraw's sketching engine for architectural diagrams and notes.",
      steps: [
        "Select the 'Whiteboard' tab from the sidebar to open a clean infinite canvas.",
        "Draw shapes, lines, text blocks, and freehand sketches with full keyboard shortcut support.",
        "Export your work instantly as PNG, SVG, or save the raw .excalidraw scene to disk.",
        "Import previous scenes back onto the canvas to resume sketching from where you left off.",
        "Clear the canvas at any time using the trash sweep button."
      ]
    },
    {
      id: "journal",
      category: "journal",
      icon: "book",
      title: "Personal Journaling",
      description: "Document daily reflections on a beautiful, blue-ruled notebook paper.",
      steps: [
        "Select 'Journaling' from the sidebar to view your chronological list of reflections grouped by month.",
        "Click 'Write Entry' to create a new page, automatically stamped with today's local date.",
        "Change the date or title of the entry by double-clicking them in the protected header mask.",
        "Toggle your daily mood (Happy, Peaceful, Thoughtful, etc.) using the floating emoji selector bar.",
        "Typing auto-saves instantly and aligns characters perfectly on pre-drawn blue rules."
      ]
    },
    {
      id: "ai",
      category: "ai",
      icon: "chat",
      title: "AI Chat Assistant & Grammar",
      description: "Review grammar using server actions and brainstorm with a resizable AI panel.",
      steps: [
        "Toggle the resizable AI Assistant chat panel using the Chat Icon in the document header.",
        "Highlight text in your note to automatically prompt the chatbot or trigger rewrite actions.",
        "Click 'Check Grammar' in the document status bar to process text highlights using LanguageTool API.",
        "Click the suggestion cards in the grammar panel to instantly correct errors in your editor."
      ]
    }
  ];

  const filteredTopics = activeTab === "all" ? helpTopics : helpTopics.filter(t => t.category === activeTab);

  return (
    <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
      
      {/* Unified SideNavBar */}
      <Sidebar activeRoute="/help" />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[280px] flex flex-col h-screen overflow-hidden bg-background">
        
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-lg h-24 bg-background z-30 shrink-0">
          <div className="flex items-center gap-lg">
            <h2 className="md:hidden font-headline-sm font-bold text-primary">Inkwell</h2>
            <div className="flex items-center gap-sm text-secondary font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">help_outline</span>
              <span className="text-on-surface font-semibold">Help & Documentation</span>
            </div>
          </div>

          {/* Trailing Actions */}
          <div className="flex items-center gap-sm md:gap-md">
            <div className="w-10 h-10 flex items-center justify-center">
              <UserButton />
            </div>
          </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto px-md md:px-lg xl:px-margin-desktop pb-xl w-full max-w-[900px] mx-auto">
          
          <div className="mb-lg">
            <h2 className="font-display-lg text-primary mb-sm">How can we help?</h2>
            <p className="font-body-lg text-secondary">Browse user guides, markdown configurations, and sketching workspace controls.</p>
          </div>

          {/* Tabs selector */}
          <div className="flex flex-wrap gap-xs mb-lg border-b border-outline-variant/30 pb-sm">
            {["all", "general", "editor", "whiteboard", "journal", "ai"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-md py-2 rounded-full font-label-md text-sm transition-all border border-transparent cursor-pointer capitalize ${
                  activeTab === tab
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-secondary hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                {tab === "all" ? "All Features" : tab === "ai" ? "AI & Grammar" : tab}
              </button>
            ))}
          </div>

          {/* Help Cards */}
          <div className="flex flex-col gap-lg">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-lg shadow-ambient-raised flex flex-col gap-md relative overflow-hidden"
              >
                <div>
                  <h3 className="font-headline-sm text-primary font-bold flex items-center gap-sm">
                    <span className="material-symbols-outlined text-[24px] text-secondary">{topic.icon}</span>
                    {topic.title}
                  </h3>
                  <p className="text-sm text-secondary mt-1">{topic.description}</p>
                </div>

                <div className="border-t border-outline-variant/30 my-xs" />

                <div className="flex flex-col gap-sm">
                  <span className="font-label-md text-on-surface font-semibold">Step-by-Step Guide:</span>
                  <ul className="list-disc pl-5 space-y-xs text-sm text-secondary font-body-md">
                    {topic.steps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>

      {/* BottomNavBar (Mobile Only Navigation) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface-container-lowest border-t border-surface-container shadow-[0_-4px_24px_rgba(0,0,0,0.02)] md:hidden pb-2">
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center text-secondary w-16 h-14 rounded-2xl mt-2 transition-all"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-sm mt-1">Home</span>
        </Link>
        <Link
          href="/dashboard?tab=subjects"
          className="flex flex-col items-center justify-center text-secondary w-16 h-14 rounded-2xl mt-2 transition-all"
        >
          <span className="material-symbols-outlined">book</span>
          <span className="font-label-sm mt-1">Subjects</span>
        </Link>
        <Link
          href="/help"
          className="flex flex-col items-center justify-center text-primary bg-surface-container-low font-bold w-16 h-14 rounded-2xl mt-2 transition-colors animate-pulse"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            help_outline
          </span>
          <span className="font-label-sm mt-1">Help</span>
        </Link>
      </nav>
      
    </div>
  );
}
