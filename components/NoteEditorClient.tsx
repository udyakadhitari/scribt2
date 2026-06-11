"use client";

import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  updateNoteContent,
  deleteNote,
  saveChatMessage,
  checkGrammar,
  createShareLink,
  deleteShareLink,
  getShareLinks,
  addComment,
  resolveComment,
  getCollaborators,
  copySharedNote,
  updateCollaboratorRole,
  removeCollaborator,
  updateNoteGeneralAccess,
  inviteCollaborator
} from "@/lib/actions";
import toast from "react-hot-toast";
import { useEditor } from "@tiptap/react";
import Sidebar from "@/components/Sidebar";
import BookLoad from "@/components/ui/book_load";
import { extensions } from "@/components/editor/extensions";
import Toolbar from "@/components/editor/toolbar";
import TiptapEditor from "@/components/editor/editor";
import { slashCommandsList } from "@/components/editor/suggestions";
import { NodeSelection, TextSelection } from "prosemirror-state";
import { EMOJI_CATEGORIES, SPECIAL_CHAR_CATEGORIES } from "@/components/editor/symbols";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import * as awarenessProtocol from "y-protocols/awareness";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { yCursorPlugin } from "@tiptap/y-tiptap";


interface ChatMessage {
  sender: "ai" | "user";
  text: string;
  suggestion?: {
    title: string;
    code: string;
  };
}

interface GrammarErrorItem {
  id: string;
  from: number;
  to: number;
  message: string;
  suggestions: string[];
  originalText: string;
}

interface NoteChatData {
  role: "USER" | "ASSISTANT";
  content: string;
}

interface NoteData {
  id: string;
  title: string;
  content: any;
  chapterTitle: string;
  subjectTitle: string;
  subjectId: string;
  chats: NoteChatData[];
  generalAccess?: "RESTRICTED" | "ANYONE";
  publicRole?: "VIEW" | "COMMENT" | "EDIT";
}

interface CommentData {
  id: string;
  content: string;
  resolved: boolean;
  createdAt: string;
  user: {
    name: string;
    imageUrl: string | null;
  };
}

const CURSOR_COLORS = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5",
  "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50",
  "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800",
  "#ff5722", "#795548", "#607d8b"
];

function getCursorColor(userId?: string) {
  if (!userId) return "#334537"; // default primary color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
}

const CustomCollaborationCursor = CollaborationCursor.extend({
  addProseMirrorPlugins() {
    return [
      yCursorPlugin(
        (() => {
          this.options.provider.awareness.setLocalStateField("user", this.options.user);

          const statesToArray = (states: Map<number, any>) => {
            return Array.from(states.entries()).map(([key, value]) => ({
              clientId: key,
              ...value.user,
            }));
          };

          this.storage.users = statesToArray(this.options.provider.awareness.states);

          this.options.provider.awareness.on("update", () => {
            this.storage.users = statesToArray(this.options.provider.awareness.states);
          });

          return this.options.provider.awareness;
        })(),
        // @ts-ignore
        {
          cursorBuilder: this.options.render,
          selectionBuilder: this.options.selectionRender,
        }
      ),
    ];
  },
});

