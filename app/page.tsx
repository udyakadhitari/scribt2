import Link from "next/link";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <div className="antialiased min-h-screen flex flex-col font-body-md text-body-md overflow-x-hidden relative bg-[#fdfdfd] text-[#1e1b18]">
      {/* Page styles, font imports, and animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;400;600;700&display=swap');
        
        body {
          background-color: #fdfdfd;
          color: #1e1b18;
          background-image: radial-gradient(#e5e7eb 0.5px, transparent 0.5px);
          background-size: 24px 24px;
        }
        
        .font-fraunces {
          font-family: 'Fraunces', serif;
        }
        
        .shadow-soft {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        }
        
        .shadow-card {
          box-shadow: 0 20px 50px rgba(74, 93, 78, 0.08);
        }
        
        .floating {
          animation: floating 6s ease-in-out infinite;
        }
        
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        
        .floating-delayed {
          animation: floating-delayed 7s ease-in-out infinite;
        }
        
        @keyframes floating-delayed {
          0% { transform: translateY(0px); }
          50% { transform: translateY(15px); }
          100% { transform: translateY(0px); }
        }
      `}} />

      {/* Header */}
      <nav className="flex justify-between items-center w-full px-gutter py-md max-w-7xl mx-auto z-50">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center outline-none">
            <Logo className="h-20 md:h-24 w-auto hover:opacity-90 transition-opacity" />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-on-surface-variant font-label-md">
            <Link className="hover:text-primary transition-colors" href="/dashboard">Dashboard</Link>
            <a className="hover:text-primary transition-colors" href="#features">Features</a>
            <Link className="hover:text-primary transition-colors" href="/help">Help</Link>
            <Link className="hover:text-primary transition-colors" href="/demo">Demo</Link>
          </div>
        </div>

        {/* Right Corner Sign In Button */}
        <div className="flex items-center gap-6">
          <Show when="signed-in">
            <div className="flex items-center justify-center p-0.5 border border-primary/10 rounded-full bg-white/50 backdrop-blur-sm">
              <UserButton />
            </div>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="bg-primary text-on-primary rounded-lg px-6 py-2.5 font-label-md hover:scale-105 transition-transform flex items-center justify-center cursor-pointer border-0 shadow-sm font-semibold">
                Sign in
              </button>
            </SignInButton>
          </Show>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-desktop py-xl md:py-[140px] max-w-7xl mx-auto w-full min-h-[90vh]">
          
          {/* Central Content */}
          <div className="flex flex-col gap-sm max-w-3xl z-20 items-center select-none mt-8">
            <div className="bg-white p-4 rounded-2xl shadow-soft mb-8 border border-slate-100/50">
              <div className="grid grid-cols-2 gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <div className="w-3 h-3 rounded-full bg-primary/20"></div>
                <div className="w-3 h-3 rounded-full bg-primary/20"></div>
                <div className="w-3 h-3 rounded-full bg-primary/20"></div>
              </div>
            </div>
            
            <h1 className="font-fraunces text-6xl md:text-[84px] text-on-background max-w-4xl leading-tight font-semibold tracking-tight">
              Think, plan, and track <span className="text-on-surface-variant/40">all in one place</span>
            </h1>
            
            <p className="font-body-md text-on-surface-variant max-w-2xl mx-auto mt-8 leading-relaxed">
              Write with clarity. Efficiently manage your creative workflow and boost productivity with our minimal workspace.
            </p>
            
            <div className="mt-12 flex flex-col items-center gap-sm">
              <Link
                href="/demo"
                className="bg-blue-600 text-white rounded-lg px-12 py-4 font-label-md text-label-md hover:bg-blue-700 transition-all shadow-lg inline-flex items-center justify-center font-bold"
              >
                Get free demo
              </Link>
              <Link
                href="/dashboard"
                className="text-on-surface-variant hover:text-primary font-label-md text-sm transition-colors mt-3 underline underline-offset-4"
              >
                Go to dashboard
              </Link>
            </div>
          </div>

          {/* Floating UI Elements (Top Left: Sticky Note) */}
          <div className="absolute top-[8%] left-[2%] xl:left-[6%] z-10 floating hidden lg:block">
            <div className="bg-yellow-100 p-6 w-56 rounded-sm shadow-card rotate-[-2deg] relative border-t-8 border-yellow-200">
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-400 rounded-full border-2 border-white"></div>
              <p className="font-serif italic text-yellow-900 leading-tight">Take notes to keep track of crucial details, and accomplish more tasks with ease.</p>
            </div>
            <div className="bg-white p-4 w-12 h-12 rounded-xl shadow-lg mt-4 -ml-4 flex items-center justify-center border border-slate-50">
              <span className="material-symbols-outlined text-blue-500 font-bold">check</span>
            </div>
          </div>

          {/* Floating UI Elements (Top Right: Whiteboard Feature Card - Rotated CW & Larger) */}
          <div className="absolute top-[10%] right-[1%] xl:right-[4%] z-10 floating-delayed hidden lg:block">
            <div className="bg-white/90 backdrop-blur-md p-6 w-72 md:w-80 rounded-xl shadow-card border border-white/40 text-left rotate-[4deg] transition-transform duration-300 hover:rotate-[6deg]">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm flex items-center gap-xs text-primary">
                  <span className="material-symbols-outlined text-[20px]">gesture</span>
                  Whiteboard
                </span>
              </div>
              <p className="text-sm font-semibold mb-1">Infinite Drawing Canvas</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Sketch ideas, draw diagrams, and brainstorm visually on a clean infinite sketchpad.
              </p>
            </div>
          </div>

          {/* Floating UI Elements (Bottom Left: Journaling Feature Card - Rotated ACW & Larger) */}
          <div className="absolute bottom-[8%] left-[1%] xl:left-[5%] z-10 floating-delayed hidden lg:block">
            <div className="bg-white/95 backdrop-blur-md p-6 w-72 md:w-80 rounded-xl shadow-card border border-white/40 text-left rotate-[-4deg] transition-transform duration-300 hover:rotate-[-6deg]">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm flex items-center gap-xs text-secondary">
                  <span className="material-symbols-outlined text-[20px]">book</span>
                  Journaling
                </span>
              </div>
              <p className="text-sm font-semibold mb-1">Daily Reflections</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Write private thoughts, record daily memories, and track your mood trends over time.
              </p>
            </div>
          </div>

          {/* Floating UI Elements (Bottom Right: Integrations) */}
          <div className="absolute bottom-[10%] right-[2%] xl:right-[8%] z-10 floating hidden lg:block">
            <div className="bg-white/80 backdrop-blur-md p-6 w-64 rounded-2xl shadow-card border border-white/40">
              <p className="text-left font-bold text-sm mb-4">100+ Integrations</p>
              <div className="flex gap-2">
                <div className="w-12 h-12 rounded-xl shadow-sm bg-white flex items-center justify-center border border-slate-50">
                  <img alt="Gmail" className="w-6 h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzHsz7QvgNR4FBS2ycwoFo7t3LOcFkmoIhr8ybLV2NbA7RIjyE2h14Xz-6OkxwbCYVBWXOdf-2hD-pOCySOo1zXAVO9e6BkbeSO6EDk1VUcnenrufRLz48X_2QR3QhB5jJGXnGy_L5qqBaygFix8YUBtRWb-FXF96OHZkNcJzBiEvWKHGqM478dNBQTFB32X05-CPt9I2mPxZdTUIr8UM6e6KWCcJXli7bh2Ytgx7F4WfgHmMLeTFqhKh34paP6FwWfCWr9adLSgGh" />
                </div>
                <div className="w-12 h-12 rounded-xl shadow-sm bg-white flex items-center justify-center border border-slate-50">
                  <img alt="Slack" className="w-6 h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBc7lWd4lGvcXhvORlIA-QXaAxQTfpqTY-6KUPL9Uq5moiuY6qrUZWUzVZHNW9lMMTwT69eeq-ZQyDr7KfIgk9Yz5MxPFOhQGLHWsKRJDBgk0S687bBsw1nUx5GqqCtXEHh55jF2hhDISlaffBcRMZWMlt7AS-IXyoOcqCE0dxAVamfyhmvnA7xBxLXsO_GtTLdsk3DDxQmgnhnInzQNTFxiVFhw2uxop3oamh2CM39wpfucVCtzftNf32mUTBzB9oEZ406AbGrznB3" />
                </div>
                <div className="w-12 h-12 rounded-xl shadow-sm bg-white flex items-center justify-center border border-slate-50">
                  <img alt="Calendar" className="w-6 h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDc6bUSjNRwm3pz9p4gAra6f0AYLVkbP9DhIUobAWMqGzZduhhhvBNbdzEpVzT2tjKhAXLvBWeai-izLHCzbAnJyELOFO2N7mTBCEn_ibpM5XQeccVmRiRVgnYCRrf4DRtKtu1Uy-n7hQY3ub0TUI518dn-nkIHaUeCS1QckH3YtUCBz13JYX9JCaNVNL9tUer-6xhznXwjkb2Ct-XfszcgxJ-YiryFDRq-KLDkX8cvR4M8Soqamh5yQWlC5bElWkGl3uv-yEC3huEp" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="relative px-margin-mobile md:px-margin-desktop py-xl md:py-[100px] max-w-7xl mx-auto w-full flex flex-col gap-xl">
          <div className="text-center flex flex-col gap-sm mb-lg">
            <h2 className="font-headline-md text-headline-md text-on-background font-semibold">Designed for Flow</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto italic">Maintain the same core pillars with a fresh perspective.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1: Notes */}
            <div className="bg-white rounded-2xl p-lg flex flex-col gap-md shadow-soft items-start hover:-translate-y-2 transition-all duration-500 group border border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[32px]">description</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-background mb-xs font-semibold">Real-time Notes</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Collaborate in real-time with an elegant, Google Docs-style Rich Text workspace.</p>
              </div>
            </div>
            {/* Feature 2: Whiteboard */}
            <div className="bg-white rounded-2xl p-lg flex flex-col gap-md shadow-soft items-start hover:-translate-y-2 transition-all duration-500 group border border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[32px]">gesture</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-background mb-xs font-semibold">Whiteboard</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Brainstorm visually on an infinite canvas using sketching tools and shapes.</p>
              </div>
            </div>
            {/* Feature 3: Journaling */}
            <div className="bg-white rounded-2xl p-lg flex flex-col gap-md shadow-soft items-start hover:-translate-y-2 transition-all duration-500 group border border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[32px]">book</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-background mb-xs font-semibold">Journaling</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Reflect on your day, record memories, and log your daily mood on blue-ruled sheets.</p>
              </div>
            </div>
            {/* Feature 4: AI Assistant */}
            <div className="bg-white rounded-2xl p-lg flex flex-col gap-md shadow-soft items-start hover:-translate-y-2 transition-all duration-500 group border border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[32px]">smart_toy</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-background mb-xs font-semibold">AI Assistant</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Refine your writing, generate ideas, and verify grammar using context-aware AI.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-lg px-margin-desktop bg-[#f9fafb] border-t border-slate-200/50 mt-auto select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-md text-xs text-[#737872]">
          <div className="flex items-center gap-sm">
            <Logo className="h-10 w-auto opacity-75" />
            <span>© 2026 Scribt</span>
          </div>
          <div className="flex gap-lg font-semibold">
            <Link href="/help" className="hover:text-[#4a5d4e] transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );  
}
