import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      where: { status: "active" },
      orderBy: { meetingDate: "desc" },
      include: { _count: { select: { opinions: true } } },
    });
    return NextResponse.json(topics);
  } catch (err) {
    console.error("GET /api/topics error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, summary, rawText, meetingDate, meetingName, keywords } = body;

    if (!title || !rawText || !meetingDate || !meetingName) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const topic = await prisma.topic.create({
      data: {
        title,
        summary: summary ?? "",
        rawText,
        meetingDate: new Date(meetingDate),
        meetingName,
        keywords: keywords ?? [],
      },
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (err) {
    console.error("POST /api/topics error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
