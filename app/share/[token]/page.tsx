import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  // Retrieve the legacy share link
  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
  });

  // If no share link
  if (!shareLink) {
    notFound();
  }

  // Check expiration date
  if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
    notFound();
  }

  // Redirect to the new direct note URL path
  redirect(`/note/${shareLink.resourceId}`);
}
