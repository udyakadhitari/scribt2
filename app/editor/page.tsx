"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface ChatMessage {
  sender: "ai" | "user";
  text: string;
  suggestion?: {
    title: string;
    code: string;
  };
}

export default function EditorPage() {
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const [selectionText, setSelectionText] = useState("");
  const [floatingMenuPos, setFloatingMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "I noticed you're writing about Dijkstra's algorithm. Would you like me to add a section about its time complexity?",
      suggestion: {
        title: "Proposed addition:",
        code: "Time Complexity: O((V + E) log V) using a binary heap, where V is vertices and E is edges.",
      },
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Editor content states
  const [title, setTitle] = useState("Dijkstra's Algorithm Implementation");
  const [wordCount, setWordCount] = useState(124);
  const [charCount, setCharCount] = useState(842);

  const proseAreaRef = useRef<HTMLDivElement>(null);
  const editorCanvasRef = useRef<HTMLDivElement>(null);

  // Handle word count calculation
  const handleContentInput = () => {
    if (proseAreaRef.current) {
      const text = proseAreaRef.current.innerText || "";
      setCharCount(text.length);
      const words = text.trim().split(/\s+/).filter(Boolean);
      setWordCount(words.length);
    }
  };

  // Run a document formatting command
  const formatText = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleContentInput();
  };

  // Handle text selection for floating menu
  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const selectedText = selection.toString().trim();
      setSelectionText(selectedText);

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Position relative to viewport or editor container
        if (proseAreaRef.current) {
          const containerRect = proseAreaRef.current.getBoundingClientRect();
          setFloatingMenuPos({
            top: rect.top - containerRect.top - 48 + proseAreaRef.current.scrollTop,
            left: rect.left - containerRect.left + rect.width / 2 - 50,
          });
        }
      } catch (e) {
        // Selection range error safe fallback
      }
    } else {
      setFloatingMenuPos(null);
    }
  };

  // Hide floating menu on click elsewhere
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        setFloatingMenuPos(null);
      }
    };

    document.addEventListener("mousedown", handleGlobalClick);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
    };
  }, []);

  // Send message to AI
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      sender: "user",
      text: chatInput,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      const aiReply: ChatMessage = {
        sender: "ai",
        text: `Here is some information regarding that: When executing Dijkstra's algorithm, verifying if 'current_distance > distances[current_node]' acts as an optimization. If we have already found a shorter path to 'current_node' via another path, we can skip processing its outgoing edges.`,
      };
      setChatMessages((prev) => [...prev, aiReply]);
    }, 1200);
  };

  // Insert AI suggestion into text
  const handleInsertSuggestion = (code: string) => {
    if (proseAreaRef.current) {
      proseAreaRef.current.focus();
      // Insert at current cursor position or append
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();

        const div = document.createElement("div");
        div.className = "bg-surface-container-low p-sm rounded-xl border border-outline-variant my-md font-semibold text-primary";
        div.innerText = code;

        range.insertNode(div);
      } else {
        proseAreaRef.current.innerHTML += `<div class="bg-surface-container-low p-sm rounded-xl border border-outline-variant my-md font-semibold text-primary">${code}</div>`;
      }
      handleContentInput();
    }
  };

  // Trigger AI analysis on selected text
  const handleAiOnSelection = () => {
    if (!selectionText) return;
    setIsAiPanelOpen(true);
    setIsTyping(true);
    setFloatingMenuPos(null);

    setTimeout(() => {
      setIsTyping(false);
      const aiResponse: ChatMessage = {
        sender: "ai",
        text: `I analyzed your highlighted text: "${selectionText.substring(0, 50)}${selectionText.length > 50 ? "..." : ""}". Here is an improvement:`,
        suggestion: {
          title: "Refinement Idea:",
          code: `Optimized: ${selectionText} (Verify graph cycles first for optimal runtime).`,
        },
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden antialiased relative">

      {/* SideNavBar */}
      <nav className="bg-surface-container-lowest w-[280px] h-screen hidden md:flex flex-col border-r border-outline-variant fixed left-0 top-0 bottom-0 z-40">
        <div className="p-lg flex items-center gap-sm">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[20px]">edit_document</span>
          </div>
          <div>
            <h1 className="font-headline-sm font-bold text-primary">Inkwell</h1>
            <p className="font-label-sm text-secondary">Technical Workspace</p>
          </div>
        </div>

        <div className="px-md pb-md">
          <Link
            href="/editor"
            onClick={() => {
              setTitle("Untitled Note");
              if (proseAreaRef.current) proseAreaRef.current.innerText = "";
              handleContentInput();
            }}
            className="w-full bg-primary text-on-primary font-label-md text-label-md py-sm px-md rounded-xl flex items-center justify-center gap-sm hover:bg-surface-tint transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Note
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-sm py-sm space-y-xs">
          <Link
            href="/dashboard"
            className="flex items-center gap-md px-md py-sm rounded-xl text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="font-body-md">Dashboard</span>
          </Link>
          <a className="flex items-center gap-md px-md py-sm rounded-xl text-primary font-bold bg-surface-container-low transition-colors duration-200" href="#">
            <span className="material-symbols-outlined text-[20px] fill">folder_open</span>
            <span className="font-body-md">Subjects</span>
          </a>
          <Link
            href="/dashboard"
            className="flex items-center gap-md px-md py-sm rounded-xl text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-[20px]">history</span>
            <span className="font-body-md">Recent</span>
          </Link>
          <button
            onClick={() => setIsAiPanelOpen((prev) => !prev)}
            className="w-full flex items-center gap-md px-md py-sm rounded-xl text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors duration-200 text-left"
          >
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            <span className="font-body-md">AI Assistant</span>
          </button>
          <Link
            href="/design-system"
            className="flex items-center gap-md px-md py-sm rounded-xl text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-[20px]">palette</span>
            <span className="font-body-md">Style Guide</span>
          </Link>
        </div>

        <div className="p-sm border-t border-outline-variant space-y-xs">
          <a className="flex items-center gap-md px-md py-sm rounded-xl text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors duration-200" href="#">
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
            <span className="font-body-md">Help</span>
          </a>
          <a className="flex items-center gap-md px-md py-sm rounded-xl text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors duration-200" href="#">
            <span className="material-symbols-outlined text-[20px]">archive</span>
            <span className="font-body-md">Archived</span>
          </a>
        </div>
      </nav>

      {/* Main Workspace Area */}
      <div
        className="flex-1 flex flex-col md:pl-[280px] h-screen transition-all duration-300 relative"
      >

        {/* TopAppBar */}
        <header className="h-16 flex items-center justify-between px-lg border-b border-outline-variant bg-surface-container-lowest shrink-0 z-30">
          <div className="flex items-center gap-sm text-secondary font-body-md text-body-md">
            <span className="material-symbols-outlined text-[18px]">folder</span>
            <Link href="/dashboard" className="hover:text-primary cursor-pointer transition-colors">
              Subjects
            </Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="hover:text-primary cursor-pointer transition-colors">CS</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface font-semibold">Algorithms</span>
            <span className="ml-lg text-outline font-label-sm text-label-sm flex items-center gap-xs hidden sm:flex">
              <span className="material-symbols-outlined text-[14px]">cloud_done</span>
              Saved just now
            </span>
          </div>

          <div className="flex items-center gap-md">
            <div className="flex -space-x-2 mr-sm">
              <img
                alt="Collaborator"
                className="w-8 h-8 rounded-full border-2 border-surface-container-lowest"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsr9_LNANJnd4-VqiTRg2huRArlTruk-9K1icj43aPRhDMvz3533Um7gY_itVf6pIJ-vQKxR9JZn6oC2vqrpYK9W57W11vniQyHx8Sq01oIKiA4U2BMo0p1YT7-kLbt1QD0DMdVJlziUXBlcuuTHJQXZZPlJt62Raud3lv_-nUjy5t_AxPP5-0MjBACiKlwMKvLTDwg06plrsSj2ECYL57tod81ZJF3zJF88ORX2W5YVuWzj6Gaa_G4k4Uyv1MhP7hihQDh4W8M2G8"
              />
              <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-primary-container flex items-center justify-center text-on-primary-container font-label-sm text-label-sm">
                +2
              </div>
            </div>

            <button className="flex items-center gap-xs px-sm py-xs border border-outline-variant rounded-xl hover:bg-surface-container-high transition-colors text-secondary">
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span className="font-label-md text-label-md">Share</span>
            </button>

            <button
              onClick={() => setIsAiPanelOpen((prev) => !prev)}
              className={`w-8 h-8 flex items-center justify-center transition-colors ${isAiPanelOpen ? "text-primary font-bold" : "text-secondary hover:text-on-surface"
                }`}
              id="toggleAiPanel"
            >
              <span className="material-symbols-outlined">smart_toy</span>
            </button>
          </div>
        </header>

        {/* Editor Toolbar */}
        <div className="h-12 flex items-center px-lg border-b border-outline-variant bg-surface shrink-0 gap-md overflow-x-auto">
          <div className="flex items-center gap-xs pr-md border-r border-outline-variant">
            <button
              onClick={() => formatText("formatBlock", "<h1>")}
              className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors font-bold text-sm"
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => formatText("formatBlock", "<h2>")}
              className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors font-bold text-sm"
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => formatText("formatBlock", "<p>")}
              className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors font-bold text-sm"
              title="Paragraph"
            >
              P
            </button>
          </div>

          <div className="flex items-center gap-xs px-md border-r border-outline-variant">
            <button
              onClick={() => formatText("bold")}
              className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
              title="Bold"
            >
              <span className="material-symbols-outlined text-[18px]">format_bold</span>
            </button>
            <button
              onClick={() => formatText("italic")}
              className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
              title="Italic"
            >
              <span className="material-symbols-outlined text-[18px]">format_italic</span>
            </button>
            <button
              onClick={() => formatText("underline")}
              className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
              title="Underline"
            >
              <span className="material-symbols-outlined text-[18px]">format_underlined</span>
            </button>
            <button
              onClick={() => formatText("strikeThrough")}
              className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
              title="Strikethrough"
            >
              <span className="material-symbols-outlined text-[18px]">strikethrough_s</span>
            </button>
          </div>

          <div className="flex items-center gap-xs px-md border-r border-outline-variant">
            <button
              onClick={() => formatText("insertUnorderedList")}
              className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
              title="Bulleted List"
            >
              <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
            </button>
            <button
              onClick={() => formatText("insertOrderedList")}
              className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
              title="Numbered List"
            >
              <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
            </button>
          </div>

          <div className="flex items-center gap-xs pl-md">
            <button
              onClick={() => formatText("hiliteColor", "#fd9d7f")}
              className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors flex items-center gap-xs"
              title="Highlight Orange"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">format_color_fill</span>
            </button>
            <button
              onClick={() => {
                const code = prompt("Enter your code block:");
                if (code) {
                  formatText("insertHTML", `<pre class="bg-surface-container-lowest border border-outline-variant p-md rounded-2xl my-md overflow-x-auto text-on-secondary-fixed-variant"><code>${code}</code></pre>`);
                }
              }}
              className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
              title="Insert Code Block"
            >
              <span className="material-symbols-outlined text-[18px]">code</span>
            </button>
          </div>
        </div>

        {/* Editor Canvas Area */}
        <div className="flex-1 flex overflow-hidden relative">
          <main
            className="flex-1 overflow-y-auto bg-surface relative"
            id="editorCanvas"
            ref={editorCanvasRef}
          >
            <div className="max-w-[900px] mx-auto px-lg py-xl min-h-full pb-32">
              <div className="mb-lg">
                <input
                  className="w-full bg-transparent border-none text-display-lg font-display-lg text-on-surface focus:ring-0 p-0 placeholder-outline-variant outline-none font-bold"
                  placeholder="Note Title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Editable Prose Area */}
              <div
                className="prose max-w-none font-body-lg text-body-lg text-on-surface space-y-md outline-none relative"
                contentEditable="true"
                suppressContentEditableWarning
                id="proseArea"
                ref={proseAreaRef}
                onInput={handleContentInput}
                onMouseUp={handleSelection}
                onKeyUp={handleSelection}
              >
                <p className="text-secondary leading-relaxed">
                  Dijkstra&apos;s algorithm is an algorithm for finding the shortest paths between nodes in a graph, which may represent, for example, road networks. It was conceived by computer scientist Edsger W. Dijkstra in 1956 and published three years later.
                </p>
                <div className="flex items-center gap-sm bg-surface-container-low p-sm rounded-xl border border-outline-variant my-md" contentEditable="false">
                  <span className="material-symbols-outlined text-primary">info</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Select text to format or get AI suggestions.</span>
                </div>
                <h2 className="font-headline-md text-headline-md font-semibold mt-xl mb-sm">1. Core Concepts</h2>
                <ul className="list-disc pl-lg space-y-xs">
                  <li><strong>Graph Representation:</strong> We typically use an adjacency list for better performance on sparse graphs.</li>
                  <li><strong>Priority Queue:</strong> Essential for efficiently retrieving the next node with the minimum tentative distance.</li>
                  <li><strong>Relaxation:</strong> The process of updating the shortest path estimate to a vertex.</li>
                </ul>
                <h2 className="font-headline-md text-headline-md font-semibold mt-xl mb-sm">2. Python Implementation</h2>
                <p>Below is a standard implementation using Python&apos;s `heapq` module.</p>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden my-md font-label-sm text-label-sm" contentEditable="false">
                  <div className="bg-surface-container-low px-sm py-xs border-b border-outline-variant flex justify-between items-center text-secondary">
                    <span>python</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("import heapq\n\ndef dijkstra(graph, start):\n...");
                        alert("Copied code to clipboard!");
                      }}
                      className="hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                  </div>
                  <pre className="p-md overflow-x-auto text-on-secondary-fixed-variant">
                    <code className="language-python">
                      {`import heapq

def dijkstra(graph, start):
    distances = {node: float('infinity') for node in graph}
    distances[start] = 0
    pq = [(0, start)]
    
    while pq:
        current_distance, current_node = heapq.heappop(pq)
        
        if current_distance > distances[current_node]:
            continue
            
        for neighbor, weight in graph[current_node].items():
            distance = current_distance + weight
            
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))
                
    return distances`}
                    </code>
                  </pre>
                </div>
                <p className="text-outline-variant italic">Press enter to continue typing...</p>
              </div>
            </div>

            {/* Selection format tooltip menu */}
            {floatingMenuPos && (
              <div
                className="absolute bg-surface-container-lowest border border-outline-variant shadow-ambient-overlay rounded-xl p-xs flex gap-xs z-50 transition-opacity"
                style={{
                  top: `${floatingMenuPos.top}px`,
                  left: `${floatingMenuPos.left}px`,
                }}
                onMouseDown={(e) => e.preventDefault()} // Prevents selection clearing on click
              >
                <button
                  onClick={() => formatText("bold")}
                  className="p-xs text-on-surface hover:bg-surface-container-high rounded-lg"
                  title="Bold"
                >
                  <span className="material-symbols-outlined text-[16px]">format_bold</span>
                </button>
                <button
                  onClick={() => formatText("italic")}
                  className="p-xs text-on-surface hover:bg-surface-container-high rounded-lg"
                  title="Italic"
                >
                  <span className="material-symbols-outlined text-[16px]">format_italic</span>
                </button>
                <button
                  onClick={handleAiOnSelection}
                  className="p-xs text-primary hover:bg-primary-container hover:text-on-primary-container rounded-lg flex items-center gap-xs px-2"
                  title="AI Explain"
                >
                  <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                  <span className="text-[12px] font-semibold">Explain</span>
                </button>
              </div>
            )}
          </main>

          {/* AI Assistant Sidebar Panel */}
          <aside
            className={`w-[320px] bg-surface border-l border-outline-variant flex flex-col transition-all duration-300 absolute lg:relative right-0 top-0 bottom-0 z-20 h-full ${isAiPanelOpen ? "translate-x-0 opacity-100" : "translate-x-full lg:w-0 lg:border-l-0 lg:opacity-0 lg:overflow-hidden"
              }`}
            id="aiPanel"
          >
            {/* Header */}
            <div className="h-12 flex items-center justify-between px-md shrink-0 border-b border-outline-variant">
              <div className="flex items-center gap-xs text-primary">
                <span className="material-symbols-outlined fill text-[20px]">smart_toy</span>
                <span className="font-label-md text-label-md">AI Assistant</span>
              </div>
              <button
                onClick={() => setIsAiPanelOpen(false)}
                className="text-secondary hover:text-on-surface transition-colors"
                id="closeAiPanel"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-md space-y-md">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex gap-sm ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-xs ${msg.sender === "user"
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-primary-container text-on-primary-container"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {msg.sender === "user" ? "person" : "smart_toy"}
                    </span>
                  </div>

                  <div
                    className={`p-sm rounded-2xl text-body-md text-on-surface w-full max-w-[85%] ${msg.sender === "user"
                        ? "bg-surface-container rounded-tr-none"
                        : "bg-surface-container-low rounded-tl-none"
                      }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>

                    {msg.suggestion && (
                      <div className="mt-sm bg-surface-container-lowest rounded-xl p-sm font-label-sm text-label-sm text-on-surface-variant border border-outline-variant">
                        <strong>{msg.suggestion.title}</strong>
                        <div className="mt-1 font-mono text-[11px] whitespace-pre-wrap select-all">
                          {msg.suggestion.code}
                        </div>
                        <div className="mt-sm flex gap-xs">
                          <button
                            onClick={() => handleInsertSuggestion(msg.suggestion!.code)}
                            className="flex-1 py-1 px-sm bg-primary text-on-primary rounded-xl font-label-md flex items-center justify-center gap-xs hover:bg-surface-tint transition-all"
                          >
                            <span className="material-symbols-outlined text-[14px]">add_circle</span> Insert
                          </button>
                          <button
                            onClick={() => {
                              setChatMessages((prev) => prev.filter((_, idx) => idx !== index));
                            }}
                            className="flex-1 py-1 px-sm border border-outline-variant text-secondary rounded-xl font-label-md hover:bg-surface-container-high transition-all"
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-sm">
                  <div className="w-6 h-6 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[14px] animate-bounce">smart_toy</span>
                  </div>
                  <div className="bg-surface-container-low p-sm rounded-2xl rounded-tl-none text-body-md text-secondary">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-sm bg-surface shrink-0 border-t border-outline-variant">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center"
              >
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-md pr-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder-outline text-sm"
                  placeholder="Ask AI to write or explain..."
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-1 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-surface-tint transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                </button>
              </form>
            </div>
          </aside>
        </div>

        {/* Bottom Editor StatusBar */}
        <footer className="h-8 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between px-md shrink-0 z-30">
          <div className="flex items-center gap-md text-outline font-label-sm text-label-sm">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
          <div className="flex items-center gap-xs text-secondary">
            <button
              onClick={() => formatText("undo")}
              className="w-6 h-6 flex items-center justify-center hover:bg-surface-container-high rounded-lg transition-colors"
              title="Undo"
            >
              <span className="material-symbols-outlined text-[16px]">undo</span>
            </button>
            <button
              onClick={() => formatText("redo")}
              className="w-6 h-6 flex items-center justify-center hover:bg-surface-container-high rounded-lg transition-colors"
              title="Redo"
            >
              <span className="material-symbols-outlined text-[16px]">redo</span>
            </button>
          </div>
        </footer>
      </div>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface-container-lowest border-t border-outline-variant md:hidden shadow-lg">
        <Link className="flex flex-col items-center justify-center text-on-surface-variant font-label-sm text-label-sm py-xs px-md rounded-xl" href="/dashboard">
          <span className="material-symbols-outlined text-[24px]">home</span>
          <span>Home</span>
        </Link>
        <button
          onClick={() => setIsAiPanelOpen((prev) => !prev)}
          className="flex flex-col items-center justify-center text-primary font-bold font-label-sm text-label-sm py-xs px-md rounded-xl scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[24px] fill">smart_toy</span>
          <span>AI Panel</span>
        </button>
        <Link className="flex flex-col items-center justify-center text-on-surface-variant font-label-sm text-label-sm py-xs px-md rounded-xl" href="/design-system">
          <span className="material-symbols-outlined text-[24px]">palette</span>
          <span>Styles</span>
        </Link>
      </nav>

    </div>
  );
}
