"use client";

import { useState } from "react";
import Link from "next/link";

interface ColorSwatch {
  name: string;
  variable: string;
  hex: string;
  desc: string;
  textColor: string;
}

export default function DesignSystem() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const colors: ColorSwatch[] = [
    { name: "Background", variable: "--color-background", hex: "#fff8f5", desc: "Warm neutral base of the workspace.", textColor: "text-on-background" },
    { name: "Primary (Forest Green)", variable: "--color-primary", hex: "#334537", desc: "Main brand and high-priority action color.", textColor: "text-on-primary" },
    { name: "Secondary (Brick Red)", variable: "--color-secondary", hex: "#944931", desc: "Accent actions and helper text highlights.", textColor: "text-on-secondary" },
    { name: "Secondary Container", variable: "--color-secondary-container", hex: "#fd9d7f", desc: "Highlights and notification backgrounds.", textColor: "text-on-secondary-container" },
    { name: "Surface Container", variable: "--color-surface-container", hex: "#f5ece7", desc: "Subtle background panels and sidebars.", textColor: "text-on-surface" },
    { name: "Surface Container Low", variable: "--color-surface-container-low", hex: "#fbf2ed", desc: "Subtle card structures.", textColor: "text-on-surface" },
    { name: "Surface Container Lowest", variable: "--color-surface-container-lowest", hex: "#ffffff", desc: "Crisp white text-area containers.", textColor: "text-on-surface" },
    { name: "Outline Variant", variable: "--color-outline-variant", hex: "#c3c8c1", desc: "Borders and dividers.", textColor: "text-on-surface-variant" },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  return (
    <div className="min-h-screen bg-background text-on-background py-xl px-gutter max-w-7xl mx-auto flex flex-col gap-xl">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md border-b border-outline-variant pb-lg">
        <div>
          <h1 className="font-display-lg text-primary mb-xs">Inkwell Design System</h1>
          <p className="font-body-lg text-secondary">
            Visual identity, color variables, typography scales, and interactive components.
          </p>
        </div>
        <div className="flex gap-sm">
          <Link
            href="/"
            className="px-lg py-sm rounded-full font-label-md bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            Landing
          </Link>
          <Link
            href="/dashboard"
            className="px-lg py-sm rounded-full font-label-md bg-primary text-on-primary hover:bg-surface-tint transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Grid Layout of Design Elements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        
        {/* Colors Section */}
        <section className="lg:col-span-2 flex flex-col gap-lg">
          <h2 className="font-headline-md text-primary border-b border-outline-variant/30 pb-xs">Harmonious Theme Swatches</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            {colors.map((color, index) => (
              <div
                key={index}
                onClick={() => handleCopy(color.hex)}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-md shadow-ambient-raised hover:shadow-ambient-overlay hover:border-primary transition-all cursor-pointer group flex flex-col gap-md relative"
              >
                <div
                  className="w-full h-24 rounded-xl border border-outline-variant/50 flex items-end justify-between p-sm text-sm font-semibold transition-transform duration-300 group-hover:scale-[1.01]"
                  style={{ backgroundColor: color.hex, color: color.hex === "#fff8f5" || color.hex === "#ffffff" || color.hex === "#fbf2ed" || color.hex === "#f5ece7" ? "#1e1b18" : "#ffffff" }}
                >
                  <span className="bg-background/80 px-2 py-0.5 rounded-md text-xs backdrop-blur-sm">
                    {color.hex}
                  </span>
                  {copiedText === color.hex && (
                    <span className="bg-primary text-on-primary px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider animate-pulse">
                      Copied!
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-headline-sm text-on-background flex items-center justify-between">
                    {color.name}
                    <span className="font-mono text-xs text-outline opacity-0 group-hover:opacity-100 transition-opacity">
                      {color.variable}
                    </span>
                  </h3>
                  <p className="font-body-md text-on-surface-variant text-sm mt-1">{color.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography Section */}
        <section className="flex flex-col gap-lg bg-surface-container-low rounded-3xl p-lg border border-outline-variant/50 shadow-ambient-raised">
          <h2 className="font-headline-md text-primary border-b border-outline-variant/30 pb-xs">Typography Scales</h2>
          <div className="flex flex-col gap-md divide-y divide-outline-variant/20">
            <div className="pt-2">
              <span className="font-label-sm text-outline block mb-1">font-display-lg (48px)</span>
              <p className="font-display-lg text-on-background">Clarified Thoughts</p>
            </div>
            <div className="pt-4">
              <span className="font-label-sm text-outline block mb-1">font-headline-md (32px)</span>
              <p className="font-headline-md text-on-background">Dijkstra&apos;s Proof</p>
            </div>
            <div className="pt-4">
              <span className="font-label-sm text-outline block mb-1">font-headline-sm (24px)</span>
              <p className="font-headline-sm text-on-background">Calculus Advanced</p>
            </div>
            <div className="pt-4">
              <span className="font-label-sm text-outline block mb-1">font-body-lg (18px)</span>
              <p className="font-body-lg text-on-surface-variant">Focus undisturbed by ambient noise.</p>
            </div>
            <div className="pt-4">
              <span className="font-label-sm text-outline block mb-1">font-body-md (16px)</span>
              <p className="font-body-md text-on-surface-variant">Standard text rendering style guide block.</p>
            </div>
            <div className="pt-4">
              <span className="font-label-sm text-outline block mb-1">font-label-md (14px)</span>
              <p className="font-label-md text-primary uppercase">Button Action Tag</p>
            </div>
          </div>
        </section>

      </div>

      {/* Shadow & Spacings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
        
        {/* Shadow Showcase */}
        <section className="flex flex-col gap-lg">
          <h2 className="font-headline-md text-primary border-b border-outline-variant/30 pb-xs">Ambient Shadow Diffusion</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md pt-sm">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg shadow-ambient-raised flex flex-col gap-sm">
              <span className="font-label-sm text-outline">CLASS: shadow-ambient-raised</span>
              <h4 className="font-headline-sm text-primary font-bold">Raised Ambient</h4>
              <p className="text-sm text-secondary">
                Soft, subtle shadow used for card elements and interactive panels. `0 8px 30px rgba(45,41,38,0.04)`
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg shadow-ambient-overlay flex flex-col gap-sm">
              <span className="font-label-sm text-outline">CLASS: shadow-ambient-overlay</span>
              <h4 className="font-headline-sm text-primary font-bold">Overlay Ambient</h4>
              <p className="text-sm text-secondary">
                Deep, rich ambient shadow used for dropdown tooltips, menus, and sidebars. `0 16px 40px rgba(74,93,78,0.08)`
              </p>
            </div>
          </div>
        </section>

        {/* Component Playgrounds */}
        <section className="flex flex-col gap-lg">
          <h2 className="font-headline-md text-primary border-b border-outline-variant/30 pb-xs">Interactive Component Playgrounds</h2>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-lg flex flex-col gap-md shadow-ambient-raised">
            <div>
              <span className="font-label-sm text-outline block mb-2">Pill Buttons</span>
              <div className="flex gap-md flex-wrap">
                <button className="bg-primary text-on-primary rounded-full px-lg py-sm font-label-md hover:bg-surface-tint transition-all hover:shadow-sm">
                  Primary Button
                </button>
                <button className="bg-primary/10 text-primary rounded-full px-lg py-sm font-label-md hover:bg-primary/20 transition-all">
                  Secondary Button
                </button>
                <button className="border border-outline-variant text-secondary rounded-full px-lg py-sm font-label-md hover:bg-surface-container-low transition-all">
                  Outline Button
                </button>
              </div>
            </div>

            <div className="pt-2">
              <span className="font-label-sm text-outline block mb-2">Subject Tags</span>
              <div className="flex gap-sm flex-wrap">
                <span className="font-label-sm px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full flex items-center gap-xs">
                  <span className="w-2 h-2 rounded-full bg-primary-fixed-dim"></span>
                  Mathematics
                </span>
                <span className="font-label-sm px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full flex items-center gap-xs">
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim"></span>
                  Comp Sci
                </span>
                <span className="font-label-sm px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full flex items-center gap-xs">
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                  Literature
                </span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
