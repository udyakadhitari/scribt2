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

  // Verify ownership, collaborator access, or general link access
  const isOwner = note.chapter?.subject?.ownerId === dbUser.id;
  const collaborator = await prisma.collaborator.findFirst({
    where: {
      noteId: id,
      userId: dbUser.id,
    },
  });

  let activeRole: "VIEW" | "COMMENT" | "EDIT" = "VIEW";

  const getHigherPermission = (p1: "VIEW" | "COMMENT" | "EDIT", p2: "VIEW" | "COMMENT" | "EDIT"): "VIEW" | "COMMENT" | "EDIT" => {
    const weights = { VIEW: 1, COMMENT: 2, EDIT: 3 };
    return weights[p1] >= weights[p2] ? p1 : p2;
  };

  if (isOwner) {
    activeRole = "EDIT";
  } else if (collaborator) {
    if (collaborator.joinedViaLink) {
      // Auto-registered collaborators only get access if General Access is ANYONE
      if (note.generalAccess === "ANYONE") {
        activeRole = note.publicRole;
        // Keep DB collaborator role synchronized with current publicRole
        if (collaborator.role !== note.publicRole) {
          try {
            await prisma.collaborator.update({
              where: { id: collaborator.id },
              data: { role: note.publicRole },
            });
          } catch (e) {
            console.error("Failed to sync collaborator role to publicRole:", e);
          }
        }
      } else {
        // General access is restricted, so this public link user loses access
        redirect("/forbidden");
      }
    } else {
      // Explicitly invited collaborators (joinedViaLink is false)
      if (note.generalAccess === "ANYONE") {
        activeRole = getHigherPermission(collaborator.role, note.publicRole);
      } else {
        activeRole = collaborator.role;
      }
    }
  } else if (note.generalAccess === "ANYONE") {
    activeRole = note.publicRole;
    // Auto-register this logged-in user as a collaborator with joinedViaLink: true
    try {
      await prisma.collaborator.create({
        data: {
          userId: dbUser.id,
          noteId: id,
          role: note.publicRole,
          invitedBy: note.chapter?.subject?.ownerId || "system",
          joinedViaLink: true,
        },
      });
    } catch (e) {
      console.error("Failed to auto-register public collaborator:", e);
    }
  } else {
    redirect("/forbidden");
  }

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
console.log("NOTE CONTENT:", note.content);
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
        generalAccess: note.generalAccess,
        publicRole: note.publicRole,
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
      joinedViaLink={collaborator ? collaborator.joinedViaLink : false}
      baseCollaboratorRole={collaborator ? collaborator.role : "VIEW"}
    />
  );
}
