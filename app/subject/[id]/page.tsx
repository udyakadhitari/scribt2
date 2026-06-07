import { checkAndSyncUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import SubjectDetailsClient from "@/components/SubjectDetailsClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubjectPage({ params }: PageProps) {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) {
    redirect("/");
  }

  const { id } = await params;

  // Retrieve the subject with its chapters and notes
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      chapters: {
        include: {
          notes: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  // Verify ownership
  if (!subject || subject.ownerId !== dbUser.id) {
    notFound();
  }

  return (
    <SubjectDetailsClient subject={subject} />
  );
}
