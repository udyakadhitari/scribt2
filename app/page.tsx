import Link from "next/link";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* TopNavBar */}
      <nav className="flex justify-between items-center w-full px-gutter py-sm max-w-7xl mx-auto bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="font-headline-sm text-headline-sm font-bold text-primary hover:opacity-90 transition-opacity">
          Inkwell
        </Link>
        <div className="hidden md:flex gap-md items-center">
          <Link href="/dashboard" className="font-label-md text-secondary hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/editor" className="font-label-md text-secondary hover:text-primary transition-colors">
            Editor
          </Link>
          <Link href="/design-system" className="font-label-md text-secondary hover:text-primary transition-colors">
            Style Guide
          </Link>
        </div>
        <div className="flex items-center gap-sm text-primary">
          <span className="material-symbols-outlined hover:text-primary transition-colors cursor-pointer" style={{ fontVariationSettings: "'FILL' 0" }}>
            notifications
          </span>
          <span className="material-symbols-outlined hover:text-primary transition-colors cursor-pointer" style={{ fontVariationSettings: "'FILL' 0" }}>
            settings
          </span>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="bg-primary text-on-primary rounded-full px-4 py-1.5 font-label-md hover:bg-surface-tint transition-all cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </Show>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-desktop py-xl md:py-[120px] max-w-7xl mx-auto w-full gap-lg">
          <div className="flex flex-col gap-md max-w-3xl">
            <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-background">
              Write with clarity.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              A technical workspace that breathes. Focus on your thoughts, undisturbed by clutter, in an environment designed for quiet luxury and deep work.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-md items-center justify-center mt-sm">
            <Link
              href="/dashboard"
              className="bg-primary text-on-primary rounded-full px-lg py-sm font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center justify-center shadow-ambient-raised"
            >
              Get Started
            </Link>
            <Link
              href="/editor"
              className="bg-primary/10 text-primary rounded-full px-lg py-sm font-label-md text-label-md hover:bg-primary/20 transition-colors flex items-center justify-center"
            >
              View Demo
            </Link>
          </div>
          <div className="w-full mt-xl rounded-xl overflow-hidden shadow-ambient-overlay h-[400px] md:h-[600px] bg-surface-container relative group">
            <img
              className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.02]"
              alt="A clean, minimalist workspace scene from a top-down perspective. A sleek laptop sits open on a smooth, cream-colored desk surface, surrounded by ample negative space."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDN_7enH-96nfSCfG--eJGLOll0dPhHW5jHKEFmgQ4b0bZpYNy88IT5ZRZM_SYqGRwMZLwde1NnO-oX5dXEglPbYw2YltrP0PJdv74Au8T0_KnxolGrbkSpcFfwEKsWtvIpt_gIXzo3Xknb38kMcbjjNqXe_Br4Hq3Cum5UleQVs1TXKMBIls38sGXCExTG9xU4gPDSe8Cz3Fm5GofFMadYS7kMmRez8gk8vIVnCTQ6M9S3G_FhCSVcVa_uKHDZo-iLa2YNWfd9netj"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none" />
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="px-margin-mobile md:px-margin-desktop py-xl max-w-7xl mx-auto w-full flex flex-col gap-xl">
          <div className="text-center flex flex-col gap-sm">
            <h2 className="font-headline-md text-headline-md text-on-background">Designed for Flow</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
              Three pillars to elevate your writing experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {/* Feature 1: Focus */}
            <div className="bg-surface-container-low rounded-xl p-lg flex flex-col gap-md shadow-ambient-raised items-start hover:bg-surface-container transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  center_focus_strong
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-background mb-xs">Unbroken Focus</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  A distraction-free canvas that lets your ideas take center stage. Organic minimalism meets digital serenity.
                </p>
              </div>
            </div>
            {/* Feature 2: AI Assistance */}
            <div className="bg-surface-container-low rounded-xl p-lg flex flex-col gap-md shadow-ambient-raised items-start hover:bg-surface-container transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-background mb-xs">Intuitive AI</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Subtle, context-aware suggestions that refine your prose without interrupting your natural rhythm.
                </p>
              </div>
            </div>
            {/* Feature 3: Organization */}
            <div className="bg-surface-container-low rounded-xl p-lg flex flex-col gap-md shadow-ambient-raised items-start hover:bg-surface-container transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  account_tree
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-background mb-xs">Fluid Organization</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Connect thoughts effortlessly. No rigid folders, just a natural progression of ideas linked together.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-xl px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-md bg-background mt-auto">
        <Link href="/" className="font-label-md text-label-md font-bold text-primary">
          Inkwell
        </Link>
        <div className="text-on-surface-variant font-label-sm text-label-sm">
          © 2026 Inkwell. Organic Minimalist Workspace.
        </div>
        <div className="flex gap-md font-label-sm text-label-sm">
          <Link href="/design-system" className="text-on-surface-variant hover:text-secondary transition-colors">
            Style Guide
          </Link>
          <a className="text-on-surface-variant hover:text-secondary transition-colors" href="#">
            Privacy
          </a>
          <a className="text-on-surface-variant hover:text-secondary transition-colors" href="#">
            Terms
          </a>
          <a className="text-on-surface-variant hover:text-secondary transition-colors" href="#">
            Changelog
          </a>
          <a className="text-on-surface-variant hover:text-secondary transition-colors" href="#">
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
