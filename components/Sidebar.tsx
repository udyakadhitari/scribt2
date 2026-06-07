"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SidebarProps {
  activeRoute: string; // e.g. "/dashboard", "/whiteboard", "/journal", "/settings"
  activeTab?: string; // e.g. "dashboard", "subjects", "recent" (used when on the dashboard page)
  onTabChange?: (tab: string) => void; // tab switch callback for DashboardClient
  activeSubject?: {
    id: string;
    title: string;
  };
  activeChapterTitle?: string;
}

export default function Sidebar({
  activeRoute,
  activeTab = "dashboard",
  onTabChange,
  activeSubject,
  activeChapterTitle,
}: SidebarProps) {
  const router = useRouter();

  // Helper to handle Dashboard tab navigations
  const handleDashboardTabClick = (e: React.MouseEvent, tab: string) => {
    if (onTabChange) {
      e.preventDefault();
      onTabChange(tab);
    } else {
      // If we are not on the dashboard page, navigate with a query parameter
      router.push(`/dashboard?tab=${tab}`);
    }
  };

  const isDashboardActive = activeRoute === "/dashboard";
  const isJournalActive = activeRoute === "/journal";
  const isWhiteboardActive = activeRoute === "/whiteboard";
  const isSettingsActive = activeRoute === "/settings";

  return (
    <nav className="bg-surface-container-lowest w-[280px] h-screen hidden md:flex flex-col border-r border-outline-variant fixed left-0 top-0 bottom-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-lg flex items-center gap-sm">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
          <span className="material-symbols-outlined font-bold text-[20px]">ink_pen</span>
        </div>
        <div>
          <h1 className="font-headline-sm text-primary font-bold">Inkwell</h1>
          <p className="font-label-sm text-secondary">Technical Workspace</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-sm py-sm space-y-xs">
        {/* Dashboard Link */}
        <Link
          href="/dashboard"
          onClick={(e) => {
            if (onTabChange) {
              e.preventDefault();
              onTabChange("dashboard");
            }
          }}
          className={`flex items-center gap-md px-md py-3 rounded-full outline-none focus:outline-none transition-colors duration-200 ${
            isDashboardActive && activeTab === "dashboard"
              ? "text-primary font-bold bg-surface-container-low"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isDashboardActive && activeTab === "dashboard" ? "'FILL' 1" : "'FILL' 0" }}>
            dashboard
          </span>
          <span className="font-body-md">Dashboard</span>
        </Link>

        {/* Subjects Tab Link */}
        <Link
          href="/dashboard?tab=subjects"
          onClick={(e) => handleDashboardTabClick(e, "subjects")}
          className={`flex items-center gap-md px-md py-3 rounded-full outline-none focus:outline-none transition-colors duration-200 ${
            isDashboardActive && activeTab === "subjects"
              ? "text-primary font-bold bg-surface-container-low"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isDashboardActive && activeTab === "subjects" ? "'FILL' 1" : "'FILL' 0" }}>
            folder_open
          </span>
          <span className="font-body-md">Subjects</span>
        </Link>

        {/* Dynamic Context: Active Subject & Chapter nested under Subjects */}
        {activeSubject && (
          <div className="flex flex-col gap-xs my-xs pl-sm border-l border-outline-variant/30 ml-md">
            <Link
              href={`/subject/${activeSubject.id}`}
              className={`flex items-center gap-md pl-6 pr-md py-2 rounded-full outline-none focus:outline-none transition-colors duration-200 ${
                activeRoute.startsWith("/subject/") || activeRoute.startsWith("/editor/") || activeRoute.startsWith("/note/")
                  ? "text-primary font-bold bg-surface-container-low"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined text-[20px] fill">folder</span>
              <span className="font-body-sm truncate text-sm">{activeSubject.title}</span>
            </Link>

            {activeChapterTitle && (
              <div className="flex items-center gap-md pl-10 pr-md py-1.5 rounded-full text-outline select-none">
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                <span className="font-body-xs truncate text-xs w-full italic">{activeChapterTitle}</span>
              </div>
            )}
          </div>
        )}

        {/* Recent Tab Link */}
        <Link
          href="/dashboard?tab=recent"
          onClick={(e) => handleDashboardTabClick(e, "recent")}
          className={`flex items-center gap-md px-md py-3 rounded-full outline-none focus:outline-none transition-colors duration-200 ${
            isDashboardActive && activeTab === "recent"
              ? "text-primary font-bold bg-surface-container-low"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isDashboardActive && activeTab === "recent" ? "'FILL' 1" : "'FILL' 0" }}>
            history
          </span>
          <span className="font-body-md">Recent</span>
        </Link>

        {/* Whiteboard Link */}
        <Link
          href="/whiteboard"
          className={`flex items-center gap-md px-md py-3 rounded-full outline-none focus:outline-none transition-colors duration-200 ${
            isWhiteboardActive
              ? "text-primary font-bold bg-surface-container-low"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">gesture</span>
          <span className="font-body-md">Whiteboard</span>
        </Link>

        {/* Journaling Link */}
        <Link
          href="/journal"
          className={`flex items-center gap-md px-md py-3 rounded-full outline-none focus:outline-none transition-colors duration-200 ${
            isJournalActive
              ? "text-primary font-bold bg-surface-container-low"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isJournalActive ? "'FILL' 1" : "'FILL' 0" }}>
            book
          </span>
          <span className="font-body-md">Journaling</span>
        </Link>

        {/* Settings Link */}
        <Link
          href="/settings"
          className={`flex items-center gap-md px-md py-3 rounded-full outline-none focus:outline-none transition-colors duration-200 ${
            isSettingsActive
              ? "text-primary font-bold bg-surface-container-low"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isSettingsActive ? "'FILL' 1" : "'FILL' 0" }}>
            settings
          </span>
          <span className="font-body-md">Settings</span>
        </Link>
      </div>

      {/* Help Footer */}
      <div className="p-sm flex flex-col gap-xs mt-auto pb-lg border-t border-outline-variant/30">
        <Link
          href="/help"
          className={`flex items-center gap-md px-md py-3 rounded-full outline-none focus:outline-none transition-colors duration-200 ${
            activeRoute === "/help"
              ? "text-primary font-bold bg-surface-container-low"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeRoute === "/help" ? "'FILL' 1" : "'FILL' 0" }}>
            help_outline
          </span>
          <span className="font-body-md">Help</span>
        </Link>
      </div>
    </nav>
  );
}
