import { checkAndSyncUser } from "@/lib/user";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sync the clerk user with Prisma DB on layout render
  await checkAndSyncUser();
  return <>{children}</>;
}
