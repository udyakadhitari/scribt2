import { checkAndSyncUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import NoteEditorClient from "@/components/NoteEditorClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NotePage({ params }: PageProps) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) {
    redirect("/");
  }

  const { id } = await params;

  // Retrieve the note with its chapter, subject, and chats sorted chronologically
  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      chapter: {
        include: {
          subject: true,
        },
      },
      chats: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  // Verify ownership
  if (!note || note.chapter.subject.ownerId !== dbUser.id) {
    notFound();
  }

  // Convert prisma note object to ensure serializable fields if needed
  return (
    <NoteEditorClient
      note={{
        id: note.id,
        title: note.title,
        content: note.content,
        chapterTitle: note.chapter.title,
        subjectTitle: note.chapter.subject.title,
        subjectId: note.chapter.subject.id,
        chats: note.chats.map((c) => ({
          role: c.role,
          content: c.content,
        })),
      }}
    />
  );
}
