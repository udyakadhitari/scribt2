import { NextRequest, NextResponse } from "next/server";
import { checkAndSyncUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    // Rate Limit (limit: 30 requests per minute)
    const limitRes = rateLimit(req, { limit: 30, windowMs: 60 * 1000 });
    if (!limitRes.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limitRes.limit.toString(),
            "X-RateLimit-Remaining": limitRes.remaining.toString(),
            "X-RateLimit-Reset": limitRes.resetTime.toString(),
          },
        }
      );
    }
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

    // 2. Search existing notes matching query — title FTS + content text search
    // First: FTS on title
    const notesByTitle = ftsQuery
      ? await prisma.note.findMany({
          where: {
            chapter: { subject: { ownerId: dbUser.id } },
            title: { search: ftsQuery },
          },
          include: { chapter: { include: { subject: true } } },
          orderBy: { updatedAt: "desc" },
        })
      : [];

    // Second: case-insensitive substring search on the JSON content column
    // We cast the JSON content to text and do an ILIKE search
    const notesByContent = cleanQuery
      ? await prisma.$queryRaw<any[]>`
          SELECT n.id, n.title, n.content, n."chapterId", n."createdAt", n."updatedAt",
                 c.id AS chid, c.title AS ctitle, c."subjectId",
                 s.id AS sid, s.title AS stitle, s.color AS scolor, s."ownerId"
          FROM "Note" n
          JOIN "Chapter" c ON n."chapterId" = c.id
          JOIN "Subject" s ON c."subjectId" = s.id
          WHERE s."ownerId" = ${dbUser.id}
            AND (
              n.content->>'html' ILIKE ${'%' + cleanQuery + '%'}
              OR n.content->>'heading' ILIKE ${'%' + cleanQuery + '%'}
            )
          ORDER BY n."updatedAt" DESC
          LIMIT 20
        `
      : [];

    // Merge and deduplicate by note ID — title matches first
    const seenIds = new Set<string>(notesByTitle.map((n: any) => n.id));
    const notesByContentFormatted = notesByContent
      .filter((row: any) => !seenIds.has(row.id))
      .map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        chapterId: row.chapterId || row.chapterid,
        createdAt: row.createdAt || row.createdat,
        updatedAt: row.updatedAt || row.updatedat,
        chapter: {
          id: row.chid,
          title: row.ctitle,
          subjectId: row.subjectId || row.subjectid,
          subject: {
            id: row.sid,
            title: row.stitle,
            color: row.scolor,
            ownerId: row.ownerId || row.ownerid,
          },
        },
      }));

    const notes = [...notesByTitle, ...notesByContentFormatted];

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




    // Format the response to match the frontend expected schemas
    const formattedSubjects = subjects.map((subj: any) => {
      const totalNotes = subj.chapters.reduce((sum: number, chap: any) => sum + chap.notes.length, 0);
      
      let latestUpdate = new Date(subj.updatedAt);
      subj.chapters.forEach((chap: any) => {
        const chapUpdate = new Date(chap.updatedAt);
        if (chapUpdate > latestUpdate) latestUpdate = chapUpdate;
        
        chap.notes.forEach((note: any) => {
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
    formattedSubjects.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const formattedNotes = notes.map((note: any) => ({
      id: note.id,
      title: note.title,
      subjectId: note.chapter.subject.id,
      subjectTitle: note.chapter.subject.title,
      chapterTitle: note.chapter.title,
      subjectColor: note.chapter.subject.color,
      updatedAt: note.updatedAt.toISOString(),
    }));

    const formattedChapters = chapters.map((chap: any) => ({
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
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
