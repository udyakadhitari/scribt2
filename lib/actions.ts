"use server";

import { prisma } from "./prisma";
import { checkAndSyncUser } from "./user";
import { revalidatePath } from "next/cache";

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

  // Verify ownership of the note
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { chapter: { include: { subject: true } } },
  });
  if (!note || note.chapter.subject.ownerId !== dbUser.id) {
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

