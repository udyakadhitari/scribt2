import { checkAndSyncUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import JournalEditorClient from "@/components/JournalEditorClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JournalEntryPage({ params }: PageProps) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) {
    redirect("/");
  }

  const { id } = await params;

  // Retrieve the journal entry
  const entry = await prisma.journalEntry.findUnique({
    where: { id },
  });

  // Verify entry exists
  if (!entry) {
    notFound();
  }

  // Verify ownership
  if (entry.userId !== dbUser.id) {
    redirect("/forbidden");
  }

  // Format data for client component
  return (
    <JournalEditorClient
      userName={dbUser.name || "Alex"}
      entry={{
        id: entry.id,
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        date: entry.date.toISOString(),
      }}
    />
  );
}
