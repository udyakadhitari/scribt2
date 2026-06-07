import { checkAndSyncUser } from "@/lib/user";
import { redirect } from "next/navigation";
import WhiteboardClient from "@/components/WhiteboardClient";

export default async function WhiteboardPage() {
  const dbUser = await checkAndSyncUser();
  if (!dbUser) {
    redirect("/");
  }

  return (
    <WhiteboardClient userName={dbUser.name || "User"} />
  );
}
