"use server";

import { prisma } from "./prisma";
import { checkAndSyncUser } from "./user";
import { revalidatePath } from "next/cache";
import { generateSecureToken } from "./share";
import { Permission } from "@prisma/client";

export async function createSubject(title: string, color?: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const subject = await prisma.subject.create({
    data: {
      title,
      color: color || "bg-primary-fixed",
      ownerId: dbUser.id,
    },
  });

  revalidatePath("/dashboard");
  return subject;
}

export async function createChapter(subjectId: string, title: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  // Verify ownership of the subject
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
  });
  if (!subject || subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  // Get max order of existing chapters
  const lastChapter = await prisma.chapter.findFirst({
    where: { subjectId },
    orderBy: { order: "desc" },
  });
  const order = lastChapter ? lastChapter.order + 1 : 1;

  const chapter = await prisma.chapter.create({
    data: {
      subjectId,
      title,
      order,
    },
  });

  revalidatePath(`/subject/${subjectId}`);
  return chapter;
}

export async function createNote(chapterId: string, title: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  // Verify ownership of the subject through chapter
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { subject: true },
  });
  if (!chapter || chapter.subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  const note = await prisma.note.create({
    data: {
      chapterId,
      title,
      content: { type: "doc", content: [] },
    },
  });

  revalidatePath(`/subject/${chapter.subjectId}`);
  revalidatePath(`/editor/${note.id}`);
  return note;
}

export async function updateNoteContent(noteId: string, title: string, content: any) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  // Verify ownership of the note OR collaborator with EDIT permission
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { chapter: { include: { subject: true } } },
  });
  if (!note) {
    throw new Error("Note not found");
  }

  const isOwner = note.chapter.subject.ownerId === dbUser.id;
  const isCollaborator = await prisma.collaborator.findFirst({
    where: { userId: dbUser.id, noteId: noteId, role: "EDIT" },
  });

  if (!isOwner && !isCollaborator) {
    throw new Error("Unauthorized");
  }

  const updatedNote = await prisma.note.update({
    where: { id: noteId },
    data: {
      title,
      content,
    },
  });

  revalidatePath(`/subject/${note.chapter.subjectId}`);
  revalidatePath(`/note/${noteId}`);
  return updatedNote;
}

export async function deleteSubject(subjectId: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
  });
  if (!subject || subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  await prisma.note.deleteMany({
    where: {
      chapter: {
        subjectId: subjectId,
      },
    },
  });

  await prisma.chapter.deleteMany({
    where: {
      subjectId: subjectId,
    },
  });

  await prisma.subject.delete({
    where: {
      id: subjectId,
    },
  });

  revalidatePath("/dashboard");
}

export async function deleteChapter(chapterId: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { subject: true },
  });
  if (!chapter || chapter.subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  await prisma.note.deleteMany({
    where: {
      chapterId: chapterId,
    },
  });

  await prisma.chapter.delete({
    where: {
      id: chapterId,
    },
  });

  revalidatePath(`/subject/${chapter.subjectId}`);
  revalidatePath("/dashboard");
}

export async function updateChapter(chapterId: string, title: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { subject: true },
  });
  if (!chapter || chapter.subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  const updated = await prisma.chapter.update({
    where: { id: chapterId },
    data: { title },
  });

  revalidatePath(`/subject/${chapter.subjectId}`);
  return updated;
}

export async function deleteNote(noteId: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { chapter: { include: { subject: true } } },
  });
  if (!note || note.chapter.subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  await prisma.note.delete({
    where: {
      id: noteId,
    },
  });

  revalidatePath(`/subject/${note.chapter.subjectId}`);
  revalidatePath("/dashboard");
}

export async function saveChatMessage(noteId: string, role: "USER" | "ASSISTANT", content: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { chapter: { include: { subject: true } } },
  });
  if (!note || note.chapter.subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  const chatMessage = await prisma.noteChat.create({
    data: {
      noteId,
      userId: dbUser.id,
      role,
      content,
    },
  });

  return chatMessage;
}

