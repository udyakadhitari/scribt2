import { checkAndSyncUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import NoteEditorClient from "@/components/NoteEditorClient";
import { SignInButton } from "@clerk/nextjs";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  // Retrieve the share link
  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
  });

  // If no share link
  if (!shareLink) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-lg">
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-xl max-w-2xl w-full text-center shadow-ambient-raised">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">link_off</span>
          <h1 className="font-headline-md text-headline-md font-bold mb-xs">Link Invalid or Expired</h1>
          <p className="font-body-md text-outline mb-lg">
            This share link does not exist, has expired, or has been deactivated by the owner.
          </p>
          <a href="/dashboard" className="inline-flex justify-center bg-primary text-on-primary rounded-full px-lg py-sm font-label-md text-label-md hover:bg-surface-tint transition-all">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Check expiration date
  if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-lg">
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-xl max-w-md w-full text-center shadow-ambient-raised">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">hourglass_disabled</span>
          <h1 className="font-headline-md text-headline-md font-bold mb-xs">Link Expired</h1>
          <p className="font-body-md text-outline mb-lg">
            This share link was set to expire and is no longer active.
          </p>
          <a href="/dashboard" className="inline-flex justify-center bg-primary text-on-primary rounded-full px-lg py-sm font-label-md text-label-md hover:bg-surface-tint transition-all">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Check auth user
  const dbUser = await checkAndSyncUser();

  // If user is NOT logged in → show sign-in wall
  if (!dbUser) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-lg">
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-xl max-w-2xl w-full text-center shadow-ambient-raised flex flex-col gap-md">
          <span className="material-symbols-outlined text-[48px] text-primary self-center">lock</span>
          <div className="flex flex-col gap-xs">
            <h1 className="font-headline-md text-headline-md font-bold">Sign in to collaborate</h1>
            <p className="font-body-md text-outline">
              The owner shared a note with <span className="font-semibold text-primary">{shareLink.permission}</span> access. Sign in to view and collaborate.
            </p>
          </div>
          <div className="mt-md flex flex-col gap-sm">
            <SignInButton mode="modal">
              <button className="w-full bg-primary text-on-primary rounded-full py-2.5 font-label-md text-label-md hover:bg-surface-tint transition-all cursor-pointer shadow-ambient-raised">
                Sign In / Sign Up
              </button>
            </SignInButton>
            <a href="/dashboard" className="text-label-md font-label-md text-secondary hover:text-primary transition-all py-1.5">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Fetch the referenced Note (including author info for "Make a Copy")
  const note = await prisma.note.findUnique({
    where: { id: shareLink.resourceId },
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
        where: { userId: dbUser.id },
        orderBy: { createdAt: "asc" } 
      },
    },
  });

  if (!note) {
    notFound();
  }


  // If the user is the owner → redirect to their normal edit page
  if (note.chapter?.subject?.ownerId === dbUser.id) {
    redirect(`/note/${note.id}`);
  }

  // Automatically register/update as collaborator
  const existing = await prisma.collaborator.findFirst({
    where: { userId: dbUser.id, noteId: note.id },
  });

  if (!existing) {
    await prisma.collaborator.create({
      data: {
        userId: dbUser.id,
        noteId: note.id,
        role: shareLink.permission,
        invitedBy: shareLink.createdBy,
      },
    });
  }

  const activeRole = existing ? existing.role : shareLink.permission;

  // Fetch comments
  const comments = await prisma.comment.findMany({
    where: { noteId: note.id, resolved: false },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  // Author name for "Make a Copy" subject naming
  const authorName = note.chapter?.subject?.owner?.name || "Shared Notes";

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
        chats: note.chats?.map((c: any) => ({
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
        },
      }))}
      isShared={true}
      isOwner={false}
      authorName={authorName}
      ownerName={note.chapter?.subject?.owner?.name || "Owner"}
      ownerImageUrl={note.chapter?.subject?.owner?.imageUrl || null}
      ownerClerkId={note.chapter?.subject?.owner?.clerkId || ""}
    />
  );
}
