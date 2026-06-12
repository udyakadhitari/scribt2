# Scribt 📝

Scribt is a modern, collaborative note-taking and workspace platform designed to help teams and individuals think, plan, and track in real-time. It integrates collaborative text editing, infinite whiteboards, daily journaling, AI-assisted workflows, and robust security controls within a premium, visual interface.

---

## ✨ Features

### 👥 Real-Time Collaboration
* **Conflict-Free Synchronization**: Powered by **Yjs** CRDTs and **Socket.io** to synchronize text document changes across clients concurrently.
* **Presence & Collaboration Cursors**: Visual indicators for cursor positions, selections, and user names inside note rooms.
* **Rich Text Editor**: Modular text formatting, font family custom styles, highlights, drag-and-drop handles, subscripts, superscripts, tables, alignment controls, and image support using **TipTap**.
* **Interactive Comments**: Add comments inline, broadcast new comments to active users, and mark comments as resolved in real-time.

### 🎨 Infinite Visual Canvas (Whiteboard)
* **Visual Sketchpad**: Fully featured drawing canvas powered by **Excalidraw** inside the workspace.
* **Seamless Visual Ideation**: Sketch out layouts, draw custom diagrams, and brainstorm visual components alongside written notes.

### 📔 Daily Journaling
* **Personal Space**: Maintain journal entries organized by date.
* **Mood Tracking**: Log and visualize daily moods with custom interactive styling components.

### 🤖 Gemini AI Assistant Integration
* **Note Side-Chat**: Engage with a chat helper that is context-aware of your current note.
* **Custom Configured API Keys**: Bring your own Gemini API Key via the settings dashboard, which is stored securely in local storage.
* **Secure Fallbacks**: Graceful handling of custom API key inputs, fallback to system configurations, and validation limits to prevent prompt-injection or abuse.

### 🔒 Hardened Security Architecture
* **Authorized WebSockets**: Token-based validation during Socket.io handshake using Clerk JWT authentication.
* **Strict Content Security Policy (CSP)**: Robust Next.js middleware headers to mitigate XSS vulnerabilities and prevent unauthorized cross-origin connections.
* **Input & Content Sanitization**: Integration of **DOMPurify** to sanitize collaborative inputs and prevent AI-generated HTML payload injection vectors.
* **API Rate Limiting**: Token-bucket-style sliding-window rate limiters protecting server routes (`/api/chat`, `/api/upload`, `/api/search`) against brute-force or Denial-of-Service (DoS) abuse.
* **Payload Validation**: Maximum upload constraints (10MB image restrictions, MIME verification to block malicious SVG scripts) and strict character limit validations on note titles, note content, chat context, and user comments.

---

## 🛠️ Tech Stack

* **Frontend Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript) & React 19
* **Database & ORM**: PostgreSQL & [Prisma ORM](https://www.prisma.io/)
* **Authentication**: [Clerk](https://clerk.com/)
* **Real-time Sync & CRDTs**: [Yjs](https://yjs.dev/), [Socket.io](https://socket.io/), `y-prosemirror`, `y-protocols`
* **Text Editor Core**: [TipTap](https://tiptap.dev/)
* **Whiteboard Integration**: [Excalidraw](https://excalidraw.com/)
* **Media Uploads**: [Cloudinary](https://cloudinary.com/) (using Next-Cloudinary)
* **Styling & Aesthetics**: Tailwind CSS 4, Google Fonts (Fraunces, Geist), Styled-Components
* **Security & Verification**: DOMPurify, `@clerk/nextjs/server` verification hooks

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18.x or newer)
* PostgreSQL Database instance (e.g., Neon Postgres, local Postgres)
* Clerk Developer Account
* Cloudinary Developer Account

### Environment Setup

1. Clone the repository and navigate into the folder:
   ```bash
   git clone <your-repo-url>
   cd scribt
   ```

2. Create a `.env` file in the root directory:
   ```env
   # Database connection string
   DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

   # Clerk Auth configuration
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   CLERK_SECRET_KEY="sk_test_..."

   # Cloudinary Media Configuration
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"

   # Application URL (for CORS and socket handshakes)
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # System Fallback Gemini API Key (optional)
   GEMINI_API_KEY="AIzaSy..."
   ```

### Installation

1. Install project dependencies:
   ```bash
   npm install
   ```

2. Push the Prisma database schema:
   ```bash
   npx prisma db push
   ```

### Running the Application

* Run the development server (which spins up the custom Socket.io server wrapper around Next.js):
  ```bash
  npm run dev
  ```
  Open [http://localhost:3000](http://localhost:3000) to view the application.

* Build for production:
  ```bash
  npm run build
  npm run start
  ```

---

## 📂 Project Structure

```text
├── app/                  # Next.js App Router (pages & API routes)
│   ├── api/              # API Endpoints (chat, upload, search)
│   ├── dashboard/        # Main workspace dashboard
│   ├── journal/          # Journaling entries & mood management
│   ├── note/             # Collaborative document editor (TipTap + Sidechat)
│   ├── whiteboard/       # Infinite drawing board page (Excalidraw)
│   └── settings/         # API key configurations & user setup
├── components/           # Reusable UI component modules (Sidebar, Editor, Logo)
├── lib/                  # Backend/client helper libraries, rate limiters & Server Actions
├── prisma/               # Prisma database schema and migrations
├── public/               # Static assets & public images
├── server.ts             # Custom HTTP & Socket.io server configuration
└── package.json          # Dependency scripts & configurations
```