export async function checkGrammar(text: string) {
  try {
    const params = new URLSearchParams();
    params.append("text", text);
    params.append("language", "en-US");

    const response = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      body: params,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      throw new Error(`LanguageTool API responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.matches || [];
  } catch (err: any) {
    console.error("Grammar check error:", err);
    throw err;
  }
}

export async function getJournalEntries() {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  return await prisma.journalEntry.findMany({
    where: { userId: dbUser.id },
    orderBy: { date: "desc" },
  });
}

export async function getJournalEntry(id: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
  });

  if (!entry || entry.userId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  return entry;
}

export async function createJournalEntry(dateString?: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const entryDate = dateString ? new Date(dateString) : new Date();
  entryDate.setHours(0, 0, 0, 0);

  const entry = await prisma.journalEntry.create({
    data: {
      userId: dbUser.id,
      title: "Dear diary...",
      content: { type: "doc", content: [] },
      mood: "neutral",
      date: entryDate,
    },
  });

  revalidatePath("/journal");
  revalidatePath(`/journal/${entry.id}`);
  return entry;
}

export async function updateJournalEntry(id: string, data: { title?: string; content?: any; mood?: string; date?: string }) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
  });

  if (!entry || entry.userId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.mood !== undefined) updateData.mood = data.mood;
  if (data.date !== undefined) {
    const entryDate = new Date(data.date);
    if (isNaN(entryDate.getTime()) || entryDate.getFullYear() < 1000 || entryDate.getFullYear() > 9999) {
      throw new Error("Invalid date value or range");
    }
    entryDate.setHours(0, 0, 0, 0);
    updateData.date = entryDate;
  }

  const updatedEntry = await prisma.journalEntry.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/journal");
  revalidatePath(`/journal/${id}`);
  return updatedEntry;
}

export async function deleteJournalEntry(id: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
  });

  if (!entry || entry.userId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  await prisma.journalEntry.delete({
    where: { id },
  });

  revalidatePath("/journal");
  return { success: true };
}

export async function updateSubject(subjectId: string, title: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
  });
  if (!subject || subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  const updated = await prisma.subject.update({
    where: { id: subjectId },
    data: { title },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/subject/${subjectId}`);
  return updated;
}

export async function createShareLink(noteId: string, permission: Permission, expiresAtStr?: string | null) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  // Verify ownership of the note
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { chapter: { include: { subject: true } } },
  });
  if (!note || note.chapter.subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  const token = generateSecureToken();
  const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;

  const shareLink = await prisma.shareLink.create({
    data: {
      token,
      resourceId: noteId,
      resourceType: "NOTE",
      permission,
      expiresAt,
      createdBy: dbUser.id,
    },
  });

  return shareLink;
}

export async function getShareLinkByToken(token: string) {
  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
  });
  if (!shareLink) return null;

  // Check if expired
  if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
    return null;
  }

  return shareLink;
}

