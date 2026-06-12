import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import * as awarenessProtocol from "y-protocols/awareness";
import { verifyToken } from "@clerk/nextjs/server";
import { prisma } from "./lib/prisma";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    path: "/api/socketio",
  });

  // Store io globally so API routes can use it
  (global as any).io = io;

  const activeDocs = new Map<string, { ydoc: Y.Doc; awareness: Awareness }>();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }
      
      const jwtPayload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      
      if (!jwtPayload) {
        return next(new Error("Authentication error: Invalid token"));
      }
      
      (socket as any).userId = jwtPayload.sub;
      next();
    } catch (err) {
      console.error("[socket.io] auth error:", err);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[socket.io] Client connected: ${socket.id}, User: ${(socket as any).userId}`);

    // Join a note room
    socket.on("join-note", async (noteId: string) => {
      const userId = (socket as any).userId;
      
      try {
        const note = await prisma.note.findUnique({
          where: { id: noteId },
          include: { chapter: { include: { subject: true } } },
        });

        if (!note) {
          console.log(`[socket.io] Note ${noteId} not found`);
          return;
        }

        const isOwner = note.chapter.subject.ownerId === userId;
        const isCollab = await prisma.collaborator.findFirst({
          where: { userId, noteId },
        });

        if (isOwner || isCollab) {
          socket.join(`note:${noteId}`);
          console.log(`[socket.io] User ${userId} joined note:${noteId}`);
        } else {
          console.log(`[socket.io] User ${userId} denied access to note:${noteId}`);
        }
      } catch (err) {
        console.error(`[socket.io] Error in join-note:`, err);
      }
    });

    // Sync Room document and awareness state
    socket.on("sync-room", (data: { noteId: string }) => {
      let room = activeDocs.get(data.noteId);
      if (!room) {
        const roomDoc = new Y.Doc();
        const roomAwareness = new Awareness(roomDoc);
        room = { ydoc: roomDoc, awareness: roomAwareness };
        activeDocs.set(data.noteId, room);
        socket.emit("sync-room-response", { empty: true });
      } else {
        const state = Y.encodeStateAsUpdate(room.ydoc);
        socket.emit("sync-room-response", {
          empty: false,
          update: Array.from(state),
        });
      }
    });

    // Handle Ydoc update broadcasts
    socket.on("ydoc-update", (data: { noteId: string; update: number[] }) => {
      const room = activeDocs.get(data.noteId);
      if (room) {
        Y.applyUpdate(room.ydoc, new Uint8Array(data.update));
      }
      socket.to(`note:${data.noteId}`).emit("ydoc-update", data.update);
    });

    // Handle Awareness update broadcasts
    socket.on("awareness-update", (data: { noteId: string; update: number[] }) => {
      const room = activeDocs.get(data.noteId);
      if (room) {
        awarenessProtocol.applyAwarenessUpdate(room.awareness, new Uint8Array(data.update), "remote");
      }
      socket.to(`note:${data.noteId}`).emit("awareness-update", data.update);
    });

    // Leave a note room
    socket.on("leave-note", (noteId: string) => {
      socket.leave(`note:${noteId}`);
    });

    // New comment broadcast
    socket.on("new-comment", (data: { noteId: string; comment: any }) => {
      // Broadcast to all OTHER clients in the same note room
      socket.to(`note:${data.noteId}`).emit("comment-added", data.comment);
    });

    // Comment resolved broadcast
    socket.on("resolve-comment", (data: { noteId: string; commentId: string }) => {
      socket.to(`note:${data.noteId}`).emit("comment-resolved", data.commentId);
    });

    // Request access broadcast (to owner)
    socket.on("request-access", (data: { noteId: string; requesterName: string; requesterId: string }) => {
      socket.to(`note:${data.noteId}`).emit("access-requested", data);
    });

    // Real-time: update collaborator role
    socket.on("update-collaborator-role", (data: { noteId: string; clerkId: string; role: "VIEW" | "COMMENT" | "EDIT" }) => {
      socket.to(`note:${data.noteId}`).emit("collaborator-role-updated", {
        clerkId: data.clerkId,
        role: data.role
      });
    });

    // Real-time: remove collaborator
    socket.on("remove-collaborator", (data: { noteId: string; clerkId: string }) => {
      socket.to(`note:${data.noteId}`).emit("collaborator-removed", {
        clerkId: data.clerkId
      });
    });

    socket.on("disconnect", () => {
      console.log(`[socket.io] Client disconnected: ${socket.id}`);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
