import { NextRequest, NextResponse } from "next/server";
import { checkAndSyncUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const dbUser = await checkAndSyncUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return NextResponse.json({ subjects: [], chapters: [], notes: [] });
    }

    // Construct PostgreSQL Full Text Search query with prefix support
    const words = cleanQuery
      .trim()
      .split(/\s+/)
      .map((w) => w.replace(/[&|!*():]/g, ""))
      .filter((w) => w.length > 0);
    const ftsQuery = words.length > 0 ? words.map((w) => `${w}:*`).join(" & ") : "";

    // 1. Search existing subjects matching query using FTS
    const subjects = await prisma.subject.findMany({
      where: {
        ownerId: dbUser.id,
        title: ftsQuery ? { search: ftsQuery } : undefined,
      },
      include: {
        chapters: {
          include: {
            notes: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 2. Search existing notes matching query using FTS
    const notes = await prisma.note.findMany({
      where: {
        chapter: {
          subject: {
            ownerId: dbUser.id,
          },
        },
        title: ftsQuery ? { search: ftsQuery } : undefined,
      },
      include: {
        chapter: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 2.5. Search existing chapters matching query using FTS
    const chapters = await prisma.chapter.findMany({
      where: {
        subject: {
          ownerId: dbUser.id,
        },
        title: ftsQuery ? { search: ftsQuery } : undefined,
      },
      include: {
        subject: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // 3. Store note if it doesn't exist (simultaneous search-and-store)
    // We only create it if the query is at least 2 characters to avoid creating notes for tiny single-char typing,
    // and if there's no exact matching note title.
    if (cleanQuery.length >= 2) {
      const exactNoteExists = await prisma.note.findFirst({
        where: {
          chapter: {
            subject: {
              ownerId: dbUser.id,
            },
          },
          title: { equals: cleanQuery, mode: "insensitive" },
        },
      });

      if (!exactNoteExists) {
        // Find user's first available chapter
        let targetChapter = await prisma.chapter.findFirst({
          where: {
            subject: {
              ownerId: dbUser.id,
            },
          },
          include: {
            subject: true,
          },
        });

        // If no chapter exists, we'll create a default Subject & Chapter
        if (!targetChapter) {
          let defaultSubject = await prisma.subject.findFirst({
            where: {
              ownerId: dbUser.id,
              title: "General",
            },
          });

          if (!defaultSubject) {
            defaultSubject = await prisma.subject.create({
              data: {
                title: "General",
                color: "bg-primary-fixed",
                ownerId: dbUser.id,
              },
            });
          }

          let defaultChapter = await prisma.chapter.findFirst({
            where: {
              subjectId: defaultSubject.id,
              title: "General Notes",
            },
          });

          if (!defaultChapter) {
            defaultChapter = await prisma.chapter.create({
              data: {
                title: "General Notes",
                order: 1,
                subjectId: defaultSubject.id,
              },
            });
          }

          targetChapter = {
            ...defaultChapter,
            subject: defaultSubject,
          };
        }

        // Create the note
        const newNote = await prisma.note.create({
          data: {
            title: cleanQuery,
            chapterId: targetChapter.id,
            content: { type: "doc", content: [] },
          },
          include: {
            chapter: {
              include: {
                subject: true,
              },
            },
          },
        });

        // Add to search results list
        notes.unshift(newNote);
      }
    }

    // Format the response to match the frontend expected schemas
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

    const formattedNotes = notes.map((note) => ({
      id: note.id,
      title: note.title,
      subjectId: note.chapter.subject.id,
      subjectTitle: note.chapter.subject.title,
      chapterTitle: note.chapter.title,
      subjectColor: note.chapter.subject.color,
      updatedAt: note.updatedAt.toISOString(),
    }));

    const formattedChapters = chapters.map((chap) => ({
      id: chap.id,
      title: chap.title,
      subjectId: chap.subject.id,
      subjectTitle: chap.subject.title,
    }));

    return NextResponse.json({
      subjects: formattedSubjects,
      chapters: formattedChapters,
      notes: formattedNotes,
    });
  } catch (error: any) {
    console.error("API search error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
