import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function checkAndSyncUser() {
  // First, get the user from Clerk server
  const clerkUser = await currentUser();

  // Add check if else for that
  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("Clerk user does not have a primary email address.");
  }

  try {
    // Check if user exists in Prisma DB
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    // If not, create a new user in Prisma DB
    if (!dbUser) {
      dbUser = await prismaUserCreate(clerkUser.id, email, clerkUser.firstName, clerkUser.lastName, clerkUser.imageUrl);
    }

    return dbUser;
  } catch (err) {
    console.error("Database connection failed in checkAndSyncUser:", err);
    return null;
  }
}

// Separate database insertion helper for clarity
export async function prismaUserCreate(
  clerkId: string,
  email: string,
  firstName: string | null,
  lastName: string | null,
  imageUrl: string | null
) {
  const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return await prisma.user.create({
    data: {
      clerkId,
      email,
      name: fullName || null,
      imageUrl: imageUrl || null,
    },
  });
}
