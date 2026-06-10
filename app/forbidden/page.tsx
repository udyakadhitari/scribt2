"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSwitchAccount = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (err) {
      console.error("Failed to sign out:", err);
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-lg relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-error/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main glassmorphism card */}
      <div className="bg-surface-container-low/80 border border-outline-variant backdrop-blur-lg rounded-3xl p-xl max-w-md w-full text-center shadow-ambient-raised flex flex-col items-center gap-md z-10 transition-all duration-300 hover:shadow-ambient-overlay">
        {/* Animated glowing warning icon */}
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-sm animate-pulse shadow-[0_0_24px_rgba(var(--color-error-rgb,211,47,47),0.15)]">
          <span className="material-symbols-outlined text-[36px] font-bold">gpp_bad</span>
        </div>

        <div className="flex flex-col gap-xs">
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
            Access Denied
          </h1>
          <p className="font-label-sm text-error font-semibold uppercase tracking-wider">
            Error 403 • Forbidden
          </p>
        </div>

        <p className="font-body-md text-outline leading-relaxed px-sm">
          You do not have permission to access this note, subject, or workspace. This content might be private, or the owner may have modified your permissions.
        </p>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-sm mt-md">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-primary text-on-primary rounded-full py-2.5 font-label-md text-label-md hover:bg-surface-tint transition-all cursor-pointer shadow-ambient-raised flex items-center justify-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Go to Dashboard
          </button>
          
          <button
            onClick={handleSwitchAccount}
            className="w-full border border-outline-variant text-secondary hover:text-primary hover:bg-surface-container-high rounded-full py-2.5 font-label-md text-label-md transition-all cursor-pointer flex items-center justify-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">switch_account</span>
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
