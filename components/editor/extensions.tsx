import StarterKit from "@tiptap/starter-kit";
import { NodeSelection } from "prosemirror-state";
import { Extension, InputRule, Mark, mergeAttributes } from "@tiptap/core";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import DragHandle from "@tiptap/extension-drag-handle";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { GrammarChecker } from "./grammar";

// Custom Resizable Image Node View
export const ResizableImage = Image.extend({
  group: "block",
  inline: false,
  draggable: false, // We handle drag ourselves to avoid duplication
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        // Parse back from the inline style on reload
        parseHTML: (element) => {
          const match = (element.getAttribute("style") || "").match(/width:\s*([^;]+)/);
          return match ? match[1].trim() : "100%";
        },
        renderHTML: (attributes) => ({
          style: `width: ${attributes.width}; max-width: 100%;`,
        }),
      },
      align: {
        default: "center",
        parseHTML: (element) => {
          const style = element.getAttribute("style") || "";
          if (style.includes("flex-end")) return "right";
          if (style.includes("flex-start")) return "left";
          return "center";
        },
        renderHTML: (attributes) => ({
          style: `align-self: ${attributes.align === "center" ? "center" : attributes.align === "right" ? "flex-end" : "flex-start"};`,
        }),
      },
      cropX: {
        default: 0,
        parseHTML: (element) => {
          const val = element.getAttribute("data-crop-x");
          return val ? parseInt(val) : 0;
        },
        renderHTML: (attributes) => ({ "data-crop-x": attributes.cropX }),
      },
      cropY: {
        default: 0,
        parseHTML: (element) => {
          const val = element.getAttribute("data-crop-y");
          return val ? parseInt(val) : 0;
        },
        renderHTML: (attributes) => ({ "data-crop-y": attributes.cropY }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNode);
  },
});

