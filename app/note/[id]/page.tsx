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
          subject: {
            include: {
              owner: true,
            },
          },
        },
      },
      chats: {
        where: {
          userId: dbUser.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  // Verify note exists
  if (!note) {
    notFound();
  }

  // Verify ownership or collaborator access
  const isOwner = note.chapter?.subject?.ownerId === dbUser.id;
  const collaborator = await prisma.collaborator.findFirst({
    where: {
      noteId: id,
      userId: dbUser.id,
    },
  });

  if (!isOwner && !collaborator) {
    redirect("/forbidden");
  }

  const activeRole = isOwner ? "EDIT" : (collaborator?.role || "VIEW");

  // Fetch comments to pass down
  const comments = await prisma.comment.findMany({
    where: { noteId: note.id, resolved: false },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  // Convert prisma note object to ensure serializable fields if needed
  return (
    <NoteEditorClient
      key={note.id}
      note={{
        id: note.id,
        title: note.title,
        content: note.content,
        chapterTitle: note.chapter?.title || "Untitled Chapter",
        subjectTitle: note.chapter?.subject?.title || "Untitled Subject",
        subjectId: note.chapter?.subject?.id || "",
        chats: note.chats?.map((c) => ({
          role: c.role,
          content: c.content,
        })) || [],
      }}
      initialRole={activeRole}
      initialComments={comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        resolved: c.resolved,
        createdAt: c.createdAt.toISOString(),
        user: {
          name: c.user.name || "Collaborator",
          imageUrl: c.user.imageUrl || null,
        }
      }))}
      ownerName={note.chapter?.subject?.owner?.name || "Owner"}
      ownerImageUrl={note.chapter?.subject?.owner?.imageUrl || null}
      ownerClerkId={note.chapter?.subject?.owner?.clerkId || ""}
    />
  );
}