export async function getShareLinks(noteId: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  // Check ownership
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { chapter: { include: { subject: true } } },
  });
  if (!note || note.chapter.subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  return await prisma.shareLink.findMany({
    where: { resourceId: noteId, resourceType: "NOTE" },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteShareLink(shareLinkId: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const shareLink = await prisma.shareLink.findUnique({
    where: { id: shareLinkId },
  });
  if (!shareLink) throw new Error("Share link not found");

  // Check note ownership
  const note = await prisma.note.findUnique({
    where: { id: shareLink.resourceId },
    include: { chapter: { include: { subject: true } } },
  });
  if (!note || note.chapter.subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  await prisma.shareLink.delete({
    where: { id: shareLinkId },
  });

  return { success: true };
}

export async function addCollaborator(noteId: string, userId: string, role: Permission) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  // Only allow note owner to add collaborators manually (invite)
  // or it can be done automatically when a user opens a link (which is done on page side)
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { chapter: { include: { subject: true } } },
  });
  if (!note) throw new Error("Note not found");

  // Check if collaborator already exists
  const existing = await prisma.collaborator.findFirst({
    where: { userId, noteId },
  });

  if (existing) {
    return await prisma.collaborator.update({
      where: { id: existing.id },
      data: { role },
    });
  }

  return await prisma.collaborator.create({
    data: {
      userId,
      noteId,
      role,
      invitedBy: dbUser.id,
    },
  });
}

export async function getCollaborators(noteId: string) {
  return await prisma.collaborator.findMany({
    where: { noteId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getComments(noteId: string) {
  return await prisma.comment.findMany({
    where: { noteId, resolved: false },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function addComment(noteId: string, content: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  // Check if user has permission (is owner or collaborator)
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { chapter: { include: { subject: true } } },
  });
  if (!note) throw new Error("Note not found");

  const isOwner = note.chapter.subject.ownerId === dbUser.id;
  const isCollaborator = await prisma.collaborator.findFirst({
    where: { userId: dbUser.id, noteId, role: { in: ["COMMENT", "EDIT"] } },
  });

  if (!isOwner && !isCollaborator) {
    throw new Error("Unauthorized");
  }

  const comment = await prisma.comment.create({
    data: {
      noteId,
      userId: dbUser.id,
      content,
    },
    include: {
      user: true,
    },
  });

  revalidatePath(`/note/${noteId}`);
  return comment;
}

export async function resolveComment(commentId: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { note: { include: { chapter: { include: { subject: true } } } } },
  });
  if (!comment) throw new Error("Comment not found");

  // Only the owner of the note can resolve comments
  if (comment.note.chapter.subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { resolved: true },
  });

  revalidatePath(`/note/${comment.noteId}`);
  return updated;
}

export async function copySharedNote(noteId: string, authorName?: string) {
  "use server";
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  // Fetch the source note with its chapter and subject info
  const sourceNote = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      chapter: {
        include: { subject: true },
      },
    },
  });
  if (!sourceNote) throw new Error("Note not found");

  const subjectLabel = authorName
    ? `${authorName}'s Notes`
    : `${sourceNote.chapter.subject.title} (Shared)`;
  const chapterLabel = sourceNote.chapter.title;
  const noteLabel = sourceNote.title;

  // 1. Find or create a subject named after the author
  let targetSubject = await prisma.subject.findFirst({
    where: { ownerId: dbUser.id, title: subjectLabel },
  });

  if (!targetSubject) {
    targetSubject = await prisma.subject.create({
      data: {
        title: subjectLabel,
        color: "bg-secondary-fixed",
        ownerId: dbUser.id,
      },
    });
  }

  // 2. Find or create a chapter with the same name as the source chapter
  let targetChapter = await prisma.chapter.findFirst({
    where: { subjectId: targetSubject.id, title: chapterLabel },
  });

  if (!targetChapter) {
    const chapCount = await prisma.chapter.count({ where: { subjectId: targetSubject.id } });
    targetChapter = await prisma.chapter.create({
      data: {
        subjectId: targetSubject.id,
        title: chapterLabel,
        order: chapCount + 1,
      },
    });
  }

  // 3. Check if copy already exists to avoid duplicates
  const existingCopy = await prisma.note.findFirst({
    where: {
      chapterId: targetChapter.id,
      title: noteLabel,
    },
  });

  if (existingCopy) {
    // Return existing copy so user is navigated there
    revalidatePath(`/subject/${targetSubject.id}`);
    return existingCopy;
  }

  // 4. Create the copy
  const copiedNote = await prisma.note.create({
    data: {
      chapterId: targetChapter.id,
      title: noteLabel,
      content: sourceNote.content as any,
    },
  });

  revalidatePath(`/subject/${targetSubject.id}`);
  return copiedNote;
}

export async function updateCollaboratorRole(noteId: string, collaboratorId: string, role: Permission) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { chapter: { include: { subject: true } } },
  });
  if (!note) throw new Error("Note not found");

  if (note.chapter.subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  const updated = await prisma.collaborator.update({
    where: { id: collaboratorId },
    data: { role },
  });

  revalidatePath(`/note/${noteId}`);
  return updated;
}

export async function removeCollaborator(noteId: string, collaboratorId: string) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) throw new Error("Unauthorized");

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { chapter: { include: { subject: true } } },
  });
  if (!note) throw new Error("Note not found");

  if (note.chapter.subject.ownerId !== dbUser.id) {
    throw new Error("Unauthorized");
  }

  const deleted = await prisma.collaborator.delete({
    where: { id: collaboratorId },
  });

  revalidatePath(`/note/${noteId}`);
  return deleted;
}