function ResizableImageNode({ node, updateAttributes, selected, deleteNode, editor, getPos }: any) {
  const [resizing, setResizing] = useState(false);
  const [width, setWidth] = useState(node.attrs.width || "100%");
  const [showCropPanel, setShowCropPanel] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Tracks the latest width value synchronously during resize
  // (avoids reading stale DOM style in the mouseup handler)
  const pendingWidthRef = useRef<string>(node.attrs.width || "100%");

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep local width state in sync when node attrs change externally
  // (e.g. after drag-move rebuilds the node with preserved attrs)
  useEffect(() => {
    const savedWidth = node.attrs.width || "100%";
    setWidth(savedWidth);
    pendingWidthRef.current = savedWidth;
  }, [node.attrs.width]);

  // ─── Custom drag via native DOM listener ────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-no-drag], button, input")) return;

      e.preventDefault();
      e.stopPropagation();

      // Select node immediately and focus editor
      if (typeof getPos === "function" && editor) {
        try {
          const pos = getPos();
          const { view } = editor;
          view.focus();
          view.dispatch(view.state.tr.setSelection(
            NodeSelection.create(view.state.doc, pos)
          ));
        } catch (_) {}
      }

      const startX = e.clientX;
      const startY = e.clientY;
      const srcSnapshot = node.attrs.src;

      // Record cursor offset from the image's top-left corner so the ghost
      // appears attached to the exact spot you clicked, not randomly offset
      const imgRect = (el.querySelector("img") || el).getBoundingClientRect();
      const clickOffsetX = e.clientX - imgRect.left;
      const clickOffsetY = e.clientY - imgRect.top;
      // Clamp ghost thumbnail dimensions to 130×auto; scale the offset
      const ghostW = 130;
      const scaleRatio = ghostW / (imgRect.width || 1);
      const ghostOffsetX = Math.round(clickOffsetX * scaleRatio);
      const ghostOffsetY = Math.round(clickOffsetY * scaleRatio);

      let dragging = false;
      let ghost: HTMLDivElement | null = null;

      const onMove = (me: MouseEvent) => {
        if (
          !dragging &&
          (Math.abs(me.clientX - startX) > 6 || Math.abs(me.clientY - startY) > 6)
        ) {
          dragging = true;

          ghost = document.createElement("div");
          ghost.style.cssText = [
            "position:fixed",
            "pointer-events:none",
            "z-index:99999",
            "opacity:0.78",
            "border-radius:6px",
            "overflow:hidden",
            "box-shadow:0 8px 28px rgba(0,0,0,0.30)",
            "background:#fff",
            "border:2px solid #1a73e8",
          ].join(";");
          const gImg = document.createElement("img");
          gImg.src = srcSnapshot;
          gImg.style.cssText = `width:${ghostW}px;height:auto;display:block;`;
          ghost.appendChild(gImg);
          document.body.appendChild(ghost);
          document.body.style.cursor = "grabbing";
          document.body.style.userSelect = "none";
        }

        if (dragging && ghost) {
          // Ghost follows so that the spot you grabbed stays under the cursor
          ghost.style.left = `${me.clientX - ghostOffsetX}px`;
          ghost.style.top  = `${me.clientY - ghostOffsetY}px`;
        }
      };

      const onUp = (me: MouseEvent) => {
        document.removeEventListener("mousemove", onMove, true);
        document.removeEventListener("mouseup",   onUp,   true);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        if (ghost) { document.body.removeChild(ghost); ghost = null; }

        if (!dragging) return;
        if (!editor || typeof getPos !== "function") return;

        const { view } = editor;

        // ── Horizontal position → alignment ──────────────────────────────────
        // Divide the editor into three equal horizontal zones.
        const editorRect = view.dom.getBoundingClientRect();
        const relX = me.clientX - editorRect.left;
        const zone = editorRect.width / 3;
        const newAlign =
          relX < zone       ? "left"
          : relX > zone * 2 ? "right"
          : "center";

        // ── Vertical position → document order ───────────────────────────────
        // Use editor horizontal center + cursor Y so posAtCoords always finds
        // the correct block boundary regardless of where horizontally you drop.
        const dropInfo = view.posAtCoords({
          left: editorRect.left + editorRect.width / 2,
          top:  me.clientY,
        });
        if (!dropInfo) return;

        const fromPos  = getPos();
        const nodeSize = node.nodeSize;
        const toPos    = dropInfo.pos;

        // Don't move if drop lands inside the node itself
        if (toPos >= fromPos && toPos <= fromPos + nodeSize) {
          // Still apply alignment change if it moved horizontally
          if (newAlign !== (node.attrs.align || "center")) {
            updateAttributes({ align: newAlign });
          }
          return;
        }

        const nodeToMove = view.state.doc.nodeAt(fromPos);
        if (!nodeToMove) return;

        // Build a new node with updated alignment
        const newNode = nodeToMove.type.create(
          { ...nodeToMove.attrs, align: newAlign },
          nodeToMove.content,
          nodeToMove.marks
        );

        const tr = view.state.tr;
        if (toPos > fromPos) {
          tr.insert(toPos, newNode);
          tr.delete(fromPos, fromPos + nodeSize);
        } else {
          tr.delete(fromPos, fromPos + nodeSize);
          tr.insert(toPos, newNode);
        }
        view.dispatch(tr);
      };

      document.addEventListener("mousemove", onMove, true);
      document.addEventListener("mouseup",   onUp,   true);
    };

    el.addEventListener("mousedown", onMouseDown);
    return () => el.removeEventListener("mousedown", onMouseDown);
  }, [editor, getPos, node.nodeSize, node.attrs.src, node.attrs.align]); // eslint-disable-line
  // ───────────────────────────────────────────────────────────────────────────

  // Resize handle mousedown (React synthetic is fine here – resize handles are
  // marked data-no-drag so the native drag listener above ignores them)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadToast = toast.loading("Replacing image on Cloudinary...");
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (data.url) {
          updateAttributes({ src: data.url });
          toast.success("Image replaced successfully!", { id: uploadToast });
        } else {
          toast.error(data.error || "Replacement failed", { id: uploadToast });
        }
      } catch (err) {
        toast.error("Replacement failed", { id: uploadToast });
      }
    }
  };

  const handleReplaceUrl = () => {
    const url = window.prompt("Enter new image URL:");
    if (url) {
      updateAttributes({ src: url });
      toast.success("Image URL replaced!");
    }
  };

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (imgRef.current && containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (!parent) return;
        const containerWidth = parent.getBoundingClientRect().width || 1;
        const rect = imgRef.current.getBoundingClientRect();

        const newWidthPx = e.clientX - rect.left;
        const percentage = Math.max(10, Math.min(100, (newWidthPx / containerWidth) * 100));
        const newWidthStr = `${Math.round(percentage)}%`;

        // Write to ref synchronously — React state update is async so the DOM
        // style may not reflect the value yet when mouseup fires
        pendingWidthRef.current = newWidthStr;
        setWidth(newWidthStr);
      }
    };

    const handleMouseUp = () => {
      setResizing(false);
      // Use ref value — guaranteed to be the latest width regardless of
      // whether React has flushed the state update to the DOM yet
      updateAttributes({ width: pendingWidthRef.current });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, updateAttributes]);

  const align = node.attrs.align || "center";
  let alignClass = "items-center"; // center by default
  if (align === "left") alignClass = "items-start";
  else if (align === "right") alignClass = "items-end";

  const cropX = node.attrs.cropX || 0;
  const cropY = node.attrs.cropY || 0;
  const clipPathStyle = cropX > 0 || cropY > 0 
    ? `inset(${cropY}% ${cropX}% ${cropY}% ${cropX}%)` 
    : undefined;

  return (
    <NodeViewWrapper
      className={`w-full relative my-md flex flex-col ${alignClass} select-none`}
      draggable={false}
    >
      <div
        ref={containerRef}
        className={`relative inline-block group ${selected ? "outline outline-[1.5px] outline-[#1a73e8]" : ""}`}
        style={{ width, transition: resizing ? "none" : "width 0.2s ease" }}
        draggable={false}
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          style={{ clipPath: clipPathStyle }}
          className="w-full h-auto border border-outline-variant select-none block cursor-grab active:cursor-grabbing"
          draggable={false}
        />

        {/* Hidden replacement file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleReplaceFile}
          className="hidden"
        />

        {/* 8 Resizing handles shown when selected */}
        {selected && (
          <>
            {/* Top-Left */}
            <div
              data-no-drag="true"
              onMouseDown={handleMouseDown}
              className="absolute w-2 h-2 bg-[#1a73e8] border border-white left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize z-20 shadow-sm"
              title="Resize"
            />
            {/* Top-Center */}
            <div
              data-no-drag="true"
              onMouseDown={handleMouseDown}
              className="absolute w-2 h-2 bg-[#1a73e8] border border-white left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize z-20 shadow-sm"
              title="Resize"
            />
            {/* Top-Right */}
            <div
              data-no-drag="true"
              onMouseDown={handleMouseDown}
              className="absolute w-2 h-2 bg-[#1a73e8] border border-white right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize z-20 shadow-sm"
              title="Resize"
            />
            {/* Left-Center */}
            <div
              data-no-drag="true"
              onMouseDown={handleMouseDown}
              className="absolute w-2 h-2 bg-[#1a73e8] border border-white left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize z-20 shadow-sm"
              title="Resize"
            />
            {/* Right-Center */}
            <div
              data-no-drag="true"
              onMouseDown={handleMouseDown}
              className="absolute w-2 h-2 bg-[#1a73e8] border border-white right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize z-20 shadow-sm"
              title="Resize"
            />
            {/* Bottom-Left */}
            <div
              data-no-drag="true"
              onMouseDown={handleMouseDown}
              className="absolute w-2 h-2 bg-[#1a73e8] border border-white left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize z-20 shadow-sm"
              title="Resize"
            />
            {/* Bottom-Center */}
            <div
              data-no-drag="true"
              onMouseDown={handleMouseDown}
              className="absolute w-2 h-2 bg-[#1a73e8] border border-white left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize z-20 shadow-sm"
              title="Resize"
            />
            {/* Bottom-Right */}
            <div
              data-no-drag="true"
              onMouseDown={handleMouseDown}
              className="absolute w-2 h-2 bg-[#1a73e8] border border-white right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize z-20 shadow-sm"
              title="Resize"
            />

            {/* Floating Image Action Toolbar */}
            {showCropPanel ? (
              <div 
                className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-white border border-[#c3c8c1] shadow-md rounded-full py-1.5 px-3 flex items-center gap-2.5 z-30 pointer-events-auto text-xs text-gray-700 whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setShowCropPanel(false)}
                  className="p-1 rounded hover:bg-gray-100 flex items-center justify-center cursor-pointer text-gray-600"
                  title="Back"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                </button>
                <div className="w-px h-3.5 bg-gray-300 mx-0.5" />
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-600">Crop X:</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="45" 
                    value={cropX}
                    onChange={(e) => updateAttributes({ cropX: parseInt(e.target.value) })}
                    className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="w-6 text-right font-mono">{cropX}%</span>
                </div>
                <div className="w-px h-3.5 bg-gray-300 mx-0.5" />
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-600">Crop Y:</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="45" 
                    value={cropY}
                    onChange={(e) => updateAttributes({ cropY: parseInt(e.target.value) })}
                    className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="w-6 text-right font-mono">{cropY}%</span>
                </div>
              </div>
            ) : (
              <div 
                className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-white border border-[#c3c8c1] shadow-md rounded-full py-1.5 px-3 flex items-center gap-1.5 z-30 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Align Left */}
                <button 
                  className={`p-1 rounded hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer ${align === "left" ? "text-primary bg-primary/10" : "text-gray-700"}`} 
                  title="Align Left"
                  onClick={() => updateAttributes({ align: "left" })}
                >
                  <span className="material-symbols-outlined text-[16px]">align_horizontal_left</span>
                </button>
                {/* Align Center */}
                <button 
                  className={`p-1 rounded hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer ${align === "center" ? "text-primary bg-primary/10" : "text-gray-700"}`} 
                  title="Align Center"
                  onClick={() => updateAttributes({ align: "center" })}
                >
                  <span className="material-symbols-outlined text-[16px]">align_horizontal_center</span>
                </button>
                {/* Align Right */}
                <button 
                  className={`p-1 rounded hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer ${align === "right" ? "text-primary bg-primary/10" : "text-gray-700"}`} 
                  title="Align Right"
                  onClick={() => updateAttributes({ align: "right" })}
                >
                  <span className="material-symbols-outlined text-[16px]">align_horizontal_right</span>
                </button>

                <div className="w-px h-3.5 bg-gray-300 mx-0.5" />
                
                {/* Crop button */}
                <button 
                  className="p-1 rounded hover:bg-gray-100 text-gray-700 transition-colors flex items-center justify-center cursor-pointer" 
                  title="Crop image"
                  onClick={() => setShowCropPanel(true)}
                >
                  <span className="material-symbols-outlined text-[16px]">crop</span>
                </button>

                <div className="w-px h-3.5 bg-gray-300 mx-0.5" />
                
                {/* More options button */}
                <div className="relative">
                  <button 
                    className={`p-1 rounded hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer ${showMoreMenu ? "text-primary bg-primary/10" : "text-gray-700"}`} 
                    title="More options"
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                  >
                    <span className="material-symbols-outlined text-[16px]">more_vert</span>
                  </button>

                  {showMoreMenu && (
                    <div 
                      className="absolute bottom-8 right-0 bg-white border border-[#c3c8c1] shadow-lg rounded-lg py-1 flex flex-col z-50 w-44 text-gray-700 text-xs font-semibold"
                      onMouseLeave={() => setShowMoreMenu(false)}
                    >
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowMoreMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">upload</span>
                        Replace from computer
                      </button>
                      <button
                        onClick={() => {
                          handleReplaceUrl();
                          setShowMoreMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">link</span>
                        Replace by URL
                      </button>
                      <div className="border-t border-gray-200 my-1" />
                      <button
                        onClick={() => {
                          deleteNode();
                          setShowMoreMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Delete image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// Custom Table extension to support border customization
export const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderWidth: {
        default: "1px",
        parseHTML: element => element.style.borderWidth || "1px",
        renderHTML: attributes => {
          return {
            style: `border-width: ${attributes.borderWidth};`,
          };
        },
      },
      borderColor: {
        default: "",
        parseHTML: element => element.style.borderColor || "",
        renderHTML: attributes => {
          if (!attributes.borderColor) return {};
          return {
            style: `border-color: ${attributes.borderColor};`,
          };
        },
      },
    };
  },
});



export const HeartEmojiExtension = Extension.create({
  name: "heartEmoji",
  addInputRules() {
    return [
      new InputRule({
        find: /<3$/,
        handler: ({ state, range }) => {
          const { tr } = state;
          tr.replaceWith(range.from, range.to, state.schema.text("❤️"));
        },
      }),
    ];
  },
});

// Export configured Tiptap extensions
export const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Highlight.configure({
    multicolor: true,
  }),
  TextStyle,
  Color,
  FontFamily,
  TextAlign.configure({
    types: ["heading", "paragraph", "tableCell", "tableHeader"],
  }),
  ResizableImage,
  CustomTable.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
  Placeholder.configure({
    placeholder: "Start writing your thoughts here...",
    emptyEditorClass: "is-editor-empty",
  }),
  DragHandle.configure({
    render() {
      const element = document.createElement("div");
      element.className = "drag-handle";
      element.innerHTML = `<span class="material-symbols-outlined text-[16px] pointer-events-none">drag_indicator</span>`;
      return element;
    },
  }),
  HeartEmojiExtension,
  Subscript,
  Superscript,
  GrammarChecker,
];
