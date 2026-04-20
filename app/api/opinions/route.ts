import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topicId, stance, userType, content } = body;

    if (!topicId || !stance || !userType || !content?.trim()) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    if (!["agree", "disagree", "conditional"].includes(stance)) {
      return NextResponse.json({ error: "Invalid stance" }, { status: 400 });
    }

    if (!["resident", "business", "other"].includes(userType)) {
      return NextResponse.json({ error: "Invalid userType" }, { status: 400 });
    }

    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const opinion = await prisma.opinion.create({
      data: {
        topicId,
        stance,
        userType,
        content: content.trim(),
        anonymous: true,
      },
    });

    return NextResponse.json(opinion, { status: 201 });
  } catch (err) {
    console.error("POST /api/opinions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("topicId");

    const opinions = await prisma.opinion.findMany({
      where: topicId ? { topicId } : {},
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(opinions);
  } catch (err) {
    console.error("GET /api/opinions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
