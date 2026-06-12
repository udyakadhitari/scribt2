"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import "@excalidraw/excalidraw/index.css";

// Dynamically import Excalidraw to bypass SSR errors
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

export default function DemoPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"note" | "whiteboard" | "journal">("note");

  // In-Memory Note State
  const [noteTitle, setNoteTitle] = useState("Demo Note: Organic Minimalism");
  const [noteContent, setNoteContent] = useState("");
  const noteContentRef = useRef<HTMLDivElement>(null);

  // In-Memory Whiteboard State (Excalidraw API)
  const [whiteboardElements, setWhiteboardElements] = useState<readonly any[]>([]);
  const excalidrawAPIRef = useRef<any>(null);

  // In-Memory Journal State
  const [journalTitle, setJournalTitle] = useState("First Impression");
  const [journalContent, setJournalContent] = useState(
    "Today I discovered Scribt! The interface is incredibly relaxing. It lets me focus on writing without any distraction."
  );
  const [journalMood, setJournalMood] = useState("thoughtful");
  const [journalDate, setJournalDate] = useState(() => {
    return new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
  });

  // Mock AI Chat Assistant state
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      sender: "ai",
      text: "Welcome to the Scribt Demo! In the full app, I can rewrite paragraphs, check grammar, and generate outlines. How can I help you today?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Format command helper for Note Editor
  const formatText = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { sender: "user", text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const aiMsg = {
        sender: "ai",
        text: "This is a simulated AI assistant for the demo workspace. Sign in to Scribt and provide your Gemini API key to activate full contextual document editing, grammar checking, and explanations!",
      };
      setChatMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  const moods = [
    { emoji: "😊", label: "happy" },
    { emoji: "🧘", label: "peaceful" },
    { emoji: "🧠", label: "thoughtful" },
    { emoji: "⚡", label: "excited" },
    { emoji: "😢", label: "sad" },
    { emoji: "😰", label: "stressed" },
  ];

  return (
    <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden antialiased select-none">
      
      {/* Dynamic Fonts Import */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Fraunces:opsz,wght@9..144,300;400;600;700&display=swap');
        
        .font-fraunces {
          font-family: 'Fraunces', serif;
        }
        .font-cursive-caveat {
          font-family: 'Caveat', cursive;
        }
        
        /* Blue notebook ruled lines for journal */
        .journal-paper {
          background-color: #fff8f5;
          background-image: linear-gradient(#90b0c0 1px, transparent 1px);
          background-size: 100% 28px;
          line-height: 28px;
          border-left: 2px solid #fd9d7f;
          padding-left: 56px;
        }
        
        /* Hide Excalidraw hamburger menu */
        .main-menu-trigger { display: none !important; }
      `}} />

      {/* Sidebar navigation */}
      <aside className="bg-surface-container-lowest w-[280px] h-screen hidden md:flex flex-col border-r border-outline-variant select-none">
        <div className="p-4 flex items-center justify-center w-full">
          <Link href="/dashboard" className="outline-none flex justify-center">
            <Logo className="h-30 w-auto hover:opacity-90 transition-opacity" />
          </Link>
        </div>

        <div className="px-md pb-md">
          <div className="w-full bg-primary/10 text-primary font-label-md text-xs py-2 px-md rounded-xl flex items-center justify-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
            Temporary Demo Session
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex-1 overflow-y-auto px-sm py-sm space-y-xs">
          <button
            onClick={() => setActiveTab("note")}
            className={`w-full flex items-center gap-md px-md py-3 rounded-full outline-none transition-colors duration-200 text-left cursor-pointer ${
              activeTab === "note"
                ? "text-primary font-bold bg-surface-container-low"
                : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">description</span>
            <span className="font-body-md">Demo Note</span>
          </button>

          <button
            onClick={() => setActiveTab("whiteboard")}
            className={`w-full flex items-center gap-md px-md py-3 rounded-full outline-none transition-colors duration-200 text-left cursor-pointer ${
              activeTab === "whiteboard"
                ? "text-primary font-bold bg-surface-container-low"
                : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">gesture</span>
            <span className="font-body-md">Demo Whiteboard</span>
          </button>

          <button
            onClick={() => setActiveTab("journal")}
            className={`w-full flex items-center gap-md px-md py-3 rounded-full outline-none transition-colors duration-200 text-left cursor-pointer ${
              activeTab === "journal"
                ? "text-primary font-bold bg-surface-container-low"
                : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">book</span>
            <span className="font-body-md">Demo Journal</span>
          </button>
        </div>

        {/* Exit footer */}
        <div className="p-sm border-t border-outline-variant/30 pb-lg">
          <Link
            href="/"
            className="flex items-center gap-md px-md py-3 rounded-full text-secondary hover:text-error hover:bg-error/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="font-body-md">Exit Demo</span>
          </Link>
        </div>
      </aside>

      {/* Main workspace view */}
      <div className="flex-grow flex flex-col md:pl-0 h-screen overflow-hidden bg-background">
        
        {/* Header bar */}
        <header className="h-16 flex items-center justify-between px-lg border-b border-outline-variant bg-surface-container-lowest shrink-0">
          <div className="flex items-center gap-sm text-secondary font-body-md text-body-md select-none">
            <span className="material-symbols-outlined text-[18px]">construction</span>
            <span className="font-semibold text-primary capitalize">Scribt Demo / {activeTab}</span>
            <span className="ml-lg text-outline font-label-sm text-label-sm flex items-center gap-xs">
              <span className="material-symbols-outlined text-[14px]">lock_reset</span>
              In-Memory Session
            </span>
          </div>
          <div className="flex items-center gap-sm">
            <Link
              href="/"
              className="text-xs bg-primary text-on-primary rounded-lg px-4 py-1.5 font-label-md font-semibold hover:bg-surface-tint transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </header>

        {/* Workspace Canvas */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* TAB 1: NOTE EDITOR */}
          {activeTab === "note" && (
            <div className="flex-grow flex overflow-hidden">
              <main className="flex-1 overflow-y-auto bg-surface relative">
                <div className="max-w-[850px] mx-auto px-lg py-xl min-h-full pb-32">
                  
                  {/* Note Title Input */}
                  <div className="mb-lg">
                    <input
                      className="w-full bg-transparent border-none text-4xl font-fraunces text-on-surface focus:ring-0 p-0 placeholder-outline-variant outline-none font-semibold border-0"
                      placeholder="Note Title"
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                    />
                  </div>

                  {/* Text Toolbar */}
                  <div className="h-12 flex items-center border-y border-outline-variant/50 bg-surface/50 shrink-0 gap-md overflow-x-auto mb-lg">
                    <div className="flex items-center gap-xs pr-md border-r border-outline-variant/30">
                      <button onClick={() => formatText("formatBlock", "<h1>")} className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded font-bold text-xs">H1</button>
                      <button onClick={() => formatText("formatBlock", "<h2>")} className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded font-bold text-xs">H2</button>
                    </div>
                    <div className="flex items-center gap-xs px-md border-r border-outline-variant/30">
                      <button onClick={() => formatText("bold")} className="p-1 hover:bg-surface-container-high rounded"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
                      <button onClick={() => formatText("italic")} className="p-1 hover:bg-surface-container-high rounded"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
                      <button onClick={() => formatText("underline")} className="p-1 hover:bg-surface-container-high rounded"><span className="material-symbols-outlined text-[18px]">format_underlined</span></button>
                    </div>
                    <div className="flex items-center gap-xs pl-md">
                      <button onClick={() => formatText("insertUnorderedList")} className="p-1 hover:bg-surface-container-high rounded"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
                      <button onClick={() => formatText("insertOrderedList")} className="p-1 hover:bg-surface-container-high rounded"><span className="material-symbols-outlined text-[18px]">format_list_numbered</span></button>
                    </div>
                  </div>

                  {/* Prose Editable Canvas */}
                  <div
                    className="prose max-w-none font-body-lg text-body-lg text-on-surface outline-none relative min-h-[50vh]"
                    contentEditable="true"
                    suppressContentEditableWarning
                    ref={noteContentRef}
                    onInput={() => setNoteContent(noteContentRef.current?.innerHTML || "")}
                  >
                    <p>Welcome to your <strong>Scribt</strong> demo editor!</p>
                    <p>Scribt is built for quiet luxury. Highlight text to format it, or use the toolbar above to structure your thoughts. In the full application, your note is automatically synchronized in real-time across your devices and with collaborators.</p>
                    <p>Try writing some notes here to test the minimalist editor canvas.</p>
                  </div>
                </div>
              </main>

              {/* Simulated AI Sidebar */}
              <aside className="w-[320px] bg-surface border-l border-outline-variant flex flex-col shrink-0">
                <div className="h-12 flex items-center justify-between px-md shrink-0 border-b border-outline-variant">
                  <div className="flex items-center gap-xs text-primary">
                    <span className="material-symbols-outlined fill text-[20px]">smart_toy</span>
                    <span className="font-label-md text-label-md font-bold">AI Assistant</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-md space-y-md">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex gap-sm ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-xs ${
                        msg.sender === "user" ? "bg-secondary-container text-on-secondary-container" : "bg-primary-container text-on-primary-container"
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {msg.sender === "user" ? "person" : "smart_toy"}
                        </span>
                      </div>
                      <div className={`p-sm rounded-2xl text-xs text-on-surface w-full max-w-[85%] leading-relaxed ${
                        msg.sender === "user" ? "bg-surface-container rounded-tr-none" : "bg-surface-container-low rounded-tl-none"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && <div className="text-xs text-secondary animate-pulse italic">Thinking...</div>}
                </div>

                {/* Input form */}
                <form onSubmit={handleSendMessage} className="p-sm border-t border-outline-variant bg-surface flex items-center relative">
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-md pr-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Ask AI assistant..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="absolute right-2.5 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-surface-tint border-0 cursor-pointer">
                    <span className="material-symbols-outlined text-[12px]">arrow_upward</span>
                  </button>
                </form>
              </aside>
            </div>
          )}

          {/* TAB 2: WHITEBOARD */}
          {activeTab === "whiteboard" && (
            <div className="flex-grow h-full relative">
              <Excalidraw
                excalidrawAPI={(api: any) => { excalidrawAPIRef.current = api; }}
                initialData={{
                  elements: whiteboardElements,
                  appState: { theme: "light", viewBackgroundColor: "#ffffff", gridModeEnabled: false },
                }}
                onChange={(elements) => setWhiteboardElements(elements)}
              />
            </div>
          )}

          {/* TAB 3: JOURNAL */}
          {activeTab === "journal" && (
            <main className="flex-grow overflow-y-auto bg-[#fff8f5] p-lg flex flex-col items-center">
              <div className="max-w-[750px] w-full bg-[#fff8f5] border border-outline-variant/40 shadow-soft rounded-3xl p-lg md:p-xl min-h-[70vh]">
                
                {/* Journal Date Header */}
                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-sm mb-lg">
                  <div className="flex items-center gap-md">
                    <div className="flex flex-col items-center justify-center w-14 h-16 bg-surface-container-high rounded-xl border border-outline-variant/30 select-none">
                      <span className="text-[10px] uppercase font-bold text-secondary tracking-widest leading-none">DEMO</span>
                      <span className="text-2xl font-bold text-primary mt-[2px] leading-none">★</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={journalTitle}
                        onChange={(e) => setJournalTitle(e.target.value)}
                        className="bg-transparent border-none text-3xl font-cursive-caveat font-bold text-on-surface outline-none focus:ring-0 p-0 max-w-full border-0"
                      />
                      <p className="text-xs text-secondary mt-0.5">{journalDate}</p>
                    </div>
                  </div>

                  {/* Mood Icon Picker */}
                  <div className="flex gap-1">
                    {moods.map((m) => (
                      <button
                        key={m.label}
                        onClick={() => setJournalMood(m.label)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-surface-container-high transition-all border-0 cursor-pointer ${
                          journalMood === m.label ? "bg-primary/10 scale-110 shadow-sm border border-primary/20" : "opacity-65"
                        }`}
                        title={m.label}
                      >
                        {m.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Journal Notebook ruled paper */}
                <textarea
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  className="w-full min-h-[450px] bg-transparent border-none outline-none resize-none font-cursive-caveat text-3xl text-primary journal-paper focus:ring-0 focus:outline-none border-0"
                  placeholder="Dear diary, today..."
                />
              </div>
            </main>
          )}

        </div>
      </div>
    </div>
  );
}
