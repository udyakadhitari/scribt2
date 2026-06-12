"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import toast from "react-hot-toast";

// Dynamically import Excalidraw to bypass SSR errors
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

interface WhiteboardClientProps {
  userName: string;
}

export default function WhiteboardClient({ userName }: WhiteboardClientProps) {
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportBg, setExportBg] = useState(true);
  const [exportDark, setExportDark] = useState(false);
  const [exportScale, setExportScale] = useState<1 | 2 | 3>(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const excalidrawAPIRef = useRef<any>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const prevPreviewUrl = useRef<string | null>(null);

  // ── Hide Excalidraw hamburger menu ─────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `.main-menu-trigger { display: none !important; }`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // ── Load saved scene from localStorage ────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        let saved = localStorage.getItem("scribt-excalidraw-scene");
        if (!saved) {
          // Auto-migrate from old Inkwell key
          saved = localStorage.getItem("inkwell-excalidraw-scene");
          if (saved) {
            localStorage.setItem("scribt-excalidraw-scene", saved);
            localStorage.removeItem("inkwell-excalidraw-scene");
          }
        }
        if (saved) {
          const parsed = JSON.parse(saved);
          setInitialData({
            elements: parsed.elements || [],
            appState: { ...(parsed.appState || {}), theme: "light", viewBackgroundColor: "#ffffff" },
            files: parsed.files || null,
          });
        }
      } catch (err) {
        console.error("Failed to load Excalidraw scene:", err);
      }
      setIsLoaded(true);
    }
  }, []);

  // ── Auto-save (debounced 1 s) ──────────────────────────────────────────────
  const handleChange = useCallback((elements: any, appState: any, files: any) => {
    if (typeof window === "undefined") return;
    const dataToSave = {
      elements,
      appState: { theme: appState.theme, viewBackgroundColor: appState.viewBackgroundColor, gridSize: appState.gridSize },
      files,
    };
    const existing = (window as any).__excalidrawSaveTimeout;
    if (existing) clearTimeout(existing);
    (window as any).__excalidrawSaveTimeout = setTimeout(() => {
      try { localStorage.setItem("scribt-excalidraw-scene", JSON.stringify(dataToSave)); }
      catch (e) { console.error(e); }
    }, 1000);
  }, []);

  // ── Export modal preview generation ───────────────────────────────────────
  const generatePreview = useCallback(async () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    setPreviewLoading(true);
    try {
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const blob = await exportToBlob({
        elements: api.getSceneElements(),
        appState: { ...api.getAppState(), exportBackground: exportBg, theme: exportDark ? "dark" : "light" },
        files: api.getFiles(),
        mimeType: "image/png",
        getDimensions: (w: number, h: number) => ({ width: w * exportScale, height: h * exportScale, scale: exportScale }),
      });
      const url = URL.createObjectURL(blob);
      // revoke previous url
      if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
      prevPreviewUrl.current = url;
      setPreviewUrl(url);
    } catch (err) { console.error(err); }
    setPreviewLoading(false);
  }, [exportBg, exportDark, exportScale]);

  useEffect(() => {
    if (exportModalOpen) generatePreview();
    // cleanup on close
    if (!exportModalOpen && prevPreviewUrl.current) {
      URL.revokeObjectURL(prevPreviewUrl.current);
      prevPreviewUrl.current = null;
      setPreviewUrl(null);
    }
  }, [exportModalOpen, exportBg, exportDark, exportScale, generatePreview]);

  // ── Export helpers ─────────────────────────────────────────────────────────
  const doExportPng = async () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    try {
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const blob = await exportToBlob({
        elements: api.getSceneElements(),
        appState: { ...api.getAppState(), exportBackground: exportBg, theme: exportDark ? "dark" : "light" },
        files: api.getFiles(),
        mimeType: "image/png",
        getDimensions: (w: number, h: number) => ({ width: w * exportScale, height: h * exportScale, scale: exportScale }),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `whiteboard-${Date.now()}.png`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported as PNG!");
    } catch { toast.error("Export failed."); }
  };

  const doExportSvg = async () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    try {
      const { exportToSvg } = await import("@excalidraw/excalidraw");
      const svg = await exportToSvg({
        elements: api.getSceneElements(),
        appState: { ...api.getAppState(), exportBackground: exportBg, theme: exportDark ? "dark" : "light" },
        files: api.getFiles(),
      });
      const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `whiteboard-${Date.now()}.svg`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported as SVG!");
    } catch { toast.error("Export failed."); }
  };

  const doExportScene = () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    try {
      const scene = {
        type: "excalidraw",
        version: 2,
        elements: api.getSceneElements(),
        appState: api.getAppState(),
        files: api.getFiles(),
      };
      const blob = new Blob([JSON.stringify(scene, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `whiteboard-${Date.now()}.excalidraw`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Scene exported as .excalidraw!");
    } catch { toast.error("Export failed."); }
  };

  const doCopyClipboard = async () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    try {
      const { exportToClipboard } = await import("@excalidraw/excalidraw");
      await exportToClipboard({
        elements: api.getSceneElements(),
        appState: { ...api.getAppState(), exportBackground: exportBg, theme: exportDark ? "dark" : "light" },
        files: api.getFiles(),
        type: "png",
      });
      toast.success("Copied to clipboard!");
    } catch { toast.error("Clipboard copy failed."); }
  };

  // ── Other header actions ───────────────────────────────────────────────────
  const handleClear = () => {
    excalidrawAPIRef.current?.updateScene({ elements: [] });
    localStorage.removeItem("scribt-excalidraw-scene");
    toast.success("Canvas cleared!");
  };
  const handleUndo = () => excalidrawAPIRef.current?.history?.undo();
  const handleRedo = () => excalidrawAPIRef.current?.history?.redo();
  const handleCollaborate = () => toast("Collaboration coming soon!", { icon: "🔗" });

  const handleImportClick = () => importInputRef.current?.click();
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const api = excalidrawAPIRef.current;
        if (!api) return;
        if (parsed.type === "excalidraw" || parsed.elements) {
          api.updateScene({ elements: parsed.elements || [], appState: { ...(parsed.appState || {}), theme: "light" } });
          localStorage.setItem("scribt-excalidraw-scene", JSON.stringify(parsed));
          toast.success("Scene imported!");
        } else { toast.error("Unrecognised file format."); }
      } catch { toast.error("Failed to read file."); }
      if (importInputRef.current) importInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  // ── Shared styles ──────────────────────────────────────────────────────────
  const btnCls = "flex items-center gap-1.5 px-3 h-8 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors text-sm";

  // Toggle component
  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 border-none cursor-pointer ${checked ? "bg-primary" : "bg-outline-variant"}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? "left-6" : "left-1"}`} />
    </button>
  );

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-background">

      {/* ── Persistent header ─────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-14 bg-surface-container-lowest border-b border-outline-variant z-50 shadow-sm">

        {/* Left */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 px-3 h-8 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="h-5 w-px bg-outline-variant" />
          <div className="flex items-center gap-1.5 text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-primary">gesture</span>
            <span className="font-semibold text-sm">Whiteboard</span>
          </div>
        </div>

        {/* Centre */}
        <div className="flex items-center gap-1">
          <button onClick={handleUndo} title="Undo" className={btnCls}>
            <span className="material-symbols-outlined text-[18px]">undo</span>
          </button>
          <button onClick={handleRedo} title="Redo" className={btnCls}>
            <span className="material-symbols-outlined text-[18px]">redo</span>
          </button>

          <div className="h-5 w-px bg-outline-variant mx-1" />

          {/* Import */}
          <button onClick={handleImportClick} title="Import .excalidraw / .json" className={btnCls}>
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span className="hidden sm:inline">Import</span>
          </button>
          <input ref={importInputRef} type="file" accept=".excalidraw,.json" className="hidden" onChange={handleImportFile} />

          {/* Export — opens modal */}
          <button onClick={() => setExportModalOpen(true)} title="Export" className={btnCls}>
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span className="hidden sm:inline">Export</span>
          </button>

          <div className="h-5 w-px bg-outline-variant mx-1" />

          {/* Collaborate */}
          <button onClick={handleCollaborate} title="Collaborate (coming soon)" className="flex items-center gap-1.5 px-3 h-8 rounded-full text-secondary border border-outline-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors text-sm">
            <span className="material-symbols-outlined text-[16px]">group_add</span>
            <span className="hidden sm:inline">Collaborate</span>
          </button>

          <div className="h-5 w-px bg-outline-variant mx-1" />

          {/* Clear */}
          <button onClick={handleClear} title="Clear canvas" className="flex items-center gap-1.5 px-3 h-8 rounded-full text-secondary hover:text-error hover:bg-error-container transition-colors text-sm">
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

        {/* Right */}
        <div className="w-9 h-9 flex items-center justify-center">
          <UserButton />
        </div>
      </header>

      {/* ── Excalidraw canvas ─────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {isLoaded ? (
          <Excalidraw
            excalidrawAPI={(api: any) => { excalidrawAPIRef.current = api; }}
            initialData={initialData}
            onChange={handleChange}
            theme="light"
            UIOptions={{
              canvasActions: {
                changeViewBackgroundColor: false,
                clearCanvas: false,
                export: false,
                saveToActiveFile: false,
                toggleTheme: false,
                saveAsImage: false,
                loadScene: false,
              },
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-surface-container-lowest">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="font-label-md text-secondary">Loading Whiteboard…</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Export Modal ──────────────────────────────────────────────────── */}
      {exportModalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setExportModalOpen(false); }}
        >
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant">
              <h2 className="font-headline-sm font-bold text-on-surface text-lg">Export image</h2>
              <button onClick={() => setExportModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal body */}
            <div className="flex gap-6 p-6">

              {/* Preview */}
              <div className="flex-1 min-w-0">
                <div className="w-full aspect-[4/3] rounded-2xl bg-[repeating-conic-gradient(#e0e0e0_0%_25%,#f5f5f5_0%_50%)] bg-[length:16px_16px] border border-outline-variant overflow-hidden flex items-center justify-center">
                  {previewLoading ? (
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  ) : previewUrl ? (
                    <img src={previewUrl} alt="Export preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-secondary text-sm">No preview</span>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="w-56 flex-shrink-0 flex flex-col gap-5">

                {/* Background toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface">Background</span>
                  <Toggle checked={exportBg} onChange={setExportBg} />
                </div>

                {/* Dark mode toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface">Dark mode</span>
                  <Toggle checked={exportDark} onChange={setExportDark} />
                </div>

                {/* Scale */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface">Scale</span>
                  <div className="flex rounded-xl overflow-hidden border border-outline-variant">
                    {([1, 2, 3] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setExportScale(s)}
                        className={`px-3 py-1 text-sm font-medium transition-colors ${exportScale === s ? "bg-primary text-on-primary" : "text-secondary hover:bg-surface-container-high"}`}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-outline-variant" />

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <button onClick={doExportPng} className="flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-on-primary font-medium text-sm hover:bg-surface-tint transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    PNG
                  </button>
                  <button onClick={doExportSvg} className="flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-on-primary font-medium text-sm hover:bg-surface-tint transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    SVG
                  </button>
                  <button onClick={doExportScene} className="flex items-center justify-center gap-2 h-10 rounded-xl border border-outline-variant text-on-surface font-medium text-sm hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    .excalidraw
                  </button>
                  <button onClick={doCopyClipboard} className="flex items-center justify-center gap-2 h-10 rounded-xl border border-outline-variant text-on-surface font-medium text-sm hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    Copy to clipboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
