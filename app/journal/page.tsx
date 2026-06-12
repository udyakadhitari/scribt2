import { checkAndSyncUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import JournalDashboardClient from "@/components/JournalDashboardClient";

export default async function JournalPage() {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) {
    redirect("/");
  }

  // Fetch journal entries owned by this user
  const entries = await prisma.journalEntry.findMany({
    where: { userId: dbUser.id },
    orderBy: {
      date: "desc",
    },
  });

  // Format date fields to be serializable strings
  const formattedEntries = entries.map((entry: any) => ({
    id: entry.id,
    title: entry.title,
    content: entry.content,
    mood: entry.mood,
    date: entry.date.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }));

  return (
    <JournalDashboardClient
      userName={dbUser.name || "Alex"}
      entries={formattedEntries}
    />
  );
}