export default function NoteEditorClient({
  note,
  initialRole = "EDIT",
  initialComments = [],
  isOwner = true,
  isShared = false,
  authorName,
  ownerName = "Owner",
  ownerImageUrl = null,
  ownerClerkId,
}: {
  note: NoteData;
  initialRole?: "VIEW" | "COMMENT" | "EDIT";
  initialComments?: CommentData[];
  isOwner?: boolean;
  isShared?: boolean;
  authorName?: string;
  ownerName?: string;
  ownerImageUrl?: string | null;
  ownerClerkId?: string;
}) {
  const router = useRouter();
  const { user } = useUser();

  // Yjs and Awareness refs
  const ydocRef = useRef<Y.Doc | null>(null);
  const awarenessRef = useRef<any>(null);
  const needsInitRef = useRef(false);
  const initialContentRef = useRef(note.content?.html || "");

  if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
    awarenessRef.current = new Awareness(ydocRef.current);
  }

  const ydoc = ydocRef.current;
  const awareness = awarenessRef.current;
  
  // Collaborative Access Roles & Comments States
  const [role, setRole] = useState<"VIEW" | "COMMENT" | "EDIT">(initialRole);
  const roleRef = useRef(role);
  useEffect(() => {
    roleRef.current = role;
  }, [role]);
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [generalAccess, setGeneralAccess] = useState<"RESTRICTED" | "ANYONE">(note.generalAccess || "RESTRICTED");
  const [publicRole, setPublicRole] = useState<"VIEW" | "COMMENT" | "EDIT">(note.publicRole || "VIEW");
  const [isUpdatingGeneralAccess, setIsUpdatingGeneralAccess] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"VIEW" | "COMMENT" | "EDIT">("VIEW");
  const [isInviting, setIsInviting] = useState(false);
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(initialRole === "COMMENT");
  const isCommentsPanelOpenRef = useRef(isCommentsPanelOpen);
  useEffect(() => {
    isCommentsPanelOpenRef.current = isCommentsPanelOpen;
  }, [isCommentsPanelOpen]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [unreadCommentCount, setUnreadCommentCount] = useState(0);
  const [pendingRoles, setPendingRoles] = useState<Record<string, "VIEW" | "COMMENT" | "EDIT">>({});
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [activeUsers, setActiveUsers] = useState<{ id: string; name: string; color: string; imageUrl: string | null }[]>([]);
  const liveCollaborators = activeUsers.filter((u) => u.id !== ownerClerkId && u.id !== "guest");

  // Sort collaborators to put live ones first
  const sortedCollaborators = [...collaborators].sort((a, b) => {
    const aLive = activeUsers.some(u => u.id === a.user.clerkId);
    const bLive = activeUsers.some(u => u.id === b.user.clerkId);
    if (aLive && !bLive) return -1;
    if (!aLive && bLive) return 1;
    return 0;
  });

  // Socket.io ref
  const socketRef = useRef<Socket | null>(null);

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Connect socket and join note room
  useEffect(() => {
    const socket = io({ path: "/api/socketio" });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-note", note.id);
      socket.emit("sync-room", { noteId: note.id });
    });

    socket.on("sync-room-response", (data: { empty: boolean; update?: number[] }) => {
      if (data.empty) {
        if (editorRef.current) {
          editorRef.current.commands.setContent(initialContentRef.current, { emitUpdate: false });
          const update = Y.encodeStateAsUpdate(ydoc);
          socket.emit("ydoc-update", { noteId: note.id, update: Array.from(update) });
        } else {
          needsInitRef.current = true;
        }
      } else if (data.update) {
        Y.applyUpdate(ydoc, new Uint8Array(data.update), "remote");
      }

      // Listen for local updates
      ydoc.on("update", (update: Uint8Array, origin: any) => {
        if (origin !== "remote" && roleRef.current === "EDIT") {
          socket.emit("ydoc-update", { noteId: note.id, update: Array.from(update) });
        }
      });
    });

    socket.on("ydoc-update", (updateData: number[]) => {
      Y.applyUpdate(ydoc, new Uint8Array(updateData), "remote");
    });

    socket.on("awareness-update", (updateData: number[]) => {
      awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(updateData), "remote");
    });

    // Listen to local awareness updates and broadcast them
    awareness.on("update", ({ added, updated, removed }: any, origin: any) => {
      if (origin !== "remote") {
        const changedClients = added.concat(updated).concat(removed);
        const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
        socket.emit("awareness-update", { noteId: note.id, update: Array.from(update) });
      }
    });

    // Real-time: receive new comment from another user
    socket.on("comment-added", (comment: CommentData) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === comment.id)) return prev;
        
        if (!isCommentsPanelOpenRef.current) {
          setTimeout(() => setUnreadCommentCount((c) => c + 1), 0);
        }
        
        return [comment, ...prev];
      });
    });

    // Real-time: receive resolved comment from another user
    socket.on("comment-resolved", (commentId: string) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    });

    // Real-time: receive collaborator role updates
    socket.on("collaborator-role-updated", (data: { clerkId: string; role: "VIEW" | "COMMENT" | "EDIT" }) => {
      console.log("[socket] collaborator-role-updated received:", data);
      const activeUser = userRef.current;
      console.log("[socket] activeUser.id:", activeUser?.id, "data.clerkId:", data.clerkId);
      if (activeUser && activeUser.id === data.clerkId) {
        console.log("[socket] Matching user! Updating local role to:", data.role);
        setRole(data.role);
        toast(`Your permission was updated to ${data.role} by the owner.`, {
          icon: '🔒',
        });
      }
    });

    // Real-time: receive collaborator removal
    socket.on("collaborator-removed", (data: { clerkId: string }) => {
      console.log("[socket] collaborator-removed received:", data);
      const activeUser = userRef.current;
      console.log("[socket] activeUser.id:", activeUser?.id, "data.clerkId:", data.clerkId);
      if (activeUser && activeUser.id === data.clerkId) {
        console.log("[socket] Matching user! Evicting to dashboard.");
        toast.error("Your access to this note has been revoked by the owner.");
        router.push("/dashboard");
      }
    });

    return () => {
      socket.emit("leave-note", note.id);
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  // Listen to awareness state to keep track of active members in real-time
  useEffect(() => {
    if (!awareness) return;

    const handleAwarenessUpdate = () => {
      const states = awareness.getStates();
      const users: any[] = [];
      states.forEach((state: any) => {
        if (state.user) {
          users.push(state.user);
        }
      });
      
      // Filter duplicate Clerk IDs (in case user opens multiple tabs)
      const uniqueUsers = users.reduce((acc: any[], current: any) => {
        if (!current.id) return acc;
        const exists = acc.some(item => item.id === current.id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      setActiveUsers(uniqueUsers);
    };

    awareness.on("change", handleAwarenessUpdate);
    handleAwarenessUpdate();

    return () => {
      awareness.off("change", handleAwarenessUpdate);
    };
  }, [awareness]);

  // Load collaborators on mount / note change
  useEffect(() => {
    if (note.id) {
      getCollaborators(note.id)
        .then((collabs) => {
          setCollaborators(collabs);
        })
        .catch((err) => {
          console.error("Failed to load collaborators:", err);
        });
    }
  }, [note.id]);


  const [isAiPanelOpen, setIsAiPanelOpen] = useState(initialRole === "EDIT");
  const [selectionText, setSelectionText] = useState("");
  const [floatingMenuPos, setFloatingMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Grammar Checker states
  const [grammarErrors, setGrammarErrors] = useState<GrammarErrorItem[]>([]);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [selectedGrammarError, setSelectedGrammarError] = useState<GrammarErrorItem | null>(null);

  const [isLoadingShareData, setIsLoadingShareData] = useState(false);

  const loadShareData = async () => {
    setIsLoadingShareData(true);
    setPendingRoles({});
    try {
      const collabs = await getCollaborators(note.id);
      setCollaborators(collabs);
    } catch (err) {
      console.error("Failed to load share data:", err);
    } finally {
      setIsLoadingShareData(false);
    }
  };

  const handleOpenShareModal = () => {
    setIsShareModalOpen(true);
    loadShareData();
  };

  const handleInviteCollaborator = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await inviteCollaborator(note.id, inviteEmail.trim(), inviteRole);
      toast.success("Collaborator invited successfully!");
      setInviteEmail("");
      // Reload collaborators list
      const collabs = await getCollaborators(note.id);
      setCollaborators(collabs);
    } catch (err: any) {
      toast.error(err.message || "Failed to invite collaborator");
    } finally {
      setIsInviting(false);
    }
  };

  const handleSavePermissions = async () => {
    setIsSavingPermissions(true);
    console.log("[save] handleSavePermissions called. pendingRoles:", pendingRoles);
    try {
      await Promise.all(
        Object.entries(pendingRoles).map(async ([collabId, role]) => {
          await updateCollaboratorRole(note.id, collabId, role);
          const collabObj = collaborators.find((c) => c.id === collabId);
          console.log("[save] collabObj found:", collabObj);
          if (collabObj && collabObj.user && collabObj.user.clerkId) {
            console.log("[save] Emitting update-collaborator-role:", {
              noteId: note.id,
              clerkId: collabObj.user.clerkId,
              role,
            });
            socketRef.current?.emit("update-collaborator-role", {
              noteId: note.id,
              clerkId: collabObj.user.clerkId,
              role,
            });
          } else {
            console.warn("[save] Could not find clerkId for collaborator", collabId);
          }
        })
      );
      toast.success("Collaborator permissions saved successfully!");
      setCollaborators((prev) =>
        prev.map((c) => (pendingRoles[c.id] !== undefined ? { ...c, role: pendingRoles[c.id] } : c))
      );
      setPendingRoles({});
    } catch (err) {
      toast.error("Failed to save collaborator permissions");
      console.error(err);
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleUpdateGeneralAccess = async (access: "RESTRICTED" | "ANYONE", role: "VIEW" | "COMMENT" | "EDIT") => {
    setIsUpdatingGeneralAccess(true);
    try {
      await updateNoteGeneralAccess(note.id, access, role);
      setGeneralAccess(access);
      setPublicRole(role);
      toast.success("General access settings updated!");
    } catch (err) {
      toast.error("Failed to update general access settings.");
    } finally {
      setIsUpdatingGeneralAccess(false);
    }
  };

  const handleRemoveCollaborator = async (collabId: string) => {
    if (confirm("Are you sure you want to remove this collaborator?")) {
      try {
        const collabObj = collaborators.find((c) => c.id === collabId);
        await removeCollaborator(note.id, collabId);
        toast.success("Collaborator removed from note");
        setCollaborators((prev) => prev.filter((c) => c.id !== collabId));
        
        if (collabObj && collabObj.user && collabObj.user.clerkId) {
          socketRef.current?.emit("remove-collaborator", {
            noteId: note.id,
            clerkId: collabObj.user.clerkId,
          });
        }
      } catch (err) {
        toast.error("Failed to remove collaborator");
        console.error(err);
      }
    }
  };

  const handleAddComment = async (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    const txt = newCommentText.trim();
    if (!txt) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await addComment(note.id, txt);
      const commentData: CommentData = {
        id: newComment.id,
        content: newComment.content,
        resolved: newComment.resolved,
        createdAt: newComment.createdAt.toISOString(),
        user: {
          name: newComment.user.name || "Collaborator",
          imageUrl: newComment.user.imageUrl || null,
        },
      };
      setComments((prev) => [commentData, ...prev]);
      setNewCommentText("");
      // Broadcast to other users in the same note room
      socketRef.current?.emit("new-comment", { noteId: note.id, comment: commentData });
      toast.success("Comment added!");
    } catch (err) {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      await resolveComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      // Broadcast resolution
      socketRef.current?.emit("resolve-comment", { noteId: note.id, commentId });
      toast.success("Comment resolved!");
    } catch (err) {
      toast.error("Failed to resolve comment");
    }
  };



  // Chat Container ref
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Persistent Custom History Stack
  const [customHistory, setCustomHistory] = useState<{ currentIndex: number; stack: string[] }>({
    currentIndex: 0,
    stack: [],
  });
  const customHistoryRef = useRef(customHistory);

  useEffect(() => {
    customHistoryRef.current = customHistory;
  }, [customHistory]);



  // Load custom history on note change
  useEffect(() => {
    if (typeof window !== "undefined" && note.id) {
      const saved = localStorage.getItem(`inkwell-history-${note.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.stack) && typeof parsed.currentIndex === "number") {
            setCustomHistory(parsed);
            return;
          }
        } catch (e) {
          console.error("Failed to parse history", e);
        }
      }
      const initialContent = note.content?.html || "";
      const initialHistory = {
        currentIndex: 0,
        stack: [initialContent],
      };
      setCustomHistory(initialHistory);
      localStorage.setItem(`inkwell-history-${note.id}`, JSON.stringify(initialHistory));
    }
  }, [note.id]);


  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (note.chats && note.chats.length > 0) {
      return note.chats.map((c) => ({
        sender: c.role === "USER" ? "user" : "ai",
        text: c.content,
      }));
    }
    return [
      {
        sender: "ai",
        text: `Hi! I'm your AI Assistant. I can help you with writing, explaining, summarizing, or formatting this note. Ask me anything!`,
      },
    ];
  });

  const [isTyping, setIsTyping] = useState(false);

  // Scroll to bottom on messages or typing state changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatMessages, isTyping]);

  // Scroll to bottom when AI panel opens
  useEffect(() => {
    if (isAiPanelOpen && chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "instant" as ScrollBehavior,
        });
      }, 100);
    }
  }, [isAiPanelOpen]);

  const handleDeleteNote = async () => {
    if (confirm(`Are you sure you want to delete note "${note.title}"?`)) {
      try {
        await deleteNote(note.id);
        toast.success(`Note "${note.title}" deleted successfully!`);
        router.push(`/subject/${note.subjectId}`);
      } catch (error) {
        toast.error("Failed to delete note.");
      }
    }
  };

  // Dynamic Editor States
  const [noteTitle, setNoteTitle] = useState(note.title);
  const [headingTitle, setHeadingTitle] = useState(note.content?.heading || note.title || "Untitled document");
  const [isEditingFileTitle, setIsEditingFileTitle] = useState(false);
  const [tempFileTitle, setTempFileTitle] = useState(note.title);
  const [symbolPickerOpen, setSymbolPickerOpen] = useState(false);
  const [symbolPickerTab, setSymbolPickerTab] = useState<"emoji" | "special">("emoji");
  const [symbolSearchQuery, setSymbolSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState("Saved just now");
  const [pageSize, setPageSize] = useState("a4");
  const [pageColor, setPageColor] = useState("#ffffff");
  const [showPageNumbers, setShowPageNumbers] = useState(true);

  const noteTitleRef = useRef(noteTitle);
  const headingTitleRef = useRef(headingTitle);

  useEffect(() => {
    noteTitleRef.current = noteTitle;
  }, [noteTitle]);

  useEffect(() => {
    headingTitleRef.current = headingTitle;
  }, [headingTitle]);

  
  const [chatInput, setChatInput] = useState("");
  

  const editorCanvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const draggedImagePosRef = useRef<number | null>(null);

  const uploadAndInsertImageFile = async (file: File) => {
    if (!editor) return;
    const uploadToast = toast.loading("Uploading image to Cloudinary...");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
        toast.success("Image uploaded and inserted!", { id: uploadToast });
      } else {
        toast.error(data.error || "Upload failed", { id: uploadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed", { id: uploadToast });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAndInsertImageFile(file);
    }
    setShowInsertMenu(false);
  };

  // Table bubble menu state
  const [tableBubbleMenuPos, setTableBubbleMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [showTableBubbleDropdown, setShowTableBubbleDropdown] = useState(false);

  // Context Menu state
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Google Docs Menu Bar states
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const [hoveredInsertGrid, setHoveredInsertGrid] = useState({ r: 0, c: 0 });

  // Auto-observe editor height for pagination
  const [editorHeight, setEditorHeight] = useState(0);

  useEffect(() => {
    if (!showInsertMenu && !showFileMenu && !showFormatMenu) return;
    const handleGlobalClick = () => {
      setShowInsertMenu(false);
      setShowFileMenu(false);
      setShowFormatMenu(false);
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [showInsertMenu, showFileMenu, showFormatMenu]);



  // Page dimension helpers
  const pageHeightPx = pageSize === "a4" ? 1123 : pageSize === "a3" ? 1587 : 1056;
  const gapHeight = 24;
  const pageCount = Math.max(1, Math.ceil(editorHeight / pageHeightPx));



  // Slash commands state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashMenuPos, setSlashMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  const slashMenuOpenRef = useRef(false);
  const filteredCommandsRef = useRef<any[]>([]);
  const slashSelectedIndexRef = useRef(0);
  const executeCommandRef = useRef<((cmd: any) => void) | null>(null);

  // Auto-scroll selected command into view
  useEffect(() => {
    if (slashMenuOpen && slashMenuPos) {
      const activeEl = document.querySelector(".slash-item-active");
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [slashSelectedIndex, slashMenuOpen]);

  // Sync refs to avoid stale closure issues in Tiptap key handlers
  useEffect(() => {
    slashMenuOpenRef.current = slashMenuOpen;
  }, [slashMenuOpen]);

  useEffect(() => {
    filteredCommandsRef.current = filteredCommands;
  }, [slashQuery, slashMenuOpen]);

  useEffect(() => {
    slashSelectedIndexRef.current = slashSelectedIndex;
  }, [slashSelectedIndex]);

  // Helper for finding slash command queries
  const getSlashCommandQuery = (editorInstance: any) => {
    if (!editorInstance) return null;
    const { state } = editorInstance;
    const { selection } = state;
    const { $from } = selection;
    
    if (!selection.empty) return null;
    
    const parentStart = $from.start();
    const currentBlockText = state.doc.textBetween(parentStart, $from.pos, " ");
    
    const lastSlashIndex = currentBlockText.lastIndexOf("/");
    if (lastSlashIndex === -1) return null;
    
    const beforeSlash = currentBlockText.substring(0, lastSlashIndex);
    const afterSlash = currentBlockText.substring(lastSlashIndex + 1);
    
    const isStartOrAfterSpace = lastSlashIndex === 0 || beforeSlash.endsWith(" ") || beforeSlash.endsWith("\n");
    
    if (isStartOrAfterSpace && !afterSlash.includes(" ") && afterSlash.length <= 20) {
      return {
        query: afterSlash,
        startPos: parentStart + lastSlashIndex,
        endPos: $from.pos
      };
    }
    
    return null;
  };

  const checkSlashCommand = (editorInstance: any) => {
    const info = getSlashCommandQuery(editorInstance);
    if (info) {
      const { query } = info;
      setSlashQuery(query);
      setSlashMenuOpen(true);
      
      const { selection } = editorInstance.state;
      try {
        const coords = editorInstance.view.coordsAtPos(selection.from);
        const canvas = editorCanvasRef.current;
        if (canvas) {
          const canvasRect = canvas.getBoundingClientRect();
          setSlashMenuPos({
            top: coords.bottom - canvasRect.top + canvas.scrollTop + 8,
            left: coords.left - canvasRect.left,
          });
        }
      } catch (e) {
        // fallback
      }
    } else {
      setSlashMenuOpen(false);
    }
  };

  const checkTableActive = (editorInstance: any) => {
    if (!editorInstance) return;
    const isTable = editorInstance.isActive("table");
    if (isTable) {
      const activeCellEl = document.querySelector(".tiptap td:focus-within, .tiptap th:focus-within, .tiptap td.selectedCell, .tiptap th.selectedCell");
      const canvas = editorCanvasRef.current;
      if (activeCellEl && canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const cellRect = activeCellEl.getBoundingClientRect();
        setTableBubbleMenuPos({
          top: cellRect.top - canvasRect.top + canvas.scrollTop - 36,
          left: cellRect.right - canvasRect.left - 60,
        });
        return;
      }
    }
    setTableBubbleMenuPos(null);
    setShowTableBubbleDropdown(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvas = editorCanvasRef.current;
    if (!canvas || !editor) return;

    const canvasRect = canvas.getBoundingClientRect();
    const clickX = e.clientX;
    const clickY = e.clientY;

    let errorAtPos = null;
    try {
      const dropCoords = editor.view.posAtCoords({ left: clickX, top: clickY });
      const pos = dropCoords?.pos;
      if (pos !== undefined && grammarErrors.length > 0) {
        errorAtPos = grammarErrors.find(err => pos >= err.from && pos <= err.to) || null;
      }
    } catch (_) {}

    setSelectedGrammarError(errorAtPos);

    setContextMenuPos({
      x: clickX - canvasRect.left,
      y: clickY - canvasRect.top + canvas.scrollTop,
    });
  };

  const editorRef = useRef<any>(null);

  const executeSlashCommand = (cmd: any) => {
    const activeEditor = editorRef.current;
    if (!activeEditor) return;
    const info = getSlashCommandQuery(activeEditor);
    if (info) {
      const { startPos, endPos } = info;
      activeEditor.chain().focus().deleteRange({ from: startPos, to: endPos }).run();
      cmd.command(activeEditor);
      setSlashMenuOpen(false);
    }
  };


  // Reset selected index when the query or filtered list changes
  const filteredCommands = slashCommandsList.filter((cmd) => {
    if (!slashQuery) return true;
    const q = slashQuery.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSlashSelectedIndex(0);
  }, [slashQuery]);

  // Instantiating TipTap Editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...extensions,
      Collaboration.configure({
        document: ydoc,
      }),
      CustomCollaborationCursor.configure({
        provider: { awareness: awareness },
        user: user
          ? {
              id: user.id,
              name: user.firstName || user.fullName || "Collaborator",
              color: getCursorColor(user.id),
              imageUrl: user.imageUrl || null,
            }
          : {
              id: "guest",
              name: "Collaborator",
              color: "#334537",
              imageUrl: null,
            },
      }),
    ],
    editable: role === "EDIT",
    editorProps: {
      attributes: {
        class: "prose max-w-none font-body-lg text-body-lg text-on-surface space-y-md outline-none min-h-[400px] focus:outline-none",
      },
      handlePaste: (view, event) => {
        if (roleRef.current !== "EDIT") {
          toast.error("This note is read-only. Please request edit access from the author.");
          return true;
        }
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf("image") === 0) {
              const file = item.getAsFile();
              if (file) {
                event.preventDefault();
                uploadAndInsertImageFile(file);
                return true;
              }
            }
          }
        }
        return false;
      },
      handleDOMEvents: {
        dragstart: (view, event) => {
          const target = event.target as HTMLElement;
          const { selection } = view.state;
          if (selection && selection instanceof NodeSelection && selection.node.type.name === "image") {
            (window as any).__draggedImagePos = selection.from;
          } else if (target && target.closest && (target.closest("[data-node-view-wrapper] img") || target.closest("img"))) {
            // Retain the position set during mousedown if dragging the image element
          } else {
            (window as any).__draggedImagePos = null;
          }
          return false;
        }
      },
      handleDrop: (view, event, slice, moved) => {
        const sourcePos = (window as any).__draggedImagePos;
        if (typeof sourcePos === "number") {
          const dropCoords = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (dropCoords) {
            const targetPos = dropCoords.pos;
            const isAltPressed = event.altKey;
            
            if (!isAltPressed) {
              // MOVE image
              event.preventDefault();
              const imageNode = view.state.doc.nodeAt(sourcePos);
              if (imageNode && imageNode.type.name === "image") {
                let tr = view.state.tr;
                tr.delete(sourcePos, sourcePos + imageNode.nodeSize);
                
                const adjustedTargetPos = targetPos > sourcePos 
                  ? Math.max(sourcePos, targetPos - imageNode.nodeSize) 
                  : targetPos;
                  
                const insertPos = Math.min(tr.doc.content.size, Math.max(0, adjustedTargetPos));
                tr.insert(insertPos, imageNode);
                
                tr.setSelection(NodeSelection.create(tr.doc, insertPos));
                
                view.dispatch(tr);
                toast.success("Image moved");
                (window as any).__draggedImagePos = null;
                return true;
              }
            } else {
              // COPY image (Alt pressed)
              event.preventDefault();
              const imageNode = view.state.doc.nodeAt(sourcePos);
              if (imageNode && imageNode.type.name === "image") {
                let tr = view.state.tr;
                const insertPos = Math.min(tr.doc.content.size, Math.max(0, targetPos));
                tr.insert(insertPos, imageNode);
                
                tr.setSelection(NodeSelection.create(tr.doc, insertPos));
                
                view.dispatch(tr);
                toast.success("Image duplicated");
                (window as any).__draggedImagePos = null;
                return true;
              }
            }
          }
        }
        (window as any).__draggedImagePos = null;
        return false;
      },
      handleKeyDown: (view, event) => {
        if (roleRef.current !== "EDIT") {
          const isModifyingKey = event.key.length === 1 || event.key === "Backspace" || event.key === "Delete" || event.key === "Enter";
          if (isModifyingKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
            toast.error("This note is read-only. Please request edit access from the author.");
            return true;
          }
        }
        // Intercept Undo / Redo shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
        const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
        const isUndo = (isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === "z" && !event.shiftKey;
        const isRedo = ((isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === "y") || 
                       ((isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === "z" && event.shiftKey);

        if (isUndo) {
          if (editor && !editor.can().undo()) {
            const hist = customHistoryRef.current;
            if (hist && hist.currentIndex > 0) {
              event.preventDefault();
              const newIndex = hist.currentIndex - 1;
              const content = hist.stack[newIndex];
              editor.commands.setContent(content, { emitUpdate: false });
              
              const updatedHistory = {
                ...hist,
                currentIndex: newIndex,
              };
              setCustomHistory(updatedHistory);
              localStorage.setItem(`inkwell-history-${note.id}`, JSON.stringify(updatedHistory));
              
              triggerAutoSave(headingTitleRef.current, content);
              return true;
            }
          }
        }

        if (isRedo) {
          if (editor && !editor.can().redo()) {
            const hist = customHistoryRef.current;
            if (hist && hist.currentIndex < hist.stack.length - 1) {
              event.preventDefault();
              const newIndex = hist.currentIndex + 1;
              const content = hist.stack[newIndex];
              editor.commands.setContent(content, { emitUpdate: false });
              
              const updatedHistory = {
                ...hist,
                currentIndex: newIndex,
              };
              setCustomHistory(updatedHistory);
              localStorage.setItem(`inkwell-history-${note.id}`, JSON.stringify(updatedHistory));
              
              triggerAutoSave(headingTitleRef.current, content);
              return true;
            }
          }
        }

        if (event.key === "Backspace" || event.key === "Delete") {
          const { selection } = view.state;
          if (selection instanceof NodeSelection && selection.node.type.name.includes("table")) {
            event.preventDefault();
            if (editor) {
              editor.commands.deleteTable();
            }
            return true;
          }
          if (selection && (selection.constructor.name === "CellSelection" || "forEachCell" in selection)) {
            event.preventDefault();

            // Check if all cells in the table are selected
            let totalCells = 0;
            let selectedCellsCount = 0;
            try {
              const cellPos = (selection as any).$anchorCell.pos;
              const $cell = view.state.doc.resolve(cellPos);
              let tableNode = null;
              let depth = $cell.depth;
              while (depth > 0) {
                const node = $cell.node(depth);
                if (node && node.type.name === "table") {
                  tableNode = node;
                  break;
                }
                depth--;
              }
              if (tableNode) {
                tableNode.forEach((rowNode) => {
                  if (rowNode.type.name === "tableRow") {
                    totalCells += rowNode.childCount;
                  }
                });
              }
              (selection as any).forEachCell(() => {
                selectedCellsCount++;
              });
            } catch (e) {
              console.error(e);
            }

            if (totalCells > 0 && selectedCellsCount === totalCells) {
              if (editor) {
                editor.commands.deleteTable();
              }
              return true;
            }

            const { tr } = view.state;
            let hasChanged = false;
            (selection as any).forEachCell((node: any, pos: number) => {
              const paragraph = view.state.schema.nodes.paragraph;
              if (paragraph) {
                const emptyPara = paragraph.createAndFill();
                if (emptyPara) {
                  // We delete the existing contents inside the cell and insert emptyPara
                  // Cell start is pos + 1, cell end is pos + node.nodeSize - 1.
                  tr.replaceWith(pos + 1, pos + node.nodeSize - 1, emptyPara);
                  hasChanged = true;
                }
              }
            });
            if (hasChanged) {
              view.dispatch(tr);
            }
            return true;
          }
        }

        if (slashMenuOpenRef.current && filteredCommandsRef.current.length > 0) {
          const selectedIndex = slashSelectedIndexRef.current;
          const commands = filteredCommandsRef.current;
          
          if (event.key === "ArrowDown") {
            event.preventDefault();
            const nextIndex = (selectedIndex + 1) % commands.length;
            setSlashSelectedIndex(nextIndex);
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            const prevIndex = (selectedIndex - 1 + commands.length) % commands.length;
            setSlashSelectedIndex(prevIndex);
            return true;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            const cmd = commands[selectedIndex];
            if (cmd) {
              executeCommandRef.current?.(cmd);
            }
            return true;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setSlashMenuOpen(false);
            return true;
          }
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      
      setCharCount(text.length);
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
      
      if (editor.isFocused) {
        triggerAutoSave(headingTitleRef.current, html);
      }
      checkSlashCommand(editor);
      checkTableActive(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      checkSlashCommand(editor);
      checkTableActive(editor);
      const { view, state } = editor;
      const { from, to } = state.selection;
      if (from === to) {
        setFloatingMenuPos(null);
        setSelectionText("");
        return;
      }
      const text = state.doc.textBetween(from, to, " ");
      setSelectionText(text);

      try {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const canvas = editorCanvasRef.current;
          if (canvas) {
            const canvasRect = canvas.getBoundingClientRect();
            setFloatingMenuPos({
              top: rect.top - canvasRect.top - 48 + canvas.scrollTop,
              left: rect.left - canvasRect.left + rect.width / 2 - 50,
            });
          }
        }
      } catch (e) {
        // fallback
      }
    }
  });

  useEffect(() => {
    editorRef.current = editor;
    executeCommandRef.current = executeSlashCommand;
    if (editor) {
      console.log("[editable effect] Setting editor.setEditable to:", role === "EDIT", "current role is:", role);
      editor.setEditable(role === "EDIT");
      setTimeout(() => {
        const el = document.querySelector(".ProseMirror") as HTMLElement;
        if (el) {
          el.contentEditable = role === "EDIT" ? "true" : "false";
        }
      }, 0);
      if (needsInitRef.current) {
        needsInitRef.current = false;
        editor.commands.setContent(initialContentRef.current, { emitUpdate: false });
        const update = Y.encodeStateAsUpdate(ydoc);
        socketRef.current?.emit("ydoc-update", { noteId: note.id, update: Array.from(update) });
      }
    }
  }, [editor, role]);

  // Update local awareness state when user changes
  useEffect(() => {
    if (user && editor) {
      editor.commands.updateUser({
        id: user.id,
        name: user.firstName || user.fullName || "Collaborator",
        color: getCursorColor(user.id),
        imageUrl: user.imageUrl || null,
      });
    }
  }, [user, editor]);

  // Idle detection to hide cursor and name
  useEffect(() => {
    if (!editor || !awareness) return;

    let idleTimeout: NodeJS.Timeout;

    const resetIdleTimer = () => {
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        // Clear local cursor state when idle
        awareness.setLocalStateField("cursor", null);
      }, 15000); // 15 seconds of inactivity
    };

    // Listen to editor transaction updates (keystrokes, selection changes, etc.)
    editor.on("transaction", resetIdleTimer);

    // Initial start
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimeout);
      editor.off("transaction", resetIdleTimer);
    };
  }, [editor, awareness]);

  useEffect(() => {
    if (!editor) return;
    const editorEl = document.querySelector(".tiptap");
    if (!editorEl) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setEditorHeight(entry.contentRect.height);
      }
    });

    observer.observe(editorEl);
    return () => observer.disconnect();
  }, [editor]);

  // Sync metadata and stats when note ID changes
  useEffect(() => {
    if (editor && note) {
      setNoteTitle(note.title);
      setHeadingTitle(note.content?.heading || note.title || "Untitled document");
      
      // Update chat history
      if (note.chats && note.chats.length > 0) {
        setChatMessages(
          note.chats.map((c) => ({
            sender: c.role === "USER" ? "user" : "ai",
            text: c.content,
          }))
        );
      } else {
        setChatMessages([
          {
            sender: "ai",
            text: `Hi! I'm your AI Assistant. I can help you with writing, explaining, summarizing, or formatting this note. Ask me anything!`,
          },
        ]);
      }
      
      // Update counts
      const text = editor.getText() || "";
      setCharCount(text.length);
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    }
  }, [note.id, editor]);

  // Debounced auto-save triggers database actions
  const triggerAutoSave = (currentHeading: string, currentHtml: string) => {
    if (roleRef.current !== "EDIT") return;
    setSaveStatus("Saving...");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateNoteContent(note.id, currentHeading || "Untitled document", { html: currentHtml, heading: currentHeading });
        setSaveStatus("Saved just now");

        // Sync custom history
        const hist = customHistoryRef.current;
        const currentSavedContent = hist.stack[hist.currentIndex];
        if (currentHtml !== currentSavedContent) {
          const newStack = hist.stack.slice(0, hist.currentIndex + 1);
          newStack.push(currentHtml);
          if (newStack.length > 40) {
            newStack.shift();
          }
          const updatedHistory = {
            currentIndex: newStack.length - 1,
            stack: newStack,
          };
          setCustomHistory(updatedHistory);
          localStorage.setItem(`inkwell-history-${note.id}`, JSON.stringify(updatedHistory));
        }
      } catch (err) {
        setSaveStatus("Failed to save changes");
      }
    }, 1000); // 1000ms debounce
  };

  const canUndo = (editor?.can().undo()) || (customHistory && customHistory.currentIndex > 0);
  const canRedo = (editor?.can().redo()) || (customHistory && customHistory.currentIndex < customHistory.stack.length - 1);

  const handleCustomUndo = () => {
    if (editor?.can().undo()) {
      editor.chain().focus().undo().run();
    } else if (customHistory && customHistory.currentIndex > 0) {
      const newIndex = customHistory.currentIndex - 1;
      const content = customHistory.stack[newIndex];
      editor?.commands.setContent(content, { emitUpdate: false });
      const updatedHistory = {
        ...customHistory,
        currentIndex: newIndex,
      };
      setCustomHistory(updatedHistory);
      localStorage.setItem(`inkwell-history-${note.id}`, JSON.stringify(updatedHistory));
      triggerAutoSave(headingTitleRef.current, content);
    }
    setContextMenuPos(null);
  };

  const handleCustomRedo = () => {
    if (editor?.can().redo()) {
      editor.chain().focus().redo().run();
    } else if (customHistory && customHistory.currentIndex < customHistory.stack.length - 1) {
      const newIndex = customHistory.currentIndex + 1;
      const content = customHistory.stack[newIndex];
      editor?.commands.setContent(content, { emitUpdate: false });
      const updatedHistory = {
        ...customHistory,
        currentIndex: newIndex,
      };
      setCustomHistory(updatedHistory);
      localStorage.setItem(`inkwell-history-${note.id}`, JSON.stringify(updatedHistory));
      triggerAutoSave(headingTitleRef.current, content);
    }
    setContextMenuPos(null);
  };

  // Save when visual heading is changed
  const handleHeadingChange = (newHeading: string) => {
    setHeadingTitle(newHeading);
    setNoteTitle(newHeading);
    const html = editor?.getHTML() || "";
    triggerAutoSave(newHeading, html);
  };

  // Save when file title is renamed (via double click)
  const saveFileTitle = async (newTitle: string) => {
    if (roleRef.current !== "EDIT") return;
    const trimmed = newTitle.trim();
    if (!trimmed) {
      toast.error("Title cannot be empty");
      setTempFileTitle(noteTitle);
      setIsEditingFileTitle(false);
      return;
    }
    setNoteTitle(trimmed);
    setIsEditingFileTitle(false);
    try {
      const currentHtml = editor?.getHTML() || "";
      await updateNoteContent(note.id, trimmed, { html: currentHtml, heading: headingTitle });
      toast.success("Note renamed successfully");
      router.refresh();
    } catch (err) {
      toast.error("Failed to rename note");
    }
  };

  // Hide floating menu on click elsewhere & deselect image if clicked outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        setFloatingMenuPos(null);
      }

      if (editor && editor.state.selection instanceof NodeSelection && editor.state.selection.node.type.name === "image") {
        const target = e.target as HTMLElement;
        const isImgOrToolbar = target.closest("[data-node-view-wrapper] img") ||
                               target.closest("img") ||
                               target.closest("[data-no-drag]") ||
                               target.closest(".floating-image-toolbar") ||
                               target.closest("button") ||
                               target.closest("input") ||
                               target.closest(".symbol-picker-modal") ||
                               target.closest(".editor-toolbar") ||
                               target.closest("header");
        if (!isImgOrToolbar) {
          const { state, view } = editor;
          const { selection: editorSel } = state;
          try {
            const tr = state.tr.setSelection(
              TextSelection.create(state.doc, editorSel.to)
            );
            view.dispatch(tr);
          } catch (err) {
            console.error("Deselect error", err);
          }
        }
      }
    };

    document.addEventListener("mousedown", handleGlobalClick);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
    };
  }, [editor]);

  // Send message to AI
  const handleSendMessage = async () => {
    const inputMsg = chatInput.trim();
    if (!inputMsg) return;
    
    const userMsg: ChatMessage = {
      sender: "user",
      text: inputMsg,
    };
    
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      // Save user message to database
      await saveChatMessage(note.id, "USER", inputMsg);

      // Call Gemini Chat API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId: note.id,
          message: inputMsg,
          noteText: editor?.getText() || "",
          history: chatMessages,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate AI insights.");
      }

      const responseData = await res.json();
      const aiText = responseData.text;

      // Save assistant response to database
      await saveChatMessage(note.id, "ASSISTANT", aiText);

      const aiReply: ChatMessage = {
        sender: "ai",
        text: aiText,
      };
      setChatMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.error("AI error:", err);
      toast.error(err.message || "Could not reach AI Assistant");
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Sorry, I encountered an error: ${err.message || "Unknown error."}`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Insert AI suggestion into text
  const handleInsertSuggestion = (code: string) => {
    if (editor) {
      editor.chain().focus().insertContent(`<div class="bg-surface-container-low p-sm rounded-xl border border-outline-variant my-md font-semibold text-primary">${code}</div>`).run();
    }
  };

  // Trigger AI analysis on selected text
  const handleAiOnSelection = async () => {
    if (!selectionText) return;
    setIsAiPanelOpen(true);
    setIsCommentsPanelOpen(false);
    setIsTyping(true);
    setFloatingMenuPos(null);

    const prompt = `Please explain or suggest improvements for the following selected text: "${selectionText}"`;
    
    const userMsg: ChatMessage = {
      sender: "user",
      text: prompt,
    };
    setChatMessages((prev) => [...prev, userMsg]);

    try {
      await saveChatMessage(note.id, "USER", prompt);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId: note.id,
          message: prompt,
          noteText: editor?.getText() || "",
          history: chatMessages,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to explain selection.");
      }

      const responseData = await res.json();
      const aiText = responseData.text;

      await saveChatMessage(note.id, "ASSISTANT", aiText);

      const aiReply: ChatMessage = {
        sender: "ai",
        text: aiText,
      };
      setChatMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.error("AI Selection error:", err);
      toast.error(err.message || "Could not explain selection");
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Sorry, I encountered an error: ${err.message}`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const runGrammarCheck = async () => {
    if (!editor) return;
    setIsCheckingGrammar(true);
    const toastId = toast.loading("Checking grammar with LanguageTool...");
    try {
      let text = "";
      const posMapping: { textOffset: number; docPos: number }[] = [];

      editor.state.doc.descendants((node, pos) => {
        if (node.isText && node.text) {
          const startOffset = text.length;
          text += node.text;
          for (let i = 0; i <= node.text.length; i++) {
            posMapping.push({
              textOffset: startOffset + i,
              docPos: pos + i,
            });
          }
        } else if (node.isBlock) {
          if (text.length > 0 && !text.endsWith("\n")) {
            text += "\n";
            posMapping.push({
              textOffset: text.length - 1,
              docPos: pos,
            });
          }
        }
      });

      if (!text.trim()) {
        toast.error("Document is empty, nothing to check!", { id: toastId });
        setIsCheckingGrammar(false);
        return;
      }

      const matches = await checkGrammar(text);

      if (matches.length === 0) {
        toast.success("No grammar errors found!", { id: toastId });
        const tr = editor.state.tr.setMeta("clearGrammarErrors", true);
        editor.view.dispatch(tr);
        setGrammarErrors([]);
        setIsCheckingGrammar(false);
        return;
      }

      const errors: GrammarErrorItem[] = [];
      const decorationsPayload: any[] = [];

      matches.forEach((match: any, index: number) => {
        const fromEntry = posMapping.find(m => m.textOffset === match.offset);
        const toEntry = posMapping.find(m => m.textOffset === (match.offset + match.length));

        if (fromEntry && toEntry) {
          const id = `err-${index}-${Date.now()}`;
          errors.push({
            id,
            from: fromEntry.docPos,
            to: toEntry.docPos,
            message: match.message,
            suggestions: match.replacements.map((r: any) => r.value),
            originalText: text.substring(match.offset, match.offset + match.length),
          });
          decorationsPayload.push({
            id,
            from: fromEntry.docPos,
            to: toEntry.docPos,
          });
        }
      });

      setGrammarErrors(errors);

      const tr = editor.state.tr.setMeta("setGrammarErrors", decorationsPayload);
      editor.view.dispatch(tr);

      toast.success(`Grammar check complete! Found ${errors.length} suggestion(s).`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error("Grammar check failed. Please check connection.", { id: toastId });
    } finally {
      setIsCheckingGrammar(false);
    }
  };

  const applyGrammarSuggestion = (errorId: string, replacement: string) => {
    if (!editor) return;
    const error = grammarErrors.find(err => err.id === errorId);
    if (!error) return;

    editor.chain().focus().insertContentAt({ from: error.from, to: error.to }, replacement).run();

    const delta = replacement.length - (error.to - error.from);

    const updatedErrors = grammarErrors
      .filter(err => err.id !== errorId)
      .map(err => {
        if (err.from > error.from) {
          return {
            ...err,
            from: err.from + delta,
            to: err.to + delta,
          };
        }
        return err;
      });

    setGrammarErrors(updatedErrors);

    const tr = editor.state.tr.setMeta("setGrammarErrors", updatedErrors.map(err => ({ id: err.id, from: err.from, to: err.to })));
    editor.view.dispatch(tr);

    setContextMenuPos(null);
    setSelectedGrammarError(null);
  };

  const applyChangeAllGrammar = () => {
    if (!editor || grammarErrors.length === 0) return;

    const sortedErrors = [...grammarErrors].sort((a, b) => b.from - a.from);
    let chain = editor.chain().focus();

    sortedErrors.forEach(error => {
      if (error.suggestions && error.suggestions.length > 0) {
        const replacement = error.suggestions[0];
        chain = chain.insertContentAt({ from: error.from, to: error.to }, replacement);
      }
    });

    chain.run();

    const tr = editor.state.tr.setMeta("clearGrammarErrors", true);
    editor.view.dispatch(tr);
    setGrammarErrors([]);
    setSelectedGrammarError(null);
    setContextMenuPos(null);
    toast.success("Applied all grammar corrections!");
  };

  const formatAiResponse = (text: string) => {
    if (!text) return "";
    
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    html = html.replace(/\*\*([^\*]+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/`([^`]+?)`/g, "<code class='bg-surface-container-high px-1.5 py-0.5 rounded font-mono text-[12px] text-primary'>$1</code>");

    const lines = html.split("\n");
    const processed: string[] = [];
    let currentTable: string[] = [];
    let inList = false;

    const flushTable = () => {
      if (currentTable.length === 0) return;
      
      const hasDivider = currentTable.length > 1 && /^\|[\s\-:|]+\|$/.test(currentTable[1].trim());
      let tableHtml = '<div class="overflow-x-auto my-sm rounded-xl border border-outline-variant bg-surface-container-lowest"><table class="w-full border-collapse text-left text-sm">';
      
      let headerRow = "";
      let bodyRows = "";
      
      const parseRowCells = (rowText: string) => {
        const trimmed = rowText.trim();
        const withoutPipes = trimmed.replace(/^\||\|$/g, "");
        return withoutPipes.split("|").map(cell => cell.trim());
      };

      if (hasDivider) {
        const headers = parseRowCells(currentTable[0]);
        headerRow = `<thead class="bg-surface-container-high border-b border-outline-variant"><tr>${
          headers.map(h => `<th class="px-md py-xs font-semibold text-primary border-r border-outline-variant last:border-r-0">${h}</th>`).join("")
        }</tr></thead>`;
        
        bodyRows = '<tbody class="divide-y divide-outline-variant">';
        for (let i = 2; i < currentTable.length; i++) {
          const cells = parseRowCells(currentTable[i]);
          bodyRows += `<tr class="hover:bg-surface-container-low transition-colors">${
            cells.map(c => `<td class="px-md py-xs border-r border-outline-variant last:border-r-0">${c}</td>`).join("")
          }</tr>`;
        }
        bodyRows += "</tbody>";
      } else {
        bodyRows = '<tbody class="divide-y divide-outline-variant">';
        for (let i = 0; i < currentTable.length; i++) {
          const cells = parseRowCells(currentTable[i]);
          bodyRows += `<tr class="hover:bg-surface-container-low transition-colors">${
            cells.map(c => `<td class="px-md py-xs border-r border-outline-variant last:border-r-0">${c}</td>`).join("")
          }</tr>`;
        }
        bodyRows += "</tbody>";
      }
      
      tableHtml += headerRow + bodyRows + "</table></div>";
      processed.push(tableHtml);
      currentTable = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const isTableRow = trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.length > 1;

      if (isTableRow) {
        if (inList) {
          processed.push("</ul>");
          inList = false;
        }
        currentTable.push(line);
      } else {
        if (currentTable.length > 0) {
          flushTable();
        }
        
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          const content = trimmed.substring(2);
          let listOpen = "";
          if (!inList) {
            inList = true;
            listOpen = '<ul class="list-disc ml-md my-xs space-y-xs">';
          }
          processed.push(`${listOpen}<li class="list-item">${content}</li>`);
        } else {
          let listClose = "";
          if (inList) {
            inList = false;
            listClose = "</ul>";
          }
          processed.push(`${listClose}${line}`);
        }
      }
    }

    if (currentTable.length > 0) {
      flushTable();
    }
    if (inList) {
      processed.push("</ul>");
    }

    let finalHtml = "";
    for (let i = 0; i < processed.length; i++) {
      const current = processed[i];
      const next = processed[i + 1];
      finalHtml += current;
      if (next !== undefined) {
        const isCurrentBlock = current.startsWith("<div") || current.endsWith("</div>") || 
                               current.startsWith("<ul") || current.endsWith("</ul>") || 
                               current.startsWith("<li") || current.endsWith("</li>") || 
                               current.startsWith("<table") || current.endsWith("</table>");
        
        const isNextBlock = next.startsWith("<div") || next.endsWith("</div>") || 
                            next.startsWith("<ul") || next.endsWith("</ul>") || 
                            next.startsWith("<li") || next.endsWith("</li>") || 
                            next.startsWith("<table") || next.endsWith("</table>");
        
        if (!isCurrentBlock && !isNextBlock && current.trim() !== "" && next.trim() !== "") {
          finalHtml += "<br />";
        } else {
          finalHtml += "\n";
        }
      }
    }
    return finalHtml;
  };



  // Filtered symbols based on active tab, category, and search query
  const filteredSymbols = (() => {
    const categories = symbolPickerTab === "emoji" ? EMOJI_CATEGORIES : SPECIAL_CHAR_CATEGORIES;
    let list: string[] = [];
    
    if (selectedCategory) {
      const catObj = categories.find((c) => c.name === selectedCategory);
      if (catObj) list = [...catObj.items];
    } else {
      categories.forEach((cat) => {
        list.push(...cat.items);
      });
    }

    list = list.map(item => {
      const parts = item.split(":");
      return parts.length > 1 ? parts[parts.length - 1].trim() : item.trim();
    });

    if (symbolSearchQuery) {
      const q = symbolSearchQuery.toLowerCase();
      list = list.filter(item => {
        return item.includes(q) || getSymbolKeyword(item).includes(q);
      });
    }
    return list;
  })();

  return (
    <div className="bg-background text-on-background font-body-md fixed inset-0 flex overflow-hidden antialiased">
      {/* Unified SideNavBar */}
      <Sidebar
        activeRoute={isShared ? `/share` : `/note/${note.id}`}
        activeSubject={isShared ? undefined : { id: note.subjectId, title: note.subjectTitle }}
        activeChapterTitle={isShared ? undefined : note.chapterTitle}
        isShared={isShared}
        sharedNoteTitle={note.title}
      />

      {/* Main Workspace Area */}
      <div
        className="flex-1 flex flex-col min-h-0 w-full transition-all duration-300 relative md:pl-[280px]"
      >
        {/* TopAppBar with Menu Bar */}
        <header className="flex flex-col border-b border-outline-variant bg-surface-container-lowest shrink-0 z-30 px-lg py-xs">
          {/* Row 1 */}
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center gap-sm text-secondary font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">{isOwner ? "folder" : ""}</span>
              {isOwner ? (
                <>
                  <Link href="/dashboard" className="hover:text-primary cursor-pointer transition-colors">
                    Subjects
                  </Link>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  <Link href={`/subject/${note.subjectId}`} className="hover:text-primary cursor-pointer transition-colors">
                    {note.subjectTitle}
                  </Link>
                </>
              ) : (
                <>
                  <span className="font-semibold text-primary">Shared Note</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  <span className="text-secondary">{note.title}</span>
                </>
              )}
              
              {role === "EDIT" && (
                <span className="ml-lg text-outline font-label-sm text-label-sm flex items-center gap-xs hidden sm:flex">
                  <span className="material-symbols-outlined text-[14px]">
                    {saveStatus === "Saving..." ? "sync" : saveStatus === "Failed to save changes" ? "error" : "cloud_done"}
                  </span>
                  {saveStatus}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-md">
              {/* Dynamic Collaborators Avatar Pile */}
              <div className="flex items-center gap-xs mr-sm">
                <div className="relative flex items-center h-8 w-16 select-none">
                  {/* Owner Profile (at the back) */}
                  <div
                    className="absolute left-0 w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm z-10"
                    title={`${ownerName} (Owner)`}
                  >
                    {ownerImageUrl ? (
                      <img src={ownerImageUrl} alt={ownerName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{ownerName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Tilted Collaborator Profile (in front) */}
                  {liveCollaborators.length > 0 && (
                    <div
                      className="absolute left-5 w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm z-20"
                      title={
                        liveCollaborators.length > 1
                          ? `${liveCollaborators.map(u => u.name).join(", ")}`
                          : `${liveCollaborators[0].name || "Collaborator"}`
                      }
                    >
                      {liveCollaborators[0].imageUrl ? (
                        <img src={liveCollaborators[0].imageUrl} alt={liveCollaborators[0].name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(liveCollaborators[0].name || "Collaborator").charAt(0).toUpperCase()}</span>
                      )}

                      {liveCollaborators.length > 1 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-extrabold select-none">
                          +{liveCollaborators.length - 1}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {isOwner && (
                <button
                  onClick={handleOpenShareModal}
                  className="flex items-center gap-xs px-sm py-xs border border-outline-variant rounded-xl hover:bg-surface-container-high transition-colors text-secondary cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  <span className="font-label-md text-label-md">Share</span>
                </button>
              )}

              {(role === "COMMENT" || role === "EDIT" || isOwner) && (
                <button
                  onClick={() => {
                    setIsCommentsPanelOpen((prev) => {
                      const next = !prev;
                      if (next) {
                        setIsAiPanelOpen(false);
                        setUnreadCommentCount(0); // clear unread when opening
                      }
                      return next;
                    });
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors relative hover:bg-surface-container-high cursor-pointer ${
                    isCommentsPanelOpen ? "text-primary font-bold" : "text-secondary hover:text-on-surface"
                  }`}
                  title="Toggle Comments"
                >
                  <span className="material-symbols-outlined text-[20px]">forum</span>
                  {unreadCommentCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-error text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {unreadCommentCount > 9 ? "9+" : unreadCommentCount}
                    </span>
                  )}
                </button>
              )}

              {/* Request Access button — shown for VIEW/COMMENT shared users only */}
              {isShared && (role === "VIEW" || role === "COMMENT") && (
                <button
                  onClick={() => {
                    socketRef.current?.emit("request-access", {
                      noteId: note.id,
                      requesterName: "Collaborator",
                      requesterId: "",
                    });
                  }}
                  className="flex items-center gap-xs px-sm py-xs border border-primary/40 text-primary rounded-xl hover:bg-primary/10 transition-colors font-label-md text-label-md cursor-pointer text-[12px]"
                  title="Request edit access from the author"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  <span className="hidden sm:inline">Request Access</span>
                </button>
              )}
              
              {role === "EDIT" && (
                <button
                  onClick={() => {
                    setIsAiPanelOpen((prev) => {
                      const next = !prev;
                      if (next) {
                        setIsCommentsPanelOpen(false);
                      }
                      return next;
                    });
                  }}
                  className={`w-8 h-8 flex items-center justify-center transition-colors hover:bg-surface-container-high rounded-full cursor-pointer ${
                    isAiPanelOpen ? "text-primary font-bold" : "text-secondary hover:text-on-surface"
                  }`}
                  id="toggleAiPanel"
                  title="Toggle AI Sidebar"
                >
                  <span className="material-symbols-outlined">smart_toy</span>
                </button>
              )}

              {isOwner && (
                <button
                  onClick={handleDeleteNote}
                  className="w-8 h-8 flex items-center justify-center text-secondary hover:text-error hover:bg-error/10 transition-colors rounded-full cursor-pointer"
                  title="Delete Note"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              )}
              <div className="w-8 h-8 flex items-center justify-center">
                <UserButton />
              </div>
            </div>
          </div>

          {/* Row 2: Menu Bar */}
          {role === "EDIT" ? (
            <div className="flex items-center gap-md h-7 mt-1 select-none text-sm text-secondary font-medium">
            {/* File Menu Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFileMenu(!showFileMenu);
                  setShowInsertMenu(false);
                  setShowFormatMenu(false);
                }}
                className={`hover:bg-surface-container-high px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center ${
                  showFileMenu ? "bg-surface-container-high text-primary font-semibold" : ""
                }`}
              >
                File
              </button>

              {showFileMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-8 left-0 bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-1 flex flex-col z-50 w-48 text-on-surface font-label-md text-[13px]"
                >
                  <button
                    onClick={() => {
                      if (editor) {
                        editor.commands.clearContent();
                        setNoteTitle("Untitled document");
                        toast.success("New document created!");
                      }
                      setShowFileMenu(false);
                    }}
                    className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">note_add</span>
                    <span>New</span>
                  </button>
                  <Link
                    href="/dashboard"
                    onClick={() => setShowFileMenu(false)}
                    className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">folder_open</span>
                    <span>Open</span>
                  </Link>
                  <button
                    onClick={async () => {
                      if (editor) {
                        try {
                          await updateNoteContent(note.id, noteTitle.trim(), { html: editor.getHTML() });
                          toast.success("Saved successfully!");
                        } catch (err) {
                          toast.error("Failed to save changes");
                        }
                      }
                      setShowFileMenu(false);
                    }}
                    className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">save</span>
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => {
                      const newTitle = window.prompt("Save as new document name:", noteTitle + " (Copy)");
                      if (newTitle) {
                        toast.success(`Saved as "${newTitle}"!`);
                      }
                      setShowFileMenu(false);
                    }}
                    className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">file_copy</span>
                    <span>Save as</span>
                  </button>
                  {isShared && (
                    <button
                      onClick={async () => {
                        setShowFileMenu(false);
                        const loadingToast = toast.loading("Making a copy of this note...");
                        try {
                          const copiedNote = await copySharedNote(note.id, authorName);
                          toast.success("Note copied successfully!", { id: loadingToast });
                          router.push(`/note/${copiedNote.id}`);
                        } catch (err) {
                          toast.error("Failed to copy note", { id: loadingToast });
                        }
                      }}
                      className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">content_copy</span>
                      <span>Make a copy</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const inputEl = document.querySelector('input[placeholder="Note Title"]') as HTMLInputElement;
                      if (inputEl) inputEl.focus();
                      setShowFileMenu(false);
                    }}
                    className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">drive_file_rename_outline</span>
                    <span>Rename</span>
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => {
                        handleDeleteNote();
                        setShowFileMenu(false);
                      }}
                      className="w-full text-left px-md py-1.5 hover:bg-surface-container-high text-error hover:bg-error/5 flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-error">delete</span>
                      <span>Delete</span>
                    </button>
                  )}
                  <div className="border-t border-outline-variant/30 my-[4px]" />
                  <button
                    onClick={() => {
                      window.print();
                      setShowFileMenu(false);
                    }}
                    className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">print</span>
                    <span>Print</span>
                  </button>
                </div>
              )}
            </div>

            {/* Insert Menu Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInsertMenu(!showInsertMenu);
                  setShowFileMenu(false);
                  setShowFormatMenu(false);
                }}
                className={`hover:bg-surface-container-high px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center ${
                  showInsertMenu ? "bg-surface-container-high text-primary font-semibold" : ""
                }`}
              >
                Insert
              </button>

              {showInsertMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-8 left-0 bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-1 flex flex-col z-50 w-56 text-on-surface font-label-md text-[13px]"
                >
                  {/* 1. Image */}
                  <div className="relative group/image-submenu w-full">
                    <button
                      className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between"
                    >
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-[16px] text-secondary">image</span>
                        <span>Image</span>
                      </div>
                      <span className="text-[10px] text-outline">▶</span>
                    </button>
                    <div className="absolute top-0 left-full ml-px bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-1 hidden group-hover/image-submenu:flex flex-col z-55 w-52 text-on-surface">
                      <button
                        onClick={() => { fileInputRef.current?.click(); setShowInsertMenu(false); }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">upload</span>
                        <span>Upload from computer</span>
                      </button>
                      <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm text-outline/50 cursor-not-allowed">
                        <span className="material-symbols-outlined text-[16px] text-outline/50">search</span>
                        <span>Search the web</span>
                      </button>
                      <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm text-outline/50 cursor-not-allowed">
                        <span className="material-symbols-outlined text-[16px] text-outline/50">add_to_drive</span>
                        <span>Drive</span>
                      </button>
                      <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm text-outline/50 cursor-not-allowed">
                        <span className="material-symbols-outlined text-[16px] text-outline/50">photo_album</span>
                        <span>Photos</span>
                      </button>
                      <button
                        onClick={() => {
                          const url = window.prompt("Enter image URL:");
                          if (url && editor) {
                            editor.chain().focus().setImage({ src: url }).run();
                          }
                          setShowInsertMenu(false);
                        }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">link</span>
                        <span>By URL</span>
                      </button>
                      <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm text-outline/50 cursor-not-allowed">
                        <span className="material-symbols-outlined text-[16px] text-outline/50">photo_camera</span>
                        <span>Camera</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Table */}
                  <div className="relative group/table-submenu w-full">
                    <button
                      className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between"
                    >
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-[16px] text-secondary">table_chart</span>
                        <span>Table</span>
                      </div>
                      <span className="text-[10px] text-outline">▶</span>
                    </button>
                    <div className="absolute top-0 left-full ml-px bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-1 hidden group-hover/table-submenu:flex flex-col z-55 w-60 text-on-surface">
                      <div className="p-2 flex flex-col items-center gap-xs border-b border-outline-variant/30">
                        <div className="font-label-sm text-outline mb-xs select-none text-[11px] whitespace-nowrap">
                          {hoveredInsertGrid.r > 0 && hoveredInsertGrid.c > 0 ? `${hoveredInsertGrid.c} x ${hoveredInsertGrid.r} Table` : "Select Grid Size"}
                        </div>
                        <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }} onMouseLeave={() => setHoveredInsertGrid({ r: 0, c: 0 })}>
                          {Array.from({ length: 8 }).map((_, rIdx) => (
                            <div key={rIdx} className="contents">
                              {Array.from({ length: 10 }).map((_, cIdx) => {
                                const r = rIdx + 1;
                                const c = cIdx + 1;
                                const isHighlighted = r <= hoveredInsertGrid.r && c <= hoveredInsertGrid.c;
                                return (
                                  <div
                                    key={cIdx}
                                    onMouseEnter={() => setHoveredInsertGrid({ r, c })}
                                    onClick={() => {
                                      if (editor) {
                                        editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
                                      }
                                      setShowInsertMenu(false);
                                    }}
                                    className={`w-4 h-4 border border-outline-variant/30 rounded-xs cursor-pointer transition-colors duration-100 ${
                                      isHighlighted ? "bg-primary border-primary" : "bg-surface-container-low hover:bg-primary-container"
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="relative group/table-templates-submenu w-full">
                        <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between text-outline/50 cursor-not-allowed">
                          <div className="flex items-center gap-sm">
                            <span className="material-symbols-outlined text-[16px] text-outline/50">dashboard_customize</span>
                            <span>Table templates</span>
                          </div>
                          <span className="text-[10px] text-outline/50">▶</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Removed Building blocks */}

                  {/* 3. Smart chips */}
                  <div className="relative group/smart-chips-submenu w-full">
                    <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-[16px] text-secondary">alternate_email</span>
                        <span>Smart chips</span>
                      </div>
                      <span className="text-[10px] text-outline">▶</span>
                    </button>
                    <div className="absolute top-0 left-full ml-px bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-1 hidden group-hover/smart-chips-submenu:flex flex-col z-55 w-52 text-on-surface">
                      <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm text-outline/50 cursor-not-allowed">
                        <span className="material-symbols-outlined text-[16px] text-outline/50">person</span>
                        <span>People</span>
                      </button>
                      <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm text-outline/50 cursor-not-allowed">
                        <span className="material-symbols-outlined text-[16px] text-outline/50">insert_drive_file</span>
                        <span>File</span>
                      </button>
                      <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm text-outline/50 cursor-not-allowed">
                        <span className="material-symbols-outlined text-[16px] text-outline/50">event</span>
                        <span>Calendar event</span>
                      </button>
                      <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm text-outline/50 cursor-not-allowed">
                        <span className="material-symbols-outlined text-[16px] text-outline/50">place</span>
                        <span>Place</span>
                      </button>
                    </div>
                  </div>

                  {/* Removed Audio buttons */}

                  {/* 4. Link */}
                  <button
                    onClick={() => {
                      const url = window.prompt("Enter link URL:");
                      if (url && editor) {
                        editor.chain().focus().setLink({ href: url }).run();
                      }
                      setShowInsertMenu(false);
                    }}
                    className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between"
                  >
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-[16px] text-secondary">link</span>
                      <span>Link</span>
                    </div>
                    <span className="text-[10px] text-outline font-mono">Ctrl+K</span>
                  </button>

                  {/* 4b. Code Block */}
                  <button
                    onClick={() => {
                      if (editor) {
                        editor.chain().focus().toggleCodeBlock().run();
                      }
                      setShowInsertMenu(false);
                    }}
                    className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between"
                  >
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-[16px] text-secondary">code</span>
                      <span>Code block</span>
                    </div>
                    <span className="text-[10px] text-outline font-mono">/code</span>
                  </button>

                  {/* Removed Drawing */}

                  {/* 5. Chart */}
                  <div className="relative group/chart-submenu w-full">
                    <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-[16px] text-secondary">bar_chart</span>
                        <span>Chart</span>
                      </div>
                      <span className="text-[10px] text-outline">▶</span>
                    </button>
                    <div className="absolute top-0 left-full ml-px bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-1 hidden group-hover/chart-submenu:flex flex-col z-55 w-52 text-on-surface text-[13px]">
                      <button
                        onClick={() => {
                          if (editor) {
                            const barChartHtml = `
<div class="my-md p-md bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md mx-auto shadow-sm select-none" contenteditable="false">
  <div class="flex items-center justify-between mb-sm border-b border-outline-variant/30 pb-xs">
    <div class="font-bold text-on-surface text-sm flex items-center gap-xs">
      <span class="material-symbols-outlined text-primary text-[18px]">bar_chart</span>
      Bar Chart Analysis
    </div>
    <span class="text-[10px] text-outline bg-surface-container px-2 py-0.5 rounded-full">Static Vector</span>
  </div>
  <div class="space-y-sm py-xs">
    <div class="space-y-xs">
      <div class="flex justify-between text-[11px] text-secondary"><span>Research & Dev</span><span>75%</span></div>
      <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
        <div class="h-full bg-primary rounded-full" style="width: 75%; background-color: var(--color-primary, #6750a4);"></div>
      </div>
    </div>
    <div class="space-y-xs">
      <div class="flex justify-between text-[11px] text-secondary"><span>Marketing & Growth</span><span>45%</span></div>
      <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
        <div class="h-full bg-primary rounded-full" style="width: 45%; background-color: var(--color-primary, #6750a4);"></div>
      </div>
    </div>
    <div class="space-y-xs">
      <div class="flex justify-between text-[11px] text-secondary"><span>Operations</span><span>90%</span></div>
      <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
        <div class="h-full bg-primary rounded-full" style="width: 90%; background-color: var(--color-primary, #6750a4);"></div>
      </div>
    </div>
  </div>
</div>`;
                            editor.chain().focus().insertContent(barChartHtml).run();
                            toast.success("Bar chart inserted!");
                          }
                          setShowInsertMenu(false);
                        }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">align_horizontal_left</span>
                        <span>Bar</span>
                      </button>
                      <button
                        onClick={() => {
                          if (editor) {
                            const columnChartHtml = `
<div class="my-md p-md bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md mx-auto shadow-sm select-none" contenteditable="false">
  <div class="flex items-center justify-between mb-sm border-b border-outline-variant/30 pb-xs">
    <div class="font-bold text-on-surface text-sm flex items-center gap-xs">
      <span class="material-symbols-outlined text-primary text-[18px]">equalizer</span>
      Column Chart Analysis
    </div>
    <span class="text-[10px] text-outline bg-surface-container px-2 py-0.5 rounded-full">Static Vector</span>
  </div>
  <div class="flex items-end justify-around h-32 pt-md px-xs">
    <div class="flex flex-col items-center gap-xs w-10">
      <div class="w-4 bg-primary rounded-t-xs" style="height: 45px; background-color: var(--color-primary, #6750a4);"></div>
      <span class="text-[9px] text-secondary">Q1</span>
    </div>
    <div class="flex flex-col items-center gap-xs w-10">
      <div class="w-4 bg-primary rounded-t-xs" style="height: 85px; background-color: var(--color-primary, #6750a4);"></div>
      <span class="text-[9px] text-secondary">Q2</span>
    </div>
    <div class="flex flex-col items-center gap-xs w-10">
      <div class="w-4 bg-primary rounded-t-xs" style="height: 60px; background-color: var(--color-primary, #6750a4);"></div>
      <span class="text-[9px] text-secondary">Q3</span>
    </div>
    <div class="flex flex-col items-center gap-xs w-10">
      <div class="w-4 bg-primary rounded-t-xs" style="height: 100px; background-color: var(--color-primary, #6750a4);"></div>
      <span class="text-[9px] text-secondary">Q4</span>
    </div>
  </div>
</div>`;
                            editor.chain().focus().insertContent(columnChartHtml).run();
                            toast.success("Column chart inserted!");
                          }
                          setShowInsertMenu(false);
                        }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">bar_chart</span>
                        <span>Column</span>
                      </button>
                      <button
                        onClick={() => {
                          if (editor) {
                            const lineChartHtml = `
<div class="my-md p-md bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md mx-auto shadow-sm select-none" contenteditable="false">
  <div class="flex items-center justify-between mb-sm border-b border-outline-variant/30 pb-xs">
    <div class="font-bold text-on-surface text-sm flex items-center gap-xs">
      <span class="material-symbols-outlined text-primary text-[18px]">show_chart</span>
      Line Chart Trend
    </div>
    <span class="text-[10px] text-outline bg-surface-container px-2 py-0.5 rounded-full">Static Vector</span>
  </div>
  <div class="w-full h-32 flex items-center justify-center py-xs px-xs">
    <svg class="w-full h-full" viewBox="0 0 300 120">
      <path d="M 10,90 Q 60,30 110,70 T 210,20 T 290,50" fill="none" stroke="var(--color-primary, #6750a4)" stroke-width="2.5" />
      <circle cx="10" cy="90" r="3" fill="var(--color-primary, #6750a4)" />
      <circle cx="110" cy="70" r="3" fill="var(--color-primary, #6750a4)" />
      <circle cx="210" cy="20" r="3" fill="var(--color-primary, #6750a4)" />
      <circle cx="290" cy="50" r="3" fill="var(--color-primary, #6750a4)" />
    </svg>
  </div>
</div>`;
                            editor.chain().focus().insertContent(lineChartHtml).run();
                            toast.success("Line chart inserted!");
                          }
                          setShowInsertMenu(false);
                        }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">show_chart</span>
                        <span>Line</span>
                      </button>
                      <button
                        onClick={() => {
                          if (editor) {
                            const pieChartHtml = `
<div class="my-md p-md bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md mx-auto shadow-sm select-none" contenteditable="false">
  <div class="flex items-center justify-between mb-sm border-b border-outline-variant/30 pb-xs">
    <div class="font-bold text-on-surface text-sm flex items-center gap-xs">
      <span class="material-symbols-outlined text-primary text-[18px]">pie_chart</span>
      Pie Chart Share
    </div>
    <span class="text-[10px] text-outline bg-surface-container px-2 py-0.5 rounded-full">Static Vector</span>
  </div>
  <div class="flex items-center justify-center gap-md py-xs">
    <svg width="60" height="60" viewBox="0 0 32 32" class="rounded-full">
      <circle r="16" cx="16" cy="16" fill="var(--color-primary-container, #eaddff)" />
      <circle r="16" cx="16" cy="16" fill="transparent" stroke="var(--color-primary, #6750a4)" stroke-width="32" stroke-dasharray="60 100" transform="rotate(-90 16 16)" />
    </svg>
    <div class="space-y-xs text-xs text-secondary">
      <div class="flex items-center gap-xs"><div class="w-2.5 h-2.5 rounded-full" style="background-color: var(--color-primary, #6750a4)"></div><span>Share A (60%)</span></div>
      <div class="flex items-center gap-xs"><div class="w-2.5 h-2.5 rounded-full" style="background-color: var(--color-primary-container, #eaddff)"></div><span>Share B (40%)</span></div>
    </div>
  </div>
</div>`;
                            editor.chain().focus().insertContent(pieChartHtml).run();
                            toast.success("Pie chart inserted!");
                          }
                          setShowInsertMenu(false);
                        }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">pie_chart</span>
                        <span>Pie</span>
                      </button>
                      <button
                        onClick={() => {
                          if (editor) {
                            const sheetsChartHtml = `
<div class="my-md p-md bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md mx-auto shadow-sm select-none" contenteditable="false">
  <div class="flex items-center justify-between mb-sm border-b border-outline-variant/30 pb-xs">
    <div class="font-bold text-on-surface text-sm flex items-center gap-xs">
      <span class="material-symbols-outlined text-green-600 text-[18px]">table_chart</span>
      Linked Sheets Data
    </div>
    <span class="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-semibold">Active Sync</span>
  </div>
  <div class="flex items-center justify-center p-sm border border-dashed border-outline-variant rounded-lg bg-surface-container-low text-secondary text-xs">
    <div class="text-center py-xs">
      <span class="material-symbols-outlined text-[24px] text-green-500 mb-xs animate-spin-slow">sync</span>
      <p class="font-bold">Linked to Financial_Q2.xlsx</p>
      <p class="text-[9px] text-outline mt-xs">Updated just now</p>
    </div>
  </div>
</div>`;
                            editor.chain().focus().insertContent(sheetsChartHtml).run();
                            toast.success("Google Sheets linked chart inserted!");
                          }
                          setShowInsertMenu(false);
                        }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">table_chart</span>
                        <span>From Sheets</span>
                      </button>
                    </div>
                  </div>

                  {/* 6. Symbols */}
                  <div className="relative group/symbols-submenu w-full">
                    <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-[16px] text-secondary">emoji_symbols</span>
                        <span>Symbols</span>
                      </div>
                      <span className="text-[10px] text-outline">▶</span>
                    </button>
                    <div className="absolute top-0 left-full ml-px bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-1 hidden group-hover/symbols-submenu:flex flex-col z-55 w-52 text-on-surface text-[13px]">
                      <button
                        onClick={() => {
                          setSymbolPickerTab("emoji");
                          setSymbolPickerOpen(true);
                          setShowInsertMenu(false);
                        }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">sentiment_satisfied</span>
                        <span>Emoji...</span>
                      </button>
                      <button
                        onClick={() => {
                          setSymbolPickerTab("special");
                          setSymbolPickerOpen(true);
                          setShowInsertMenu(false);
                        }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">code</span>
                        <span>Special characters...</span>
                      </button>
                      <div className="relative group/eq-sub w-full">
                        <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between">
                          <div className="flex items-center gap-sm">
                            <span className="material-symbols-outlined text-[16px] text-secondary">functions</span>
                            <span>Equation</span>
                          </div>
                          <span className="text-[10px] text-outline">▶</span>
                        </button>
                        <div className="absolute top-0 left-full ml-px bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-1 hidden group-hover/eq-sub:flex flex-col z-60 w-44 text-on-surface">
                          {[
                            { label: "Pythagorean (a² + b² = c²)", text: "a² + b² = c²" },
                            { label: "Einstein (E = mc²)", text: "E = mc²" },
                            { label: "Circle Area (A = πr²)", text: "A = πr²" },
                            { label: "Quadratic Formula", text: "x = (-b ± √(b² - 4ac)) / 2a" }
                          ].map((eq) => (
                            <button
                              key={eq.label}
                              onClick={() => {
                                editor?.chain().focus().insertContent(eq.text).run();
                                setShowInsertMenu(false);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-surface-container-high text-xs truncate cursor-pointer"
                              title={eq.label}
                            >
                              {eq.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-outline-variant/30 my-xs" />

                  {/* 7. Tab */}
                  <button
                    onClick={() => {
                      if (editor) {
                        editor.chain().focus().insertContent("    ").run();
                      }
                      setShowInsertMenu(false);
                    }}
                    className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between"
                  >
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-[16px] text-outline/50">tab</span>
                      <span>Tab</span>
                    </div>
                    <span className="text-[10px] text-outline/50 font-mono">Shift+F11</span>
                  </button>

                  {/* 11. Horizontal line */}
                  <button
                    onClick={() => {
                      if (editor) {
                        editor.chain().focus().setHorizontalRule().run();
                      }
                      setShowInsertMenu(false);
                    }}
                    className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">horizontal_rule</span>
                    <span>Horizontal line</span>
                  </button>

                  {/* 12. Break */}
                  <div className="relative group/break-submenu w-full">
                    <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-[16px] text-secondary">splitscreen</span>
                        <span>Break</span>
                      </div>
                      <span className="text-[10px] text-outline">▶</span>
                    </button>
                    <div className="absolute top-0 left-full ml-px bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-1 hidden group-hover/break-submenu:flex flex-col z-55 w-52 text-on-surface">
                      <button
                        onClick={() => {
                          if (editor) {
                            editor.chain().focus().setHorizontalRule().run();
                          }
                          setShowInsertMenu(false);
                        }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">vertical_align_bottom</span>
                        <span>Page break</span>
                      </button>
                      <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm text-outline/50 cursor-not-allowed">
                        <span className="material-symbols-outlined text-[16px] text-outline/50">arrow_downward</span>
                        <span>Section break (next page)</span>
                      </button>
                      <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm text-outline/50 cursor-not-allowed">
                        <span className="material-symbols-outlined text-[16px] text-outline/50">sync_alt</span>
                        <span>Section break (continuous)</span>
                      </button>
                    </div>
                  </div>

                  {/* 13. Bookmark */}
                  <button
                    onClick={() => {
                      toast.success("Bookmark added at current cursor location!");
                      setShowInsertMenu(false);
                    }}
                    className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">bookmark</span>
                    <span>Bookmark</span>
                  </button>

                  {/* 14. Page elements */}
                  <div className="relative group/page-elements-submenu w-full">
                    <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-[16px] text-secondary">tag</span>
                        <span>Page elements</span>
                      </div>
                      <div className="flex items-center gap-xs">
                        <span className="bg-primary-container text-on-primary-container text-[9px] font-bold px-1.5 py-0.5 rounded-full">Updated</span>
                        <span className="text-[10px] text-outline">▶</span>
                      </div>
                    </button>
                    <div className="absolute top-0 left-full ml-px bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-1 hidden group-hover/page-elements-submenu:flex flex-col z-55 w-52 text-on-surface">
                      <button
                        onClick={() => {
                          setShowPageNumbers(!showPageNumbers);
                          toast.success(showPageNumbers ? "Page numbers hidden" : "Page numbers visible by default");
                          setShowInsertMenu(false);
                        }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between"
                      >
                        <div className="flex items-center gap-sm">
                          <span className="material-symbols-outlined text-[16px] text-secondary">numbers</span>
                          <span>Page numbers</span>
                        </div>
                        {showPageNumbers && (
                          <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                        )}
                      </button>
                      <button className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm text-outline/50 cursor-not-allowed">
                        <span className="material-symbols-outlined text-[16px] text-outline/50">calculate</span>
                        <span>Page count</span>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-outline-variant/30 my-xs" />

                  {/* 15. Comment */}
                  <button
                    onClick={() => {
                      toast.success("Comment Mode: Highlight text and click 'Explain' to talk to Gemini!");
                      setShowInsertMenu(false);
                    }}
                    className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between"
                  >
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-[16px] text-secondary">add_comment</span>
                      <span>Comment</span>
                    </div>
                    <span className="text-[10px] text-outline/50 font-mono">Ctrl+Alt+M</span>
                  </button>
                </div>
              )}
            </div>

            {/* Format Menu Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFormatMenu(!showFormatMenu);
                  setShowFileMenu(false);
                  setShowInsertMenu(false);
                }}
                className={`hover:bg-surface-container-high px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center ${
                  showFormatMenu ? "bg-surface-container-high text-primary font-semibold" : ""
                }`}
              >
                Format
              </button>

              {showFormatMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-8 left-0 bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-[4px] flex flex-col z-50 w-56 text-on-surface font-label-md text-[13px]"
                >
                  {/* 1. Page Setup */}
                  <div className="relative group/page-setup-submenu w-full">
                    <button
                      className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between"
                    >
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-[16px] text-secondary">description</span>
                        <span>Page setup</span>
                      </div>
                      <span className="text-[10px] text-outline">▶</span>
                    </button>
                    <div className="absolute top-0 left-full ml-px bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-[4px] hidden group-hover/page-setup-submenu:flex flex-col z-55 w-48 text-on-surface">
                      <button
                        onClick={() => { setPageSize("a4"); setShowFormatMenu(false); }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between"
                      >
                        <span>A4 (Standard)</span>
                        {pageSize === "a4" && (
                          <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                        )}
                      </button>
                      <button
                        onClick={() => { setPageSize("a3"); setShowFormatMenu(false); }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between"
                      >
                        <span>A3 (Large)</span>
                        {pageSize === "a3" && (
                          <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                        )}
                      </button>
                      <button
                        onClick={() => { setPageSize("letter"); setShowFormatMenu(false); }}
                        className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between"
                      >
                        <span>Letter</span>
                        {pageSize === "letter" && (
                          <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. Page Color */}
                  <div className="relative group/page-color-submenu w-full">
                    <button
                      className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between"
                    >
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-[16px] text-secondary">palette</span>
                        <span>Page color</span>
                      </div>
                      <span className="text-[10px] text-outline">▶</span>
                    </button>
                    <div className="absolute top-0 left-full ml-px bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-[4px] hidden group-hover/page-color-submenu:flex flex-col z-55 w-48 text-on-surface">
                      {[
                        { label: "White", value: "#ffffff" },
                        { label: "Cream", value: "#fefcf0" },
                        { label: "Sepia", value: "#f4ecd8" },
                        { label: "Ice Blue", value: "#e8eff5" },
                        { label: "Soft Gray", value: "#f1f3f4" }
                      ].map((color) => (
                        <button
                          key={color.value}
                          onClick={() => { setPageColor(color.value); setShowFormatMenu(false); }}
                          className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center justify-between"
                        >
                          <div className="flex items-center gap-sm">
                            <div className="w-3.5 h-3.5 rounded-full border border-outline-variant" style={{ backgroundColor: color.value }} />
                            <span>{color.label}</span>
                          </div>
                          {pageColor === color.value && (
                            <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-outline-variant/30 my-[4px]" />

                  {/* 6. Clear formatting */}
                  <button
                    onClick={() => { editor?.chain().focus().unsetAllMarks().run(); setShowFormatMenu(false); }}
                    className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">format_clear</span>
                    <span>Clear formatting</span>
                  </button>
                </div>
              )}
            </div>

            <button className="hover:bg-surface-container-high px-2 py-0.5 rounded cursor-pointer transition-colors">Tools</button>
            <button className="hover:bg-surface-container-high px-2 py-0.5 rounded cursor-pointer transition-colors">Help</button>
          </div>
          ) : isShared ? (
            <div className="flex items-center gap-md h-7 mt-1 select-none text-sm text-secondary font-medium">
              {/* File Menu Dropdown Trigger for Read-Only Shared Users */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFileMenu(!showFileMenu);
                  }}
                  className={`hover:bg-surface-container-high px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center ${
                    showFileMenu ? "bg-surface-container-high text-primary font-semibold" : ""
                  }`}
                >
                  File
                </button>

                {showFileMenu && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-8 left-0 bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-1 flex flex-col z-50 w-48 text-on-surface font-label-md text-[13px]"
                  >
                    <Link
                      href="/dashboard"
                      onClick={() => setShowFileMenu(false)}
                      className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">folder_open</span>
                      <span>Open</span>
                    </Link>

                    <button
                      onClick={async () => {
                        setShowFileMenu(false);
                        const loadingToast = toast.loading("Making a copy of this note...");
                        try {
                          const copiedNote = await copySharedNote(note.id, authorName);
                          toast.success("Note copied successfully!", { id: loadingToast });
                          router.push(`/note/${copiedNote.id}`);
                        } catch (err) {
                          toast.error("Failed to copy note", { id: loadingToast });
                        }
                      }}
                      className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">content_copy</span>
                      <span>Make a copy</span>
                    </button>

                    <div className="border-t border-outline-variant/30 my-[4px]" />
                    
                    <button
                      onClick={() => {
                        window.print();
                        setShowFileMenu(false);
                      }}
                      className="w-full text-left px-md py-1.5 hover:bg-surface-container-high flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">print</span>
                      <span>Print</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </header>

        {/* Editor Toolbar */}
        <div className={role !== "EDIT" ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
          <Toolbar
            editor={editor}
            pageSize={pageSize}
            setPageSize={setPageSize}
            pageColor={pageColor}
            setPageColor={setPageColor}
          />
        </div>

        {/* Editor Canvas Area — main stays full width, page-sheet moves via margin */}
        <div className="flex-1 flex overflow-hidden relative">
          <main
            className="flex-1 overflow-y-auto bg-surface-container-high relative p-md"
            id="editorCanvas"
            ref={editorCanvasRef}
            onContextMenu={role === "EDIT" ? handleContextMenu : undefined}
            onClick={(e) => {
              if (role !== "EDIT") {
                const target = e.target as HTMLElement;
                if (target.closest(".page-sheet") && !target.closest("input")) {
                  toast.error("This note is read-only. Please request edit access from the author.");
                }
              }
            }}
          >
            <div
              className={`page-sheet page-${pageSize} max-w-full relative`}
              style={{
                backgroundColor: pageColor,
                minHeight: `${pageCount * pageHeightPx + (pageCount - 1) * gapHeight}px`,
              }}
            >
              <div className="mb-lg">
                <input
                  className="w-full bg-transparent border-none text-display-lg font-display-lg text-on-surface focus:ring-0 p-0 placeholder-outline-variant outline-none font-bold"
                  placeholder="Untitled document"
                  type="text"
                  value={headingTitle}
                  onChange={(e) => {
                    if (role === "EDIT") {
                      handleHeadingChange(e.target.value);
                    }
                  }}
                  readOnly={role !== "EDIT"}
                  onClick={(e) => {
                    if (role !== "EDIT") {
                      e.stopPropagation();
                      toast.error("This note is read-only. Please request edit access from the author.");
                    }
                  }}
                />
              </div>
              
              {/* TipTap Editor */}
              <TiptapEditor editor={editor} />

              {/* Dynamic Page Breaks & Page Numbers overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                {/* Visual Gap Overlays */}
                {Array.from({ length: pageCount - 1 }).map((_, idx) => {
                  const y = (idx + 1) * pageHeightPx + idx * gapHeight;
                  return (
                    <div
                      key={`page-gap-${idx}`}
                      className="absolute left-[-1px] right-[-1px] pointer-events-none select-none"
                      style={{
                        top: `${y}px`,
                        height: `${gapHeight}px`,
                        backgroundColor: "var(--color-surface-container-high)",
                        borderTop: "1px solid var(--color-outline-variant)",
                        borderBottom: "1px solid var(--color-outline-variant)",
                        boxShadow: "inset 0 4px 6px -4px rgba(0, 0, 0, 0.12), inset 0 -4px 6px -4px rgba(0, 0, 0, 0.12)",
                      }}
                    />
                  );
                })}

                {/* Page Number Badges */}
                {showPageNumbers && Array.from({ length: pageCount }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const footerY = pageNum * pageHeightPx + (pageNum - 1) * gapHeight - 32;
                  return (
                    <div
                      key={`page-num-${pageNum}`}
                      className="absolute text-outline font-label-sm text-[12px] select-none pointer-events-none"
                      style={{
                        top: `${footerY}px`,
                        right: "48px",
                      }}
                    >
                      Page {pageNum}
                    </div>
                  );
                })}
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Selection format tooltip menu */}
            {floatingMenuPos && (
              <div
                className="absolute bg-surface-container-lowest border border-outline-variant shadow-ambient-overlay rounded-xl p-xs flex gap-xs z-50 transition-opacity"
                style={{
                  top: `${floatingMenuPos.top}px`,
                  left: `${floatingMenuPos.left}px`,
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {role === "EDIT" && (
                  <>
                    <button
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`p-xs rounded-lg ${
                        editor?.isActive("bold") ? "bg-primary-container text-on-primary-container" : "text-on-surface hover:bg-surface-container-high"
                      }`}
                      title="Bold"
                    >
                      <span className="material-symbols-outlined text-[16px]">format_bold</span>
                    </button>
                    <button
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={`p-xs rounded-lg ${
                        editor?.isActive("italic") ? "bg-primary-container text-on-primary-container" : "text-on-surface hover:bg-surface-container-high"
                      }`}
                      title="Italic"
                    >
                      <span className="material-symbols-outlined text-[16px]">format_italic</span>
                    </button>
                  </>
                )}
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

            {/* Table cell floating bubble menu */}
            {tableBubbleMenuPos && editor && editor.isActive("table") && (
              <div
                className="absolute bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg p-xs flex gap-xs z-40 items-center select-none"
                style={{
                  top: `${tableBubbleMenuPos.top}px`,
                  left: `${tableBubbleMenuPos.left}px`,
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {/* 1. Drag indicator */}
                <div 
                  className="w-6 h-6 flex items-center justify-center text-outline cursor-grab hover:bg-surface-container-high rounded-md transition-colors"
                  title="Drag cell"
                >
                  <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
                </div>
                
                {/* 2. Cell settings */}
                <button
                  onClick={() => {
                    editor.chain().focus().mergeOrSplit().run();
                  }}
                  className="w-6 h-6 flex items-center justify-center text-secondary hover:bg-surface-container-high rounded-md transition-colors"
                  title="Merge or Split Cells"
                >
                  <span className="material-symbols-outlined text-[16px]">merge</span>
                </button>

                {/* 3. Plus sign to increase rows/cols */}
                <div className="relative">
                  <button
                    onClick={() => setShowTableBubbleDropdown(!showTableBubbleDropdown)}
                    className="w-6 h-6 flex items-center justify-center bg-primary text-on-primary hover:bg-surface-tint rounded-md transition-colors"
                    title="Insert Row or Column"
                  >
                    <span className="material-symbols-outlined text-[16px] font-bold">add</span>
                  </button>

                  {showTableBubbleDropdown && (
                    <div className="absolute top-8 right-0 bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-xs flex flex-col z-50 w-40">
                      <button
                        onClick={() => {
                          editor.chain().focus().addRowAfter().run();
                          setShowTableBubbleDropdown(false);
                        }}
                        className="w-full text-left px-md py-sm hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-xs"
                      >
                        <span className="material-symbols-outlined text-[14px]">add_row_below</span>
                        Add Row Below
                      </button>
                      <button
                        onClick={() => {
                          editor.chain().focus().addColumnAfter().run();
                          setShowTableBubbleDropdown(false);
                        }}
                        className="w-full text-left px-md py-sm hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-xs"
                      >
                        <span className="material-symbols-outlined text-[14px]">add_column_right</span>
                        Add Column Right
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Floating Slash suggestions menu */}
            {slashMenuOpen && slashMenuPos && filteredCommands.length > 0 && (
              <div
                className="absolute bg-surface/95 backdrop-blur-md border border-outline-variant shadow-ambient-overlay rounded-lg p-xs flex flex-col z-50 w-64 max-h-80 overflow-y-auto scrollbar-thin"
                style={{
                  top: `${slashMenuPos.top}px`,
                  left: `${slashMenuPos.left}px`,
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="px-sm py-xs font-label-sm text-outline text-[10px] uppercase tracking-wider border-b border-outline-variant/30 mb-xs select-none">
                  Suggestions
                </div>
                {filteredCommands.map((cmd, index) => {
                  const isSelected = index === slashSelectedIndex;
                  return (
                    <button
                      key={cmd.title}
                      onClick={() => executeSlashCommand(cmd)}
                      className={`w-full text-left px-md py-sm rounded-lg flex items-center gap-md transition-all duration-150 ${
                        isSelected
                          ? "bg-primary text-on-primary shadow-sm slash-item-active"
                          : "text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[18px] ${isSelected ? "text-on-primary" : "text-secondary"}`}>
                        {cmd.icon}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md truncate">{cmd.title}</span>
                        <span className={`text-[10px] truncate ${isSelected ? "text-on-primary/70" : "text-outline"}`}>
                          {cmd.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Custom Right-Click Context Menu */}
            {contextMenuPos && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bg-surface border border-outline-variant shadow-ambient-overlay rounded-lg py-xs flex flex-col z-50 w-56 select-none"
                style={{
                  top: `${contextMenuPos.y}px`,
                  left: `${contextMenuPos.x}px`,
                }}
              >
                {editor && editor.isActive("table") ? (
                  <>
                    <div className="px-md py-1 text-[10px] font-bold text-outline uppercase tracking-wider select-none border-b border-outline-variant/30 mb-xs">
                      Table Options
                    </div>
                    <button
                      onClick={() => { editor.chain().focus().addRowBefore().run(); setContextMenuPos(null); }}
                      className="w-full text-left px-md py-sm hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">add_row_above</span>
                      Insert Row Above
                    </button>
                    <button
                      onClick={() => { editor.chain().focus().addRowAfter().run(); setContextMenuPos(null); }}
                      className="w-full text-left px-md py-sm hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">add_row_below</span>
                      Insert Row Below
                    </button>
                    <button
                      onClick={() => { editor.chain().focus().addColumnBefore().run(); setContextMenuPos(null); }}
                      className="w-full text-left px-md py-sm hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">add_column_left</span>
                      Insert Column Left
                    </button>
                    <button
                      onClick={() => { editor.chain().focus().addColumnAfter().run(); setContextMenuPos(null); }}
                      className="w-full text-left px-md py-sm hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">add_column_right</span>
                      Insert Column Right
                    </button>
                    <div className="border-t border-outline-variant/30 my-xs" />
                    <button
                      onClick={() => { editor.chain().focus().mergeCells().run(); setContextMenuPos(null); }}
                      className="w-full text-left px-md py-sm hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">merge</span>
                      Merge Cells
                    </button>
                    <button
                      onClick={() => { editor.chain().focus().splitCell().run(); setContextMenuPos(null); }}
                      className="w-full text-left px-md py-sm hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">call_split</span>
                      Split Cell
                    </button>
                    <div className="border-t border-outline-variant/30 my-xs" />
                    <button
                      onClick={() => { editor.chain().focus().deleteRow().run(); setContextMenuPos(null); }}
                      className="w-full text-left px-md py-sm hover:bg-surface-container-high text-error hover:bg-error/5 font-label-md text-label-md flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Delete Row
                    </button>
                    <button
                      onClick={() => { editor.chain().focus().deleteColumn().run(); setContextMenuPos(null); }}
                      className="w-full text-left px-md py-sm hover:bg-surface-container-high text-error hover:bg-error/5 font-label-md text-label-md flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Delete Column
                    </button>
                    <button
                      onClick={() => { editor.chain().focus().deleteTable().run(); setContextMenuPos(null); }}
                      className="w-full text-left px-md py-sm hover:bg-surface-container-high text-error hover:bg-error/5 font-label-md text-label-md flex items-center gap-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] fill">delete</span>
                      Delete Table
                    </button>
                  </>
                ) : (
                  <>
                    {selectedGrammarError ? (
                      <>
                        <div className="px-md py-1 text-[10px] font-bold text-outline uppercase tracking-wider select-none border-b border-outline-variant/30 mb-xs">
                          Grammar Correction
                        </div>
                        <div className="px-md py-2 text-xs text-secondary leading-snug">
                          {selectedGrammarError.message}
                        </div>
                        <div className="border-t border-outline-variant/30 my-xs" />
                        
                        {selectedGrammarError.suggestions && selectedGrammarError.suggestions.length > 0 ? (
                          selectedGrammarError.suggestions.slice(0, 3).map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => applyGrammarSuggestion(selectedGrammarError.id, suggestion)}
                              className="w-full text-left px-md py-2 hover:bg-primary/10 hover:text-primary font-bold font-label-md text-label-md flex items-center gap-sm transition-colors border-none cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              <span className="truncate">{suggestion}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-md py-1 text-xs italic text-secondary">
                            No suggestions available.
                          </div>
                        )}
                        
                        <div className="border-t border-outline-variant/30 my-xs" />
                        <button
                          onClick={() => {
                            const updated = grammarErrors.filter(err => err.id !== selectedGrammarError.id);
                            setGrammarErrors(updated);
                            if (editor) {
                              const tr = editor.state.tr.setMeta("setGrammarErrors", updated.map(err => ({ id: err.id, from: err.from, to: err.to })));
                              editor.view.dispatch(tr);
                            }
                            setSelectedGrammarError(null);
                            setContextMenuPos(null);
                          }}
                          className="w-full text-left px-md py-2 hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-sm border-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] text-secondary">visibility_off</span>
                          <span>Ignore error</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-md py-1 text-[10px] font-bold text-outline uppercase tracking-wider select-none border-b border-outline-variant/30 mb-xs">
                          Edit Options
                        </div>
                        <button
                          disabled={!canUndo}
                          onClick={handleCustomUndo}
                          className={`w-full text-left px-md py-sm hover:bg-surface-container-high font-label-md text-label-md flex items-center gap-sm border-none cursor-pointer ${!canUndo ? "text-outline/40 cursor-not-allowed bg-transparent" : "text-on-surface bg-transparent"}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">undo</span>
                          Undo
                        </button>
                        <button
                          disabled={!canRedo}
                          onClick={handleCustomRedo}
                          className={`w-full text-left px-md py-sm hover:bg-surface-container-high font-label-md text-label-md flex items-center gap-sm border-none cursor-pointer ${!canRedo ? "text-outline/40 cursor-not-allowed bg-transparent" : "text-on-surface bg-transparent"}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">redo</span>
                          Redo
                        </button>
                        <div className="border-t border-outline-variant/30 my-xs" />
                        {selectionText && (
                          <>
                            <button
                              onClick={() => { editor?.chain().focus().toggleBold().run(); setContextMenuPos(null); }}
                              className="w-full text-left px-md py-sm hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-sm border-none cursor-pointer bg-transparent"
                            >
                              <span className="material-symbols-outlined text-[16px] text-secondary">format_bold</span>
                              Bold
                            </button>
                            <button
                              onClick={() => { editor?.chain().focus().toggleItalic().run(); setContextMenuPos(null); }}
                              className="w-full text-left px-md py-sm hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-sm border-none cursor-pointer bg-transparent"
                            >
                              <span className="material-symbols-outlined text-[16px] text-secondary">format_italic</span>
                              Italic
                            </button>
                            <button
                              onClick={() => { handleAiOnSelection(); setContextMenuPos(null); }}
                              className="w-full text-left px-md py-sm hover:bg-surface-container-high text-primary font-bold font-label-md text-label-md flex items-center gap-sm border-none cursor-pointer bg-transparent"
                            >
                              <span className="material-symbols-outlined text-[16px] fill">smart_toy</span>
                              Explain with AI
                            </button>
                            <div className="border-t border-outline-variant/30 my-xs" />
                          </>
                        )}
                        <button
                          onClick={() => { editor?.chain().focus().unsetAllMarks().run(); setContextMenuPos(null); }}
                          className="w-full text-left px-md py-sm hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-sm border-none cursor-pointer bg-transparent"
                        >
                          <span className="material-symbols-outlined text-[16px] text-secondary">format_clear</span>
                          Clear Formatting
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </main>

          {/* AI Assistant Sidebar Panel */}
          {role === "EDIT" && (
            <aside
            className={`w-[400px] bg-surface border-l border-outline-variant flex flex-col transition-all duration-300 absolute lg:relative right-0 top-0 bottom-0 z-30 h-full ${
              isAiPanelOpen
                ? "translate-x-0 opacity-100 pointer-events-auto"
                : "translate-x-full lg:w-0 lg:border-l-0 lg:opacity-0 lg:overflow-hidden pointer-events-none"
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
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-md space-y-md"
            >
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex gap-sm ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-xs ${
                      msg.sender === "user"
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-primary-container text-on-primary-container"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {msg.sender === "user" ? "person" : "smart_toy"}
                    </span>
                  </div>
                  
                  <div
                    className={`p-sm rounded-2xl text-body-md text-on-surface w-full max-w-[85%] ${
                      msg.sender === "user"
                        ? "bg-surface-container rounded-tr-none"
                        : "bg-surface-container-low rounded-tl-none"
                    }`}
                  >
                    <div 
                      className="leading-relaxed text-sm whitespace-pre-wrap select-text markdown-ai-response prose prose-sm max-w-none text-on-surface"
                      dangerouslySetInnerHTML={{ __html: formatAiResponse(msg.text) }}
                    />
                    
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
          )}

          {/* Comments Sidebar Panel */}
          <aside
            className={`w-[400px] bg-surface border-l border-outline-variant flex flex-col transition-all duration-300 absolute lg:relative right-0 top-0 bottom-0 z-30 h-full ${
              isCommentsPanelOpen
                ? "translate-x-0 opacity-100 pointer-events-auto"
                : "translate-x-full lg:w-0 lg:border-l-0 lg:opacity-0 lg:overflow-hidden pointer-events-none"
            }`}
            id="commentsPanel"
          >
            {/* Header */}
            <div className="h-12 flex items-center justify-between px-md shrink-0 border-b border-outline-variant">
              <div className="flex items-center gap-xs text-primary">
                <span className="material-symbols-outlined text-[20px]">forum</span>
                <span className="font-label-md text-label-md">Comments</span>
              </div>
              <button
                onClick={() => setIsCommentsPanelOpen(false)}
                className="text-secondary hover:text-on-surface transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Comments Stream */}
            <div className="flex-1 overflow-y-auto p-md space-y-md">
              {comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-outline p-lg">
                  <span className="material-symbols-outlined text-[36px] mb-xs">chat_bubble_outline</span>
                  <p className="text-sm">No comments yet.</p>
                  <p className="text-[11px] mt-xs">Start the conversation by adding a comment below.</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-surface-container-low border border-outline-variant/50 p-sm rounded-xl flex flex-col gap-sm shadow-xs animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-xs">
                        {comment.user.imageUrl ? (
                          <img
                            src={comment.user.imageUrl}
                            alt={comment.user.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                            {comment.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate max-w-[150px]">
                          {comment.user.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-xs">
                        <span className="text-[10px] text-outline">
                          {(() => {
                            const diffMs = Date.now() - new Date(comment.createdAt).getTime();
                            const diffMins = Math.floor(diffMs / 60000);
                            const diffHrs = Math.floor(diffMins / 60);
                            if (diffMins < 1) return "just now";
                            if (diffMins < 60) return `${diffMins}m ago`;
                            if (diffHrs < 24) return `${diffHrs}h ago`;
                            return new Date(comment.createdAt).toLocaleDateString();
                          })()}
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => handleResolveComment(comment.id)}
                            className="w-5 h-5 flex items-center justify-center text-outline hover:text-success hover:bg-success/10 rounded-full transition-colors cursor-pointer border-none bg-transparent"
                            title="Resolve comment"
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-body-md text-secondary text-sm whitespace-pre-wrap select-text leading-relaxed pl-1">
                      {comment.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            {(role === "COMMENT" || role === "EDIT" || isOwner) && (
              <div className="p-sm bg-surface shrink-0 border-t border-outline-variant">
                <form onSubmit={handleAddComment} className="flex flex-col gap-xs">
                  <textarea
                    rows={2}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-sm text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder-outline resize-none text-on-surface"
                    placeholder="Write a comment... (Enter to send)"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    disabled={isSubmittingComment}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (newCommentText.trim() && !isSubmittingComment) {
                          handleAddComment(e);
                        }
                      }
                    }}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !newCommentText.trim()}
                      className="bg-primary text-on-primary rounded-full px-md py-xs font-label-md text-xs hover:bg-surface-tint transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingComment ? "Posting..." : "Comment"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </aside>
        </div>

        {/* Bottom Editor StatusBar */}
        <footer className="h-9 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between px-md shrink-0 z-30 select-none">
          <div className="flex items-center gap-md text-outline font-label-sm text-label-sm">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
            
            {editor && editor.isActive("table") && (
              <div className="flex items-center gap-md border-l border-outline-variant/30 pl-md ml-xs py-0.5">
                <span className="font-semibold text-secondary flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]">grid_on</span> Table
                </span>
                
                {/* Border thickness control */}
                <div className="flex items-center gap-xs">
                  <span className="text-[11px] text-outline">Border:</span>
                  <select
                    onChange={(e) => {
                      editor.chain().focus().updateAttributes("table", { borderWidth: e.target.value }).run();
                    }}
                    className="h-6 px-1.5 rounded bg-surface-container border-none outline-none font-label-sm text-[11px] text-on-surface cursor-pointer focus:ring-0"
                    title="Border Thickness"
                  >
                    <option value="1px">1px</option>
                    <option value="2px">2px</option>
                    <option value="3px">3px</option>
                    <option value="4px">4px</option>
                    <option value="0px">No Border</option>
                  </select>
                </div>

                {/* Border color control */}
                <div className="flex items-center gap-xs">
                  <span className="text-[11px] text-outline">Color:</span>
                  <input
                    type="color"
                    onChange={(e) => {
                      editor.chain().focus().updateAttributes("table", { borderColor: e.target.value }).run();
                    }}
                    className="w-5 h-5 p-0 border border-outline-variant rounded cursor-pointer"
                    title="Border Color"
                  />
                </div>

                {/* Actions quick shortcuts */}
                <div className="flex items-center gap-xs border-l border-outline-variant/30 pl-xs">
                  <button
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    className="h-6 px-1.5 hover:bg-surface-container rounded font-label-sm text-[11px] text-on-surface flex items-center gap-xs"
                    title="Add Row Below"
                  >
                    + Row
                  </button>
                  <button
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    className="h-6 px-1.5 hover:bg-surface-container rounded font-label-sm text-[11px] text-on-surface flex items-center gap-xs"
                    title="Add Column Right"
                  >
                    + Col
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-sm">
            <button
              onClick={runGrammarCheck}
              disabled={isCheckingGrammar}
              className="flex items-center gap-xs px-sm py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-all rounded-full font-label-md text-[11px] font-bold border-none cursor-pointer disabled:opacity-50"
            >
              {isCheckingGrammar ? (
                <>
                  <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[12px]">spellcheck</span>
                  <span>Check Grammar</span>
                </>
              )}
            </button>

            {grammarErrors.length > 0 && (
              <button
                onClick={applyChangeAllGrammar}
                className="flex items-center gap-xs px-sm py-1 bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all rounded-full font-label-md text-[11px] font-bold border-none cursor-pointer"
                title="Apply top suggestion to all grammar errors"
              >
                <span className="material-symbols-outlined text-[12px]">done_all</span>
                <span>Change All ({grammarErrors.length})</span>
              </button>
            )}

            <div className="h-4 w-px bg-outline-variant/40 mx-xs" />

            <button
              disabled={!canUndo}
              onClick={handleCustomUndo}
              className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${!canUndo ? "text-outline/40 cursor-not-allowed" : "text-secondary hover:bg-surface-container-high"}`}
              title="Undo"
            >
              <span className="material-symbols-outlined text-[16px]">undo</span>
            </button>
            <button
              disabled={!canRedo}
              onClick={handleCustomRedo}
              className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${!canRedo ? "text-outline/40 cursor-not-allowed" : "text-secondary hover:bg-surface-container-high"}`}
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
          onClick={() => {
            setIsAiPanelOpen((prev) => {
              const next = !prev;
              if (next) {
                setIsCommentsPanelOpen(false);
              }
              return next;
            });
          }}
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

      {symbolPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none">
          <div 
            className="bg-surface border border-outline-variant rounded-2xl w-[480px] h-[520px] shadow-ambient-overlay flex flex-col overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-lg py-md border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest shrink-0">
              <h3 className="font-headline-sm text-primary flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[22px]">emoji_symbols</span>
                Insert Symbol
              </h3>
              <button 
                onClick={() => {
                  setSymbolPickerOpen(false);
                  setSymbolSearchQuery("");
                }}
                className="text-secondary hover:text-on-surface hover:bg-surface-container-high w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-outline-variant/30 bg-surface-container-low shrink-0">
              <button
                onClick={() => {
                  setSymbolPickerTab("emoji");
                  setSymbolSearchQuery("");
                  setSelectedCategory(null);
                }}
                className={`flex-1 py-3 text-center font-label-md transition-all cursor-pointer border-none bg-transparent ${
                  symbolPickerTab === "emoji" 
                    ? "text-primary border-b-2 border-b-primary font-bold bg-surface-container-lowest" 
                    : "text-secondary border-b-2 border-transparent hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                Emojis
              </button>
              <button
                onClick={() => {
                  setSymbolPickerTab("special");
                  setSymbolSearchQuery("");
                  setSelectedCategory(null);
                }}
                className={`flex-1 py-3 text-center font-label-md transition-all cursor-pointer border-none bg-transparent ${
                  symbolPickerTab === "special" 
                    ? "text-primary border-b-2 border-b-primary font-bold bg-surface-container-lowest" 
                    : "text-secondary border-b-2 border-transparent hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                Special Characters
              </button>
            </div>

            {/* Search Input */}
            <div className="p-md border-b border-outline-variant/20 bg-surface-container-lowest shrink-0">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[18px] text-outline absolute left-3">search</span>
                <input
                  type="text"
                  placeholder={`Search ${symbolPickerTab === "emoji" ? "emojis" : "special characters"}...`}
                  value={symbolSearchQuery}
                  onChange={(e) => setSymbolSearchQuery(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2 pl-10 pr-md text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder-outline"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Content Area */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Category Sidebar */}
              <div className="w-[160px] border-r border-outline-variant/20 bg-surface-container-lowest overflow-y-auto shrink-0 py-sm">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-md py-2 font-label-sm flex items-center gap-sm transition-colors border-none bg-transparent cursor-pointer ${
                    selectedCategory === null 
                      ? "text-primary font-bold bg-primary/10 border-l-4 border-primary" 
                      : "text-secondary hover:text-on-surface hover:bg-surface-container-high border-l-4 border-transparent"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">grid_view</span>
                  All
                </button>
                {(symbolPickerTab === "emoji" ? EMOJI_CATEGORIES : SPECIAL_CHAR_CATEGORIES).map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full text-left px-md py-2 font-label-sm flex items-center gap-sm transition-colors border-none bg-transparent cursor-pointer ${
                      selectedCategory === cat.name 
                        ? "text-primary font-bold bg-primary/10 border-l-4 border-primary" 
                        : "text-secondary hover:text-on-surface hover:bg-surface-container-high border-l-4 border-transparent"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                    <span className="truncate">{cat.name.split(" & ")[0]}</span>
                  </button>
                ))}
              </div>

              {/* Symbols Grid */}
              <div className="flex-1 p-md overflow-y-auto bg-surface-container-low">
                <div className="grid grid-cols-6 gap-2">
                  {filteredSymbols.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        editor?.chain().focus().insertContent(item).run();
                        setSymbolPickerOpen(false);
                        setSymbolSearchQuery("");
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/30 rounded-xl hover:bg-primary-container hover:text-on-primary-container hover:scale-105 transition-all text-lg cursor-pointer shadow-xs"
                    >
                      {item}
                    </button>
                  ))}
                </div>
                {filteredSymbols.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-md">
                    <span className="material-symbols-outlined text-outline text-[32px] mb-xs">search_off</span>
                    <p className="font-label-sm text-secondary">No symbols found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[99] p-md select-none">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-outline-variant rounded-2xl w-full max-w-2xl shadow-ambient-raised flex flex-col max-h-[85vh] overflow-hidden select-text"
          >
            {/* Header */}
            <div className="p-md border-b border-outline-variant flex items-center justify-between shrink-0">
              <div className="flex items-center gap-sm text-primary">
                <span className="material-symbols-outlined">share</span>
                <h2 className="font-headline-sm text-headline-sm font-bold">Share Note</h2>
              </div>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="text-secondary hover:text-on-surface transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-md overflow-y-auto flex-grow space-y-lg">
              {/* Invite Collaborators */}
              <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-md flex flex-col gap-sm">
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[18px] text-primary">person_add</span>
                  Invite Collaborators
                </h3>
                <div className="flex flex-col sm:flex-row gap-sm items-end sm:items-center">
                  <div className="flex-1 w-full flex flex-col gap-xs">
                    <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      placeholder="collaborator@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="bg-surface border border-outline-variant rounded-xl p-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none text-on-surface w-full transition-all"
                    />
                  </div>
                  <div className="w-full sm:w-auto flex flex-col gap-xs shrink-0">
                    <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="bg-surface border border-outline-variant rounded-xl p-2.5 text-sm focus:border-primary focus:outline-none text-on-surface cursor-pointer min-w-[120px]"
                    >
                      <option value="VIEW">Viewer</option>
                      <option value="COMMENT">Commenter</option>
                      <option value="EDIT">Editor</option>
                    </select>
                  </div>
                  <button
                    onClick={handleInviteCollaborator}
                    disabled={isInviting || !inviteEmail.trim()}
                    className="bg-primary text-on-primary rounded-xl px-md py-[11px] font-label-md text-sm hover:bg-surface-tint hover:shadow-md transition-all disabled:opacity-50 cursor-pointer border-none shrink-0 w-full sm:w-auto flex items-center justify-center gap-xs font-semibold"
                  >
                    {isInviting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        Inviting...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        Invite
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* General Access */}
              <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-md flex flex-col gap-sm">
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[18px] text-primary">public</span>
                  General Access
                </h3>
                
                <div className="flex flex-col gap-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm border-b border-outline-variant/40 pb-sm">
                    <div className="flex items-start gap-sm">
                      <span className="material-symbols-outlined text-[24px] text-secondary mt-0.5">
                        {generalAccess === "RESTRICTED" ? "lock" : "public"}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-on-surface">
                          {generalAccess === "RESTRICTED" ? "Restricted" : "Anyone with the link"}
                        </span>
                        <span className="text-xs text-outline">
                          {generalAccess === "RESTRICTED" 
                            ? "Only people added can open with this link" 
                            : "Anyone on the internet with this link can view, comment, or edit"
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-sm shrink-0">
                      <select
                        value={generalAccess}
                        onChange={(e) => handleUpdateGeneralAccess(e.target.value as any, publicRole)}
                        disabled={isUpdatingGeneralAccess}
                        className="bg-surface border border-outline-variant rounded-xl p-2 text-xs font-semibold focus:border-primary focus:outline-none text-on-surface cursor-pointer"
                      >
                        <option value="RESTRICTED">Restricted</option>
                        <option value="ANYONE">Anyone with the link</option>
                      </select>

                      {generalAccess === "ANYONE" && (
                        <select
                          value={publicRole}
                          onChange={(e) => handleUpdateGeneralAccess(generalAccess, e.target.value as any)}
                          disabled={isUpdatingGeneralAccess}
                          className="bg-surface border border-outline-variant rounded-xl p-2 text-xs font-semibold focus:border-primary focus:outline-none text-on-surface cursor-pointer"
                        >
                          <option value="VIEW">Viewer</option>
                          <option value="COMMENT">Commenter</option>
                          <option value="EDIT">Editor</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Link Copy Bar */}
                  <div className="flex items-center gap-xs bg-surface-container border border-outline-variant/60 rounded-xl p-sm">
                    <span className="material-symbols-outlined text-[16px] text-outline ml-xs shrink-0">link</span>
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/note/${note.id}`}
                      className="bg-transparent border-none focus:outline-none text-xs font-mono flex-1 text-on-surface select-all px-xs min-w-0"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/note/${note.id}`);
                        toast.success("Link copied to clipboard!");
                      }}
                      className="bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary-dark transition-all rounded-lg px-sm py-1.5 text-xs font-bold flex items-center gap-xs cursor-pointer border-none shrink-0"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>

              {/* Collaborators list */}
              <div className="space-y-sm pt-2">
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px] text-secondary">group</span>
                  Current Collaborators
                </h3>
                
                {collaborators.length === 0 ? (
                  <p className="text-xs text-outline italic">No collaborators have accessed this note yet.</p>
                ) : (
                  <div className="border border-outline-variant rounded-xl divide-y divide-outline-variant/50 bg-surface-container-lowest overflow-hidden">
                    {sortedCollaborators.map((collab) => (
                      <div key={collab.id} className="p-sm flex items-center justify-between text-sm hover:bg-surface-container-lowest transition-colors">
                        <div className="flex items-center gap-sm">
                          {collab.user.imageUrl ? (
                            <img
                              src={collab.user.imageUrl}
                              alt={collab.user.name}
                              className="w-7 h-7 rounded-full object-cover border border-outline-variant"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {collab.user.name ? collab.user.name.charAt(0).toUpperCase() : "C"}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-xs">
                              <span className="font-semibold text-on-surface">{collab.user.name || "Collaborator"}</span>
                              {activeUsers.some((u) => u.id === collab.user.clerkId) && (
                                <span className="flex items-center gap-1 bg-success/15 text-success text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90 origin-left">
                                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                  Live
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-outline">Joined {new Date(collab.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-xs">
                          {/* Access select dropdown */}
                          <select
                            value={pendingRoles[collab.id] !== undefined ? pendingRoles[collab.id] : collab.role}
                            onChange={(e) => {
                              const newRole = e.target.value as "VIEW" | "COMMENT" | "EDIT";
                              setPendingRoles((prev) => ({
                                ...prev,
                                [collab.id]: newRole,
                              }));
                            }}
                            className="bg-surface-container border border-outline-variant/60 rounded-lg px-2 py-1 text-xs text-secondary hover:text-primary outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
                          >
                            <option value="VIEW">VIEW</option>
                            <option value="COMMENT">COMMENT</option>
                            <option value="EDIT">EDIT</option>
                          </select>

                          {/* Remove collaborator button */}
                          <button
                            onClick={() => handleRemoveCollaborator(collab.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error/10 text-secondary hover:text-error transition-all cursor-pointer border-none bg-transparent"
                            title="Remove Collaborator"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {Object.keys(pendingRoles).length > 0 && (
                  <div className="flex justify-end pt-xs">
                    <button
                      onClick={handleSavePermissions}
                      disabled={isSavingPermissions}
                      className="bg-primary hover:bg-primary/95 text-on-primary rounded-full px-lg py-sm font-label-md text-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center gap-xs border-none"
                    >
                      {isSavingPermissions ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">save</span>
                          Save Permissions
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-md border-t border-outline-variant flex justify-end shrink-0 bg-surface-container-lowest">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="bg-surface-container-high border border-outline-variant text-on-surface rounded-full px-lg py-sm font-label-md text-sm hover:bg-surface-container transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const getSymbolKeyword = (char: string): string => {
  const map: Record<string, string> = {
    "❤️": "heart love red",
    "👍": "thumbs up like yes",
    "👎": "thumbs down dislike no",
    "😀": "smile happy laugh face",
    "😂": "cry laugh joy face",
    "🔥": "fire hot trend",
    "🚀": "rocket space launch",
    "💡": "bulb light idea smart",
    "✅": "check tick verify done",
    "©": "copyright",
    "®": "registered trademark",
    "™": "trademark",
    "°": "degree",
    "±": "plus minus",
    "≠": "not equal",
    "≤": "less than or equal",
    "≥": "greater than or equal",
    "÷": "divide division",
    "×": "multiply multiplication",
    "π": "pi math",
    "∞": "infinity infinite",
  };
  return map[char] || "";
};
