import { Editor } from "@tiptap/react";
import { useState, useEffect } from "react";

interface ToolbarProps {
  editor: Editor | null;
  pageSize: string;
  setPageSize: (size: string) => void;
  pageColor: string;
  setPageColor: (color: string) => void;
}

export default function Toolbar({
  editor,
  pageSize,
  setPageSize,
  pageColor,
  setPageColor,
}: ToolbarProps) {


  if (!editor) return null;

  const fontOptions = [
    { label: "Default", value: "" },
    { label: "Serif", value: "serif" },
    { label: "Monospace", value: "monospace" },
    { label: "Sans-Serif", value: "sans-serif" },
    { label: "Cursive", value: "cursive" },
  ];

  const colorOptions = [
    { label: "Dark", value: "#1e1b18" },
    { label: "Primary", value: "#334537" },
    { label: "Brick Red", value: "#944931" },
    { label: "Royal Blue", value: "#1a5fb4" },
    { label: "Gold", value: "#b58900" },
  ];

  const pagePresetColors = [
    { label: "White", value: "#ffffff" },
    { label: "Cream", value: "#fefcf0" },
    { label: "Sepia", value: "#f4ecd8" },
    { label: "Ice Blue", value: "#e8eff5" },
    { label: "Soft Gray", value: "#f1f3f4" },
  ];

  return (
    <div className="flex flex-wrap items-center px-md py-xs border-b border-outline-variant bg-surface shrink-0 gap-y-xs gap-x-md overflow-x-auto select-none">
      


      {/* 2. Text style headings */}
      <div className="flex items-center gap-xs pr-md border-r border-outline-variant">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`w-8 h-8 rounded-lg font-bold text-sm transition-colors flex items-center justify-center ${
            editor.isActive("heading", { level: 1 })
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`w-8 h-8 rounded-lg font-bold text-sm transition-colors flex items-center justify-center ${
            editor.isActive("heading", { level: 2 })
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`w-8 h-8 rounded-lg font-bold text-sm transition-colors flex items-center justify-center ${
            editor.isActive("heading", { level: 3 })
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Heading 3"
        >
          H3
        </button>
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`w-8 h-8 rounded-lg font-bold text-sm transition-colors flex items-center justify-center ${
            editor.isActive("paragraph")
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Paragraph"
        >
          P
        </button>
      </div>

      {/* 3. Font Family Selection */}
      <div className="flex items-center gap-xs pr-md border-r border-outline-variant">
        <span className="material-symbols-outlined text-[18px] text-secondary">font_download</span>
        <select
          onChange={(e) => {
            const font = e.target.value;
            if (font === "") {
              editor.chain().focus().unsetFontFamily().run();
            } else {
              editor.chain().focus().setFontFamily(font).run();
            }
          }}
          className="h-8 px-2 rounded-lg bg-surface-container border-none outline-none font-label-md text-label-md text-on-surface cursor-pointer focus:ring-1 focus:ring-primary/20"
          title="Font Family"
        >
          {fontOptions.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Text styles (Bold, Italic, Strike) */}
      <div className="flex items-center gap-xs pr-md border-r border-outline-variant">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive("bold")
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Bold"
        >
          <span className="material-symbols-outlined text-[18px]">format_bold</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive("italic")
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Italic"
        >
          <span className="material-symbols-outlined text-[18px]">format_italic</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive("strike")
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Strikethrough"
        >
          <span className="material-symbols-outlined text-[18px]">format_strikethrough</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive("subscript")
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Subscript (Ctrl+,)"
        >
          <span className="material-symbols-outlined text-[18px]">subscript</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive("superscript")
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Superscript (Ctrl+.)"
        >
          <span className="material-symbols-outlined text-[18px]">superscript</span>
        </button>
      </div>

      {/* 5. Text Alignment */}
      <div className="flex items-center gap-xs pr-md border-r border-outline-variant">
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive({ textAlign: "left" }) || (!editor.isActive({ textAlign: "center" }) && !editor.isActive({ textAlign: "right" }) && !editor.isActive({ textAlign: "justify" }))
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Align Left"
        >
          <span className="material-symbols-outlined text-[18px]">format_align_left</span>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive({ textAlign: "center" })
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Align Center"
        >
          <span className="material-symbols-outlined text-[18px]">format_align_center</span>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive({ textAlign: "right" })
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Align Right"
        >
          <span className="material-symbols-outlined text-[18px]">format_align_right</span>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive({ textAlign: "justify" })
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Justify"
        >
          <span className="material-symbols-outlined text-[18px]">format_align_justify</span>
        </button>
      </div>

      {/* 6. List elements */}
      <div className="flex items-center gap-xs pr-md border-r border-outline-variant">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive("bulletList")
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Bulleted List"
        >
          <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive("orderedList")
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Numbered List"
        >
          <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
        </button>
      </div>



      {/* 7. Text Color & Highlight */}
      <div className="flex items-center gap-sm">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px] text-secondary">format_color_text</span>
          <select
            onChange={(e) => {
              const val = e.target.value;
              editor.chain().focus().setColor(val).run();
            }}
            className="h-8 px-2 rounded-lg bg-surface-container border-none outline-none font-label-md text-label-md text-on-surface cursor-pointer focus:ring-1 focus:ring-primary/20"
            title="Text Color"
          >
            {colorOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="color"
            onInput={(e: any) => {
              editor.chain().focus().setColor(e.target.value).run();
            }}
            className="w-6 h-6 p-0 border-none outline-none rounded cursor-pointer"
            title="Custom Text Color"
          />
        </div>

        <button
          onClick={() => editor.chain().focus().toggleHighlight({ color: "#ffec99" }).run()}
          className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive("highlight")
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          title="Highlight"
        >
          <span className="material-symbols-outlined text-[18px]">format_color_fill</span>
        </button>
      </div>
    </div>
  );
}
