"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import Sidebar from "@/components/Sidebar";

import toast from "react-hot-toast";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("scribt-gemini-api-key") || "";
      setApiKey(saved);
    }
  }, []);

  const handleSaveKey = () => {
    try {
      localStorage.setItem("scribt-gemini-api-key", apiKey.trim());
      toast.success("Gemini API Key saved successfully!");
    } catch (err) {
      toast.error("Failed to save API Key");
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
      
      {/* Unified SideNavBar */}
      <Sidebar activeRoute="/settings" />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[280px] flex flex-col h-screen overflow-hidden bg-background">
        
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-lg h-24 bg-background z-30 shrink-0">
          <div className="flex items-center gap-lg">
            <h2 className="md:hidden font-headline-sm font-bold text-primary">Scribt</h2>
            <div className="flex items-center gap-sm text-secondary font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">settings</span>
              <span className="text-on-surface font-semibold">Settings</span>
            </div>
          </div>

          {/* Trailing Actions */}
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
        <main className="flex-1 overflow-y-auto px-md md:px-lg xl:px-margin-desktop pb-xl w-full max-w-[800px] mx-auto">
          
          <div className="mb-lg">
            <h2 className="font-display-lg text-primary mb-sm">Settings</h2>
            <p className="font-body-lg text-secondary">Manage your workspace configuration and integration keys.</p>
          </div>

          <div className="flex flex-col gap-lg">
            
            {/* Card for API Keys */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-lg shadow-ambient-raised flex flex-col gap-md relative overflow-hidden">
              <div>
                <h3 className="font-headline-sm text-primary font-bold flex items-center gap-xs">
                  <span className="material-symbols-outlined fill">key</span>
                  AI Integration Keys
                </h3>
                <p className="text-sm text-secondary mt-1">
                  Configure your custom Google Gemini API Key. AI features will only run if a valid key is provided.
                </p>
              </div>

              <div className="border-t border-outline-variant/30 my-sm" />

              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-on-surface font-semibold">Google Gemini API Key</label>
                <div className="relative flex gap-sm">
                  <input
                    type="password"
                    placeholder="Enter your Gemini API key (e.g. AIzaSy...)"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-grow h-12 px-md rounded-xl bg-surface-container-low border border-outline-variant outline-none text-on-surface placeholder:text-outline"
                  />
                  <button
                    onClick={handleSaveKey}
                    className="bg-primary text-on-primary rounded-xl px-6 h-12 font-label-md hover:bg-surface-tint transition-all cursor-pointer border-0"
                  >
                    Save Key
                  </button>
                </div>
                <p className="text-xs text-outline">
                  Your API key is stored safely inside your local browser storage and is forwarded directly to the Gemini API endpoint.
                </p>
              </div>
            </div>

            {/* Premium Theme Preference Section */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-lg shadow-ambient-raised flex flex-col gap-md">
              <div>
                <h3 className="font-headline-sm text-primary font-bold flex items-center gap-xs">
                  <span className="material-symbols-outlined">palette</span>
                  Workspace Theme
                </h3>
                <p className="text-sm text-secondary mt-1">
                  Manage the aesthetic styling of your technical notes and canvas interfaces.
                </p>
              </div>

              <div className="border-t border-outline-variant/30 my-sm" />

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-md text-on-surface font-semibold block">Aesthetic Warmth Mode</span>
                  <span className="text-xs text-secondary">Quiet luxury color palette matching premium writing surfaces.</span>
                </div>
                <span className="font-label-sm px-3 py-1 bg-primary/10 text-primary rounded-full font-bold">
                  Active
                </span>
              </div>
            </div>

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
          href="/dashboard"
          className="flex flex-col items-center justify-center text-secondary w-16 h-14 rounded-2xl mt-2 transition-all"
        >
          <span className="material-symbols-outlined">book</span>
          <span className="font-label-sm mt-1">Subjects</span>
        </Link>
        <button
          className="flex flex-col items-center justify-center text-primary bg-surface-container-low font-bold w-16 h-14 rounded-2xl mt-2 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            settings
          </span>
          <span className="font-label-sm mt-1">Settings</span>
        </button>
      </nav>
      
    </div>
  );
}
