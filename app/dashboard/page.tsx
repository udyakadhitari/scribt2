import { checkAndSyncUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const defaultTab = searchParams.tab || "dashboard";

  const dbUser = await checkAndSyncUser();
  if (!dbUser) {
    redirect("/");
  }

  // Fetch subjects owned by this user
  const subjects = await prisma.subject.findMany({
    where: { ownerId: dbUser.id },
    include: {
      chapters: {
        include: {
          notes: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Fetch recent notes across all user subjects
  const recentNotes = await prisma.note.findMany({
    where: {
      chapter: {
        subject: {
          ownerId: dbUser.id,
        },
      },
    },
    include: {
      chapter: {
        include: {
          subject: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 10, // show up to 10 recent notes
  });

  // Map database entries to the format expected by our clean client dashboard
  const formattedSubjects = subjects.map((subj) => {
    const totalNotes = subj.chapters.reduce((sum, chap) => sum + chap.notes.length, 0);

    let latestUpdate = new Date(subj.updatedAt);
    subj.chapters.forEach((chap) => {
      const chapUpdate = new Date(chap.updatedAt);
      if (chapUpdate > latestUpdate) latestUpdate = chapUpdate;

      chap.notes.forEach((note) => {
        const noteUpdate = new Date(note.updatedAt);
        if (noteUpdate > latestUpdate) latestUpdate = noteUpdate;
      });
    });

    return {
      id: subj.id,
      title: subj.title,
      color: subj.color,
      notesCount: totalNotes,
      updatedAt: latestUpdate.toISOString(),
    };
  });

  // Sort subjects by latest dynamic update
  formattedSubjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const formattedNotes = recentNotes.map((note) => ({
    id: note.id,
    title: note.title,
    subjectId: note.chapter.subject.id,
    subjectTitle: note.chapter.subject.title,
    subjectColor: note.chapter.subject.color,
    updatedAt: note.updatedAt.toISOString(),
  }));

  return (
    <DashboardClient
      userName={dbUser.name || "Alex"}
      subjects={formattedSubjects}
      notes={formattedNotes}
      defaultTab={defaultTab}
    />
  );
}
